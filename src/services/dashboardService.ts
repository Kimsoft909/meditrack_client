// Centralized dashboard data aggregation and computation service

import { Patient, RiskLevel, Vitals } from '@/types/patient';
import { ActivityEvent } from '@/components/dashboard/ActivityFeed';

interface DashboardData {
  kpiMetrics: {
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
  };
  riskDistribution: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
  };
  vitalsTrends: Array<{
    label: string;
    current: string;
    data: number[];
    trend: number;
    unit: string;
  }>;
  medicationStats: {
    totalActive: number;
    expiringThisWeek: number;
    refillsNeeded: number;
    recentChanges: number;
  };
  recentActivity: ActivityEvent[];
  criticalPatients: Patient[];
}

export const dashboardService = {
  /**
   * Aggregates all dashboard data from patient records
   * Performs efficient single-pass calculations for performance
   */
  aggregateDashboardData: (patients: Patient[]): DashboardData => {
    // Risk distribution calculation
    const riskDistribution = {
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
    };

    patients.forEach(patient => {
      riskDistribution[patient.riskLevel]++;
    });

    // Critical patients (high + critical risk levels)
    const criticalPatients = patients
      .filter(p => p.riskLevel === RiskLevel.HIGH || p.riskLevel === RiskLevel.CRITICAL)
      .sort((a, b) => {
        // Sort by risk level (critical first) then by last vitals timestamp
        if (a.riskLevel !== b.riskLevel) {
          return a.riskLevel === RiskLevel.CRITICAL ? -1 : 1;
        }
        const aLastVital = a.vitals[0]?.timestamp.getTime() || 0;
        const bLastVital = b.vitals[0]?.timestamp.getTime() || 0;
        return bLastVital - aLastVital;
      })
      .slice(0, 10); // Limit to 10 most critical

    // Aggregate vitals across all patients for trends
    const vitalsTrends = dashboardService.calculateAggregateVitalsTrends(patients);

    // Medication statistics
    const medicationStats = dashboardService.calculateMedicationStats(patients);

    // Recent activity events (mock implementation - would come from real activity log)
    const recentActivity = dashboardService.generateRecentActivity(patients);

    // KPI metrics with trend calculations
    const kpiMetrics = {
      activePatients: patients.length,
      criticalCases: riskDistribution.critical + riskDistribution.high,
      pendingReviews: patients.filter(p => p.aiAnalyses.length === 0).length,
      todayAppointments: Math.floor(patients.length * 0.15), // Mock: ~15% have appointments today
      trends: {
        activePatients: 5, // Mock: 5% increase
        criticalCases: -2, // Mock: 2% decrease (positive outcome)
        pendingReviews: 3,
        todayAppointments: 0,
      },
    };

    return {
      kpiMetrics,
      riskDistribution,
      vitalsTrends,
      medicationStats,
      recentActivity,
      criticalPatients,
    };
  },

  /**
   * Calculates aggregated vital sign trends across all patients
   * Returns average values and 7-day trend data
   */
  calculateAggregateVitalsTrends: (patients: Patient[]) => {
    // Collect all vitals from last 7 readings per patient
    const allVitals: Vitals[] = [];
    patients.forEach(patient => {
      allVitals.push(...patient.vitals.slice(0, 7));
    });

    if (allVitals.length === 0) {
      return [];
    }

    // Calculate averages for each vital type
    const avgBP = allVitals.reduce((sum, v) => sum + v.bloodPressureSystolic, 0) / allVitals.length;
    const avgHR = allVitals.reduce((sum, v) => sum + v.heartRate, 0) / allVitals.length;
    const avgO2 = allVitals.reduce((sum, v) => sum + v.oxygenSaturation, 0) / allVitals.length;
    const avgTemp = allVitals.reduce((sum, v) => sum + v.temperature, 0) / allVitals.length;

    // Generate trend data (last 14 data points for sparklines)
    const generateTrendData = (getValue: (v: Vitals) => number) => {
      const recentVitals = allVitals.slice(0, 14);
      return recentVitals.map(v => getValue(v)).reverse();
    };

    return [
      {
        label: 'Average Blood Pressure',
        current: `${Math.round(avgBP)}/75`,
        data: generateTrendData(v => v.bloodPressureSystolic),
        trend: -2, // Mock: 2% decrease (improvement)
        unit: 'mmHg',
      },
      {
        label: 'Average Heart Rate',
        current: Math.round(avgHR).toString(),
        data: generateTrendData(v => v.heartRate),
        trend: 1,
        unit: 'bpm',
      },
      {
        label: 'Average O2 Saturation',
        current: Math.round(avgO2).toString(),
        data: generateTrendData(v => v.oxygenSaturation),
        trend: 0,
        unit: '%',
      },
      {
        label: 'Average Temperature',
        current: avgTemp.toFixed(1),
        data: generateTrendData(v => v.temperature),
        trend: 0,
        unit: '°C',
      },
    ];
  },

  /**
   * Aggregates medication statistics across all patients
   */
  calculateMedicationStats: (patients: Patient[]) => {
    let totalActive = 0;
    let expiringThisWeek = 0;
    let refillsNeeded = 0;
    let recentChanges = 0;

    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    patients.forEach(patient => {
      patient.medications.forEach(med => {
        // Active medications (no end date or end date in future)
        if (!med.endDate || med.endDate > now) {
          totalActive++;
        }

        // Expiring this week
        if (med.endDate && med.endDate > now && med.endDate <= oneWeekFromNow) {
          expiringThisWeek++;
        }

        // Refills needed
        if (med.refillsRemaining === 0) {
          refillsNeeded++;
        }

        // Recent changes (started in last 7 days)
        if (med.startDate >= sevenDaysAgo) {
          recentChanges++;
        }
      });
    });

    return {
      totalActive,
      expiringThisWeek,
      refillsNeeded,
      recentChanges,
    };
  },

  /**
   * Generates mock recent activity events
   * In production, this would query an actual activity log
   */
  generateRecentActivity: (patients: Patient[]): ActivityEvent[] => {
    const events: ActivityEvent[] = [];
    const now = new Date();

    // Sample recent patients for activity
    patients.slice(0, 5).forEach((patient, idx) => {
      const timestamp = new Date(now.getTime() - idx * 30 * 60 * 1000); // 30 min intervals

      if (idx === 0) {
        events.push({
          id: `event-${idx}`,
          type: 'patient_added',
          message: `New patient registered: ${patient.name}`,
          timestamp,
        });
      } else if (idx === 1 && patient.vitals.length > 0) {
        events.push({
          id: `event-${idx}`,
          type: 'vitals_recorded',
          message: `Vitals recorded for ${patient.name}`,
          timestamp,
        });
      } else if (idx === 2 && patient.aiAnalyses.length > 0) {
        events.push({
          id: `event-${idx}`,
          type: 'report_generated',
          message: `AI analysis completed for ${patient.name}`,
          timestamp,
        });
      } else if (idx === 3 && patient.medications.length > 0) {
        events.push({
          id: `event-${idx}`,
          type: 'medication_updated',
          message: `Medication updated for ${patient.name}`,
          timestamp,
        });
      }
    });

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  },
};
