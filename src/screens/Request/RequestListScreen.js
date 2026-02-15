import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  FlatList,
  SectionList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getComplaintRequestsAPI } from '../../services/request.service';

export default function RequestListScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'complaint', 'maintenance', 'moving'

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

  // Load requests from API
  const loadRequests = async (filter = selectedFilter) => {
    try {
      setLoading(true);
      console.log('Loading requests with filter:', filter);
      
      // Currently only complaint API is available
      if (filter === 'all' || filter === 'complaint') {
        const response = await getComplaintRequestsAPI({ page: 1, limit: 10 });
      
      console.log('API Response:', JSON.stringify(response, null, 2));
      
        if (response.success && response.data) {
          console.log('Number of requests:', response.data.data.length);
          // Map API data to UI format
          const mappedRequests = response.data.data.map((item) => ({
            id: item._id,
            type: 'complaint',
            title: `${item.category} - ${item.content.substring(0, 50)}${item.content.length > 50 ? '...' : ''}`,
            status: getStatusText(item.status),
            createdDate: formatDate(item.createdDate),
            rawStatus: item.status,
            category: item.category,
            priority: item.priority,
            fullContent: item.content,
          }));
          setRequests(mappedRequests);
        } else {
          console.error('API response not successful or no data');
        }
      } else if (filter === 'maintenance') {
        // TODO: Add maintenance API when available
        console.log('Maintenance API not yet implemented');
        setRequests([]);
      } else if (filter === 'moving') {
        // TODO: Add moving room API when available
        console.log('Moving room API not yet implemented');
        setRequests([]);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        isNetworkError: error.isNetworkError,
      });
      
      let errorMessage = 'Không thể tải danh sách yêu cầu. Vui lòng thử lại.';
      
      // Handle specific error cases
      if (error.status === 403) {
        errorMessage = 'Bạn không có quyền xem danh sách yêu cầu';
      } else if (error.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
      } else if (error.isNetworkError) {
        errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Lỗi', errorMessage);
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
                  // Navigation to create request screen
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
                    size={36}
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
            <Text style={styles.sectionTitle}>Yêu cầu gần đây</Text>
            <TouchableOpacity
              onPress={() => {
                // TODO: Navigate to full request history
              }}
            >
              <Text style={styles.viewAllLink}>Xem tất cả</Text>
            </TouchableOpacity>
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
                {selectedFilter === 'maintenance' || selectedFilter === 'moving'
                  ? 'API cho loại yêu cầu này đang được phát triển'
                  : 'Chưa có yêu cầu nào'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {selectedFilter === 'maintenance' || selectedFilter === 'moving'
                  ? 'Vui lòng quay lại sau'
                  : 'Tạo yêu cầu mới từ phía trên'}
              </Text>
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
                    navigation.navigate('RequestDetail', { requestId: item.id });
                  }}
                >
                  <View style={styles.requestItemContent}>
                    <Text style={styles.requestItemTitle}>
                      {item.title}
                    </Text>
                    <Text style={styles.requestItemDate}>
                      {item.createdDate}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.requestStatus,
                      {
                        backgroundColor:
                          item.status === 'Hoàn thành'
                            ? '#D1FAE5'
                            : item.status === 'Chờ xử lý'
                            ? '#FEF3C7'
                            : item.status === 'Đang xử lý'
                            ? '#DBEAFE'
                            : '#FEE2E2',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.requestStatusText,
                        {
                          color:
                            item.status === 'Hoàn thành'
                              ? '#10B981'
                              : item.status === 'Chờ xử lý'
                              ? '#F59E0B'
                              : item.status === 'Đang xử lý'
                              ? '#3B82F6'
                              : '#EF4444',
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  requestCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    minHeight: 140,
  },
  cardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  requestItemContent: {
    flex: 1,
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
    marginLeft: 12,
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
