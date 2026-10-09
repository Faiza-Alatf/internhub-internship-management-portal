import axios from 'axios';
import { getToken } from '../utils/storage';

// The ONE place where the API URL is defined. Override with VITE_API_URL in client/.env if needed.
export const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({ baseURL: API_URL, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const DEFAULT_MESSAGES = {
  400: 'The request was invalid. Please check your input.',
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to do that.',
  404: 'The requested item was not found.',
  409: 'This record conflicts with an existing one.',
  500: 'Something went wrong on the server. Please try again.',
};

// Turns any axios error into a friendly Error with .status and .fieldErrors
function normalizeError(error) {
  const status = error.response?.status;
  const data = error.response?.data;
  let message = data?.message;
  if (!error.response) message = error.code === 'ECONNABORTED' ? 'The request timed out. Please try again.' : 'Cannot reach the server. Make sure the backend is running.';
  if (!message) message = DEFAULT_MESSAGES[status] || 'Unexpected error. Please try again.';
  const normalized = new Error(message);
  normalized.status = status;
  normalized.fieldErrors = data?.errors || {};
  return normalized;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Expired / invalid token -> tell AuthContext to log the user out (login failures are excluded)
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(normalizeError(error));
  }
);

export const getErrorMessage = (error) => error?.message || 'Something went wrong';
