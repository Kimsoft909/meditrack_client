import { logger } from '@/utils/logger';

const KEYS = {
  ACCESS_TOKEN: 'meditrack_access_token',
  REFRESH_TOKEN: 'meditrack_refresh_token',
  USER: 'meditrack_user',
  TOKEN_EXPIRY: 'meditrack_token_expiry',
} as const;

export const tokenStorage = {
  // Save tokens and calculate expiry time
  setTokens(accessToken: string, refreshToken: string, expiresInMinutes: number = 30) {
    try {
      localStorage.setItem(KEYS.ACCESS_TOKEN, accessToken);
      localStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
      
      // Store expiry time (current time + expiry - 5 mins buffer)
      const expiryTime = Date.now() + ((expiresInMinutes - 5) * 60 * 1000);
      localStorage.setItem(KEYS.TOKEN_EXPIRY, expiryTime.toString());
      
      logger.debug('Tokens saved to storage');
    } catch (error) {
      logger.error('Failed to save tokens', error);
    }
  },

  getAccessToken(): string | null {
    return localStorage.getItem(KEYS.ACCESS_TOKEN);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(KEYS.REFRESH_TOKEN);
  },

  getTokenExpiry(): number | null {
    const expiry = localStorage.getItem(KEYS.TOKEN_EXPIRY);
    return expiry ? parseInt(expiry, 10) : null;
  },

  // Check if token needs refresh (5 mins before expiry)
  shouldRefreshToken(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return false;
    return Date.now() >= expiry;
  },

  setUser(user: any) {
    try {
      localStorage.setItem(KEYS.USER, JSON.stringify(user));
      logger.debug('User saved to storage');
    } catch (error) {
      logger.error('Failed to save user', error);
    }
  },

  getUser(): any | null {
    try {
      const user = localStorage.getItem(KEYS.USER);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      logger.error('Failed to parse user', error);
      return null;
    }
  },

  clearAll() {
    Object.values(KEYS).forEach(key => localStorage.removeItem(key));
    logger.debug('All tokens cleared from storage');
  },

  hasValidSession(): boolean {
    return !!(this.getAccessToken() && this.getRefreshToken() && this.getUser());
  },
};
