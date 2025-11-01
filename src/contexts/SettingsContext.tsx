// Global settings context with localStorage persistence

import React, { createContext, useContext, useEffect, useReducer, useCallback, useMemo } from 'react';
import { AppSettings, DEFAULT_SETTINGS, FontFamily, FontSize, ThemeMode, FONT_SIZE_SCALES } from '@/types/settings';

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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveSettings(settings);
    }, 300);
    return () => clearTimeout(timeoutId);
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
