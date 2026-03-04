// Request Service - Handle request operations
import apiClient from './api.service';
import { API_CONFIG } from '../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Create a complaint request
 * POST /api/requests/complaints
 * @param {Object} complaintData - Complaint request data
 * @param {string} complaintData.content - Complaint description (min 10 chars, max 2000 chars)
 * @param {string} complaintData.category - Complaint category: "Tiếng ồn", "Vệ sinh", "An niên", "Cơ sở vật chất", "Thái độ phục vụ", "Khác"
 * @param {string} complaintData.priority - Priority level: "Low", "Medium", "High" (default: "Low")
 * @returns {Promise} - Response with created complaint data
 */
export const createComplaintRequestAPI = async (complaintData) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Vui lòng đăng nhập để tiếp tục');
    }
    
    const response = await apiClient.post(
      API_CONFIG.ENDPOINTS.REQUEST.CREATE_COMPLAINT,
      complaintData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    // Check if response is successful
    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể tạo khiếu nại');
    }
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get list of complaint requests
 * GET /api/requests/complaints
 * @param {Object} filters - Filter parameters
 * @param {string} filters.status - Status filter: "Pending", "Processing", "Done"
 * @param {string} filters.category - Category filter
 * @param {number} filters.page - Page number (default: 1)
 * @param {number} filters.limit - Items per page (default: 10)
 * @returns {Promise} - Response with complaints list and pagination
 */
export const getComplaintRequestsAPI = async (filters = {}) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    console.log('Getting complaint requests list');
    console.log('Token exists:', !!token);
    
    if (!token) {
      throw new Error('Vui lòng đăng nhập để tiếp tục');
    }
    
    // Build query string
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    const endpoint = `${API_CONFIG.ENDPOINTS.REQUEST.CREATE_COMPLAINT}?${queryParams.toString()}`;
    console.log('Request endpoint:', endpoint);
    
    const response = await apiClient.get(
      endpoint,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    console.log('Response status:', response.status);
    return response.data;
  } catch (error) {
    console.error('API Error in getComplaintRequestsAPI:', {
      message: error.message,
      status: error.status,
      response: error.response?.data,
    });
    
    // Add network error flag
    if (error.message?.includes('Network request failed') || 
        error.message?.includes('Failed to fetch') ||
        error.code === 'ECONNREFUSED') {
      error.isNetworkError = true;
    }
    
    // Handle 403 specifically
    if (error.status === 403 || error.response?.status === 403) {
      throw new Error('Bạn không có quyền truy cập danh sách yêu cầu');
    }
    
    throw error;
  }
};

/**
 * Get all requests (complaint, repair, moving room)
 * Since backend doesn't have a single endpoint for all requests,
 * we fetch from multiple endpoints and merge results
 * @param {Object} filters - Filter parameters
 * @param {string} filters.status - Status filter: "Pending", "Processing", "Done"
 * @param {string} filters.type - Request type filter
 * @param {number} filters.page - Page number (default: 1)
 * @param {number} filters.limit - Items per page (default: 10)
 * @returns {Promise} - Response with requests list and pagination
 */
export const getAllRequestsAPI = async (filters = {}) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    console.log('Getting all requests (merging from multiple endpoints)');
    console.log('Token exists:', !!token);
    
    if (!token) {
      throw new Error('Vui lòng đăng nhập để tiếp tục');
    }
    
    // Fetch from both complaint and repair endpoints
    const [complaintsResponse, repairsResponse] = await Promise.allSettled([
      getComplaintRequestsAPI(filters),
      getRepairRequestsAPI(filters),
    ]);
    
    console.log('Complaints response:', complaintsResponse.status);
    console.log('Repairs response:', repairsResponse.status);
    
    // Merge results
    let allRequests = [];
    
    if (complaintsResponse.status === 'fulfilled' && complaintsResponse.value?.success) {
      const complaints = complaintsResponse.value.data?.data || complaintsResponse.value.data || [];
      allRequests = allRequests.concat(complaints);
      console.log('Complaints count:', complaints.length);
    }
    
    if (repairsResponse.status === 'fulfilled' && repairsResponse.value?.success) {
      const repairs = repairsResponse.value.data?.data || repairsResponse.value.data || [];
      allRequests = allRequests.concat(repairs);
      console.log('Repairs count:', repairs.length);
    }
    
    console.log('Total merged requests:', allRequests.length);
    
    // Return in same format as other APIs
    return {
      success: true,
      data: allRequests,
    };
  } catch (error) {
    console.error('API Error in getAllRequestsAPI:', {
      message: error.message,
      status: error.status,
      response: error.response?.data,
    });
    
    // Add network error flag
    if (error.message?.includes('Network request failed') || 
        error.message?.includes('Failed to fetch') ||
        error.code === 'ECONNREFUSED') {
      error.isNetworkError = true;
    }
    
    if (error.status === 403 || error.response?.status === 403) {
      throw new Error('Bạn không có quyền truy cập danh sách yêu cầu');
    }
    
    throw error;
  }
};

/**
 * Get repair/maintenance request detail
 * GET /api/requests/repair/:id
 * @param {string} id - Repair request ID
 * @returns {Promise} - Response with repair request details
 */
export const getRepairRequestDetailAPI = async (id) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    console.log('Getting repair request detail for ID:', id);
    console.log('Token exists:', !!token);
    
    if (!token) {
      throw new Error('Vui lòng đăng nhập để tiếp tục');
    }
    
    const endpoint = `${API_CONFIG.ENDPOINTS.REQUEST.CREATE_REPAIR}/${id}`;
    console.log('Request endpoint:', endpoint);
    
    const response = await apiClient.get(
      endpoint,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    console.log('Response status:', response.status);
    return response.data;
  } catch (error) {
    console.error('API Error in getRepairRequestDetailAPI:', {
      message: error.message,
      status: error.status,
      response: error.response?.data,
    });
    
    // Handle 403 specifically
    if (error.status === 403 || error.response?.status === 403) {
      throw new Error('Bạn không có quyền xem yêu cầu này');
    } else if (error.status === 404 || error.response?.status === 404) {
      throw new Error('Không tìm thấy yêu cầu');
    }
    
    throw error;
  }
};

/**
 * Get repair/maintenance requests (user's own requests)
 * GET /api/requests/repair/my-requests
 * @param {Object} filters - Filter parameters
 * @param {string} filters.status - Status filter: "Pending", "Processing", "Done"
 * @param {string} filters.type - Type filter: "Sửa chữa", "Bảo trì"
 * @param {number} filters.page - Page number (default: 1)
 * @param {number} filters.limit - Items per page (default: 10)
 * @returns {Promise} - Response with repair requests list and pagination
 */
export const getRepairRequestsAPI = async (filters = {}) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    console.log('Getting repair requests (my requests)');
    console.log('Token exists:', !!token);
    
    if (!token) {
      throw new Error('Vui lòng đăng nhập để tiếp tục');
    }
    
    // Build query string
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    const endpoint = `${API_CONFIG.ENDPOINTS.REQUEST.MY_REPAIRS}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    console.log('Request endpoint:', endpoint);
    
    const response = await apiClient.get(
      endpoint,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    console.log('Response status:', response.status);
    return response.data;
  } catch (error) {
    console.error('API Error in getRepairRequestsAPI:', {
      message: error.message,
      status: error.status,
      response: error.response?.data,
    });
    
    // Add network error flag
    if (error.message?.includes('Network request failed') || 
        error.message?.includes('Failed to fetch') ||
        error.code === 'ECONNREFUSED') {
      error.isNetworkError = true;
    }
    
    if (error.status === 403 || error.response?.status === 403) {
      throw new Error('Bạn không có quyền truy cập danh sách yêu cầu');
    }
    
    throw error;
  }
};

/**
 * Get complaint request details
 * GET /api/requests/complaints/:id
 * @param {string} id - Complaint ID
 * @returns {Promise} - Response with complaint details
 */
export const getComplaintRequestDetailAPI = async (id) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    console.log('Getting complaint detail for ID:', id);
    console.log('Token exists:', !!token);
    console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'null');
    
    if (!token) {
      throw new Error('Vui lòng đăng nhập để tiếp tục');
    }
    
    const endpoint = `${API_CONFIG.ENDPOINTS.REQUEST.CREATE_COMPLAINT}/${id}`;
    console.log('Request endpoint:', endpoint);
    
    const response = await apiClient.get(
      endpoint,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          populate: 'responseBy',
        },
      }
    );
    
    console.log('Response status:', response.status);
    return response.data;
  } catch (error) {
    console.error('API Error in getComplaintRequestDetailAPI:', {
      message: error.message,
      status: error.status,
      response: error.response?.data,
    });
    
    // Handle 403 specifically
    if (error.status === 403 || error.response?.status === 403) {
      throw new Error('Bạn không có quyền xem yêu cầu này');
    }
    
    throw error;
  }
};

/**
 * Delete a complaint request (only when Pending)
 * DELETE /api/requests/complaints/:id
 */
export const deleteComplaintRequestAPI = async (id) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) throw new Error('Vui l\u00f2ng \u0111\u0103ng nh\u1eadp \u0111\u1ec3 ti\u1ebfp t\u1ee5c');
    const response = await apiClient.delete(
      `${API_CONFIG.ENDPOINTS.REQUEST.DELETE_COMPLAINT}/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.data.success) throw new Error(response.data.message || 'Kh\u00f4ng th\u1ec3 x\u00f3a khi\u1ebfu n\u1ea1i');
    return response.data;
  } catch (error) {
    console.error('API Error in deleteComplaintRequestAPI:', error.message);
    if (error.response?.status === 403 || error.status === 403)
      throw new Error('B\u1ea1n kh\u00f4ng c\u00f3 quy\u1ec1n x\u00f3a khi\u1ebfu n\u1ea1i n\u00e0y');
    if (error.response?.status === 400 || error.status === 400)
      throw new Error(error.response?.data?.message || 'Ch\u1ec9 c\u00f3 th\u1ec3 x\u00f3a khi\u1ebfu n\u1ea1i \u1edf tr\u1ea1ng th\u00e1i Pending');
    if (error.response?.status === 404 || error.status === 404)
      throw new Error('Kh\u00f4ng t\u00ecm th\u1ea5y khi\u1ebfu n\u1ea1i');
    throw error;
  }
};

/**
 * Update complaint request
 * PUT /api/requests/complaints/:id
 * @param {string} id - Complaint ID
 * @param {Object} updateData - Update data
 * @param {string} updateData.content - Complaint description (min 10 chars, max 2000 chars)
 * @param {string} updateData.category - Complaint category
 * @returns {Promise} - Response with updated complaint data
 */
export const updateComplaintRequestAPI = async (id, updateData) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Vui lòng đăng nhập để tiếp tục');
    }
    
    const endpoint = `${API_CONFIG.ENDPOINTS.REQUEST.UPDATE_COMPLAINT}/${id}`;
    
    const response = await apiClient.put(
      endpoint,
      { content: updateData.content, category: updateData.category },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể cập nhật khiếu nại');
    }
    
    return response.data;
  } catch (error) {
    console.error('API Error in updateComplaintRequestAPI:', {
      message: error.message,
      status: error.status,
      response: error.response?.data,
    });
    
    if (error.response?.status === 403 || error.status === 403) {
      throw new Error('Bạn không có quyền cập nhật yêu cầu này');
    } else if (error.response?.status === 400 || error.status === 400) {
      throw new Error(error.response?.data?.message || 'Dữ liệu không hợp lệ');
    } else if (error.response?.status === 404 || error.status === 404) {
      throw new Error('Không tìm thấy khiếu nại');
    }
    
    throw error;
  }
};

/**
 * Create a repair/maintenance request
 * POST /api/requests/repair
 * @param {Object} repairData - Repair request data
 * @param {string} repairData.devicesId - Device/Item ID that needs repair
 * @param {string} repairData.type - Type of repair needed
 * @param {string} repairData.description - Description of the issue
 * @param {Array} repairData.images - Optional array of image URLs
 * @returns {Promise} - Response with created repair request data
 */
export const createRepairRequestAPI = async (repairData) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    console.log('Creating repair request with data:', repairData);
    console.log('Token exists:', !!token);
    
    if (!token) {
      throw new Error('Vui lòng đăng nhập để tiếp tục');
    }
    
    const response = await apiClient.post(
      API_CONFIG.ENDPOINTS.REQUEST.CREATE_REPAIR,
      repairData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    console.log('Response status:', response.status);
    
    // Check if response is successful
    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể tạo yêu cầu sửa chữa/bảo trì');
    }
    
    return response.data;
  } catch (error) {
    console.error('API Error in createRepairRequestAPI:', {
      message: error.message,
      status: error.status,
      response: error.response?.data,
    });
    
    // Handle specific errors
    if (error.status === 401 || error.response?.status === 401) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
    } else if (error.status === 404 || error.response?.status === 404) {
      throw new Error(error.response?.data?.message || 'Không tìm thấy thiết bị');
    } else if (error.status === 400 || error.response?.status === 400) {
      throw new Error(error.response?.data?.message || 'Dữ liệu không hợp lệ');
    }
    
    throw new Error(error.response?.data?.message || error.message || 'Có lỗi xảy ra. Vui lòng thử lại');
  }
};

/**
 * Update a repair/maintenance request (tenant, only when Pending)
 * PUT /api/requests/repair/:requestId
 * @param {string} id - Repair request ID
 * @param {Object} updateData - { type?, devicesId?, description?, images? }
 * @returns {Promise} - Response with updated repair request
 */
export const updateRepairRequestAPI = async (id, updateData) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');

    const response = await apiClient.put(
      `${API_CONFIG.ENDPOINTS.REQUEST.UPDATE_REPAIR}/${id}`,
      updateData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể cập nhật yêu cầu sửa chữa');
    }
    return response.data;
  } catch (error) {
    console.error('API Error in updateRepairRequestAPI:', error);
    if (error.status === 401 || error.response?.status === 401) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
    } else if (error.status === 403 || error.response?.status === 403) {
      throw new Error('Bạn không có quyền cập nhật yêu cầu này');
    } else if (error.status === 400 || error.response?.status === 400) {
      throw new Error(error.response?.data?.message || 'Dữ liệu không hợp lệ');
    }
    throw new Error(error.response?.data?.message || error.message || 'Có lỗi xảy ra. Vui lòng thử lại');
  }
};

/**
 * Delete a repair/maintenance request
 * DELETE /api/requests/repair/:id
 * Only owner can delete, and only if status is Pending
 * @param {string} id - Repair request ID
 * @returns {Promise} - Response with success status
 */
export const deleteRepairRequestAPI = async (id) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    console.log('Deleting repair request ID:', id);
    console.log('Token exists:', !!token);
    
    if (!token) {
      throw new Error('Vui lòng đăng nhập để tiếp tục');
    }
    
    const endpoint = `${API_CONFIG.ENDPOINTS.REQUEST.CREATE_REPAIR}/${id}`;
    console.log('Request endpoint:', endpoint);
    
    const response = await apiClient.delete(
      endpoint,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    console.log('Response status:', response.status);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể xóa yêu cầu');
    }
    
    return response.data;
  } catch (error) {
    console.error('API Error in deleteRepairRequestAPI:', {
      message: error.message,
      status: error.status,
      response: error.response?.data,
    });
    
    // Handle specific errors
    if (error.status === 403 || error.response?.status === 403) {
      throw new Error('Bạn không có quyền xóa yêu cầu này hoặc yêu cầu đã được xử lý');
    } else if (error.status === 404 || error.response?.status === 404) {
      throw new Error('Không tìm thấy yêu cầu');
    } else if (error.status === 400 || error.response?.status === 400) {
      throw new Error(error.response?.data?.message || 'Không thể xóa yêu cầu này');
    }
    
    throw error;
  }
};

/**
 * Get available rooms for transfer
 * GET /api/requests/transfer/available-rooms
 */
export const getAvailableRoomsForTransferAPI = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');

    const response = await apiClient.get(
      API_CONFIG.ENDPOINTS.REQUEST.TRANSFER_AVAILABLE_ROOMS,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('API Error in getAvailableRoomsForTransferAPI:', error.message);
    throw error;
  }
};

/**
 * Create a transfer room request
 * POST /api/requests/transfer
 * Body: { targetRoomId, transferDate, reason }
 */
export const createTransferRequestAPI = async (transferData) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');

    const response = await apiClient.post(
      API_CONFIG.ENDPOINTS.REQUEST.TRANSFER_CREATE,
      transferData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể tạo yêu cầu chuyển phòng');
    }
    return response.data;
  } catch (error) {
    console.error('API Error in createTransferRequestAPI:', error.message);
    throw error;
  }
};

/**
 * Get my transfer requests
 * GET /api/requests/transfer/my-requests
 */
export const getMyTransferRequestsAPI = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');

    const response = await apiClient.get(
      API_CONFIG.ENDPOINTS.REQUEST.TRANSFER_MY_REQUESTS,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('API Error in getMyTransferRequestsAPI:', error.message);
    throw error;
  }
};

/**
 * Update a transfer request (only when Pending)
 * PUT /api/requests/transfer/:id
 * Body: { targetRoomId?, transferDate?, reason? }
 */
export const updateTransferRequestAPI = async (id, updateData) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) throw new Error('Vui l\u00f2ng \u0111\u0103ng nh\u1eadp \u0111\u1ec3 ti\u1ebfp t\u1ee5c');
    const response = await apiClient.put(
      `${API_CONFIG.ENDPOINTS.REQUEST.TRANSFER_UPDATE}/${id}`,
      updateData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.data.success) throw new Error(response.data.message || 'Kh\u00f4ng th\u1ec3 c\u1eadp nh\u1eadt y\u00eau c\u1ea7u');
    return response.data;
  } catch (error) {
    console.error('API Error in updateTransferRequestAPI:', error.message);
    if (error.response?.status === 403) throw new Error('B\u1ea1n kh\u00f4ng c\u00f3 quy\u1ec1n c\u1eadp nh\u1eadt y\u00eau c\u1ea7u n\u00e0y');
    if (error.response?.status === 400) throw new Error(error.response?.data?.message || 'Y\u00eau c\u1ea7u kh\u00f4ng h\u1ee3p l\u1ec7');
    throw error;
  }
};

/**
 * Delete a transfer request (only when Pending)
 * DELETE /api/requests/transfer/:id
 */
export const deleteTransferRequestAPI = async (id) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) throw new Error('Vui l\u00f2ng \u0111\u0103ng nh\u1eadp \u0111\u1ec3 ti\u1ebfp t\u1ee5c');
    const response = await apiClient.delete(
      `${API_CONFIG.ENDPOINTS.REQUEST.TRANSFER_DELETE}/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.data.success) throw new Error(response.data.message || 'Kh\u00f4ng th\u1ec3 x\u00f3a y\u00eau c\u1ea7u');
    return response.data;
  } catch (error) {
    console.error('API Error in deleteTransferRequestAPI:', error.message);
    if (error.response?.status === 403) throw new Error('B\u1ea1n kh\u00f4ng c\u00f3 quy\u1ec1n x\u00f3a y\u00eau c\u1ea7u n\u00e0y');
    if (error.response?.status === 400) throw new Error(error.response?.data?.message || 'Ch\u1ec9 c\u00f3 th\u1ec3 x\u00f3a y\u00eau c\u1ea7u \u1edf tr\u1ea1ng th\u00e1i Pending');
    if (error.response?.status === 404) throw new Error('Kh\u00f4ng t\u00ecm th\u1ea5y y\u00eau c\u1ea7u');
    throw error;
  }
};

/**
 * Cancel a transfer request (only when Pending)
 * PATCH /api/requests/transfer/:id/cancel
 */
export const cancelTransferRequestAPI = async (requestId) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');

    const endpoint = API_CONFIG.ENDPOINTS.REQUEST.TRANSFER_CANCEL.replace(':id', requestId);
    const response = await apiClient.patch(
      endpoint,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('API Error in cancelTransferRequestAPI:', error.message);
    throw error;
  }
};
