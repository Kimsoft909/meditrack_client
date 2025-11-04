// Advanced mock data generator for development and testing

import { Patient, RiskLevel, PatientStatus, Vitals, DashboardStats, Medication, Visit } from '@/types/patient';
import { generatePatientId, calculateBMI } from '@/utils/medical';

export const PATIENTS_PER_PAGE = 50;

// Realistic name pools
const firstNames = {
  M: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Andrew', 'Kenneth', 'Joshua', 'Kevin'],
  F: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Lisa', 'Nancy', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle'],
};

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker'];

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const commonAllergies = ['Penicillin', 'Sulfa drugs', 'Aspirin', 'Latex', 'Iodine', 'Eggs', 'Peanuts', 'Shellfish'];
const chronicConditions = ['Type 2 Diabetes', 'Hypertension', 'Coronary Artery Disease', 'COPD', 'Asthma', 'Hypothyroidism', 'Atrial Fibrillation', 'Chronic Kidney Disease', 'Arthritis'];
const medications = [
  { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', instructions: 'Take with meals' },
  { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', instructions: 'Take in the morning' },
  { name: 'Atorvastatin', dosage: '40mg', frequency: 'Once daily', instructions: 'Take at bedtime' },
  { name: 'Levothyroxine', dosage: '75mcg', frequency: 'Once daily', instructions: 'Take on empty stomach' },
  { name: 'Warfarin', dosage: '5mg', frequency: 'Once daily', instructions: 'Consistent timing daily' },
  { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', instructions: 'Take with or without food' },
  { name: 'Omeprazole', dosage: '20mg', frequency: 'Once daily', instructions: 'Take before breakfast' },
];

const doctorNames = ['Dr. Smith', 'Dr. Patel', 'Dr. Kumar', 'Dr. Johnson', 'Dr. Lee', 'Dr. Brown', 'Dr. Wilson', 'Dr. Garcia'];

// Generate realistic vital signs with age-appropriate variations
const generateVitals = (count: number, age: number, conditions: string[]): Vitals[] => {
  const vitals: Vitals[] = [];
  const now = new Date();
  
  // Age and condition-based baseline adjustments
  const hasHypertension = conditions.includes('Hypertension');
  const hasDiabetes = conditions.includes('Type 2 Diabetes');
  const baselineSystolic = hasHypertension ? 135 : 115;
  const baselineGlucose = hasDiabetes ? 140 : 95;
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 7); // Weekly readings
    
    vitals.push({
      id: `vital-${date.getTime()}-${i}`,
      timestamp: date,
      bloodPressureSystolic: baselineSystolic + Math.floor(Math.random() * 20 - 10),
      bloodPressureDiastolic: 70 + Math.floor(Math.random() * 15),
      heartRate: 60 + Math.floor(Math.random() * 25) + Math.floor(age / 10),
      temperature: 36.5 + Math.random() * 1.0,
      oxygenSaturation: 95 + Math.floor(Math.random() * 5),
      bloodGlucose: baselineGlucose + Math.floor(Math.random() * 30 - 15),
    });
  }
  
  return vitals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

// Generate visit history
const generateVisits = (count: number): Visit[] => {
  const reasons = ['Routine checkup', 'Follow-up visit', 'Acute complaint', 'Chronic disease management', 'Medication review', 'Lab results review'];
  const visitTypes: Array<'routine' | 'emergency' | 'follow-up'> = ['routine', 'routine', 'follow-up', 'emergency', 'routine', 'follow-up'];
  const departments = ['General Medicine', 'Cardiology', 'Emergency', 'Internal Medicine'];
  const visits: Visit[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i * 2);
    
    const reason = reasons[Math.floor(Math.random() * reasons.length)];
    
    visits.push({
      id: `visit-${date.getTime()}-${i}`,
      date,
      visit_type: visitTypes[Math.floor(Math.random() * visitTypes.length)],
      department: departments[Math.floor(Math.random() * departments.length)],
      provider: doctorNames[Math.floor(Math.random() * doctorNames.length)],
      chief_complaint: reason,
      diagnosis: 'Stable condition, continue current treatment',
      treatment: 'Continue current medications, follow-up in 2 months',
      notes: 'Patient reports feeling well. Vital signs within acceptable range. Continue current medications.',
      // Legacy fields for backward compatibility
      reason,
      doctorName: doctorNames[Math.floor(Math.random() * doctorNames.length)],
    });
  }
  
  return visits;
};

// Generate patient medications
const generateMedications = (conditions: string[]): Medication[] => {
  const patientMeds: Medication[] = [];
  
  conditions.forEach((condition, idx) => {
    const med = medications[idx % medications.length];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 24));
    
    patientMeds.push({
      id: `med-${Date.now()}-${idx}`,
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      startDate,
      prescribedBy: doctorNames[Math.floor(Math.random() * doctorNames.length)],
      prescriptionNumber: `RX${new Date().getFullYear()}${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
      instructions: med.instructions,
      refillsRemaining: Math.floor(Math.random() * 6),
    });
  });
  
  return patientMeds;
};

// Generate 100 patients with realistic, varied data
export const mockPatients: Patient[] = Array.from({ length: 100 }, (_, index) => {
  const sex = Math.random() > 0.5 ? 'M' : 'F';
  const firstName = firstNames[sex][Math.floor(Math.random() * firstNames[sex].length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const age = 20 + Math.floor(Math.random() * 60);
  const dateOfBirth = new Date();
  dateOfBirth.setFullYear(dateOfBirth.getFullYear() - age);
  
  // Age-appropriate conditions (older patients → more conditions)
  const numConditions = age > 60 ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 2);
  const patientConditions = Array.from({ length: numConditions }, () => 
    chronicConditions[Math.floor(Math.random() * chronicConditions.length)]
  ).filter((v, i, a) => a.indexOf(v) === i); // Unique conditions
  
  // Risk level based on age and conditions
  let riskLevel: RiskLevel;
  if (patientConditions.length >= 3 || age > 70) {
    riskLevel = RiskLevel.CRITICAL;
  } else if (patientConditions.length >= 2 || age > 60) {
    riskLevel = RiskLevel.HIGH;
  } else if (patientConditions.length >= 1) {
    riskLevel = RiskLevel.MODERATE;
  } else {
    riskLevel = RiskLevel.LOW;
  }
  
  // Generate allergies (30% chance of having allergies)
  const hasAllergies = Math.random() > 0.7;
  const numAllergies = hasAllergies ? Math.floor(Math.random() * 2) + 1 : 0;
  const patientAllergies = Array.from({ length: numAllergies }, () =>
    commonAllergies[Math.floor(Math.random() * commonAllergies.length)]
  ).filter((v, i, a) => a.indexOf(v) === i);
  
  // Physical metrics with realistic distributions
  const height = 1.5 + Math.random() * 0.45; // 1.50m to 1.95m
  const weight = 45 + Math.random() * 75; // 45kg to 120kg
  const bmi = calculateBMI(weight, height);
  
  const lastVisit = new Date();
  lastVisit.setDate(lastVisit.getDate() - Math.floor(Math.random() * 30));
  
  return {
    id: generatePatientId(),
    name: `${firstName} ${lastName}`,
    age,
    sex: sex as 'M' | 'F',
    dateOfBirth,
    contactNumber: `+1-${Math.floor(Math.random() * 900 + 100)}-${String(Math.floor(Math.random() * 9000000 + 1000000))}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
    address: `${Math.floor(Math.random() * 9999) + 1} ${lastNames[Math.floor(Math.random() * lastNames.length)]} St`,
    bloodType: bloodTypes[Math.floor(Math.random() * bloodTypes.length)],
    allergies: patientAllergies,
    chronicConditions: patientConditions,
    emergencyContact: {
      name: `${firstNames[sex === 'M' ? 'F' : 'M'][Math.floor(Math.random() * 5)]} ${lastName}`,
      phone: `+1-${Math.floor(Math.random() * 900 + 100)}-${String(Math.floor(Math.random() * 9000000 + 1000000))}`,
      relationship: ['Spouse', 'Sibling', 'Parent', 'Child', 'Friend'][Math.floor(Math.random() * 5)],
    },
    status: Math.random() > 0.9 ? PatientStatus.DISCHARGED : PatientStatus.ACTIVE,
    riskLevel,
    lastVisit,
    vitals: generateVitals(30, age, patientConditions),
    medications: generateMedications(patientConditions),
    visits: generateVisits(Math.floor(Math.random() * 8) + 2),
    aiAnalyses: [],
    weight: Number(weight.toFixed(1)),
    height: Number(height.toFixed(2)),
    bmi: Number(bmi.toFixed(1)),
  };
});

export const mockDashboardStats: DashboardStats = {
  totalPatients: mockPatients.length,
  patientsAtRisk: mockPatients.filter(p => 
    p.riskLevel === RiskLevel.HIGH || p.riskLevel === RiskLevel.CRITICAL
  ).length,
  activePatients: mockPatients.filter(p => p.status === PatientStatus.ACTIVE).length,
  medicationChanges: 8,
  pendingReports: 5,
};
