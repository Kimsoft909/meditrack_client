// Dashboard API service - integrates with backend

import { API_ENDPOINTS } from '@/config/api';
import { httpClient } from './httpClient';
import { logger } from '@/utils/logger';
import type {
  DashboardStats,
  KPIMetricsResponse,
  RiskDistribution,
  VitalsTrendsResponse,
  DashboardKPIMetrics,
  VitalTrend,
} from '@/types/dashboard';

export const dashboardService = {
  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    logger.debug('Fetching dashboard stats');
    
    const stats = await httpClient.get<DashboardStats>(
      API_ENDPOINTS.dashboard.stats,
      true
    );

    logger.info('Dashboard stats fetched', stats);
    return stats;
  },

  /**
   * Get KPI metrics with trends
   */
  async getKPIMetrics(): Promise<KPIMetricsResponse> {
    logger.debug('Fetching KPI metrics');
    
    const kpis = await httpClient.get<KPIMetricsResponse>(
      API_ENDPOINTS.dashboard.kpis,
      true
    );

    logger.info('KPI metrics fetched', kpis);
    return kpis;
  },

  /**
   * Get patient risk distribution
   */
  async getRiskDistribution(): Promise<RiskDistribution> {
    logger.debug('Fetching risk distribution');
    
    const distribution = await httpClient.get<RiskDistribution>(
      API_ENDPOINTS.dashboard.riskDistribution,
      true
    );

    logger.info('Risk distribution fetched', distribution);
    return distribution;
  },

  /**
   * Get aggregated vitals trends
   */
  async getVitalsTrends(): Promise<VitalsTrendsResponse> {
    logger.debug('Fetching vitals trends');
    
    const trends = await httpClient.get<VitalsTrendsResponse>(
      API_ENDPOINTS.dashboard.vitalsTrends,
      true
    );

    logger.info('Vitals trends fetched', trends);
    return trends;
  },

  /**
   * Transform backend KPI metrics to frontend format
   */
  transformKPIMetrics(
    stats: DashboardStats,
    kpiResponse: KPIMetricsResponse
  ): DashboardKPIMetrics {
    // Create a map of KPI metrics by label
    const metricsMap = new Map(
      kpiResponse.metrics.map(m => [m.label.toLowerCase(), m])
    );

    return {
      activePatients: stats.active_patients,
      criticalCases: stats.critical_alerts,
      pendingReviews: stats.pending_analyses,
      todayAppointments: Math.floor(stats.active_patients * 0.15), // Mock for now
      trends: {
        activePatients: metricsMap.get('active patients')?.trend || 0,
        criticalCases: metricsMap.get('critical cases')?.trend || 0,
        pendingReviews: metricsMap.get('pending reviews')?.trend || 0,
        todayAppointments: 0,
      },
    };
  },

  /**
   * Transform vitals trends for VitalsSparklines component
   */
  transformVitalsTrends(vitalsResponse: VitalsTrendsResponse): VitalTrend[] {
    return vitalsResponse.sparklines.map(sparkline => {
      const current = sparkline.data[sparkline.data.length - 1] || 0;
      const previous = sparkline.data[sparkline.data.length - 2] || current;
      const trend = previous !== 0 ? ((current - previous) / previous) * 100 : 0;

      return {
        label: sparkline.label,
        current: current.toFixed(1),
        data: sparkline.data,
        trend: Math.round(trend),
        unit: sparkline.unit,
      };
    });
  },
};
