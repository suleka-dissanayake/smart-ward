// We are going to run this locally

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
const TOKEN_KEY = 'smartward_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Request failed');
  return data;
}

const get = (path) => request(path);
const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) });
const patch = (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) });
const del = (path) => request(path, { method: 'DELETE' });

export const authApi = {
  login: async (email, password) => {
    const res = await post('/auth/login', { email, password });
    setToken(res.token);
    return res;
  },
  me: () => get('/auth/me'),
  logout: () => clearToken(),
  changePassword: (currentPassword, newPassword) => patch('/auth/change-password', { currentPassword, newPassword }),
};

export const dashboardApi = {
  stats: () => get('/dashboard'),
};

export const patientsApi = {
  list: (params) => get(`/patients${params ? '?' + new URLSearchParams(params) : ''}`),
  get: (id) => get(`/patients/${id}`),
  create: (body) => post('/patients', body),
  update: (id, body) => patch(`/patients/${id}`, body),
  remove: (id) => del(`/patients/${id}`),
  addVitals: (id, body) => post(`/patients/${id}/vitals`, body),
  addMedication: (id, body) => post(`/patients/${id}/medications`, body),
  removeMedication: (id, medId) => del(`/patients/${id}/medications/${medId}`),
  administerDose: (id, medId, doseIdx) => patch(`/patients/${id}/medications/${medId}/doses/${doseIdx}`, {}),
  addWardRound: (id, body) => post(`/patients/${id}/ward-rounds`, body),
  addNursingNote: (id, body) => post(`/patients/${id}/nursing-notes`, body),
};

export const wardsApi = {
  list: () => get('/wards'),
  get: (id) => get(`/wards/${id}`),
  create: (body) => post('/wards', body),
  update: (id, body) => patch(`/wards/${id}`, body),
  remove: (id) => del(`/wards/${id}`),
  addBeds: (id, body) => post(`/wards/${id}/beds`, body),
  removeBed: (id, bedNumber) => del(`/wards/${id}/beds/${encodeURIComponent(bedNumber)}`),
};

export const usersApi = {
  list: () => get('/users'),
  doctors: () => get('/users/doctors'),
  nurses: () => get('/users/nurses'),
  get: (id) => get(`/users/${id}`),
  create: (body) => post('/users', body),
  update: (id, body) => patch(`/users/${id}`, body),
  remove: (id) => del(`/users/${id}`),
};

export const notificationsApi = {
  list: () => get('/notifications'),
  markRead: (id) => patch(`/notifications/${id}/read`, {}),
  markAllRead: () => patch('/notifications/read-all', {}),
  create: (body) => post('/notifications', body),
};

export const seedDb = () => fetch(`${BASE_URL}/seed`, { method: 'POST' }).then((r) => r.json()); // for export to local mongodb database
