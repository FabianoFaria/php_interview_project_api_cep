import axios from 'axios';
import { clearToken, getToken } from './tokenStorage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isUnauthorized = error?.response?.status === 401;

    if (isUnauthorized && window.location.pathname !== '/login') {
      clearToken();
      window.location.assign('/login');
    }

    return Promise.reject(error);
  }
);

export default api;
