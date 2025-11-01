// Custom hook for managing dashboard state with memoized calculations

import { useMemo } from 'react';
import { patientService } from '@/services/patientService';
import { dashboardService } from '@/services/dashboardService';

export const useDashboardData = () => {
  // Fetch all patients (in production, this would be paginated/filtered)
  const { patients } = patientService.getPatients(1, 1000);

  // Memoize expensive dashboard calculations to prevent unnecessary re-renders
  const dashboardData = useMemo(() => {
    return dashboardService.aggregateDashboardData(patients);
  }, [patients]);

  return {
    ...dashboardData,
    isLoading: false, // Would be true during API calls in production
    error: null, // Would contain error state in production
  };
};
