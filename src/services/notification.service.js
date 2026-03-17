// Notification Service - Handle notification operations
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './api.service';
import { API_CONFIG } from '../config/api.config';

/**
 * Get notifications for current authenticated user (Tenant/Manager/Accountant/Owner)
 * Tenant use-case: list notifications that Manager sent to Tenant
 *
 * Backend: GET /api/notifications/my-notifications
 * Query: { page, limit, is_read }
 */
export const getMyNotificationsAPI = async ({ page = 1, limit = 20, isRead } = {}) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const params = { page, limit };
    if (typeof isRead === 'boolean') params.is_read = isRead ? 'true' : 'false';

    const response = await apiClient.get(API_CONFIG.ENDPOINTS.NOTIFICATION.MY_NOTIFICATIONS, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Mark a notification as read for current recipient
 * Backend: PATCH /api/notifications/:notificationId/read
 */
export const markNotificationReadAPI = async (notificationId) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await apiClient.patch(
      API_CONFIG.ENDPOINTS.NOTIFICATION.MARK_READ.replace(':id', notificationId),
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Mark all notifications as read for current recipient
 * Backend: PATCH /api/notifications/mark-all-read
 */
export const markAllNotificationsReadAPI = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await apiClient.patch(
      API_CONFIG.ENDPOINTS.NOTIFICATION.MARK_ALL_READ,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
