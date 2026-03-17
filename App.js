import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { AuthContextProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';

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

export default function App() {
  useEffect(() => {
    // Request notification permissions on app start
    const requestPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    };
    requestPermissions();

    // Listen for notification responses
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      // Handle notification tap - navigate to notification screen
      const data = response.notification.request.content.data;
      // You can handle navigation here if needed
      console.log('Notification tapped:', data);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <AuthContextProvider>
      <AppNavigator />
      <StatusBar style="dark" />
    </AuthContextProvider>
  );
}
