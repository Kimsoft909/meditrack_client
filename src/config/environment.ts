export type Environment = 'development' | 'production';

export const config = {
  env: (import.meta.env.MODE || 'development') as Environment,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  enableLogging: import.meta.env.DEV, // Only log in development
};
