// We are going to run this locally

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5000/api";
const TOKEN_KEY = "smartward_token";

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string): void  => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = (): void          => localStorage.removeItem(TOKEN_KEY);

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "Request failed");
  return data;
}

const get    = <T>(path: string)                  => request<T>(path);
const post   = <T>(path: string, body: unknown)   => request<T>(path, { method: "POST",   body: JSON.stringify(body) });
const patch  = <T>(path: string, body: unknown)   => request<T>(path, { method: "PATCH",  body: JSON.stringify(body) });
const del    = <T>(path: string)                  => request<T>(path, { method: "DELETE" });

export const authApi = {
  login: async (email: string, password: string): Promise<{ success: boolean; token: string; user: ApiUser }> => {
    const res = await post<{ success: boolean; token: string; user: ApiUser }>("/auth/login", { email, password });
    setToken(res.token);
    return res;
  },
  me: () => get<{ success: boolean; user: ApiUser }>("/auth/me"),
  logout: () => clearToken(),
  changePassword: (currentPassword: string, newPassword: string) =>
    patch<{ success: boolean; message: string }>("/auth/change-password", { currentPassword, newPassword }),
};

export const dashboardApi = {
  stats: () => get<{ success: boolean; data: DashboardStats }>("/dashboard"),
};

export const patientsApi = {
  list:           (params?: Record<string, string>) =>
    get<ApiListResponse<ApiPatient>>(`/patients${params ? "?" + new URLSearchParams(params) : ""}`),
  get:            (id: string) => get<{ success: boolean; data: ApiPatient }>(`/patients/${id}`),
  create:         (body: Partial<ApiPatient> & { assignedDoctor: string; assignedNurse: string }) =>
    post<{ success: boolean; data: ApiPatient }>("/patients", body),
  update:         (id: string, body: Partial<ApiPatient>) =>
    patch<{ success: boolean; data: ApiPatient }>(`/patients/${id}`, body),
  remove:         (id: string) => del<{ success: boolean }>(`/patients/${id}`),
  addVitals:      (id: string, body: VitalsPayload) =>
    post<{ success: boolean; data: ApiVitals }>(`/patients/${id}/vitals`, body),
  addMedication:  (id: string, body: MedPayload) =>
    post<{ success: boolean; data: ApiMedication }>(`/patients/${id}/medications`, body),
  administerDose: (id: string, medId: string, doseIdx: number) =>
    patch<{ success: boolean; message: string }>(`/patients/${id}/medications/${medId}/doses/${doseIdx}`, {}),
  addWardRound:   (id: string, body: WardRoundPayload) =>
    post<{ success: boolean; data: ApiWardRound }>(`/patients/${id}/ward-rounds`, body),
  addNursingNote: (id: string, body: { note: string }) =>
    post<{ success: boolean; data: ApiNursingNote }>(`/patients/${id}/nursing-notes`, body),
};

export const wardsApi = {
  list:   () => get<ApiListResponse<ApiWard>>("/wards"),
  get:    (id: string) => get<{ success: boolean; data: ApiWard }>(`/wards/${id}`),
  create: (body: { name: string; totalBeds: number; description?: string }) =>
    post<{ success: boolean; data: ApiWard }>("/wards", body),
  update: (id: string, body: Partial<ApiWard>) =>
    patch<{ success: boolean; data: ApiWard }>(`/wards/${id}`, body),
  remove: (id: string) => del<{ success: boolean }>(`/wards/${id}`),
};

export const usersApi = {
  list:    () => get<ApiListResponse<ApiUser>>("/users"),
  doctors: () => get<ApiListResponse<ApiUser>>("/users/doctors"),
  nurses:  () => get<ApiListResponse<ApiUser>>("/users/nurses"),
  get:     (id: string) => get<{ success: boolean; data: ApiUser }>(`/users/${id}`),
  create:  (body: Partial<ApiUser> & { password: string }) =>
    post<{ success: boolean; data: ApiUser }>("/users", body),
  update:  (id: string, body: Partial<ApiUser>) =>
    patch<{ success: boolean; data: ApiUser }>(`/users/${id}`, body),
  remove:  (id: string) => del<{ success: boolean }>(`/users/${id}`),
};

export const notificationsApi = {
  list:        () => get<ApiListResponse<ApiNotification>>("/notifications"),
  markRead:    (id: string) => patch<{ success: boolean; data: ApiNotification }>(`/notifications/${id}/read`, {}),
  markAllRead: () => patch<{ success: boolean; message: string }>("/notifications/read-all", {}),
  create:      (body: Partial<ApiNotification>) =>
    post<{ success: boolean; data: ApiNotification }>("/notifications", body),
};

export const seedDb = () =>
  fetch(`${BASE_URL}/seed`, { method: "POST" }).then(r => r.json()); // for export to local mongodb database

export interface ApiListResponse<T> {
  success: boolean;
  count: number;
  data: T[];
}

export interface ApiUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: "doctor" | "nurse" | "admin";
  department: string;
  status: "Active" | "Inactive";
}

export interface ApiVitals {
  _id: string;
  temperature: string;
  bloodPressure: string;
  pulse: string;
  respiratoryRate: string;
  spo2: string;
  painScore: number;
  recordedAt: string;
  recordedBy: ApiUser | string;
}

export interface ApiScheduledDose {
  _id: string;
  time: string;
  status: "Pending" | "Administered";
  administeredAt?: string;
  administeredBy?: ApiUser | string;
}

export interface ApiMedication {
  _id: string;
  name: string;
  dose: string;
  route: string;
  frequency: string;
  startDate: string;
  endDate: string;
  scheduledTimes: ApiScheduledDose[];
  prescribedBy: ApiUser | string;
}

export interface ApiWardRound {
  _id: string;
  date: string;
  assessment: string;
  clinicalNotes: string;
  treatmentPlan: string;
  nextReview: string;
  doctor: ApiUser | string;
}

export interface ApiNursingNote {
  _id: string;
  date: string;
  note: string;
  nurse: ApiUser | string;
}

export interface ApiPatient {
  _id: string;
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female";
  ward: ApiWard | string;
  bed: string;
  admissionDate: string;
  status: "Stable" | "Attention" | "Critical" | "Discharged";
  diagnosis: string;
  allergies: string[];
  assignedDoctor: ApiUser | string;
  assignedNurse: ApiUser | string;
  vitals: ApiVitals[];
  medications: ApiMedication[];
  wardRounds: ApiWardRound[];
  nursingNotes: ApiNursingNote[];
}

export interface ApiWard {
  _id: string;
  id: string;
  name: string;
  totalBeds: number;
  occupiedBeds: number;
  beds: { bedNumber: string; isOccupied: boolean; patientId?: string }[];
}

export interface ApiNotification {
  _id: string;
  id: string;
  title: string;
  message: string;
  type: "alert" | "info" | "task" | "critical";
  recipientRole: string;
  isRead: boolean;
  createdAt: string;
  patient?: { _id: string; name: string };
  createdBy?: ApiUser | string;
}

export interface DashboardStats {
  totalPatients: number;
  criticalPatients: number;
  stablePatients: number;
  attentionPatients: number;
  totalWards: number;
  totalUsers: number;
  unreadNotifications: number;
  wardSummary: { id: string; name: string; totalBeds: number; occupiedBeds: number }[];
}

export interface VitalsPayload {
  temperature: string;
  bloodPressure: string;
  pulse: string;
  respiratoryRate: string;
  spo2: string;
  painScore: number;
}

export interface MedPayload {
  name: string;
  dose: string;
  route: string;
  frequency: string;
  startDate: string;
  endDate: string;
}

export interface WardRoundPayload {
  assessment: string;
  clinicalNotes: string;
  treatmentPlan: string;
  nextReview: string;
}
