import axios, { AxiosInstance } from 'axios';
import { getSession } from './auth';

// Extend AxiosInstance with our custom methods
interface CustomAxiosInstance extends AxiosInstance {
  checkHealth: () => Promise<any>;
  checkDatabaseHealth: () => Promise<any>;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
}) as CustomAxiosInstance;

// Add a request interceptor to include auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const session = await getSession();

      console.log('Session:', session);
      
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      } else {
        console.warn('No access token available for API request');
      }
      
      // For debugging only - remove in production
      if (process.env.NODE_ENV === 'development') {
        console.log(`API Request to: ${config.url}`);
        console.log('Full request URL:', API_URL + config.url);
        console.log('Request headers:', config.headers);
        console.log('Request data:', config.data);
      }
      
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return config; // Return config anyway to avoid blocking the request
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // For debugging only - remove in production
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response from ${response.config.url}: Status ${response.status}`);
      console.log('Response data:', response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Enhanced error logging
    console.error(`API Error: ${error.response?.status} on ${originalRequest?.url}`, 
      error.response?.data?.message || error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    console.error('Error config:', error.config);
    
    // If the error is due to an expired token and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token
        const session = await getSession();
        if (session?.refresh_token) {
          // This would be where you'd call your refresh token endpoint
          // For now, we'll just redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        // Redirect to login page
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// Utility function to make health check request
api.checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('API Health check failed:', error);
    return { status: 'error', message: 'API server unreachable' };
  }
};

// Utility function to make database health check request
api.checkDatabaseHealth = async () => {
  try {
    const response = await api.get('/health/db');
    return response.data;
  } catch (error) {
    console.error('Database health check failed:', error);
    return { status: 'error', message: 'Database connection failed' };
  }
};

export default api;