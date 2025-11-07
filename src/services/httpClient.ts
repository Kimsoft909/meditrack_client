import { API_BASE_URL } from '@/config/api';
import { tokenStorage } from './tokenStorage';
import { logger } from '@/utils/logger';

interface RequestConfig extends RequestInit {
  requiresAuth?: boolean;
  timeout?: number;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
  };
}

class HttpClient {
  private async requestWithTimeout<T>(
    url: string,
    config: RequestConfig,
    attemptNumber: number = 1
  ): Promise<T> {
    const { 
      requiresAuth = false, 
      headers = {}, 
      timeout = 60000, // Default 60s timeout
      retryConfig,
      ...restConfig 
    } = config;

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const requestHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        ...headers,
      };

      if (requiresAuth) {
        const token = tokenStorage.getAccessToken();
        if (token) {
          requestHeaders['Authorization'] = `Bearer ${token}`;
        }
      }

      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

      logger.debug(`HTTP ${config.method || 'GET'} ${fullUrl} (attempt ${attemptNumber})`);
      
      const response = await fetch(fullUrl, {
        ...restConfig,
        headers: requestHeaders,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle Pydantic validation errors (array of error objects)
        let errorMessage: string;
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail
            .map((err: any) => err.msg || err.message || String(err))
            .join(', ');
        } else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else {
          errorMessage = `HTTP ${response.status}`;
        }
        
        logger.error(`HTTP Error: ${response.status} - ${errorMessage}`);
        
        // Retry logic for 5xx errors and network failures
        if (retryConfig && attemptNumber < retryConfig.maxRetries && response.status >= 500) {
          const delay = retryConfig.retryDelay * Math.pow(2, attemptNumber - 1); // Exponential backoff
          logger.info(`Retrying in ${delay}ms... (attempt ${attemptNumber + 1}/${retryConfig.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.requestWithTimeout<T>(url, config, attemptNumber + 1);
        }
        
        throw new Error(errorMessage);
      }

      // Handle 204 No Content - no body to parse
      if (response.status === 204) {
        return null as T;
      }

      // Check if response has content before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return null as T;
      }

      const data = await response.json();
      return data as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Handle timeout errors
      if (error.name === 'AbortError') {
        logger.error('Request timed out', error);
        throw new Error('Server is taking longer than expected. Please try again.');
      }
      
      // Retry logic for network failures
      if (retryConfig && attemptNumber < retryConfig.maxRetries && 
          (error.message.includes('fetch') || error.message.includes('network'))) {
        const delay = retryConfig.retryDelay * Math.pow(2, attemptNumber - 1);
        logger.info(`Network error, retrying in ${delay}ms... (attempt ${attemptNumber + 1}/${retryConfig.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.requestWithTimeout<T>(url, config, attemptNumber + 1);
      }
      
      logger.error('HTTP request failed', error);
      throw error;
    }
  }

  private async request<T>(
    url: string,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.requestWithTimeout<T>(url, config, 1);
  }

  async get<T>(url: string, requiresAuth: boolean = false, timeout?: number): Promise<T> {
    return this.request<T>(url, { method: 'GET', requiresAuth, timeout });
  }

  async post<T>(
    url: string, 
    body: any, 
    requiresAuth: boolean = false,
    timeout?: number,
    retryConfig?: { maxRetries: number; retryDelay: number }
  ): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(body),
      requiresAuth,
      timeout,
      retryConfig,
    });
  }

  async patch<T>(url: string, body: any, requiresAuth: boolean = true): Promise<T> {
    return this.request<T>(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
      requiresAuth,
    });
  }

  async delete<T>(url: string, requiresAuth: boolean = true): Promise<T> {
    return this.request<T>(url, { method: 'DELETE', requiresAuth });
  }

  // Special method for blob responses (PDF downloads)
  async getBlob(url: string, requiresAuth: boolean = false): Promise<Blob> {
    const requestHeaders: HeadersInit = {};

    if (requiresAuth) {
      const token = tokenStorage.getAccessToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

    try {
      logger.debug(`HTTP GET (Blob) ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: requestHeaders,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || `HTTP ${response.status}`;
        logger.error(`HTTP Error: ${response.status} - ${errorMessage}`);
        throw new Error(errorMessage);
      }

      return await response.blob();
    } catch (error: any) {
      logger.error('Blob download failed', error);
      throw error;
    }
  }

  // Special method for multipart/form-data (avatar upload)
  async postFormData<T>(url: string, formData: FormData, requiresAuth: boolean = true): Promise<T> {
    const token = tokenStorage.getAccessToken();
    const headers: HeadersInit = {};

    if (requiresAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        body: formData,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      logger.error('Form data upload failed', error);
      throw error;
    }
  }
}

export const httpClient = new HttpClient();
