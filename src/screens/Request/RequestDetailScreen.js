import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getComplaintRequestDetailAPI } from '../../services/request.service';
import { debugAuthState } from '../../utils/authDebug';

export default function RequestDetailScreen({ navigation, route }) {
  const { requestId } = route.params || {};
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  // Format date helper
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      return '';
    }
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return dateString;
    }
  };

  // Load request details from API
  const loadRequestDetails = async () => {
    try {
      setLoading(true);
      console.log('Loading complaint request details for ID:', requestId);
      const response = await getComplaintRequestDetailAPI(requestId);
      
      console.log('API Response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        const data = response.data;
        
        // Map API data to UI format
        const mappedRequest = {
          id: data._id,
          type: 'complaint',
          title: `${data.category}`,
          description: data.content,
          category: data.category,
          status: data.status,
          priority: data.priority,
          createdDate: formatDate(data.createdDate),
          createdTime: formatTime(data.createdDate),
          response: data.response,
          responseBy: data.responseBy ? 
            (data.responseBy.username || data.responseBy.email) : null,
          responseDate: data.responseDate ? formatDateTime(data.responseDate) : null,
        };
        
        console.log('Mapped request:', mappedRequest);
        setRequest(mappedRequest);
      } else {
        console.error('API response not successful or no data');
        throw new Error('Không thể tải thông tin yêu cầu');
      }
    } catch (error) {
      console.error('Error loading request details:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        isNetworkError: error.isNetworkError,
      });
      
      // Debug auth state on 403 error
      if (error.status === 403 || error.status === 401) {
        console.log('Auth error detected, debugging auth state...');
        await debugAuthState();
      }
      
      let errorMessage = 'Không thể tải thông tin yêu cầu. Vui lòng thử lại.';
      
      // Handle specific error cases
      if (error.status === 403) {
        errorMessage = 'Bạn không có quyền xem yêu cầu này';
      } else if (error.status === 404) {
        errorMessage = 'Không tìm thấy yêu cầu này';
      } else if (error.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
      } else if (error.isNetworkError) {
        errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Lỗi',
        errorMessage,
        [
          {
            text: 'Quay lại',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestId) {
      loadRequestDetails();
    } else {
      Alert.alert('Lỗi', 'Không tìm thấy ID yêu cầu', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [requestId]);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'Pending':
      case 'pending':
        return { label: 'Chờ xử lý', color: '#F59E0B', bgColor: '#FEF3C7', icon: 'clock-outline' };
      case 'Processing':
      case 'in_progress':
        return { label: 'Đang xử lý', color: '#3B82F6', bgColor: '#DBEAFE', icon: 'cog' };
      case 'Done':
      case 'completed':
        return { label: 'Hoàn thành', color: '#10B981', bgColor: '#D1FAE5', icon: 'check-circle' };
      case 'rejected':
        return { label: 'Từ chối', color: '#EF4444', bgColor: '#FEE2E2', icon: 'close-circle' };
      default:
        return { label: 'Không xác định', color: '#6B7280', bgColor: '#F3F4F6', icon: 'help-circle' };
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'Low':
      case 'low':
        return 'Thấp';
      case 'Medium':
      case 'normal':
        return 'Trung bình';
      case 'High':
      case 'high':
        return 'Cao';
      default:
        return 'Không xác định';
    }
  };

  const getTypeInfo = (type, requestType) => {
    switch (type) {
      case 'maintenance':
      case 'repair':
        return { 
          label: requestType || 'Sửa chữa/Bảo trì', 
          icon: requestType === 'Bảo trì' ? 'cog' : 'hammer-wrench' 
        };
      case 'complaint':
        return { label: 'Khiếu nại', icon: 'alert-circle' };
      case 'moving':
        return { label: 'Chuyển phòng', icon: 'home-move-outline' };
      default:
        return { label: 'Yêu cầu', icon: 'clipboard-list' };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết yêu cầu</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  // If no request data, show error state
  if (!request) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết yêu cầu</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Không thể tải thông tin yêu cầu</Text>
          <View style={styles.errorButtonsContainer}>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => loadRequestDetails()}
            >
              <MaterialCommunityIcons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Quay lại</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={async () => {
              await debugAuthState();
              Alert.alert('Debug', 'Kiểm tra console để xem thông tin chi tiết');
            }}
          >
            <MaterialCommunityIcons name="bug" size={16} color="#6B7280" />
            <Text style={styles.debugButtonText}>Debug Auth</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo(request.status);
  const typeInfo = getTypeInfo(request.type, request.requestType);

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết yêu cầu</Text>
        {/* Only show edit button for Pending status */}
        {request.status === 'Pending' ? (
          <TouchableOpacity onPress={() => navigation.navigate('UpdateRequest', { requestId: request.id })}>
            <MaterialCommunityIcons name="pencil" size={24} color="#3B82F6" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Section */}
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
            <MaterialCommunityIcons
              name={statusInfo.icon}
              size={24}
              color={statusInfo.color}
            />
            <Text style={[styles.statusLabel, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {/* Main Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin yêu cầu</Text>

          {/* Type */}
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name={typeInfo.icon} size={20} color="#3B82F6" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Loại yêu cầu</Text>
              <Text style={styles.infoValue}>{typeInfo.label}</Text>
            </View>
          </View>

          {/* Title (for complaint) */}
          {request.title && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="format-title" size={20} color="#3B82F6" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Tiêu đề</Text>
                <Text style={styles.infoValue}>{request.title}</Text>
              </View>
            </View>
          )}

          {/* Device (for repair/maintenance) */}
          {request.device && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="devices" size={20} color="#3B82F6" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Thiết bị</Text>
                <Text style={styles.infoValue}>{request.device}</Text>
                {request.deviceCategory && (
                  <Text style={styles.infoSubValue}>({request.deviceCategory})</Text>
                )}
              </View>
            </View>
          )}

          {/* Category (for complaint) */}
          {request.category && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="tag" size={20} color="#3B82F6" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Loại khiếu nại</Text>
                <Text style={styles.infoValue}>{request.category}</Text>
              </View>
            </View>
          )}

          {/* Priority (for complaint) */}
          {request.priority && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="priority-high" size={20} color="#3B82F6" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ưu tiên</Text>
                <Text style={styles.infoValue}>{getPriorityLabel(request.priority)}</Text>
              </View>
            </View>
          )}

          {/* Cost (for repair/maintenance) */}
          {request.cost && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="cash" size={20} color="#10B981" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Chi phí</Text>
                <Text style={[styles.infoValue, { color: '#10B981', fontWeight: '600' }]}>
                  {request.cost.toLocaleString('vi-VN')} ₫
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả</Text>
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>{request.description}</Text>
          </View>
        </View>

        {/* Images Section (for repair/maintenance) */}
        {request.images && request.images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hình ảnh đính kèm</Text>
            <View style={styles.imagesContainer}>
              {request.images.map((image, index) => (
                <View key={index} style={styles.imageBox}>
                  <MaterialCommunityIcons name="image" size={40} color="#9CA3AF" />
                  <Text style={styles.imagePlaceholder}>Ảnh {index + 1}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.imageNote}>
              <MaterialCommunityIcons name="information-outline" size={14} color="#6B7280" />
              {' '}{request.images.length} hình ảnh đã được tải lên
            </Text>
          </View>
        )}

        {/* Timeline Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thời gian</Text>

          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Tạo yêu cầu</Text>
              <Text style={styles.timelineDate}>
                {request.createdDate} lúc {request.createdTime}
              </Text>
            </View>
          </View>

          {request.estimatedDate && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#F59E0B' }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Ngày dự kiến hoàn thành</Text>
                <Text style={styles.timelineDate}>{request.estimatedDate}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Assigned To Section */}
        {request.assignedTo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Giao cho</Text>
            <View style={styles.assignedBox}>
              <MaterialCommunityIcons name="account" size={24} color="#3B82F6" />
              <Text style={styles.assignedText}>{request.assignedTo}</Text>
            </View>
          </View>
        )}

        {/* Response Section - For Complaint Requests */}
        {request.response && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phản hồi từ quản lý</Text>
            <View style={styles.responseBox}>
              <View style={styles.responseMeta}>
                <View style={styles.responseHeader}>
                  <MaterialCommunityIcons name="account-tie" size={20} color="#3B82F6" />
                  <Text style={styles.responseAuthor}>
                    {request.responseBy || 'Quản lý'}
                  </Text>
                </View>
                {request.responseDate && (
                  <Text style={styles.responseDate}>{request.responseDate}</Text>
                )}
              </View>
              <Text style={styles.responseContent}>{request.response}</Text>
            </View>
          </View>
        )}

        {/* Notes Section */}
        {request.notes && request.notes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ghi chú</Text>
            {request.notes.map((note) => (
              <View key={note.id} style={styles.noteItem}>
                <View style={styles.noteMeta}>
                  <Text style={styles.noteAuthor}>{note.author}</Text>
                  <Text style={styles.noteDate}>{note.date}</Text>
                </View>
                <Text style={styles.noteContent}>{note.content}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons - Only show for Pending status */}
      {request.status === 'Pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                'Xóa yêu cầu',
                'Bạn có chắc chắn muốn xóa yêu cầu này không?',
                [
                  { text: 'Hủy', style: 'cancel' },
                  {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: () => {
                      // TODO: Call delete API
                      Alert.alert('Thông báo', 'Chức năng đang phát triển');
                    },
                  },
                ]
              );
            }}
          >
            <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Xóa yêu cầu</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('UpdateRequest', { requestId: request.id })}
          >
            <MaterialCommunityIcons name="pencil" size={20} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Chỉnh sửa</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoSubValue: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  descriptionBox: {
    backgroundColor: '#F9FAFB',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  imageBox: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  imageNote: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  timelineDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  assignedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  assignedText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  responseBox: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  responseMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  responseAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 6,
  },
  responseDate: {
    fontSize: 11,
    color: '#6B7280',
  },
  responseContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  noteItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  noteMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  noteAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  noteDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  noteContent: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#DBEAFE',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    marginLeft: 8,
  },
  contactButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    marginRight: 8,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    marginLeft: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  errorButtonsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  debugButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  debugButtonText: {
    color: '#6B7280',
    fontSize: 12,
  },
});
