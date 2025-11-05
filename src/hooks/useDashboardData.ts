// Custom hook for managing dashboard state with memoized calculations

import { useState, useEffect, useMemo } from 'react';
import { patientService } from '@/services/patientService';
import { dashboardService } from '@/services/dashboardService';

export const useDashboardData = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoading(true);
        const response = await patientService.getPatients({ page: 1, pageSize: 1000 });
        setPatients(response.patients);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatients();
  }, []);

  // Memoize expensive dashboard calculations to prevent unnecessary re-renders
  const dashboardData = useMemo(() => {
    return dashboardService.aggregateDashboardData(patients);
  }, [patients]);

  return {
    ...dashboardData,
    isLoading,
    error,
  };
};
