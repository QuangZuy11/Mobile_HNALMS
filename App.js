import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContextProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import apiClient from './src/services/api.service';

// Configure notification for lock screen
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Handle notification when app is in foreground
Notifications.addNotificationReceivedListener((notification) => {
  console.log('Notification received in foreground:', notification.request.content.title);
});

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Request notification permissions and register push token
    const setupNotifications = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permission not granted');
        return;
      }

      // Get push token for remote notifications
      try {
        const pushToken = await Notifications.getExpoPushTokenAsync();
        console.log('Push token:', pushToken.data);

        // Send push token to backend
        const authToken = await AsyncStorage.getItem('authToken');
        if (authToken) {
          await apiClient.post('/notifications/register-device', {
            pushToken: pushToken.data,
            deviceId: pushToken.deviceId,
          }).catch(err => console.log('Register device error:', err.message));
        }
      } catch (error) {
        console.log('Error getting push token:', error.message);
      }

      // Check for new notifications and show local notification (including system type)
      // Note: OS will automatically show notifications when app is in foreground due to
      // shouldShowAlert: true in notification handler config, so we skip manual showing here
      // to avoid duplicate notifications
      try {
        const authToken = await AsyncStorage.getItem('authToken');
        if (authToken) {
          // Just update the last viewed timestamp to sync notification read state
          await AsyncStorage.setItem('notification_last_viewed_at', new Date().toISOString());
        }
      } catch (error) {
        console.log('Error updating notification timestamp:', error.message);
      }
    };

    setupNotifications();

    // Listen for notification responses (when user taps notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);
    });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <AuthContextProvider>
      <AppNavigator />
      <StatusBar style="dark" />
    </AuthContextProvider>
  );
}
