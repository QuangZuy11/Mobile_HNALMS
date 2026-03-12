// Device Service - Handle device operations
import apiClient from './api.service';
import { API_CONFIG } from '../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Get all devices
 * GET /api/devices
 * @returns {Promise} - Response with devices list
 */
export const getDevicesAPI = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Vui lòng đăng nhập để tiếp tục');
    }
    
    const response = await apiClient.get(
      API_CONFIG.ENDPOINTS.DEVICE.LIST,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    // Check if response is successful
    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể lấy danh sách thiết bị');
    }
    
    return response.data;
  } catch (error) {
    
    // Handle specific errors
    if (error.status === 401 || error.response?.status === 401) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
    } else if (error.status === 403 || error.response?.status === 403) {
      throw new Error('Bạn không có quyền truy cập danh sách thiết bị');
    }
    
    throw new Error(error.response?.data?.message || error.message || 'Có lỗi xảy ra. Vui lòng thử lại');
  }
};

/**
 * Get devices of tenant's current rented room
 * GET /api/roomdevices/my-room
 */
export const getDevicesByRoomAPI = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');

    const response = await apiClient.get(API_CONFIG.ENDPOINTS.DEVICE.MY_ROOM_DEVICES, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể lấy danh sách thiết bị');
    }

    return response.data;
  } catch (error) {
    if (error.status === 401 || error.response?.status === 401) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
    }
    throw new Error(error.response?.data?.message || error.message || 'Có lỗi xảy ra. Vui lòng thử lại');
  }
};
