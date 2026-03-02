import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getAllRequestsAPI, 
  getComplaintRequestsAPI,
  getRepairRequestsAPI 
} from '../../services/request.service';

export default function RequestListScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [userInfo, setUserInfo] = useState(null);

  // Check user authentication
  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userDataStr = await AsyncStorage.getItem('userData');
      
      console.log('=== Auth Check ===');
      console.log('Token exists:', !!token);
      console.log('Token preview:', token ? token.substring(0, 30) + '...' : 'null');
      
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setUserInfo(userData);
        console.log('User info:', userData);
      }
      
      if (!token) {
        Alert.alert('Thông báo', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking auth:', error);
      return false;
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
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

  // Map status from API to Vietnamese
  const getStatusText = (status) => {
    switch (status) {
      case 'Pending':
        return 'Chờ xử lý';
      case 'Processing':
        return 'Đang xử lý';
      case 'Done':
        return 'Hoàn thành';
      default:
        return status;
    }
  };

  // Filter options
  const filterOptions = [
    { id: 'all', label: 'Tất cả', icon: 'format-list-bulleted' },
    { id: 'complaint', label: 'Khiếu nại', icon: 'alert-circle' },
    { id: 'maintenance', label: 'Sửa chữa/Bảo trì', icon: 'tools' },
    { id: 'moving', label: 'Chuyển phòng', icon: 'home-move-outline' },
  ];

  // Map request type from API
  const getRequestType = (request) => {
    // Check if it's a complaint request (has category field)
    if (request.category) return 'complaint';
    
    // Check if it's a repair/maintenance request (has type field with "Sửa chữa" or "Bảo trì")
    if (request.type === 'Sửa chữa' || request.type === 'Bảo trì') return 'maintenance';
    
    // Check if it's a moving room request
    if (request.roomId || request.desiredRoomId) return 'moving';
    
    return 'unknown';
  };

  // Format request for display
  const formatRequest = (item) => {
    try {
      if (!item || !item._id) {
        console.error('Invalid request item:', item);
        return null;
      }

      const requestType = getRequestType(item);
      
      let title = '';
      let typeLabel = '';
      
      if (requestType === 'complaint') {
        const content = item.content || '';
        title = `${item.category || 'Khiếu nại'} - ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`;
        typeLabel = 'Khiếu nại';
      } else if (requestType === 'maintenance') {
        const deviceName = item.devicesId?.name || item.deviceName || 'Thiết bị';
        title = `${item.type || 'Yêu cầu'} - ${deviceName}`;
        typeLabel = 'Sửa chữa/Bảo trì';
      } else if (requestType === 'moving') {
        title = `Chuyển phòng - ${item.reason || 'Yêu cầu chuyển phòng'}`;
        typeLabel = 'Chuyển phòng';
      } else {
        title = item.content || item.description || item.reason || 'Yêu cầu';
        typeLabel = 'Khác';
      }

      return {
        id: item._id,
        type: requestType,
        typeLabel,
        title,
        status: getStatusText(item.status || 'Pending'),
        createdDate: formatDate(item.createdDate || item.createdAt || new Date()),
        rawStatus: item.status || 'Pending',
        priority: item.priority,
        fullData: item,
      };
    } catch (error) {
      console.error('Error formatting request:', error);
      console.error('Item causing error:', item);
      return null;
    }
  };

  // Load requests from API (initial or refresh)
  const loadRequests = async (filter = selectedFilter) => {
    try {
      setLoading(true);
      
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) {
        setLoading(false);
        setRequests([]);
        return;
      }
      
      let response;
      
      if (filter === 'all') {
        response = await getAllRequestsAPI({ page: 1, limit: 200 });
      } else if (filter === 'complaint') {
        response = await getComplaintRequestsAPI({ page: 1, limit: 200 });
      } else if (filter === 'maintenance') {
        response = await getRepairRequestsAPI({ page: 1, limit: 200 });
      } else if (filter === 'moving') {
        response = await getAllRequestsAPI({ page: 1, limit: 200 });
      }
      
      if (response && response.success) {
        let rawData = [];
        
        if (Array.isArray(response.data)) {
          rawData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          rawData = response.data.data;
        } else if (response.data?.requests && Array.isArray(response.data.requests)) {
          rawData = response.data.requests;
        } else if (response.data?.list && Array.isArray(response.data.list)) {
          rawData = response.data.list;
        }
        
        let mappedRequests = rawData
          .map(formatRequest)
          .filter(req => req !== null);
        
        if (filter === 'moving') {
          mappedRequests = mappedRequests.filter(req => req.type === 'moving');
        }

        // Sort by date descending
        mappedRequests.sort((a, b) => {
          const dateA = new Date(a.fullData?.createdDate || a.fullData?.createdAt || 0);
          const dateB = new Date(b.fullData?.createdDate || b.fullData?.createdAt || 0);
          return dateB - dateA;
        });

        setRequests(mappedRequests);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      
      let errorMessage = 'Không thể tải danh sách yêu cầu. Vui lòng thử lại.';
      
      if (error.status === 403) {
        errorMessage = 'Bạn không có quyền xem danh sách yêu cầu';
      } else if (error.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
      } else if (error.isNetworkError || error.message?.includes('Network')) {
        errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Lỗi', errorMessage);
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
  };

  // Handle filter change
  const handleFilterChange = (filterId) => {
    setSelectedFilter(filterId);
    loadRequests(filterId);
  };

  // Fetch requests when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [selectedFilter])
  );

  const requestTypes = [
    {
      id: 'maintenance',
      title: 'Yêu cầu sửa chữa/Bảo trì',
      subtitle: 'Báo cáo hư hỏng',
      icon: 'tools',
      color: '#3B82F6',
      bgColor: '#DBEAFE',
      screen: 'CreateMaintenanceRequest',
    },
    {
      id: 'complaint',
      title: 'Yêu cầu khiếu nại',
      subtitle: 'Gửi khiếu nại',
      icon: 'alert-circle',
      color: '#EF4444',
      bgColor: '#FEE2E2',
      screen: 'CreateComplaintRequest',
    },
    {
      id: 'moving',
      title: 'Yêu cầu chuyển phòng',
      subtitle: 'Đổi phòng ở',
      icon: 'home-move-outline',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      screen: 'CreateMovingRoomRequest',
    },
  ];

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Yêu cầu của tôi</Text>
            <Text style={styles.headerSubtitle}>
              Tạo yêu cầu hoặc xem lịch sử yêu cầu
            </Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.filterTab,
                  selectedFilter === option.id && styles.filterTabActive,
                ]}
                onPress={() => handleFilterChange(option.id)}
              >
                <MaterialCommunityIcons
                  name={option.icon}
                  size={18}
                  color={selectedFilter === option.id ? '#EF4444' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === option.id && styles.filterTabTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Create Request Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Tạo yêu cầu mới</Text>
          <View style={styles.requestGrid}>
            {requestTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={styles.requestCard}
                onPress={() => {
                  if (type.screen) {
                    navigation.navigate(type.screen);
                  }
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.cardIconContainer,
                    { backgroundColor: type.bgColor },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={type.icon}
                    size={28}
                    color={type.color}
                  />
                </View>
                <Text style={styles.cardTitle}>{type.title}</Text>
                <Text style={styles.cardSubtitle}>{type.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Requests Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderWithAction}>
            <Text style={styles.sectionTitle}>Tất cả yêu cầu</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#EF4444" />
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : requests.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="inbox-outline"
                size={48}
                color="#D1D5DB"
              />
              <Text style={styles.emptyStateText}>
                Bạn chưa có yêu cầu nào
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {selectedFilter === 'all'
                  ? 'Tạo yêu cầu mới từ các tùy chọn phía trên'
                  : `Bạn chưa có yêu cầu ${filterOptions.find(f => f.id === selectedFilter)?.label.toLowerCase()} nào`}
              </Text>
              {userInfo && (
                <Text style={styles.emptyStateSubtext}>
                  Đăng nhập với: {userInfo.email || userInfo.username || userInfo.phone}
                </Text>
              )}
            </View>
          ) : (
            <FlatList
              data={requests}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.requestItem}
                  onPress={() => {
                    navigation.navigate('RequestDetail', {
                      requestId: item.id,
                      requestType: item.type,
                    });
                  }}
                >
                  <View style={styles.requestItemHeader}>
                    <View style={[
                      styles.requestTypeBadge,
                      {
                        backgroundColor:
                          item.type === 'complaint' ? '#FEE2E2' :
                          item.type === 'maintenance' ? '#DBEAFE' :
                          item.type === 'moving' ? '#FEF3C7' : '#F3F4F6',
                      },
                    ]}>
                      <MaterialCommunityIcons
                        name={
                          item.type === 'complaint' ? 'alert-circle' :
                          item.type === 'maintenance' ? 'tools' :
                          item.type === 'moving' ? 'home-move-outline' : 'file-document'
                        }
                        size={14}
                        color={
                          item.type === 'complaint' ? '#EF4444' :
                          item.type === 'maintenance' ? '#3B82F6' :
                          item.type === 'moving' ? '#F59E0B' : '#6B7280'
                        }
                      />
                      <Text style={[
                        styles.requestTypeBadgeText,
                        {
                          color:
                            item.type === 'complaint' ? '#EF4444' :
                            item.type === 'maintenance' ? '#3B82F6' :
                            item.type === 'moving' ? '#F59E0B' : '#6B7280',
                        },
                      ]}>
                        {item.typeLabel}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.requestItemContent}>
                    <Text style={styles.requestItemTitle}>{item.title}</Text>
                    <Text style={styles.requestItemDate}>{item.createdDate}</Text>
                  </View>
                  <View
                    style={[
                      styles.requestStatus,
                      {
                        backgroundColor:
                          item.status === 'Hoàn thành' ? '#D1FAE5' :
                          item.status === 'Chờ xử lý' ? '#FEF3C7' :
                          item.status === 'Đang xử lý' ? '#DBEAFE' : '#FEE2E2',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.requestStatusText,
                        {
                          color:
                            item.status === 'Hoàn thành' ? '#10B981' :
                            item.status === 'Chờ xử lý' ? '#F59E0B' :
                            item.status === 'Đang xử lý' ? '#3B82F6' : '#EF4444',
                        },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Section
  sectionContainer: {
    paddingHorizontal: 12,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllLink: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },

  // Request Grid
  requestGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  requestCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Recent Requests
  requestItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  requestItemHeader: {
    marginBottom: 8,
  },
  requestTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  requestTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  requestItemContent: {
    flex: 1,
    marginBottom: 8,
  },
  requestItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  requestItemDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  requestStatus: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  requestStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },

  // Loading State
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },

  // Filter Tabs
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 6,
  },
  filterTabTextActive: {
    color: '#EF4444',
    fontWeight: '600',
  },

});
