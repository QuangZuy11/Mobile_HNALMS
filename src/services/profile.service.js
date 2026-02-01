// Profile Service - Handle profile operations
import apiClient from './api.service';
import { API_CONFIG } from '../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Get user profile
 * @returns {Promise} User profile data
 */
export const getProfileAPI = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.PROFILE.GET, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update user profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise} Updated profile data
 */
export const updateProfileAPI = async (profileData) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    // Convert gender to backend format (Male, Female, Other)
    const genderMap = {
      'male': 'Male',
      'female': 'Female',
      'other': 'Other',
    };
    
    // Backend expects: address, dob, gender, email, phoneNumber
    // fullname, cccd cannot be updated
    const updateData = {
      address: profileData.address,
      dob: profileData.dob || null,
      gender: genderMap[String(profileData.gender).toLowerCase()] || profileData.gender,
      email: profileData.email,
      phoneNumber: profileData.phoneNumber,
    };
    
    console.log('Sending to API:', updateData);
    
    const response = await apiClient.put(
      API_CONFIG.ENDPOINTS.PROFILE.UPDATE,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // Backend returns { success: true, message, data: updatedProfile }
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Change password
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise} Success message
 */
export const changePasswordAPI = async (oldPassword, newPassword) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await apiClient.post(
      API_CONFIG.ENDPOINTS.PROFILE.CHANGE_PASSWORD,
      {
        oldPassword: oldPassword,
        newPassword: newPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get my room information
 * @returns {Promise} Room information
 */
export const getMyRoomAPI = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.PROFILE.MY_ROOM, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
