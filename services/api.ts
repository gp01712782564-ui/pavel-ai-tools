import axios from 'axios';

// Safely access env vars to prevent runtime errors if import.meta.env is missing
const getApiUrl = (): string => {
  try {
    return (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';
  } catch (e) {
    return 'http://localhost:5000';
  }
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pavel_auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Session expired, logging out...');
      localStorage.removeItem('pavel_auth_token');
    }
    return Promise.reject(error);
  }
);

export default api;