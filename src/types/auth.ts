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
  full_name: string;
  specialty?: string;
  password: string;
  confirmPassword: string;
}

// Backend Response Types
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name: string;
  specialty: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ProfileUpdateRequest {
  full_name?: string;
  specialty?: string;
  email?: string;
}
