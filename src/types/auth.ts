// Authentication-related types for user management

export enum MedicalSpecialty {
  CARDIOLOGIST = 'Cardiologist',
  ORTHOPEDIST = 'Orthopedist',
  PEDIATRICIAN = 'Pediatrician',
  NEUROLOGIST = 'Neurologist',
  DERMATOLOGIST = 'Dermatologist',
  PSYCHIATRIST = 'Psychiatrist',
  ONCOLOGIST = 'Oncologist',
  ENDOCRINOLOGIST = 'Endocrinologist',
  GASTROENTEROLOGIST = 'Gastroenterologist',
  PULMONOLOGIST = 'Pulmonologist',
  RHEUMATOLOGIST = 'Rheumatologist',
  NEPHROLOGIST = 'Nephrologist',
  RADIOLOGIST = 'Radiologist',
  ANESTHESIOLOGIST = 'Anesthesiologist',
  SURGEON = 'General Surgeon',
  PATHOLOGIST = 'Pathologist',
  OPHTHALMOLOGIST = 'Ophthalmologist',
  UROLOGIST = 'Urologist',
  OBSTETRICIAN = 'Obstetrician/Gynecologist',
  OTHER = 'Other'
}

export interface User {
  id: string;
  username: string;
  email: string;
  specialty: MedicalSpecialty;
  avatar?: string;
  initials: string;
}

export interface LoginFormData {
  username: string;
  password: string;
}

export interface SignupFormData {
  username: string;
  email: string;
  specialty: MedicalSpecialty;
  password: string;
  confirmPassword: string;
}
