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
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      hasAuth: !!config.headers?.Authorization,
    });
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      success: response.data?.success,
    });
    return response;
  },
  (error) => {
    console.error('API Error Interceptor:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });
    
    // Handle error responses
    if (error.response) {
      // Server responded with error status
      // Preserve the original error but enhance it
      const enhancedError = new Error(
        error.response.data?.message || 
        error.response.data?.error?.message || 
        error.response.statusText
      );
      enhancedError.status = error.response.status;
      enhancedError.data = error.response.data;
      enhancedError.response = error.response;
      return Promise.reject(enhancedError);
    } else if (error.request) {
      // Request was made but no response
      const noResponseError = new Error('Không thể kết nối đến máy chủ');
      noResponseError.status = null;
      noResponseError.isNetworkError = true;
      return Promise.reject(noResponseError);
    } else {
      // Something else happened
      return Promise.reject(error);
    }
  }
);

export default apiClient;