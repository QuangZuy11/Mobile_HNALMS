// Contract Service - Handle contract operations (Tenant APIs)
import apiClient from './api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Get my contracts list
 * GET /api/contracts/my-contracts
 */
export const getMyContractsAPI = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await apiClient.get('/contracts/my-contracts', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.success ? response.data.data : [];
  } catch (error) {
    console.error('getMyContractsAPI error:', error);
    throw error;
  }
};

/**
 * Get contract detail
 * GET /api/contracts/:id
 */
export const getContractDetailAPI = async (contractId) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await apiClient.get(`/contracts/${contractId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('getContractDetailAPI error:', error);
    throw error;
  }
};

/**
 * Get renewal preview for a contract
 * GET /api/contracts/renewal/preview/:contractId
 */
export const getRenewalPreviewAPI = async (contractId) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await apiClient.get(
      `/contracts/renewal/preview/${contractId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data?.data || response.data;
  } catch (error) {
    console.error('getRenewalPreviewAPI error:', error);
    throw error;
  }
};

/**
 * Confirm contract renewal
 * POST /api/contracts/renewal/confirm
 * Body: { contractId: string, extensionMonths: number }
 */
export const confirmRenewalAPI = async ({ contractId, extensionMonths }) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await apiClient.post(
      '/contracts/renewal/confirm',
      { contractId, extensionMonths },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('confirmRenewalAPI error:', error);
    throw error;
  }
};

/**
 * Decline contract renewal
 * POST /api/contracts/renewal/decline
 * Body: { contractId: string }
 */
export const declineRenewalAPI = async (contractId) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await apiClient.post(
      '/contracts/renewal/decline',
      { contractId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('declineRenewalAPI error:', error);
    throw error;
  }
};
