import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Type definitions for API responses
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// Generic API request function
export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await httpClient(config);
    return response.data as unknown as T;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const serverError = error as AxiosError<ApiResponse<T>>;
      if (serverError && serverError.response) {
        throw new Error(serverError.response.data.message || 'An error occurred');
      }
    }
    throw new Error('Network error: Unable to connect to server');
  }
}

export default httpClient; 