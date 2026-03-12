// Upload Service - Handle image uploads via Backend API
import { API_CONFIG } from '../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Upload single image to Cloudinary via Backend API
 * @param {string} imageUri - Local image URI
 * @returns {Promise<string>} - Cloudinary image URL
 */
export const uploadImageToCloudinary = async (imageUri) => {
  try {

    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Vui lòng đăng nhập để tiếp tục');
    }

    // Create form data
    const formData = new FormData();
    
    // Extract filename from URI
    const uriParts = imageUri.split('/');
    const filename = uriParts[uriParts.length - 1];
    
    // Determine file type
    let fileType = 'image/jpeg';
    if (filename.toLowerCase().includes('.png')) {
      fileType = 'image/png';
    } else if (filename.toLowerCase().includes('.jpg') || filename.toLowerCase().includes('.jpeg')) {
      fileType = 'image/jpeg';
    }

    // For React Native, we need to format the file object correctly
    const file = {
      uri: imageUri,
      type: fileType,
      name: filename || `photo_${Date.now()}.jpg`,
    };

    formData.append('image', file);

    const response = await fetch(`${API_CONFIG.BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type, let the browser set it with boundary
      },
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Upload thất bại');
    }
    
    return result.data.url;
  } catch (error) {
    
    throw new Error(error.message || 'Không thể tải ảnh lên. Vui lòng thử lại.');
  }
};

/**
 * Upload multiple images to Cloudinary via Backend API
 * Uses batch upload endpoint for better performance
 * @param {Array<string>} imageUris - Array of local image URIs
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<Array<string>>} - Array of Cloudinary image URLs
 */
export const uploadMultipleImages = async (
  imageUris,
  uploadPreset = null, // Not used anymore, kept for compatibility
  onProgress = null
) => {
  try {
    
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Vui lòng đăng nhập để tiếp tục');
    }

    // Create form data with all images
    const formData = new FormData();
    
    imageUris.forEach((imageUri, index) => {
      const uriParts = imageUri.split('/');
      const filename = uriParts[uriParts.length - 1];
      
      // Determine file type
      let fileType = 'image/jpeg';
      if (filename.toLowerCase().includes('.png')) {
        fileType = 'image/png';
      } else if (filename.toLowerCase().includes('.jpg') || filename.toLowerCase().includes('.jpeg')) {
        fileType = 'image/jpeg';
      }

      const file = {
        uri: imageUri,
        type: fileType,
        name: filename || `photo_${Date.now()}_${index}.jpg`,
      };

      // Append all images with same field name 'images'
      formData.append('images', file);
    });

    const response = await fetch(`${API_CONFIG.BASE_URL}/upload/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Upload thất bại');
    }
    
    // Call progress callback if provided
    if (onProgress) {
      onProgress(result.data.successful, result.data.total);
    }
    
    return result.data.urls;
  } catch (error) {
    throw new Error(error.message || 'Không thể tải ảnh lên. Vui lòng thử lại.');
  }
};
