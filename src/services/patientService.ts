// Patient data access layer with full backend integration

import { httpClient } from './httpClient';
import { API_ENDPOINTS } from '@/config/api';
import { logger } from '@/utils/logger';
import type {
  Patient, PatientCreate, PatientUpdate, PatientResponse, PatientListResponse,
  VitalCreate, VitalResponse, MedicationCreate, MedicationUpdate, MedicationResponse,
  VisitCreate, VisitResponse, PatientStatus, RiskLevel
} from '@/types/patient';

// Transform backend PatientResponse to frontend Patient model
const transformPatient = (backendPatient: PatientResponse): Patient => {
  return {
    id: backendPatient.id,
    name: `${backendPatient.first_name} ${backendPatient.last_name}`,
    age: backendPatient.age,
    sex: backendPatient.sex,
    dateOfBirth: new Date(backendPatient.date_of_birth),
    contactNumber: backendPatient.contact_number || '',
    email: backendPatient.email,
    address: backendPatient.address,
    bloodType: backendPatient.blood_type,
    allergies: backendPatient.allergies?.split(',').map(a => a.trim()).filter(Boolean) || [],
    chronicConditions: backendPatient.chronic_conditions?.split(',').map(c => c.trim()).filter(Boolean) || [],
    emergencyContact: {
      name: 'Not provided',
      phone: 'Not provided',
      relationship: 'Not provided',
    },
    status: backendPatient.status as PatientStatus,
    riskLevel: backendPatient.risk_level as RiskLevel,
    lastVisit: new Date(backendPatient.updated_at),
    vitals: [],
    medications: [],
    visits: [],
    aiAnalyses: [],
    weight: backendPatient.weight,
    height: backendPatient.height,
    bmi: backendPatient.bmi,
  };
};

export const patientService = {
  // Get paginated patients with filters
  async getPatients(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    riskLevel?: string;
  } = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('page_size', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.riskLevel) queryParams.append('risk_level', params.riskLevel);

      const url = `${API_ENDPOINTS.patients.list}?${queryParams.toString()}`;
      const response = await httpClient.get<PatientListResponse>(url, true);

      logger.info('Fetched patients successfully', { count: response.patients.length });
      
      return {
        patients: response.patients.map(transformPatient),
        total: response.total,
        page: response.page,
        pageSize: response.page_size,
        totalPages: Math.ceil(response.total / response.page_size),
      };
    } catch (error) {
      logger.error('Failed to fetch patients', error);
      throw error;
    }
  },

  // Get single patient by ID
  async getPatientById(id: string): Promise<Patient> {
    try {
      const response = await httpClient.get<PatientResponse>(API_ENDPOINTS.patients.details(id), true);
      logger.info('Fetched patient details', { patientId: id });
      return transformPatient(response);
    } catch (error) {
      logger.error('Failed to fetch patient', { patientId: id, error });
      throw error;
    }
  },

  // Create patient
  async createPatient(data: PatientCreate): Promise<Patient> {
    try {
      const response = await httpClient.post<PatientResponse>(API_ENDPOINTS.patients.create, data, true);
      logger.info('Created new patient', { patientId: response.id });
      return transformPatient(response);
    } catch (error) {
      logger.error('Failed to create patient', error);
      throw error;
    }
  },

  // Update patient
  async updatePatient(id: string, updates: PatientUpdate): Promise<Patient> {
    try {
      const response = await httpClient.patch<PatientResponse>(API_ENDPOINTS.patients.update(id), updates, true);
      logger.info('Updated patient', { patientId: id });
      return transformPatient(response);
    } catch (error) {
      logger.error('Failed to update patient', { patientId: id, error });
      throw error;
    }
  },

  // Delete patient (soft delete)
  async deletePatient(id: string): Promise<void> {
    try {
      await httpClient.delete(API_ENDPOINTS.patients.delete(id), true);
      logger.info('Deleted patient', { patientId: id });
    } catch (error) {
      logger.error('Failed to delete patient', { patientId: id, error });
      throw error;
    }
  },

  // Add vital reading
  async addVitalReading(patientId: string, vital: VitalCreate): Promise<VitalResponse> {
    try {
      const response = await httpClient.post<VitalResponse>(
        API_ENDPOINTS.vitals.create(patientId),
        vital,
        true
      );
      logger.info('Added vital reading', { patientId, vitalId: response.id });
      return response;
    } catch (error) {
      logger.error('Failed to add vital reading', { patientId, error });
      throw error;
    }
  },

  // Get patient vitals
  async getPatientVitals(patientId: string, limit: number = 50): Promise<VitalResponse[]> {
    try {
      const url = `${API_ENDPOINTS.vitals.list(patientId)}?limit=${limit}`;
      const response = await httpClient.get<VitalResponse[]>(url, true);
      logger.info('Fetched patient vitals', { patientId, count: response.length });
      return response;
    } catch (error) {
      logger.error('Failed to fetch vitals', { patientId, error });
      throw error;
    }
  },

  // Add medication
  async addMedication(patientId: string, medication: MedicationCreate): Promise<MedicationResponse> {
    try {
      const response = await httpClient.post<MedicationResponse>(
        API_ENDPOINTS.medications.create(patientId),
        medication,
        true
      );
      logger.info('Added medication', { patientId, medicationId: response.id });
      return response;
    } catch (error) {
      logger.error('Failed to add medication', { patientId, error });
      throw error;
    }
  },

  // Get patient medications
  async getPatientMedications(patientId: string, activeOnly: boolean = true): Promise<MedicationResponse[]> {
    try {
      const url = `${API_ENDPOINTS.medications.list(patientId)}?active_only=${activeOnly}`;
      const response = await httpClient.get<{ medications: MedicationResponse[] }>(url, true);
      logger.info('Fetched patient medications', { patientId, count: response.medications.length });
      return response.medications;
    } catch (error) {
      logger.error('Failed to fetch medications', { patientId, error });
      throw error;
    }
  },

  // Update medication
  async updateMedication(medicationId: string, updates: MedicationUpdate): Promise<MedicationResponse> {
    try {
      const response = await httpClient.patch<MedicationResponse>(
        API_ENDPOINTS.medications.update(medicationId),
        updates,
        true
      );
      logger.info('Updated medication', { medicationId });
      return response;
    } catch (error) {
      logger.error('Failed to update medication', { medicationId, error });
      throw error;
    }
  },

  // Discontinue medication
  async discontinueMedication(medicationId: string): Promise<void> {
    try {
      await httpClient.delete(API_ENDPOINTS.medications.discontinue(medicationId), true);
      logger.info('Discontinued medication', { medicationId });
    } catch (error) {
      logger.error('Failed to discontinue medication', { medicationId, error });
      throw error;
    }
  },

  // Add visit
  async addVisit(patientId: string, visit: VisitCreate): Promise<VisitResponse> {
    try {
      const response = await httpClient.post<VisitResponse>(
        API_ENDPOINTS.visits.create(patientId),
        visit,
        true
      );
      logger.info('Recorded visit', { patientId, visitId: response.id });
      return response;
    } catch (error) {
      logger.error('Failed to record visit', { patientId, error });
      throw error;
    }
  },

  // Get patient visits
  async getPatientVisits(patientId: string): Promise<VisitResponse[]> {
    try {
      const response = await httpClient.get<{
        visits: VisitResponse[];
        total: number;
        page: number;
        page_size: number;
      }>(
        API_ENDPOINTS.visits.list(patientId),
        true
      );
      logger.info('Fetched patient visits', { 
        patientId, 
        count: response.visits.length,
        total: response.total 
      });
      return response.visits;
    } catch (error) {
      logger.error('Failed to fetch visits', { patientId, error });
      throw error;
    }
  },
};
