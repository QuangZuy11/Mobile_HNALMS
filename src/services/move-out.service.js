// Move-Out Service - Handle move-out/terminate contract operations (Tenant APIs only)
import apiClient from './api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Get contract information for move-out request
 * @param {string} contractId - Contract ID
 * @returns {Promise} Contract info with dates and room details
 * GET /api/move-outs/contract/:contractId/info
 */
export const getContractMoveOutInfoAPI = async (contractId) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    console.log('Fetching move-out contract info for contractId:', contractId);
    const response = await apiClient.get(
      `/move-outs/contract/${contractId}/info`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log('Move-out contract info response:', response.data);
    return response.data.data;  // ✅ Trả về inner data object
  } catch (error) {
    console.error('getContractMoveOutInfoAPI error:', error);
    throw error;
  }
};

/**
 * Create move-out request
 * @param {Object} data - Move-out request data
 * @param {string} data.contractId - Contract ID
 * @param {string} data.expectedMoveOutDate - Expected move-out date (ISO format)
 * @param {string} data.reason - Reason for move-out
 * @returns {Promise} Created move-out request with warnings
 * POST /api/move-outs
 */
export const createMoveOutRequestAPI = async (data) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await apiClient.post(
      '/move-outs',
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get tenant's move-out request for a specific contract
 * @param {string} contractId - Contract ID
 * @returns {Promise} Tenant's move-out request for this contract
 * GET /api/move-outs/my/:contractId
 */
export const getMyMoveOutRequestAPI = async (contractId) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await apiClient.get(
      `/move-outs/my/${contractId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log('Get my move-out request response:', response.data);
    // Backend returns { success, data: moveOutRequest }
    return response.data?.data || response.data;
  } catch (error) {
    console.error('getMyMoveOutRequestAPI error:', error);
    throw error;
  }
};
