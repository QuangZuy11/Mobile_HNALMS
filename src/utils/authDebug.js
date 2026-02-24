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
    
    console.log('=== AUTH DEBUG ===');
    console.log('Token exists:', !!token);
    
    if (token) {
      console.log('Token length:', token.length);
      console.log('Token preview:', token.substring(0, 30) + '...');
      
      // Try to decode JWT payload (basic decode, no verification)
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('Token payload:', {
            userId: payload.userId || payload.id || payload.sub,
            role: payload.role,
            exp: payload.exp,
            isExpired: payload.exp ? Date.now() > payload.exp * 1000 : 'unknown',
          });
        }
      } catch (decodeError) {
        console.log('Cannot decode token (might not be JWT)');
      }
    }
    
    if (user) {
      const userData = JSON.parse(user);
      console.log('User data:', {
        id: userData._id || userData.id,
        username: userData.username,
        role: userData.role,
        email: userData.email,
      });
    }
    
    console.log('=================');
  } catch (error) {
    console.error('Error debugging auth state:', error);
  }
};

/**
 * Clear all auth data (for testing)
 */
export const clearAuthData = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
    console.log('Auth data cleared');
  } catch (error) {
    console.error('Error clearing auth data:', error);
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
    console.error('Error checking token expiration:', error);
    return false;
  }
};
