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
  Modal,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAllRequestsAPI,
  getComplaintRequestsAPI,
  getRepairRequestsAPI,
  getMyTransferRequestsAPI,
  getComplaintRequestDetailAPI,
  getRepairRequestDetailAPI,
  deleteRepairRequestAPI,
  deleteTransferRequestAPI,
  deleteComplaintRequestAPI,
} from '../../services/request.service';

export default function RequestListScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [userInfo, setUserInfo] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);   // formatted item from list
  const [detailData, setDetailData] = useState(null);   // full API detail response
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Full-screen image preview
  const [selectedImage, setSelectedImage] = useState(null);

  // Check user authentication
  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userDataStr = await AsyncStorage.getItem('userData');

      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setUserInfo(userData);
      }

      if (!token) {
        Alert.alert('Thông báo', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return false;
      }

      return true;
    } catch (error) {
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
      case 'Pending': return 'Chờ xử lý';
      case 'Processing': return 'Đang xử lý';
      case 'Done': return 'Đã xử lý';
      case 'Unpaid': return 'Chờ thanh toán';
      case 'Paid': return 'Đã thanh toán';
      case 'Approved': return 'Đã duyệt';
      case 'Rejected': return 'Từ chối';
      case 'Cancelled': return 'Đã hủy';
      case 'InvoiceReleased': return 'Đã xuất hóa đơn';
      case 'Completed': return 'Hoàn tất';
      case 'Paid': return 'Đã thanh toán';
      default: return status || 'Chờ xử lý';
    }
  };

  // Map status to colour
  const getStatusColor = (status) => {
    switch (status) {
      case 'Đã xử lý':
      case 'Đã thanh toán':
      case 'Đã duyệt': return { bg: '#D1FAE5', text: '#10B981' };
      case 'Chờ xử lý': return { bg: '#FEF3C7', text: '#F59E0B' };
      case 'Đang xử lý': return { bg: '#DBEAFE', text: '#3B82F6' };
      case 'Chờ thanh toán': return { bg: '#FEF9C3', text: '#CA8A04' };
      case 'Từ chối':
      case 'Đã hủy': return { bg: '#FEE2E2', text: '#EF4444' };
      case 'Chưa phân công': return { bg: '#F3E8FF', text: '#7C3AED' };
      case 'Đã xuất hóa đơn': return { bg: '#D1FAE5', text: '#10B981' };
      case 'Hoàn tất': return { bg: '#D1FAE5', text: '#10B981' };
      case 'Đã thanh toán': return { bg: '#D1FAE5', text: '#10B981' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
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
    // Transfer room request — has targetRoomId
    if (request.targetRoomId !== undefined) return 'moving';
    // Complaint — has category
    if (request.category) return 'complaint';
    // Repair / maintenance
    if (request.type === 'Sửa chữa' || request.type === 'Bảo trì') return 'maintenance';
    // Legacy moving
    if (request.roomId || request.desiredRoomId) return 'moving';
    return 'unknown';
  };

  // Format request for display
  const formatRequest = (item) => {
    try {
      if (!item || !item._id) {
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
        const targetName =
          item.targetRoomId?.name ||
          item.targetRoomId?.roomCode ||
          item.desiredRoomId?.name ||
          'Phòng đích';
        const reasonShort = (item.reason || '').substring(0, 40);
        title = `Chuyển sang ${targetName}${reasonShort ? ` - ${reasonShort}` : ''}`;
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
      return null;
    }
  };

  // ─── Detail modal helpers ──────────────────────────────────────────────────
  const getDetailStatusInfo = (status) => {
    switch (status) {
      case 'Pending': return { label: 'Chờ xử lý', color: '#F59E0B', bg: '#FEF3C7', icon: 'clock-outline' };
      case 'Processing': return { label: 'Đang xử lý', color: '#3B82F6', bg: '#DBEAFE', icon: 'cog' };
      case 'Done': return { label: 'Đã xử lý', color: '#10B981', bg: '#D1FAE5', icon: 'check-circle-outline' };
      case 'Approved': return { label: 'Đã duyệt', color: '#10B981', bg: '#D1FAE5', icon: 'check-decagram-outline' };
      case 'Rejected': return { label: 'Từ chối', color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle-outline' };
      case 'Cancelled': return { label: 'Đã hủy', color: '#EF4444', bg: '#FEE2E2', icon: 'cancel' };
      case 'Unpaid': return { label: 'Chờ thanh toán', color: '#CA8A04', bg: '#FEF9C3', icon: 'cash-clock' };
      case 'InvoiceReleased': return { label: 'Đã xuất hóa đơn', color: '#F59E0B', bg: '#FEF3C7', icon: 'file-document-outline' };
      case 'Paid': return { label: 'Đã thanh toán', color: '#10B981', bg: '#D1FAE5', icon: 'cash-check' };
      case 'Completed': return { label: 'Hoàn tất', color: '#10B981', bg: '#D1FAE5', icon: 'flag-checkered' };
      default: return { label: status || 'Không xác định', color: '#6B7280', bg: '#F3F4F6', icon: 'help-circle' };
    }
  };

  const openDetail = async (item) => {
    setDetailItem(item);
    setDetailData(null);
    setShowDetailModal(true);
    setLoadingDetail(true);
    try {
      if (item.type === 'complaint') {
        const res = await getComplaintRequestDetailAPI(item.id);
        if (res?.success && res?.data) setDetailData(res.data);
        else setDetailData(item.fullData);
      } else {
        // maintenance & transfer — dùng fullData từ list (endpoint detail yêu cầu quyền admin)
        setDetailData(item.fullData);
      }
    } catch (e) {
      // fallback to list data
      setDetailData(item.fullData);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setDetailItem(null);
    setDetailData(null);
  };

  // Render detail row helper
  const DetailRow = ({ icon, label, value, valueColor }) => (
    <View style={styles.detailRow}>
      <MaterialCommunityIcons name={icon} size={18} color="#3B82F6" style={{ marginTop: 1 }} />
      <View style={styles.detailRowContent}>
        <Text style={styles.detailRowLabel}>{label}</Text>
        <Text style={[styles.detailRowValue, valueColor && { color: valueColor }]}>{value}</Text>
      </View>
    </View>
  );
  // ─────────────────────────────────────────────────────────────────────────────

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

      // Helper to extract array from various API response shapes
      const extractArray = (res) => {
        if (!res || !res.success) return [];
        const d = res.data;
        if (Array.isArray(d)) return d;
        if (d?.data && Array.isArray(d.data)) return d.data;
        if (d?.requests && Array.isArray(d.requests)) return d.requests;
        if (d?.list && Array.isArray(d.list)) return d.list;
        return [];
      };

      let rawData = [];

      if (filter === 'moving') {
        // Only fetch transfer room requests
        const transferRes = await getMyTransferRequestsAPI();
        rawData = extractArray(transferRes);
      } else if (filter === 'complaint') {
        const res = await getComplaintRequestsAPI({ page: 1, limit: 200 });
        rawData = extractArray(res);
      } else if (filter === 'maintenance') {
        const res = await getRepairRequestsAPI({ page: 1, limit: 200 });
        rawData = extractArray(res);
      } else {
        // 'all': merge general requests + transfer requests
        const [generalRes, transferRes] = await Promise.all([
          getAllRequestsAPI({ page: 1, limit: 200 }),
          getMyTransferRequestsAPI(),
        ]);
        const generalData = extractArray(generalRes);
        const transferData = extractArray(transferRes);
        // Deduplicate by _id
        const seen = new Set(generalData.map((r) => r._id));
        const merged = [...generalData];
        transferData.forEach((r) => { if (!seen.has(r._id)) merged.push(r); });
        rawData = merged;
      }

      let mappedRequests = rawData
        .map(formatRequest)
        .filter((req) => req !== null);

      // Sort by date descending
      mappedRequests.sort((a, b) => {
        const dateA = new Date(a.fullData?.createdDate || a.fullData?.createdAt || 0);
        const dateB = new Date(b.fullData?.createdDate || b.fullData?.createdAt || 0);
        return dateB - dateA;
      });

      setRequests(mappedRequests);
    } catch (error) {

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

      Alert.alert('Thông báo', errorMessage);
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
                  onPress={() => openDetail(item)}
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
                      { backgroundColor: getStatusColor(item.status).bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.requestStatusText,
                        { color: getStatusColor(item.status).text },
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

      {/* ───── Detail Modal ─────────────────────────────────────────────────── */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDetail}
      >
        <SafeAreaView style={styles.detailModalSafe}>
          {/* Modal header */}
          <View style={styles.detailModalHeader}>
            <Text style={styles.detailModalTitle}>Chi tiết yêu cầu</Text>
            <TouchableOpacity onPress={closeDetail} style={styles.detailModalClose}>
              <MaterialCommunityIcons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {loadingDetail ? (
            <View style={styles.detailCenter}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.detailLoadingText}>Đang tải chi tiết...</Text>
            </View>
          ) : !detailData && !detailItem ? (
            <View style={styles.detailCenter}>
              <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
              <Text style={styles.detailErrorText}>Không thể tải dữ liệu</Text>
            </View>
          ) : (() => {
            const data = detailData || detailItem?.fullData || {};
            const rawStatus = data.status || detailItem?.rawStatus || 'Pending';
            const si = getDetailStatusInfo(rawStatus);
            const type = detailItem?.type;

            return (
              <ScrollView
                contentContainerStyle={styles.detailScroll}
                showsVerticalScrollIndicator={false}
              >
                {/* Status banner */}
                <View style={[styles.detailStatusBanner, { backgroundColor: si.bg }]}>
                  <MaterialCommunityIcons name={si.icon} size={22} color={si.color} />
                  <Text style={[styles.detailStatusText, { color: si.color }]}>{si.label}</Text>
                </View>

                {/* Type badge */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Thông tin yêu cầu</Text>

                  {/* Common: type */}
                  <DetailRow
                    icon={type === 'complaint' ? 'alert-circle' : type === 'maintenance' ? 'tools' : 'home-move-outline'}
                    label="Loại yêu cầu"
                    value={detailItem?.typeLabel || 'Yêu cầu'}
                  />

                  {/* Complaint fields */}
                  {type === 'complaint' && (
                    <>
                      {data.category && <DetailRow icon="tag" label="Loại khiếu nại" value={data.category} />}
                    </>
                  )}

                  {/* Maintenance/Repair fields */}
                  {type === 'maintenance' && (
                    <>
                      {(data.type) && <DetailRow icon="cog" label="Loại" value={data.type} />}
                      {(data.devicesId?.name || data.deviceName) && (
                        <DetailRow icon="devices" label="Thiết bị" value={data.devicesId?.name || data.deviceName} />
                      )}
                      {(data.devicesId?.category || data.deviceCategory) && (
                        <DetailRow icon="shape" label="Phân loại" value={data.devicesId?.category || data.deviceCategory} />
                      )}
                    </>
                  )}

                  {/* Transfer fields */}
                  {type === 'moving' && (
                    <>
                      {(data.targetRoomId?.name || data.targetRoomId?.roomCode) && (
                        <DetailRow icon="door-open" label="Phòng muốn chuyển đến" value={data.targetRoomId?.name || data.targetRoomId?.roomCode} />
                      )}
                      {data.targetRoomId?.floorId?.name && (
                        <DetailRow icon="layers" label="Tầng" value={data.targetRoomId.floorId.name} />
                      )}
                      {data.targetRoomId?.roomTypeId?.typeName && (
                        <DetailRow icon="home-city" label="Loại phòng" value={data.targetRoomId.roomTypeId.typeName} />
                      )}
                      {data.transferDate && (
                        <DetailRow icon="calendar" label="Ngày chuyển" value={formatDate(data.transferDate)} />
                      )}
                    </>
                  )}

                  {/* Created date */}
                  <DetailRow
                    icon="clock-outline"
                    label="Ngày tạo"
                    value={formatDate(data.createdDate || data.createdAt)}
                  />
                </View>

                {/* Description */}
                {(data.content || data.description || data.reason) && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>
                      {type === 'moving' ? 'Lý do chuyển phòng' : 'Mô tả'}
                    </Text>
                    <View style={styles.detailDescBox}>
                      <Text style={styles.detailDescText}>
                        {data.content || data.description || data.reason}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Lý do từ chối từ quản lý (khiếu nại) — sau Mô tả, giống mockup */}
                {type === 'complaint' &&
                  data.managerNote != null &&
                  String(data.managerNote).trim() !== '' && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Lý do từ chối từ quản lý</Text>
                      <View style={styles.detailRejectionBox}>
                        <View style={styles.detailRejectionMeta}>
                          <MaterialCommunityIcons name="account-tie" size={16} color="#EF4444" />
                          <Text style={styles.detailRejectionAuthor}>
                            {data.responseBy?.fullname ||
                              data.responseBy?.username ||
                              data.responseBy?.email ||
                              'Quản lý'}
                          </Text>
                          {data.responseDate ? (
                            <Text style={styles.detailRejectionDate}>
                              {formatDate(data.responseDate)}
                            </Text>
                          ) : null}
                        </View>
                        <Text style={styles.detailRejectionText}>
                          {String(data.managerNote).trim()}
                        </Text>
                      </View>
                    </View>
                  )}

                {/* Images (repair/maintenance) */}
                {type === 'maintenance' && data.images && data.images.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Hình ảnh đính kèm ({data.images.length})</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagesScrollContent}>
                      {data.images.map((url, idx) => (
                        <TouchableOpacity
                          key={idx}
                          activeOpacity={0.8}
                          onPress={() => setSelectedImage(url)}
                        >
                          <Image
                            source={{ uri: url }}
                            style={styles.detailThumb}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Manager response (complaint) */}
                {data.response && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Phản hồi từ quản lý</Text>
                    <View style={styles.detailResponseBox}>
                      <View style={styles.detailResponseMeta}>
                        <MaterialCommunityIcons name="account-tie" size={16} color="#3B82F6" />
                        <Text style={styles.detailResponseAuthor}>
                          {data.responseBy?.fullname || data.responseBy?.username || data.responseBy?.email || 'Quản lý'}
                        </Text>
                        {data.responseDate && (
                          <Text style={styles.detailResponseDate}>{formatDate(data.responseDate)}</Text>
                        )}
                      </View>
                      <Text style={styles.detailResponseContent}>{data.response}</Text>
                    </View>
                  </View>
                )}

                {/* Rejection note (transfer) */}
                {(rawStatus === 'Rejected' || rawStatus === 'Cancelled') && data.note && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Ghi chú</Text>
                    <View style={styles.detailNoteBox}>
                      <Text style={styles.detailNoteText}>{data.note}</Text>
                    </View>
                  </View>
                )}

                {/* Edit action for Pending maintenance */}
                {type === 'maintenance' && rawStatus === 'Pending' && (
                  <View style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 8 }}>
                    <TouchableOpacity
                      style={styles.editActionButton}
                      onPress={() => {
                        closeDetail();
                        navigation.navigate('UpdateRepairRequest', {
                          requestId: detailItem?.id,
                          initialData: data,
                        });
                      }}
                    >
                      <MaterialCommunityIcons name="pencil" size={18} color="#FFFFFF" />
                      <Text style={styles.editActionButtonText}>Chỉnh sửa yêu cầu</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.deleteActionButton, deletingId === detailItem?.id && { opacity: 0.6 }]}
                      disabled={deletingId === detailItem?.id}
                      onPress={() => {
                        Alert.alert(
                          'Xác nhận xóa',
                          'Bạn có chắc muốn xóa yêu cầu này không? Hành động này không thể hoàn tác.',
                          [
                            { text: 'Hủy', style: 'cancel' },
                            {
                              text: 'Xóa',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  setDeletingId(detailItem?.id);
                                  await deleteRepairRequestAPI(detailItem?.id);
                                  closeDetail();
                                  Alert.alert('Thành công', 'Đã xóa yêu cầu thành công');
                                  loadRequests();
                                } catch (err) {
                                  Alert.alert('Thông báo', err.message || 'Không thể xóa yêu cầu');
                                } finally {
                                  setDeletingId(null);
                                }
                              },
                            },
                          ]
                        );
                      }}
                    >
                      {deletingId === detailItem?.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FFFFFF" />
                      )}
                      <Text style={styles.deleteActionButtonText}>
                        {deletingId === detailItem?.id ? 'Đang xóa...' : 'Xóa yêu cầu'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Edit + Delete actions for Pending transfer */}
                {type === 'moving' && rawStatus === 'Pending' && (
                  <View style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 8 }}>
                    <TouchableOpacity
                      style={styles.editActionButton}
                      onPress={() => {
                        closeDetail();
                        navigation.navigate('UpdateTransferRequest', {
                          requestId: detailItem?.id,
                          initialData: data,
                        });
                      }}
                    >
                      <MaterialCommunityIcons name="pencil" size={18} color="#FFFFFF" />
                      <Text style={styles.editActionButtonText}>Chỉnh sửa yêu cầu</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.deleteActionButton, deletingId === detailItem?.id && { opacity: 0.6 }]}
                      disabled={deletingId === detailItem?.id}
                      onPress={() => {
                        Alert.alert(
                          'Xác nhận xóa',
                          'Bạn có chắc muốn xóa yêu cầu chuyển phòng này không?',
                          [
                            { text: 'Hủy', style: 'cancel' },
                            {
                              text: 'Xóa',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  setDeletingId(detailItem?.id);
                                  await deleteTransferRequestAPI(detailItem?.id);
                                  closeDetail();
                                  Alert.alert('Thành công', 'Đã xóa yêu cầu thành công');
                                  loadRequests();
                                } catch (err) {
                                  Alert.alert('Thông báo', err.message || 'Không thể xóa yêu cầu');
                                } finally {
                                  setDeletingId(null);
                                }
                              },
                            },
                          ]
                        );
                      }}
                    >
                      {deletingId === detailItem?.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FFFFFF" />
                      )}
                      <Text style={styles.deleteActionButtonText}>
                        {deletingId === detailItem?.id ? 'Đang xóa...' : 'Xóa yêu cầu'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Edit + Delete actions for Pending complaint */}
                {type === 'complaint' && rawStatus === 'Pending' && (
                  <View style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 8 }}>
                    <TouchableOpacity
                      style={styles.editActionButton}
                      onPress={() => {
                        closeDetail();
                        navigation.navigate('UpdateRequest', {
                          requestId: data?._id || detailItem?.id,
                          initialData: data,
                        });
                      }}
                    >
                      <MaterialCommunityIcons name="pencil" size={18} color="#FFFFFF" />
                      <Text style={styles.editActionButtonText}>Chỉnh sửa yêu cầu</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.deleteActionButton, deletingId === detailItem?.id && { opacity: 0.6 }]}
                      disabled={deletingId === detailItem?.id}
                      onPress={() => {
                        Alert.alert(
                          'Xác nhận xóa',
                          'Bạn có chắc muốn xóa khiếu nại này không? Hành động này không thể hoàn tác.',
                          [
                            { text: 'Hủy', style: 'cancel' },
                            {
                              text: 'Xóa',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  setDeletingId(detailItem?.id);
                                  await deleteComplaintRequestAPI(data?._id || detailItem?.id);
                                  closeDetail();
                                  Alert.alert('Thành công', 'Đã xóa khiếu nại thành công');
                                  loadRequests();
                                } catch (err) {
                                  Alert.alert('Thông báo', err.message || 'Không thể xóa khiếu nại');
                                } finally {
                                  setDeletingId(null);
                                }
                              },
                            },
                          ]
                        );
                      }}
                    >
                      {deletingId === detailItem?.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FFFFFF" />
                      )}
                      <Text style={styles.deleteActionButtonText}>
                        {deletingId === detailItem?.id ? 'Đang xóa...' : 'Xóa khiếu nại'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            );
          })()}
        </SafeAreaView>
      </Modal>

      {/* Full-screen image preview modal */}
      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
        statusBarTranslucent
      >
        <View style={styles.imageFullscreenOverlay}>
          <TouchableOpacity
            style={styles.imageFullscreenClose}
            onPress={() => setSelectedImage(null)}
          >
            <MaterialCommunityIcons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.imageFullscreen}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
      {/* ─────────────────────────────────────────────────────────────────────── */}
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

  // ─── Detail Modal ────────────────────────────────────────────────────────────
  detailModalSafe: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  detailModalClose: {
    padding: 4,
  },
  detailCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  detailLoadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailErrorText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailScroll: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  detailStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 12,
  },
  detailStatusText: {
    fontSize: 15,
    fontWeight: '600',
  },
  detailSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  detailRowContent: {
    flex: 1,
  },
  detailRowLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  detailRowValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  detailDescBox: {
    backgroundColor: '#F9FAFB',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  detailDescText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 21,
  },
  detailResponseBox: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  detailResponseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  detailResponseAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  detailResponseDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  detailResponseContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  detailRejectionBox: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  detailRejectionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  detailRejectionAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
    flex: 1,
  },
  detailRejectionDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  detailRejectionText: {
    fontSize: 14,
    color: '#7F1D1D',
    lineHeight: 21,
  },
  detailNoteBox: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  detailNoteText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  imagesScrollContent: {
    paddingVertical: 4,
    gap: 10,
  },
  detailThumb: {
    width: 110,
    height: 110,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    marginRight: 10,
  },
  imageFullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageFullscreenClose: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    padding: 6,
  },
  imageFullscreen: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  editActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 10,
  },
  editActionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  deleteActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 14,
  },
  deleteActionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  // ────────────────────────────────────────────────────────────────────────────

});
