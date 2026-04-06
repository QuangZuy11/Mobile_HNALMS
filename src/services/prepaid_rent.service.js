// Prepaid Rent Service - Handle prepaid rent operations
import apiClient from './api.service';
import { API_CONFIG } from '../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Lấy danh sách hợp đồng đang hoạt động của tenant (form trả trước — có thể nhiều phòng)
 * @returns {Promise} { success, data: { contracts: Array<{ contractId, contractCode, startDate, endDate, rentPaidUntil, room, maxPrepaidMonths, monthsRemaining }> } }
 */
export const getMyContractForPrepaidAPI = async () => {
    try {
        const token = await AsyncStorage.getItem('authToken');
        const response = await apiClient.get(
            API_CONFIG.ENDPOINTS.PREPAID_RENT.MY_CONTRACT,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Tạo yêu cầu trả trước tiền phòng + khởi tạo thanh toán QR
 * @param {string} contractId - Mã hợp đồng
 * @param {number} prepaidMonths - Số tháng đóng trước (đã tính từ startMonth + endMonth picker)
 * @returns {Promise} { requestId, transactionCode, qrUrl, bankInfo, expireAt, ... }
 */
export const createPrepaidRentAPI = async (contractId, prepaidMonths) => {
    try {
        const token = await AsyncStorage.getItem('authToken');
        const response = await apiClient.post(
            API_CONFIG.ENDPOINTS.PREPAID_RENT.CREATE,
            { contractId, prepaidMonths },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Poll trạng thái thanh toán
 * @param {string} transactionCode - Mã giao dịch sepay
 * @returns {Promise} { status, requestId, amount, expireInSeconds, ... }
 */
export const getPrepaidRentPaymentStatusAPI = async (transactionCode) => {
    try {
        const token = await AsyncStorage.getItem('authToken');
        const encoded = encodeURIComponent(transactionCode);
        const response = await apiClient.get(
            `${API_CONFIG.ENDPOINTS.PREPAID_RENT.PAYMENT_STATUS}/${encoded}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Hủy yêu cầu trả trước đang chờ
 * @param {string} transactionCode - Mã giao dịch sepay
 * @returns {Promise}
 */
export const cancelPrepaidRentAPI = async (transactionCode) => {
    try {
        const token = await AsyncStorage.getItem('authToken');
        const encoded = encodeURIComponent(transactionCode);
        const response = await apiClient.post(
            `${API_CONFIG.ENDPOINTS.PREPAID_RENT.CANCEL}/${encoded}`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Lấy lịch sử trả trước của tenant
 * @returns {Promise} Array of prepaid rent history
 */
export const getPrepaidRentHistoryAPI = async () => {
    try {
        const token = await AsyncStorage.getItem('authToken');
        const response = await apiClient.get(
            API_CONFIG.ENDPOINTS.PREPAID_RENT.HISTORY,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};
