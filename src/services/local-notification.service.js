// Local Notification Service - Handle local push notifications for lock screen
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handler for lock screen display
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 * @returns {boolean} Whether permission was granted
 */
export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

/**
 * Schedule a local notification (for lock screen display)
 * @param {Object} notification - Notification data
 * @param {string} notification.title - Notification title
 * @param {string} notification.content - Notification body
 * @param {string} [notification.data] - Additional data
 */
export const scheduleLocalNotification = async (notification) => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Notification permission not granted');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title || 'Thông báo mới',
        body: notification.content || '',
        data: notification.data || {},
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // null means show immediately
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

/**
 * Display notification for new apartment request/status update
 * @param {Object} data - Notification data
 */
export const displayNotification = async (data) => {
  await scheduleLocalNotification({
    title: data.title || 'Thông báo',
    content: data.content || '',
    data: data,
  });
};

/**
 * Cancel all pending notifications
 */
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/**
 * Get all delivered notifications
 */
export const getDeliveredNotifications = async () => {
  return await Notifications.getPresentedNotificationsAsync();
};

/**
 * Dismiss all delivered notifications
 */
export const dismissAllNotifications = async () => {
  await Notifications.dismissAllNotificationsAsync();
};
