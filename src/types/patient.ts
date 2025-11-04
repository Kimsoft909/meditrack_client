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
  route?: string; // oral, IV, topical, etc.
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  prescriptionNumber: string;
  instructions: string;
  refillsRemaining: number;
  indication?: string; // reason for medication
  notes?: string;
  drug_id?: string; // backend reference
  is_active?: boolean; // backend tracking
}

export interface Visit {
  id: string;
  date: Date;
  visit_type: 'routine' | 'emergency' | 'follow-up'; // backend alignment
  department?: string;
  provider?: string; // doctor/provider name
  chief_complaint?: string; // reason for visit
  diagnosis: string;
  treatment?: string;
  notes: string;
  // Legacy fields for backward compatibility
  reason?: string;
  doctorName?: string;
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
