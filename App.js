import { StatusBar } from 'expo-status-bar';
import { AuthContextProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthContextProvider>
      <AppNavigator />
      <StatusBar style="dark" />
    </AuthContextProvider>
  );
}
