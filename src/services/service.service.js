// Service Service - Handle service booking operations
import apiClient from './api.service';
import { API_CONFIG } from '../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getToken = async () => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
  return token;
};

/**
 * GET /api/services/list
 * Get all services with booking status for the current tenant.
 * Returns Fixed (contract) + Extension services, each with isBooked flag.
 * @param {string} contractId - Optional: specific contract ID
 */
export const getAllServicesForTenantAPI = async (contractId = null) => {
  const token = await getToken();
  const params = contractId ? { contractId } : {};
  const response = await apiClient.get(
    API_CONFIG.ENDPOINTS.SERVICE.LIST_FOR_TENANT,
    { 
      params,
      headers: { Authorization: `Bearer ${token}` } 
    }
  );
  if (!response.data.success) {
    throw new Error(response.data.message || 'Không thể tải danh sách dịch vụ');
  }
  return response.data; // { success, count, data }
};

/**
 * POST /api/services/book
 * Book an Extension service.
 * @param {string} serviceId - Service ID to book
 * @param {number} quantity - Number of people (default: 1)
 * @param {string} contractId - Optional: specific contract ID
 */
export const bookServiceAPI = async (serviceId, quantity = 1, contractId = null) => {
  const token = await getToken();
  const data = { serviceId, quantity };
  if (contractId) data.contractId = contractId;
  
  const response = await apiClient.post(
    API_CONFIG.ENDPOINTS.SERVICE.BOOK,
    data,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.data.success) {
    const err = new Error(
      response.data.message ||
      response.data.error ||
      response.data.msg ||
      'Không thể đăng ký dịch vụ'
    );
    err.data = response.data;
    throw err;
  }
  return response.data;
};

/**
 * PATCH /api/services/book/:serviceId/cancel
 * Cancel a booked Extension service (sets endDate = now).
 * @param {string} serviceId - Service ID to cancel
 * @param {string} contractId - Optional: specific contract ID
 */
export const cancelBookedServiceAPI = async (serviceId, contractId = null) => {
  const token = await getToken();
  const params = contractId ? { contractId } : {};
  
  const response = await apiClient.patch(
    `${API_CONFIG.ENDPOINTS.SERVICE.CANCEL_BOOK}/${serviceId}/cancel`,
    {},
    { 
      params,
      headers: { Authorization: `Bearer ${token}` } 
    }
  );
  if (!response.data.success) {
    const err = new Error(
      response.data.message ||
      response.data.error ||
      response.data.msg ||
      'Không thể huỷ dịch vụ'
    );
    err.data = response.data;
    throw err;
  }
  return response.data;
};

/**
 * GET /api/services/my-services
 * Get all booked services for the current tenant (via active contract).
 */
export const getMyBookedServicesAPI = async () => {
  const token = await getToken();
  const response = await apiClient.get(
    API_CONFIG.ENDPOINTS.SERVICE.MY_SERVICES,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.data.success) {
    throw new Error(response.data.message || 'Không thể tải danh sách dịch vụ');
  }
  return response.data;
};
