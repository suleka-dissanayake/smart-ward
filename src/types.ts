export type UserRole = 'doctor' | 'nurse' | 'admin';

export type Screen =
  | 'login'
  | 'doctor-dashboard'
  | 'nurse-dashboard'
  | 'ward-bed'
  | 'patient-list'
  | 'patient-profile'
  | 'patient-history'
  | 'record-vitals'
  | 'medications'
  | 'ward-round'
  | 'nursing-notes'
  | 'notifications'
  | 'admin-dashboard'
  | 'admin-patients'
  | 'admin-wards'
  | 'admin-users'
  | 'er-diagram';

export type PatientStatus = 'Stable' | 'Attention' | 'Critical' | 'Discharged';

export interface VitalSigns {
  temperature: string;
  bloodPressure: string;
  pulse: string;
  respiratoryRate: string;
  spo2: string;
  painScore: number;
  recordedAt: string;
  recordedBy: string;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  route: string;
  frequency: string;
  startDate: string;
  endDate: string;
  scheduledTimes: ScheduledDose[];
}

export interface ScheduledDose {
  time: string;
  status: 'Pending' | 'Administered';
  administeredAt?: string;
  administeredBy?: string;
}

export interface WardRoundNote {
  id: string;
  date: string;
  doctor: string;
  assessment: string;
  clinicalNotes: string;
  treatmentPlan: string;
  nextReview: string;
}

export interface NursingNote {
  id: string;
  date: string;
  nurse: string;
  note: string;
}

export interface HistoryEntry {
  id: string;
  type: 'ward-round' | 'vitals' | 'medication' | 'nursing-note' | 'admission';
  date: string;
  title: string;
  summary: string;
  staff: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  ward: string;
  bed: string;
  admissionDate: string;
  status: PatientStatus;
  diagnosis: string;
  allergies: string[];
  vitals: VitalSigns;
  medications: Medication[];
  wardRounds: WardRoundNote[];
  nursingNotes: NursingNote[];
  history: HistoryEntry[];
  assignedDoctor: string;
  assignedNurse: string;
}

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  department: string;
  status: 'Active' | 'Inactive';
}

export interface Ward {
  id: string;
  name: string;
  totalBeds: number;
  occupiedBeds: number;
}

export interface AppState {
  currentUser: AppUser | null;
  screen: Screen;
  selectedPatientId: string | null;
}
