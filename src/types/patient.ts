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

// ========== Backend API Types ==========

export interface PatientCreate {
  first_name: string;
  last_name: string;
  date_of_birth: string; // ISO date string
  sex: 'M' | 'F' | 'Other';
  blood_type?: string;
  contact_number?: string;
  email?: string;
  address?: string;
  weight: number;
  height: number;
  allergies?: string; // comma-separated
  chronic_conditions?: string; // comma-separated
  notes?: string;
}

export interface PatientUpdate {
  first_name?: string;
  last_name?: string;
  contact_number?: string;
  email?: string;
  address?: string;
  weight?: number;
  height?: number;
  allergies?: string;
  chronic_conditions?: string;
  notes?: string;
  status?: string;
  risk_level?: string;
}

export interface PatientResponse {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  sex: 'M' | 'F' | 'Other';
  date_of_birth: string;
  blood_type?: string;
  contact_number?: string;
  email?: string;
  address?: string;
  weight: number;
  height: number;
  bmi: number;
  allergies?: string;
  chronic_conditions?: string;
  notes?: string;
  status: string;
  risk_level: string;
  admission_date: string;
  created_at: string;
  updated_at: string;
}

export interface PatientListResponse {
  total: number;
  page: number;
  page_size: number;
  patients: PatientResponse[];
}

export interface VitalCreate {
  blood_pressure_systolic: number;
  blood_pressure_diastolic: number;
  heart_rate: number;
  temperature: number;
  oxygen_saturation: number;
  respiratory_rate?: number;
  blood_glucose?: number;
  notes?: string;
}

export interface VitalResponse extends VitalCreate {
  id: string;
  patient_id: string;
  timestamp: string;
  recorded_by?: string;
}

export interface MedicationCreate {
  name: string;
  dosage: string;
  frequency: string;
  route?: string;
  prescribed_by?: string;
  start_date?: string;
  end_date?: string;
  indication?: string;
  notes?: string;
  drug_id?: string;
}

export interface MedicationUpdate {
  dosage?: string;
  frequency?: string;
  route?: string;
  end_date?: string;
  is_active?: boolean;
  notes?: string;
}

export interface MedicationResponse extends MedicationCreate {
  id: string;
  patient_id: string;
  is_active: boolean;
  created_at: string;
}

export interface VisitCreate {
  visit_type: 'routine' | 'emergency' | 'follow-up';
  department?: string;
  provider?: string;
  chief_complaint?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
}

export interface VisitResponse extends VisitCreate {
  id: string;
  patient_id: string;
  visit_date: string;
}

export interface VisitListResponse {
  total: number;
  page: number;
  page_size: number;
  visits: VisitResponse[];
}
