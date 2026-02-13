// Request Service - Handle request operations
import apiClient from './api.service';
import { API_CONFIG } from '../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Create a complaint request
 * POST /api/requests/complaints
 * @param {Object} complaintData - Complaint request data
 * @param {string} complaintData.content - Complaint description (min 10 chars, max 2000 chars)
 * @param {string} complaintData.category - Complaint category: "Tiếng ồn", "Vệ sinh", "An niên", "Cơ sở vật chất", "Thái độ phục vụ", "Khác"
 * @param {string} complaintData.priority - Priority level: "Low", "Medium", "High" (default: "Low")
 * @returns {Promise} - Response with created complaint data
 */
export const createComplaintRequestAPI = async (complaintData) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Vui lòng đăng nhập để tiếp tục');
    }
    
    const response = await apiClient.post(
      API_CONFIG.ENDPOINTS.REQUEST.CREATE_COMPLAINT,
      complaintData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    // Check if response is successful
    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể tạo khiếu nại');
    }
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get list of complaint requests
 * GET /api/requests/complaints
 * @param {Object} filters - Filter parameters
 * @param {string} filters.status - Status filter: "Pending", "Processing", "Done"
 * @param {string} filters.category - Category filter
 * @param {number} filters.page - Page number (default: 1)
 * @param {number} filters.limit - Items per page (default: 10)
 * @returns {Promise} - Response with complaints list and pagination
 */
export const getComplaintRequestsAPI = async (filters = {}) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Vui lòng đăng nhập để tiếp tục');
    }
    
    // Build query string
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    const response = await apiClient.get(
      `${API_CONFIG.ENDPOINTS.REQUEST.CREATE_COMPLAINT}?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get complaint request details
 * GET /api/requests/complaints/:id
 * @param {string} id - Complaint ID
 * @returns {Promise} - Response with complaint details
 */
export const getComplaintRequestDetailAPI = async (id) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Vui lòng đăng nhập để tiếp tục');
    }
    
    const response = await apiClient.get(
      `${API_CONFIG.ENDPOINTS.REQUEST.CREATE_COMPLAINT}/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    throw error;
  }
};
