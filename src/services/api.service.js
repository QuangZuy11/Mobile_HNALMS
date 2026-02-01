// API Service - Base API service with axios instance
import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle error responses
    if (error.response) {
      // Server responded with error status
      return Promise.reject({
        message: error.response.data?.message || error.response.statusText,
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      // Request was made but no response
      return Promise.reject({
        message: 'Không thể kết nối đến máy chủ',
        status: null,
      });
    } else {
      // Something else happened
      return Promise.reject({
        message: error.message || 'Có lỗi xảy ra',
        status: null,
      });
    }
  }
);

export default apiClient;