import { api } from './api';

const data = (res) => res.data.data;  // list/get return just the data
const full = (res) => res.data;       // create/update/delete return { message, data }

// Generic REST helper: crud('/interns') gives list/get/create/update/remove
const crud = (path) => ({
  list: (params) => api.get(path, { params }).then(data),
  get: (id) => api.get(`${path}/${id}`).then(data),
  create: (body) => api.post(path, body).then(full),
  update: (id, body) => api.put(`${path}/${id}`, body).then(full),
  remove: (id) => api.delete(`${path}/${id}`).then(full),
});

export const internsApi = crud('/interns');
export const mentorsApi = crud('/mentors');
export const departmentsApi = crud('/departments');
export const tasksApi = crud('/tasks');

export const authApi = {
  login: (body) => api.post('/auth/login', body).then(data),
  me: () => api.get('/auth/me').then(data),
  updateProfile: (body) => api.put('/auth/profile', body).then(full),
  changePassword: (body) => api.put('/auth/password', body).then(full),
};

export const attendanceApi = {
  list: (params) => api.get('/attendance', { params }).then(data),
  monthly: (params) => api.get('/attendance/monthly', { params }).then(data),
  record: (body) => api.post('/attendance', body).then(full),
};

export const evaluationsApi = {
  list: (params) => api.get('/evaluations', { params }).then(data),
  create: (body) => api.post('/evaluations', body).then(full),
};

export const notificationsApi = {
  list: () => api.get('/notifications').then(data),
  markRead: (id) => api.put(`/notifications/${id}/read`).then(full),
  markAllRead: () => api.put('/notifications/read-all').then(full),
};

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats').then(data),
  charts: () => api.get('/dashboard/charts').then(data),
};
