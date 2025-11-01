// Medical calculations and utilities for patient data

export const calculateBMI = (weight: number, height: number): number => {
  if (height <= 0) return 0;
  return Number((weight / (height * height)).toFixed(1));
};

export type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export const getBMICategory = (bmi: number): BMICategory => {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
};

export const getBMIColor = (bmi: number): string => {
  const category = getBMICategory(bmi);
  switch (category) {
    case 'underweight':
      return 'text-blue-600';
    case 'normal':
      return 'text-success';
    case 'overweight':
      return 'text-warning';
    case 'obese':
      return 'text-destructive';
  }
};

export const getBMIBackgroundColor = (bmi: number): string => {
  const category = getBMICategory(bmi);
  switch (category) {
    case 'underweight':
      return 'bg-blue-50';
    case 'normal':
      return 'bg-green-50';
    case 'overweight':
      return 'bg-amber-50';
    case 'obese':
      return 'bg-red-50';
  }
};

// Generate custom patient ID in format MED-YYYY-XXXX
export const generatePatientId = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `MED-${year}-${random}`;
};

// Validate patient ID format
export const isValidPatientId = (id: string): boolean => {
  return /^MED-\d{4}-\d{4}$/.test(id);
};

// Validate vital signs are within acceptable ranges
export const validateVitalRange = (
  type: 'systolic' | 'diastolic' | 'heartRate' | 'temperature' | 'oxygen' | 'glucose',
  value: number
): boolean => {
  switch (type) {
    case 'systolic':
      return value >= 60 && value <= 250;
    case 'diastolic':
      return value >= 40 && value <= 150;
    case 'heartRate':
      return value >= 30 && value <= 220;
    case 'temperature':
      return value >= 35 && value <= 42;
    case 'oxygen':
      return value >= 70 && value <= 100;
    case 'glucose':
      return value >= 40 && value <= 600;
    default:
      return false;
  }
};

// Get vital status based on value
export const getVitalStatus = (
  type: 'systolic' | 'diastolic' | 'heartRate' | 'temperature' | 'oxygen' | 'glucose',
  value: number
): 'normal' | 'warning' | 'danger' => {
  switch (type) {
    case 'systolic':
      if (value < 90 || value > 140) return 'warning';
      if (value < 80 || value > 180) return 'danger';
      return 'normal';
    case 'diastolic':
      if (value < 60 || value > 90) return 'warning';
      if (value < 50 || value > 110) return 'danger';
      return 'normal';
    case 'heartRate':
      if (value < 60 || value > 100) return 'warning';
      if (value < 50 || value > 120) return 'danger';
      return 'normal';
    case 'temperature':
      if (value < 36.1 || value > 37.8) return 'warning';
      if (value < 35.5 || value > 39) return 'danger';
      return 'normal';
    case 'oxygen':
      if (value < 95) return 'warning';
      if (value < 90) return 'danger';
      return 'normal';
    case 'glucose':
      if (value < 70 || value > 140) return 'warning';
      if (value < 60 || value > 200) return 'danger';
      return 'normal';
    default:
      return 'normal';
  }
};
