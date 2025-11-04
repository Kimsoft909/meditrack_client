import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { tokenStorage } from '@/services/tokenStorage';
import { logger } from '@/utils/logger';
import type { AuthState, UserProfile, LoginFormData, SignupFormData } from '@/types/auth';

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginFormData) => Promise<void>;
  signup: (data: SignupFormData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuthToken: () => Promise<void>;
  updateUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true, // Start with loading to check existing session
  });

  const navigate = useNavigate();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false); // Prevent concurrent refreshes

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      logger.debug('Initializing auth state');

      if (authService.hasValidSession()) {
        const user = tokenStorage.getUser();
        const accessToken = tokenStorage.getAccessToken();
        const refreshToken = tokenStorage.getRefreshToken();

        setState({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });

        logger.info('Auth state restored from storage', { userId: user?.id });

        // Start refresh timer
        startRefreshTimer();
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        logger.debug('No valid session found');
      }
    };

    initAuth();

    // Cleanup on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  const refreshAuthToken = useCallback(async () => {
    if (isRefreshingRef.current) {
      logger.debug('Refresh already in progress, skipping');
      return;
    }

    isRefreshingRef.current = true;

    try {
      logger.info('Refreshing access token');
      const response = await authService.refreshToken();

      setState({
        user: response.user,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        isAuthenticated: true,
        isLoading: false,
      });

      logger.info('Token refresh successful');
    } catch (error: any) {
      logger.error('Token refresh failed', error);
      
      // If refresh fails, logout user
      tokenStorage.clearAll();
      setState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
      navigate('/login');
    } finally {
      isRefreshingRef.current = false;
    }
  }, [navigate]);

  // Token refresh timer (checks every minute, refreshes 5 mins before expiry)
  const startRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    refreshTimerRef.current = setInterval(() => {
      if (tokenStorage.shouldRefreshToken() && !isRefreshingRef.current) {
        logger.debug('Token expiring soon, triggering refresh');
        refreshAuthToken();
      }
    }, 60000); // Check every minute
  }, [refreshAuthToken]);

  const login = useCallback(async (credentials: LoginFormData) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const response = await authService.login(credentials);

      setState({
        user: response.user,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        isAuthenticated: true,
        isLoading: false,
      });

      startRefreshTimer();
      navigate('/dashboard');
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [navigate, startRefreshTimer]);

  const signup = useCallback(async (data: SignupFormData) => {
    await authService.signup(data);
    // Don't auto-login after signup, user must login manually
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      logger.error('Logout failed', error);
    } finally {
      setState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });

      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }

      navigate('/login');
    }
  }, [navigate]);

  const updateUser = useCallback((user: UserProfile) => {
    setState(prev => ({ ...prev, user }));
    tokenStorage.setUser(user);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        logout,
        refreshAuthToken,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
