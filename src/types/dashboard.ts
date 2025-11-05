// Dashboard type definitions matching backend API

export interface KPIMetric {
  label: string;
  value: number;
  trend: number;
  trend_direction: 'up' | 'down' | 'stable';
}

export interface DashboardStats {
  total_patients: number;
  active_patients: number;
  discharged_patients: number;
  critical_alerts: number;
  pending_analyses: number;
}

export interface KPIMetricsResponse {
  metrics: KPIMetric[];
}

export interface RiskDistribution {
  distribution: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
  };
}

export interface SparklineData {
  label: string;
  data: number[];
  unit: string;
}

export interface VitalsTrendsResponse {
  sparklines: SparklineData[];
}

// Frontend-specific types for dashboard display
export interface DashboardKPIMetrics {
  activePatients: number;
  criticalCases: number;
  pendingReviews: number;
  todayAppointments: number;
  trends: {
    activePatients: number;
    criticalCases: number;
    pendingReviews: number;
    todayAppointments: number;
  };
}

export interface VitalTrend {
  label: string;
  current: string;
  data: number[];
  trend: number;
  unit: string;
}

export interface MedicationStats {
  totalActive: number;
  expiringThisWeek: number;
  refillsNeeded: number;
  recentChanges: number;
}
