// Patient data access layer - abstraction over mock data for future API integration

import { Patient, PatientFormData, VitalReadingInput, Medication, Vitals, PatientStatus, RiskLevel } from '@/types/patient';
import { mockPatients, PATIENTS_PER_PAGE } from '@/utils/mockData';
import { generatePatientId, calculateBMI } from '@/utils/medical';

// In-memory store (will be replaced with API calls)
let patientsStore: Patient[] = [...mockPatients];

export const patientService = {
  // Get paginated patients
  getPatients: (page: number = 1, pageSize: number = PATIENTS_PER_PAGE) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPatients = patientsStore.slice(startIndex, endIndex);
    
    return {
      patients: paginatedPatients,
      total: patientsStore.length,
      page,
      pageSize,
      totalPages: Math.ceil(patientsStore.length / pageSize),
    };
  },

  // Get single patient by ID
  getPatientById: (id: string): Patient | undefined => {
    return patientsStore.find(p => p.id === id);
  },

  // Add new patient
  addPatient: (data: PatientFormData): Patient => {
    const age = new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear();
    const name = `${data.firstName} ${data.lastName}`;
    const dateOfBirth = new Date(data.dateOfBirth);
    const weight = data.weight || 70;
    const height = data.height || 1.7;
    const bmi = calculateBMI(weight, height);
    
    const newPatient: Patient = {
      id: generatePatientId(),
      name,
      age,
      sex: data.sex,
      dateOfBirth,
      contactNumber: data.contactNumber,
      email: data.email,
      address: data.address,
      bloodType: data.bloodType,
      allergies: data.allergies,
      chronicConditions: data.chronicConditions,
      emergencyContact: {
        name: data.emergencyContactName || 'Not provided',
        phone: data.emergencyContactPhone || 'Not provided',
        relationship: data.emergencyContactRelationship || 'Not provided',
      },
      status: PatientStatus.ACTIVE,
      riskLevel: RiskLevel.LOW,
      lastVisit: new Date(),
      vitals: [],
      medications: [],
      visits: [],
      aiAnalyses: [],
      photo: data.photo,
      weight,
      height,
      bmi,
    };

    patientsStore = [newPatient, ...patientsStore];
    return newPatient;
  },

  // Update existing patient
  updatePatient: (id: string, updates: Partial<Patient>): Patient | null => {
    const index = patientsStore.findIndex(p => p.id === id);
    if (index === -1) return null;

    // Recalculate BMI if weight or height changed
    if (updates.weight || updates.height) {
      const patient = patientsStore[index];
      const weight = updates.weight ?? patient.weight;
      const height = updates.height ?? patient.height;
      updates.bmi = calculateBMI(weight, height);
    }

    patientsStore[index] = { ...patientsStore[index], ...updates };
    return patientsStore[index];
  },

  // Add vital reading
  addVitalReading: (patientId: string, vitals: VitalReadingInput): Vitals | null => {
    const patient = patientsStore.find(p => p.id === patientId);
    if (!patient) return null;

    const newVital: Vitals = {
      id: `vital-${Date.now()}`,
      timestamp: vitals.timestamp || new Date(),
      bloodPressureSystolic: vitals.bloodPressureSystolic,
      bloodPressureDiastolic: vitals.bloodPressureDiastolic,
      heartRate: vitals.heartRate,
      temperature: vitals.temperature,
      oxygenSaturation: vitals.oxygenSaturation,
      bloodGlucose: vitals.bloodGlucose,
    };

    patient.vitals = [newVital, ...patient.vitals];
    patient.lastVisit = newVital.timestamp;
    
    return newVital;
  },

  // Add medication
  addMedication: (patientId: string, medication: Omit<Medication, 'id'>): Medication | null => {
    const patient = patientsStore.find(p => p.id === patientId);
    if (!patient) return null;

    const newMedication: Medication = {
      ...medication,
      id: `med-${Date.now()}`,
    };

    patient.medications = [...patient.medications, newMedication];
    return newMedication;
  },

  // Update medication
  updateMedication: (patientId: string, medicationId: string, updates: Partial<Medication>): Medication | null => {
    const patient = patientsStore.find(p => p.id === patientId);
    if (!patient) return null;

    const medIndex = patient.medications.findIndex(m => m.id === medicationId);
    if (medIndex === -1) return null;

    patient.medications[medIndex] = { ...patient.medications[medIndex], ...updates };
    return patient.medications[medIndex];
  },

  // Discontinue medication (set end date)
  discontinueMedication: (patientId: string, medicationId: string): Medication | null => {
    return patientService.updateMedication(patientId, medicationId, { endDate: new Date() });
  },

  // Refill medication (decrement refills)
  refillMedication: (patientId: string, medicationId: string): Medication | null => {
    const patient = patientsStore.find(p => p.id === patientId);
    if (!patient) return null;

    const medication = patient.medications.find(m => m.id === medicationId);
    if (!medication || medication.refillsRemaining <= 0) return null;

    return patientService.updateMedication(patientId, medicationId, {
      refillsRemaining: medication.refillsRemaining - 1,
    });
  },
};
