// Notification Service - Handle notification operations
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
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
      headers: {
        Authorization: `Bearer ${token}`,
        // Avoid any intermediary caching/revalidation that can cause 304 loops in dev
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    // Deduplicate notifications to remove duplicates (server side issue fallback)
    const data = response.data;
    if (data?.notifications && Array.isArray(data.notifications)) {
      const seen = new Set();
      data.notifications = data.notifications.filter((notif) => {
        const key = notif?._id || `${notif?.title}-${notif?.content}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Show local notification for new notification from server
 * Supports all notification types including system (contract renewal)
 * @param {Object} notification - The notification data from server
 */
export const showLocalNotification = async (notification) => {
  try {
    // Check permission
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    // Determine notification type and icon
    const notifType = notification?.type || 'notification';
    let iconName = 'bell-outline';
    if (notifType === 'system') {
      iconName = 'file-document-outline'; // For contract renewal
    } else if (notifType === 'staff') {
      iconName = 'account-tie-outline';
    }

    // Schedule immediate local notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title || 'Thông báo mới',
        body: notification.content || '',
        data: { ...notification, type: notifType },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error showing local notification:', error);
  }
};

/**
 * Check and show local notification for new notifications
 * Call this after fetching notifications to detect new ones
 * Supports all types: staff, system, tenant
 * @param {Array} newNotifications - New notifications from server
 * @param {string} lastViewedAt - ISO timestamp of last viewed
 */
export const checkAndShowNotifications = async (newNotifications, lastViewedAt) => {
  if (!newNotifications || newNotifications.length === 0) return;

  const lastViewed = lastViewedAt ? new Date(lastViewedAt) : new Date(0);

  // Find notifications created after last viewed time (all types)
  const newOnes = newNotifications.filter((n) => {
    const createdAt = n?.createdAt ? new Date(n.createdAt) : null;
    return createdAt && createdAt > lastViewed;
  });

  // Show local notification for the most recent new notification
  // This includes system type notifications (contract renewal)
  if (newOnes.length > 0) {
    const latest = newOnes[0]; // Already sorted by createdAt desc
    
    // Check if this notification was already shown recently
    try {
      const shownKey = 'last_shown_notification_id';
      const lastShown = await AsyncStorage.getItem(shownKey);
      const currentId = latest?._id || `${latest?.title}-${latest?.content}`;
      
      // Only show if it's a different notification or was shown more than 3 minutes ago
      if (lastShown !== currentId) {
        await showLocalNotification(latest);
        await AsyncStorage.setItem(shownKey, currentId);
      }
    } catch (error) {
      console.error('Error tracking shown notification:', error);
      // Fallback: show anyway if tracking fails
      await showLocalNotification(latest);
    }
  }
};

/**
 * Show local notification immediately (for testing or manual trigger)
 * @param {Object} notification - Notification data with title, content, type
 */
export const showImmediateNotification = async (notification) => {
  await showLocalNotification(notification);
};

/**
 * Update app badge count
 * @param {number} count - Number to show on badge
 */
export const updateBadgeCount = async (count) => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error updating badge count:', error);
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