// Core patient data structures for MEDITRACK

export enum RiskLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum PatientStatus {
  ACTIVE = 'active',
  DISCHARGED = 'discharged',
  PENDING = 'pending',
}

export interface Vitals {
  id: string;
  timestamp: Date;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  temperature: number;
  oxygenSaturation: number;
  bloodGlucose?: number;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  prescriptionNumber: string;
  instructions: string;
  refillsRemaining: number;
}

export interface Visit {
  id: string;
  date: Date;
  reason: string;
  diagnosis: string;
  notes: string;
  doctorName: string;
}

export interface AIAnalysis {
  id: string;
  date: Date;
  summary: string;
  riskFactors: string[];
  recommendations: string[];
  confidence: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: 'M' | 'F' | 'Other';
  dateOfBirth: Date;
  contactNumber: string;
  email?: string;
  address?: string;
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  status: PatientStatus;
  riskLevel: RiskLevel;
  lastVisit: Date;
  vitals: Vitals[];
  medications: Medication[];
  visits: Visit[];
  aiAnalyses: AIAnalysis[];
  photo?: string;
  weight: number; // in kg
  height: number; // in meters
  bmi: number; // calculated
}

export interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // Date string format for form input
  age: number;
  sex: 'M' | 'F' | 'Other';
  contactNumber: string;
  email?: string;
  address?: string;
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  weight?: number;
  height?: number;
  photo?: string;
}

export interface VitalReadingInput {
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  temperature: number;
  oxygenSaturation: number;
  bloodGlucose?: number;
  timestamp?: Date;
  notes?: string;
}

export interface DashboardStats {
  totalPatients: number;
  patientsAtRisk: number;
  activePatients: number;
  medicationChanges: number;
  pendingReports: number;
}
