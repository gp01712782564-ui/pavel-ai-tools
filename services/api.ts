import axios from 'axios';

// Robustly get API URL to prevent runtime errors
const getApiUrl = (): string => {
  try {
    // Check if import.meta exists and has env property safely
    // @ts-ignore
    const env = import.meta?.env;
    if (env && env.VITE_API_URL) {
      return env.VITE_API_URL;
    }
  } catch (e) {
    // Ignore error and fall back
  }
  return 'http://localhost:5000';
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