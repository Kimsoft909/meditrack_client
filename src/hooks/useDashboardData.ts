// Custom hook for managing dashboard state from backend API

import { useState, useEffect } from 'react';
import { dashboardService } from '@/services/dashboardService';
import { patientService } from '@/services/patientService';
import { logger } from '@/utils/logger';
import type { Patient } from '@/types/patient';
import type {
  DashboardStats,
  KPIMetricsResponse,
  RiskDistribution,
  VitalsTrendsResponse,
  DashboardKPIMetrics,
  VitalTrend,
  MedicationStats,
} from '@/types/dashboard';
import type { ActivityEvent } from '@/components/dashboard/ActivityFeed';

interface DashboardData {
  kpiMetrics: DashboardKPIMetrics;
  riskDistribution: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
  };
  vitalsTrends: VitalTrend[];
  medicationStats: MedicationStats;
  recentActivity: ActivityEvent[];
  criticalPatients: Patient[];
  isLoading: boolean;
  error: Error | null;
}

export const useDashboardData = (): DashboardData => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [kpiMetrics, setKpiMetrics] = useState<DashboardKPIMetrics>({
    activePatients: 0,
    criticalCases: 0,
    pendingReviews: 0,
    todayAppointments: 0,
    trends: {
      activePatients: 0,
      criticalCases: 0,
      pendingReviews: 0,
      todayAppointments: 0,
    },
  });
  const [riskDistribution, setRiskDistribution] = useState({
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
  });
  const [vitalsTrends, setVitalsTrends] = useState<VitalTrend[]>([]);
  const [criticalPatients, setCriticalPatients] = useState<Patient[]>([]);

  // Mock data for features not yet in backend
  const [medicationStats] = useState<MedicationStats>({
    totalActive: 0,
    expiringThisWeek: 0,
    refillsNeeded: 0,
    recentChanges: 0,
  });
  const [recentActivity] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        logger.info('Fetching dashboard data');

        // Fetch all dashboard data in parallel
        const [statsData, kpisData, riskData, vitalsData, patientsData] = await Promise.all([
          dashboardService.getDashboardStats(),
          dashboardService.getKPIMetrics(),
          dashboardService.getRiskDistribution(),
          dashboardService.getVitalsTrends(),
          patientService.getPatients({ page: 1, pageSize: 100 }).catch(() => ({ patients: [] })),
        ]);

        // Transform and set data
        setStats(statsData);
        setKpiMetrics(dashboardService.transformKPIMetrics(statsData, kpisData));
        setRiskDistribution(riskData.distribution);
        setVitalsTrends(dashboardService.transformVitalsTrends(vitalsData));

        // Get critical patients (high + critical risk)
        const critical = patientsData.patients
          .filter((p: Patient) => p.riskLevel === 'critical' || p.riskLevel === 'high')
          .slice(0, 10);
        setCriticalPatients(critical);

        logger.info('Dashboard data loaded successfully');
      } catch (err: any) {
        logger.error('Failed to fetch dashboard data', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    kpiMetrics,
    riskDistribution,
    vitalsTrends,
    medicationStats,
    recentActivity,
    criticalPatients,
    isLoading,
    error,
  };
};
