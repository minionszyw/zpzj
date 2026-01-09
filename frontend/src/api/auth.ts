import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  sendCode: (email: string) => api.post('/auth/send-code', { email }),
  login: (email: string, code: string) => api.post('/auth/login', { email, code }),
  updateUserMe: (data: any) => api.patch('/users/me', data),
};

export default api;
