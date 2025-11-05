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
  patients: {
    list: `${API_BASE_URL}/api/v1/patients`,
    create: `${API_BASE_URL}/api/v1/patients`,
    details: (id: string) => `${API_BASE_URL}/api/v1/patients/${id}`,
    update: (id: string) => `${API_BASE_URL}/api/v1/patients/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/v1/patients/${id}`,
  },
  vitals: {
    create: (patientId: string) => `${API_BASE_URL}/api/v1/vitals/patients/${patientId}/vitals`,
    list: (patientId: string) => `${API_BASE_URL}/api/v1/vitals/patients/${patientId}/vitals`,
    chart: (patientId: string) => `${API_BASE_URL}/api/v1/vitals/patients/${patientId}/vitals/chart`,
  },
  medications: {
    create: (patientId: string) => `${API_BASE_URL}/api/v1/medications/patients/${patientId}/medications`,
    list: (patientId: string) => `${API_BASE_URL}/api/v1/medications/patients/${patientId}/medications`,
    update: (medicationId: string) => `${API_BASE_URL}/api/v1/medications/${medicationId}`,
    discontinue: (medicationId: string) => `${API_BASE_URL}/api/v1/medications/${medicationId}`,
  },
  visits: {
    create: (patientId: string) => `${API_BASE_URL}/api/v1/visits/patients/${patientId}/visits`,
    list: (patientId: string) => `${API_BASE_URL}/api/v1/visits/patients/${patientId}/visits`,
  },
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
  dashboard: {
    stats: `${API_BASE_URL}/api/v1/dashboard/stats`,
    kpis: `${API_BASE_URL}/api/v1/dashboard/kpis`,
    riskDistribution: `${API_BASE_URL}/api/v1/dashboard/risk-distribution`,
    vitalsTrends: `${API_BASE_URL}/api/v1/dashboard/vitals-trends`,
  },
  settings: `${API_BASE_URL}/api/v1/settings`,
};
