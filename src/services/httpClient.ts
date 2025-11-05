import { API_BASE_URL } from '@/config/api';
import { tokenStorage } from './tokenStorage';
import { logger } from '@/utils/logger';

interface RequestConfig extends RequestInit {
  requiresAuth?: boolean;
}

class HttpClient {
  private async request<T>(
    url: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { requiresAuth = false, headers = {}, ...restConfig } = config;

    // Add auth header if required
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

    try {
      logger.debug(`HTTP ${config.method || 'GET'} ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        ...restConfig,
        headers: requestHeaders,
      });

      // Handle error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}`;
        
        logger.error(`HTTP Error: ${response.status} - ${errorMessage}`);
        throw new Error(errorMessage);
      }

      // Handle 204 No Content - no body to parse
      if (response.status === 204) {
        return null as T;
      }

      // Check if response has content before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // If not JSON, return empty response for successful requests
        return null as T;
      }

      // Parse JSON response
      const data = await response.json();
      return data as T;
    } catch (error: any) {
      logger.error('HTTP request failed', error);
      throw error;
    }
  }

  async get<T>(url: string, requiresAuth: boolean = false): Promise<T> {
    return this.request<T>(url, { method: 'GET', requiresAuth });
  }

  async post<T>(url: string, body: any, requiresAuth: boolean = false): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(body),
      requiresAuth,
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
