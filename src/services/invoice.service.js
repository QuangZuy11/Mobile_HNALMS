// Invoice Service - Handle invoice operations
import apiClient from './api.service';
import { API_CONFIG } from '../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Get invoices for a specific tenant (paginated)
 * @param {string} tenantId - ObjectId of the tenant
 * @param {number} page - Current page (default 1)
 * @param {number} limit - Items per page (default 10)
 * @returns {Promise} { data: [], pagination: {} }
 */
export const getTenantInvoicesAPI = async (tenantId, page = 1, limit = 10) => {
    try {
        const token = await AsyncStorage.getItem('authToken');
        const response = await apiClient.get(
            `${API_CONFIG.ENDPOINTS.INVOICE.TENANT_LIST}/${tenantId}`,
            {
                params: { page, limit },
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Get invoice detail by id
 * @param {string} invoiceId
 * @returns {Promise} Invoice detail
 */
export const getInvoiceDetailAPI = async (invoiceId) => {
    try {
        const token = await AsyncStorage.getItem('authToken');
        const response = await apiClient.get(
            API_CONFIG.ENDPOINTS.INVOICE.DETAIL.replace(':id', invoiceId),
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Get incurred invoice detail by id
 * @param {string} invoiceId
 * @returns {Promise} Incurred invoice detail
 */
export const getIncurredInvoiceDetailAPI = async (invoiceId) => {
    try {
        const token = await AsyncStorage.getItem('authToken');
        const response = await apiClient.get(
            API_CONFIG.ENDPOINTS.INVOICE.INCURRED_DETAIL.replace(':id', invoiceId),
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};
