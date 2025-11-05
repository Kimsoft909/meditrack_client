// Global settings context with localStorage persistence and backend sync

import React, { createContext, useContext, useEffect, useReducer, useCallback, useMemo, useRef } from 'react';
import { AppSettings, DEFAULT_SETTINGS, FontFamily, FontSize, ThemeMode, FONT_SIZE_SCALES } from '@/types/settings';
import { settingsService, BackendSettingsUpdate } from '@/services/settingsService';
import { logger } from '@/utils/logger';

const STORAGE_KEY = 'meditrack_settings';

interface SettingsContextValue {
  settings: AppSettings;
  updateTypography: (typography: Partial<AppSettings['typography']>) => void;
  updateTheme: (theme: ThemeMode) => void;
  updateNotifications: (notifications: Partial<AppSettings['notifications']>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

type SettingsAction =
  | { type: 'SET_SETTINGS'; payload: AppSettings }
  | { type: 'UPDATE_TYPOGRAPHY'; payload: Partial<AppSettings['typography']> }
  | { type: 'UPDATE_THEME'; payload: ThemeMode }
  | { type: 'UPDATE_NOTIFICATIONS'; payload: Partial<AppSettings['notifications']> }
  | { type: 'RESET_SETTINGS' };

function settingsReducer(state: AppSettings, action: SettingsAction): AppSettings {
  switch (action.type) {
    case 'SET_SETTINGS':
      return action.payload;
    case 'UPDATE_TYPOGRAPHY':
      return {
        ...state,
        typography: { ...state.typography, ...action.payload },
      };
    case 'UPDATE_THEME':
      return {
        ...state,
        theme: action.payload,
      };
    case 'UPDATE_NOTIFICATIONS':
      return {
        ...state,
        notifications: { ...state.notifications, ...action.payload },
      };
    case 'RESET_SETTINGS':
      return DEFAULT_SETTINGS;
    default:
      return state;
  }
}

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

function applyFontSettings(fontFamily: FontFamily, fontSize: FontSize): void {
  const root = document.documentElement;
  root.style.setProperty('--font-family', fontFamily);
  root.style.setProperty('--font-scale', FONT_SIZE_SCALES[fontSize].toString());
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, dispatch] = useReducer(settingsReducer, DEFAULT_SETTINGS, loadSettings);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Fetch settings from backend on mount
  useEffect(() => {
    const fetchBackendSettings = async () => {
      try {
        logger.debug('Fetching settings from backend');
        const backendSettings = await settingsService.getSettings();

        // Transform backend settings to frontend format
        const frontendSettings: AppSettings = {
          typography: {
            fontFamily: backendSettings.font_family as FontFamily,
            fontSize: backendSettings.font_size as FontSize,
          },
          theme: backendSettings.theme as ThemeMode,
          notifications: {
            inApp: backendSettings.push_notifications,
            email: backendSettings.email_notifications,
          },
        };

        dispatch({ type: 'SET_SETTINGS', payload: frontendSettings });
        saveSettings(frontendSettings);
        logger.info('Settings loaded from backend');
      } catch (error) {
        logger.error('Failed to fetch backend settings, using local storage', error);
        // Continue with local storage settings if backend fails
      }
    };

    fetchBackendSettings();
  }, []);

  // Debounced save to localStorage and backend
  useEffect(() => {
    // Skip saving on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save operations
    saveTimeoutRef.current = setTimeout(async () => {
      // Save to localStorage immediately
      saveSettings(settings);

      // Save to backend
      try {
        logger.debug('Syncing settings to backend');
        const backendUpdate: BackendSettingsUpdate = {
          theme: settings.theme,
          font_family: settings.typography.fontFamily,
          font_size: settings.typography.fontSize,
          email_notifications: settings.notifications.email,
          push_notifications: settings.notifications.inApp,
        };

        await settingsService.updateSettings(backendUpdate);
        logger.info('Settings synced to backend');
      } catch (error) {
        logger.error('Failed to sync settings to backend', error);
        // Continue with local storage even if backend sync fails
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [settings]);

  useEffect(() => {
    applyFontSettings(settings.typography.fontFamily, settings.typography.fontSize);
  }, [settings.typography.fontFamily, settings.typography.fontSize]);

  const updateTypography = useCallback((typography: Partial<AppSettings['typography']>) => {
    dispatch({ type: 'UPDATE_TYPOGRAPHY', payload: typography });
  }, []);

  const updateTheme = useCallback((theme: ThemeMode) => {
    dispatch({ type: 'UPDATE_THEME', payload: theme });
  }, []);

  const updateNotifications = useCallback((notifications: Partial<AppSettings['notifications']>) => {
    dispatch({ type: 'UPDATE_NOTIFICATIONS', payload: notifications });
  }, []);

  const resetSettings = useCallback(() => {
    dispatch({ type: 'RESET_SETTINGS' });
  }, []);

  const value = useMemo(
    () => ({
      settings,
      updateTypography,
      updateTheme,
      updateNotifications,
      resetSettings,
    }),
    [settings, updateTypography, updateTheme, updateNotifications, resetSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
