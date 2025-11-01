// Settings type definitions for MediTrack application

export enum FontFamily {
  CAMBRIA = 'Cambria',
  INTER = 'Inter',
  ROBOTO = 'Roboto',
  OPEN_SANS = 'Open Sans',
  SOURCE_SANS = 'Source Sans Pro',
}

export enum FontSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export interface TypographySettings {
  fontFamily: FontFamily;
  fontSize: FontSize;
}

export interface NotificationSettings {
  inApp: boolean;
  email: boolean;
}

export interface AppSettings {
  typography: TypographySettings;
  theme: ThemeMode;
  notifications: NotificationSettings;
}

export interface FeedbackData {
  category: string;
  message: string;
  contactEmail?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  typography: {
    fontFamily: FontFamily.INTER,
    fontSize: FontSize.MEDIUM,
  },
  theme: ThemeMode.LIGHT,
  notifications: {
    inApp: true,
    email: false,
  },
};

export const FONT_SIZE_SCALES: Record<FontSize, number> = {
  [FontSize.SMALL]: 0.875,
  [FontSize.MEDIUM]: 1,
  [FontSize.LARGE]: 1.125,
};
