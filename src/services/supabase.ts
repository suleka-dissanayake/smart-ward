import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  { auth: { persistSession: true, autoRefreshToken: true } }
);

// Base URL for the edge function server
export const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-8e66a9de`;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(`${SERVER_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? data.message ?? "Request failed");
  return data;
}

const get   = <T>(path: string) => request<T>(path);
const post  = <T>(path: string, body: unknown) => request<T>(path, { method: "POST",  body: JSON.stringify(body) });
const patch = <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
const del   = <T>(path: string) => request<T>(path, { method: "DELETE" });

// ── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login:  (email: string, password: string) => supabase.auth.signInWithPassword({ email, password }),
  logout: () => supabase.auth.signOut(),
  getSession: () => supabase.auth.getSession(),
  onAuthStateChange: (cb: Parameters<typeof supabase.auth.onAuthStateChange>[0]) =>
    supabase.auth.onAuthStateChange(cb),
};

// ── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => get<{ success: boolean; data: DashboardStats }>("/dashboard"),
};

// ── Patients ────────────────────────────────────────────────────────────────
export const patientsApi = {
  list:           (params?: Record<string, string>) => get<ApiListResponse<ApiPatient>>(`/patients${params ? "?" + new URLSearchParams(params) : ""}`),
  get:            (id: string) => get<{ success: boolean; data: ApiPatient }>(`/patients/${id}`),
  create:         (body: Partial<ApiPatient>) => post<{ success: boolean; data: ApiPatient }>("/patients", body),
  update:         (id: string, body: Partial<ApiPatient>) => patch<{ success: boolean; data: ApiPatient }>(`/patients/${id}`, body),
  remove:         (id: string) => del<{ success: boolean }>(`/patients/${id}`),
  addVitals:      (id: string, body: VitalsPayload) => post<{ success: boolean; data: ApiVitals }>(`/patients/${id}/vitals`, body),
  addMedication:  (id: string, body: MedPayload) => post<{ success: boolean; data: ApiMedication }>(`/patients/${id}/medications`, body),
  administerDose: (id: string, medId: string, doseId: string) => patch(`/patients/${id}/medications/${medId}/doses/${doseId}`, {}),
  addWardRound:   (id: string, body: WardRoundPayload) => post<{ success: boolean; data: ApiWardRound }>(`/patients/${id}/ward-rounds`, body),
  addNursingNote: (id: string, body: { note: string }) => post<{ success: boolean; data: ApiNursingNote }>(`/patients/${id}/nursing-notes`, body),
};

// ── Wards ────────────────────────────────────────────────────────────────────
export const wardsApi = {
  list:   () => get<ApiListResponse<ApiWard>>("/wards"),
  get:    (id: string) => get<{ success: boolean; data: ApiWard }>(`/wards/${id}`),
  create: (body: Partial<ApiWard>) => post<{ success: boolean; data: ApiWard }>("/wards", body),
  update: (id: string, body: Partial<ApiWard>) => patch<{ success: boolean; data: ApiWard }>(`/wards/${id}`, body),
  remove: (id: string) => del<{ success: boolean }>(`/wards/${id}`),
};

// ── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  list:    () => get<ApiListResponse<ApiUser>>("/users"),
  doctors: () => get<ApiListResponse<ApiUser>>("/users/doctors"),
  nurses:  () => get<ApiListResponse<ApiUser>>("/users/nurses"),
  create:  (body: Partial<ApiUser> & { password: string }) => post<{ success: boolean; data: ApiUser }>("/users", body),
  update:  (id: string, body: Partial<ApiUser>) => patch<{ success: boolean; data: ApiUser }>(`/users/${id}`, body),
  remove:  (id: string) => del<{ success: boolean }>(`/users/${id}`),
};

// ── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  list:        () => get<ApiListResponse<ApiNotification>>("/notifications"),
  markRead:    (id: string) => patch(`/notifications/${id}/read`, {}),
  markAllRead: () => patch("/notifications/read-all", {}),
  create:      (body: Partial<ApiNotification>) => post<{ success: boolean; data: ApiNotification }>("/notifications", body),
};

// ── Seed ─────────────────────────────────────────────────────────────────────
export const seedDb = () => fetch(`${SERVER_URL}/seed`, { method: "POST" }).then(r => r.json());

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ApiListResponse<T> { success: boolean; count: number; data: T[] }

export interface ApiUser {
  id: string; _id: string;
  name: string; email: string;
  role: "doctor" | "nurse" | "admin";
  department: string; status: "Active" | "Inactive";
}

export interface ApiVitals {
  id: string; _id: string;
  temperature: string; blood_pressure: string; bloodPressure?: string;
  pulse: string; respiratory_rate: string; respiratoryRate?: string;
  spo2: string; pain_score: number; painScore?: number;
  recorded_at: string; recorded_by: ApiUser | string;
}

export interface ApiScheduledDose {
  id: string; _id: string;
  time: string; status: "Pending" | "Administered";
  administered_at?: string; administered_by?: ApiUser | string;
}

export interface ApiMedication {
  id: string; _id: string;
  name: string; dose: string; route: string; frequency: string;
  start_date: string; end_date: string;
  scheduled_doses: ApiScheduledDose[]; scheduledTimes?: ApiScheduledDose[];
  prescribed_by: ApiUser | string;
}

export interface ApiWardRound {
  id: string; _id: string;
  date: string; assessment: string; clinical_notes: string; clinicalNotes?: string;
  treatment_plan: string; treatmentPlan?: string; next_review: string;
  doctor: ApiUser | string;
}

export interface ApiNursingNote {
  id: string; _id: string;
  date: string; note: string;
  nurse: ApiUser | string;
}

export interface ApiPatient {
  id: string; _id: string;
  name: string; age: number; gender: "Male" | "Female";
  ward: ApiWard | string;
  ward_id?: string;
  bed: string; admission_date: string; admissionDate?: string;
  status: "Stable" | "Attention" | "Critical" | "Discharged";
  diagnosis: string; allergies: string[];
  assigned_doctor: ApiUser | string; assignedDoctor?: ApiUser | string;
  assigned_nurse: ApiUser | string;  assignedNurse?: ApiUser | string;
  vitals: ApiVitals[];
  medications: ApiMedication[];
  ward_rounds: ApiWardRound[]; wardRounds?: ApiWardRound[];
  nursing_notes: ApiNursingNote[]; nursingNotes?: ApiNursingNote[];
}

export interface ApiWard {
  id: string; _id: string;
  name: string; total_beds: number; totalBeds?: number;
  occupiedBeds: number;
  beds: { bed_number: string; bedNumber?: string; is_occupied: boolean; patient_id?: string }[];
}

export interface ApiNotification {
  id: string; _id: string;
  title: string; message: string;
  type: "alert" | "info" | "task" | "critical";
  recipient_role: string; recipientRole?: string;
  is_read: boolean; isRead?: boolean;
  created_at: string; createdAt?: string;
  patient?: { id: string; _id?: string; name: string };
  created_by?: ApiUser | string;
}

export interface DashboardStats {
  totalPatients: number; criticalPatients: number;
  stablePatients: number; attentionPatients: number;
  totalWards: number; totalUsers: number;
  unreadNotifications: number;
  wardSummary: { id: string; name: string; totalBeds: number; occupiedBeds: number }[];
}

export interface VitalsPayload {
  temperature: string; bloodPressure: string; pulse: string;
  respiratoryRate: string; spo2: string; painScore: number;
}

export interface MedPayload {
  name: string; dose: string; route: string; frequency: string;
  startDate: string; endDate: string;
}

export interface WardRoundPayload {
  assessment: string; clinicalNotes: string; treatmentPlan: string; nextReview: string;
}
