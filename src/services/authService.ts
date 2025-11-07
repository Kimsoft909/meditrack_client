import { API_ENDPOINTS } from '@/config/api';
import { httpClient } from './httpClient';
import { tokenStorage } from './tokenStorage';
import { logger } from '@/utils/logger';
import type {
  LoginFormData,
  SignupFormData,
  TokenResponse,
  UserProfile,
  PasswordChangeRequest,
  ProfileUpdateRequest,
} from '@/types/auth';

export const authService = {
  async login(credentials: LoginFormData): Promise<TokenResponse> {
    logger.info('Attempting login', { username: credentials.username });
    
    const response = await httpClient.post<TokenResponse>(
      API_ENDPOINTS.auth.login,
      credentials,
      false, // No auth required for login
      120000, // 120s timeout for cold start
      { maxRetries: 3, retryDelay: 5000 } // Retry with exponential backoff
    );

    // Save tokens
    tokenStorage.setTokens(response.access_token, response.refresh_token);
    tokenStorage.setUser(response.user);

    logger.info('Login successful', { userId: response.user.id });
    return response;
  },

  async signup(data: SignupFormData): Promise<UserProfile> {
    logger.info('Attempting signup', { username: data.username });
    
    // Remove confirmPassword before sending to backend
    const { confirmPassword, ...signupData } = data;
    
    const user = await httpClient.post<UserProfile>(
      API_ENDPOINTS.auth.signup,
      signupData,
      false,
      120000, // 120s timeout for cold start
      { maxRetries: 3, retryDelay: 5000 } // Retry with exponential backoff
    );

    logger.info('Signup successful', { userId: user.id });
    return user;
  },

  async refreshToken(): Promise<TokenResponse> {
    const refreshToken = tokenStorage.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    logger.debug('Refreshing access token');

    const response = await httpClient.post<TokenResponse>(
      API_ENDPOINTS.auth.refresh,
      { refresh_token: refreshToken },
      false,
      120000, // 120s timeout for cold start
      { maxRetries: 3, retryDelay: 5000 } // Retry with exponential backoff
    );

    // Update tokens
    tokenStorage.setTokens(response.access_token, response.refresh_token);
    tokenStorage.setUser(response.user);

    logger.debug('Token refresh successful');
    return response;
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();
    
    if (refreshToken) {
      try {
        await httpClient.post(
          API_ENDPOINTS.auth.logout,
          { refresh_token: refreshToken },
          true
        );
        logger.info('Logout successful');
      } catch (error) {
        logger.error('Logout API call failed', error);
        // Continue with local logout even if API call fails
      }
    }

    tokenStorage.clearAll();
  },

  async getProfile(): Promise<UserProfile> {
    return httpClient.get<UserProfile>(API_ENDPOINTS.auth.profile, true);
  },

  async updateProfile(updates: ProfileUpdateRequest): Promise<UserProfile> {
    const user = await httpClient.patch<UserProfile>(
      API_ENDPOINTS.auth.updateProfile,
      updates,
      true
    );
    
    tokenStorage.setUser(user);
    return user;
  },

  async changePassword(data: PasswordChangeRequest): Promise<{ message: string }> {
    return httpClient.post(API_ENDPOINTS.auth.changePassword, data, true);
  },

  async uploadAvatar(file: File): Promise<{ avatar_url: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await httpClient.postFormData<{ avatar_url: string; message: string }>(
      API_ENDPOINTS.auth.uploadAvatar,
      formData,
      true
    );

    // Update user avatar in storage
    const user = tokenStorage.getUser();
    if (user) {
      user.avatar_url = response.avatar_url;
      tokenStorage.setUser(user);
    }

    return response;
  },

  // Check if user has valid session
  hasValidSession(): boolean {
    return tokenStorage.hasValidSession();
  },
};
