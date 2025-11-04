import { config } from './environment';

export const API_BASE_URL = config.apiBaseUrl;

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/api/v1/auth/login`,
    signup: `${API_BASE_URL}/api/v1/auth/signup`,
    refresh: `${API_BASE_URL}/api/v1/auth/refresh`,
    logout: `${API_BASE_URL}/api/v1/auth/logout`,
    profile: `${API_BASE_URL}/api/v1/auth/profile`,
    updateProfile: `${API_BASE_URL}/api/v1/auth/profile`,
    changePassword: `${API_BASE_URL}/api/v1/auth/change-password`,
    uploadAvatar: `${API_BASE_URL}/api/v1/auth/avatar`,
  },
  patients: `${API_BASE_URL}/api/v1/patients`,
  vitals: `${API_BASE_URL}/api/v1/vitals`,
  medications: `${API_BASE_URL}/api/v1/medications`,
  aiAnalysis: `${API_BASE_URL}/api/v1/ai-analysis`,
  drugChecker: `${API_BASE_URL}/api/v1/drugs`,
  chat: {
    send: `${API_BASE_URL}/api/v1/chat/send`,
    history: `${API_BASE_URL}/api/v1/chat/history`,
    deleteConversation: (conversationId: string) => 
      `${API_BASE_URL}/api/v1/chat/history/${conversationId}`,
  },
  drugs: {
    search: `${API_BASE_URL}/api/v1/drugs/search`,
    checkInteractions: `${API_BASE_URL}/api/v1/drugs/check-interactions`,
    fdaInfo: (drugId: string) => `${API_BASE_URL}/api/v1/drugs/fda-info/${drugId}`,
  },
  dashboard: `${API_BASE_URL}/api/v1/dashboard`,
  settings: `${API_BASE_URL}/api/v1/settings`,
};
