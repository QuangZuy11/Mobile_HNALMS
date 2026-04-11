// Move-Out Service - Handle move-out/terminate contract operations (Tenant APIs only)
import apiClient from './api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Get contract information for move-out request
 * GET /api/move-outs/contract/:contractId/info
 */
export const getContractMoveOutInfoAPI = async (contractId) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await apiClient.get(
      `/move-outs/contract/${contractId}/info`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data;
  } catch (error) {
    console.error('getContractMoveOutInfoAPI error:', error);
    throw error;
  }
};

/**
 * Create move-out request
 * POST /api/move-outs
 */
export const createMoveOutRequestAPI = async (data) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await apiClient.post('/move-outs', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get tenant's move-out request for a specific contract.
 * Returns null if no request exists yet (404) instead of throwing.
 * GET /api/move-outs/my/:contractId
 */
export const getMyMoveOutRequestAPI = async (contractId) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await apiClient.get(`/move-outs/my/${contractId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.data || response.data;
  } catch (error) {
    // 404 = chưa có request, là trường hợp bình thường → trả null
    if (error?.response?.status === 404) return null;
    console.error('getMyMoveOutRequestAPI error:', error);
    throw error;
  }
};

/**
 * Get deposit vs final invoice comparison for a move-out request
 * GET /api/move-outs/:id/deposit-vs-invoice
 */
export const getMoveOutDepositVsInvoiceAPI = async (moveOutRequestId) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await apiClient.get(
      `/move-outs/${moveOutRequestId}/deposit-vs-invoice`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data?.data || response.data;
  } catch (error) {
    console.error('getMoveOutDepositVsInvoiceAPI error:', error);
    throw error;
  }
};

/**
 * Delete a move-out request (only allowed when status = 'Requested' or 'InvoiceReleased')
 * DELETE /api/move-outs/:id
 */
export const deleteMoveOutRequestAPI = async (moveOutRequestId) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await apiClient.delete(`/move-outs/${moveOutRequestId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('deleteMoveOutRequestAPI error:', error);
    throw error;
  }
};
