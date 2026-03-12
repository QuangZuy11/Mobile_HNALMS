// Auth Debug Utilities
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Debug current auth state
 * Logs token and user info to console
 */
export const debugAuthState = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const user = await AsyncStorage.getItem('user');
    
    if (token) {
      
      // Try to decode JWT payload (basic decode, no verification)
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
        }
      } catch (decodeError) {
      }
    }
    
    if (user) {
      const userData = JSON.parse(user);
    }
  } catch (error) {
  }
};

/**
 * Clear all auth data (for testing)
 */
export const clearAuthData = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  } catch (error) {
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return true;
    
    const parts = token.split('.');
    if (parts.length !== 3) return false; // Not a JWT
    
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false; // No expiration
    
    return Date.now() > payload.exp * 1000;
  } catch (error) {
    return false;
  }
};
