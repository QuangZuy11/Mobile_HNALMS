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
 * Get periodic invoice detail by id
 * @param {string} invoiceId
 * @returns {Promise} Invoice detail
 */
export const getInvoiceDetailAPI = async (invoiceId) => {
    try {
        const token = await AsyncStorage.getItem('authToken');
        const response = await apiClient.get(
            `${API_CONFIG.ENDPOINTS.INVOICE.PERIODIC_DETAIL}/${invoiceId}`,
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
            `${API_CONFIG.ENDPOINTS.INVOICE.INCURRED_DETAIL}/${invoiceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Get invoice status by type (for polling payment confirmation)
 * @param {string} invoiceId - Invoice ID
 * @param {string} invoiceType - 'periodic' or 'incurred'
 * @returns {Promise} { success, data: { status } }
 */
export const getInvoiceStatusAPI = async (invoiceId, invoiceType) => {
    try {
        const token = await AsyncStorage.getItem('authToken');
        let endpoint;
        if (invoiceType === 'periodic') {
            endpoint = `${API_CONFIG.ENDPOINTS.INVOICE.PERIODIC_DETAIL}/${invoiceId}`;
        } else {
            endpoint = `${API_CONFIG.ENDPOINTS.INVOICE.INCURRED_DETAIL}/${invoiceId}`;
        }
        const response = await apiClient.get(endpoint, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Initiate payment for an invoice
 * @param {string} invoiceId - Invoice ID
 * @param {string} invoiceType - 'periodic' or 'incurred'
 * @returns {Promise} { transactionCode, qrUrl, bankInfo, expireAt, ... }
 */
export const initiatePaymentAPI = async (invoiceId, invoiceType = 'incurred') => {
    try {
        const token = await AsyncStorage.getItem('authToken');
        const endpoint = API_CONFIG.ENDPOINTS.INVOICE.PAYMENT_INITIATE.replace(':id', invoiceId);
        const response = await apiClient.post(
            endpoint,
            { type: invoiceType },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Poll payment status
 * @param {string} transactionCode
 * @returns {Promise} { status, ... }
 */
export const getPaymentStatusAPI = async (transactionCode) => {
    try {
        const token = await AsyncStorage.getItem('authToken');
        const encoded = encodeURIComponent(transactionCode);
        const response = await apiClient.get(
            `${API_CONFIG.ENDPOINTS.INVOICE.PAYMENT_STATUS}/${encoded}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Cancel a pending payment
 * @param {string} transactionCode
 * @returns {Promise}
 */
export const cancelPaymentAPI = async (transactionCode) => {
    try {
        const token = await AsyncStorage.getItem('authToken');
        const encoded = encodeURIComponent(transactionCode);
        const response = await apiClient.post(
            `${API_CONFIG.ENDPOINTS.INVOICE.PAYMENT_CANCEL}/${encoded}`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};
