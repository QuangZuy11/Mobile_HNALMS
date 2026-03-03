// Authentication Service - Handle login, logout, forgot password
import apiClient from './api.service';
import { API_CONFIG } from '../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Login user with username and password
 * @param {string} username - Username
 * @param {string} password - Plain text password
 * @returns {Promise} - Response with user data and token
 */
export const loginAPI = async (username, password) => {
  try {
    const requestData = {
      username: username.trim(), // Chỉ trim, không chuyển lowercase (giữ nguyên chữ hoa/thường)
      password: password,
    };
    
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, requestData);

    const data = response.data;

    // Kiểm tra response - hỗ trợ cả trường hợp có và không có field 'success'
    if (data.success === false) {
      throw new Error(data.message || 'Đăng nhập thất bại');
    }

    // Save token to AsyncStorage
    const token = data.token || data.data?.token;
    const user = data.user || data.data?.user;
    
    if (token) {
      await AsyncStorage.setItem('authToken', token);
    }
    if (user) {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Logout user
 * @returns {Promise}
 */
export const logoutAPI = async () => {
  try {
    // Call logout endpoint
    await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    
    // Clear stored data
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
    
    return { success: true };
  } catch (error) {
    // Even if API fails, clear local storage
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
    throw error;
  }
};

/**
 * Request forgot password
 * @param {string} email - User email
 * @returns {Promise}
 */
export const forgotPasswordAPI = async (email) => {
  try {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      email: email.toLowerCase().trim(),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get current authenticated user info
 * GET /api/auth/me
 * @returns {Promise} - Current user data
 */
export const getAuthMeAPI = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.AUTH.ME, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // Backend returns { success: true, data: profile }
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Reset password
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise}
 */
export const resetPasswordAPI = async (token, newPassword) => {
  try {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, {
      token,
      password: newPassword,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};