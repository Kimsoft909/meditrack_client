// Settings API service - integrates with backend

import { API_ENDPOINTS } from '@/config/api';
import { httpClient } from './httpClient';
import { logger } from '@/utils/logger';

export interface BackendUserSettings {
  theme: string;
  font_family: string;
  font_size: string;
  email_notifications: boolean;
  push_notifications: boolean;
  critical_alerts_only: boolean;
  dashboard_layout: any | null;
}

export interface BackendSettingsUpdate {
  theme?: string;
  font_family?: string;
  font_size?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  critical_alerts_only?: boolean;
  dashboard_layout?: any;
}

export interface BackendNotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  critical_alerts_only: boolean;
}

export const settingsService = {
  /**
   * Get user settings from backend
   */
  async getSettings(): Promise<BackendUserSettings> {
    logger.debug('Fetching user settings');
    
    const settings = await httpClient.get<BackendUserSettings>(
      API_ENDPOINTS.settings,
      true
    );

    logger.info('User settings fetched', settings);
    return settings;
  },

  /**
   * Update user settings
   */
  async updateSettings(updates: BackendSettingsUpdate): Promise<BackendUserSettings> {
    logger.debug('Updating user settings', updates);
    
    const settings = await httpClient.patch<BackendUserSettings>(
      API_ENDPOINTS.settings,
      updates,
      true
    );

    logger.info('User settings updated', settings);
    return settings;
  },

  /**
   * Get notification preferences only
   */
  async getNotificationPreferences(): Promise<BackendNotificationPreferences> {
    logger.debug('Fetching notification preferences');
    
    const prefs = await httpClient.get<BackendNotificationPreferences>(
      `${API_ENDPOINTS.settings}/notifications`,
      true
    );

    logger.info('Notification preferences fetched', prefs);
    return prefs;
  },
};
