import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../services/api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleCallManager } from '../../utils/phoneHelper';

const { width, height } = Dimensions.get('window');

export default function MyContractScreen({ navigation }) {
  const [contractData, setContractData] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const fetchContractData = async () => {
    try {
      setError(null);
      const token = await AsyncStorage.getItem('authToken');
      
      // Fetch contract data from /room/my-room endpoint
      const response = await apiClient.get('/room/my-room', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('Contract API Response:', JSON.stringify(response.data, null, 2));

      const responseData = response.data?.data;
      
      if (responseData) {
        if (responseData.contract) {
          setContractData(responseData.contract);
        }
        if (responseData.room) {
          setRoomData(responseData.room);
        }
        
        if (!responseData.contract) {
          setError('Bạn chưa có hợp đồng nào');
        }
      } else {
        setError('Không thể tải thông tin hợp đồng');
      }
    } catch (err) {
      console.error('Contract data error:', err);
      console.error('Error details:', err.response?.data || err.message);
      
      if (err.response?.status === 404) {
        setError('Không tìm thấy thông tin hợp đồng');
      } else if (err.response?.status === 401) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContractData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchContractData();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    const amount = value.$numberDecimal || value;
    return `${parseFloat(amount).toLocaleString('vi-VN')} VND`;
  };

  const getStatusBadgeColor = (status) => {
    const lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
      case 'active':
        return { bg: '#D1FAE5', text: '#047857', label: 'Đang hiệu lực' };
      case 'expired':
        return { bg: '#FEE2E2', text: '#991B1B', label: 'Đã hết hạn' };
      case 'terminated':
        return { bg: '#FEE2E2', text: '#991B1B', label: 'Đã thanh lý' };
      case 'pending':
        return { bg: '#FEF3C7', text: '#92400E', label: 'Chờ xử lý' };
      default:
        return { bg: '#F3F4F6', text: '#374151', label: status || 'Chưa xác định' };
    }
  };

  const getDepositStatusColor = (status) => {
    const lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
      case 'held':
        return { bg: '#DBEAFE', text: '#0369A1', label: 'Đang giữ' };
      case 'returned':
        return { bg: '#D1FAE5', text: '#047857', label: 'Đã hoàn trả' };
      case 'forfeited':
        return { bg: '#FEE2E2', text: '#991B1B', label: 'Đã tịch thu' };
      default:
        return { bg: '#F3F4F6', text: '#374151', label: status || 'Chưa xác định' };
    }
  };

  const openContractImage = (imageUrl) => {
    setSelectedImage(imageUrl);
    setImageLoading(true);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setImageLoading(false);
    setTimeout(() => {
      setSelectedImage(null);
    }, 300);
  };

  const calculateRemainingDays = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hợp đồng của tôi</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hợp đồng của tôi</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              fetchContractData();
            }}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!contractData) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hợp đồng của tôi</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="file-document-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>Bạn chưa có hợp đồng nào</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusBadge = getStatusBadgeColor(contractData.status);
  const depositStatusBadge = contractData.deposit ? getDepositStatusColor(contractData.deposit.status) : null;
  const remainingDays = calculateRemainingDays(contractData.endDate);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hợp đồng của tôi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Contract Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusBadge.bg }]}>
          <MaterialCommunityIcons name="file-document" size={24} color={statusBadge.text} />
          <Text style={[styles.statusBannerText, { color: statusBadge.text }]}>
            {statusBadge.label}
          </Text>
        </View>

        {/* Remaining Time Alert */}
        {remainingDays !== null && remainingDays > 0 && remainingDays <= 30 && (
          <View style={styles.alertBanner}>
            <MaterialCommunityIcons name="clock-alert" size={20} color="#92400E" />
            <Text style={styles.alertText}>
              Hợp đồng sẽ hết hạn trong {remainingDays} ngày
            </Text>
          </View>
        )}

        {/* Contract Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin hợp đồng</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialCommunityIcons name="barcode" size={20} color="#8B5CF6" />
                <Text style={styles.infoLabel}>Mã hợp đồng</Text>
              </View>
              <Text style={styles.infoValue}>{contractData.contractCode || 'N/A'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialCommunityIcons name="calendar-start" size={20} color="#8B5CF6" />
                <Text style={styles.infoLabel}>Ngày bắt đầu</Text>
              </View>
              <Text style={styles.infoValue}>{formatDate(contractData.startDate)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialCommunityIcons name="calendar-end" size={20} color="#8B5CF6" />
                <Text style={styles.infoLabel}>Ngày kết thúc</Text>
              </View>
              <Text style={styles.infoValue}>{formatDate(contractData.endDate)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialCommunityIcons name="account-group" size={20} color="#8B5CF6" />
                <Text style={styles.infoLabel}>Số người ở</Text>
              </View>
              <Text style={styles.infoValue}>{contractData.personInRoom || 0} người</Text>
            </View>
          </View>
        </View>

        {/* Room Info */}
        {roomData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin phòng</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <MaterialCommunityIcons name="door" size={20} color="#3B82F6" />
                  <Text style={styles.infoLabel}>Tên phòng</Text>
                </View>
                <Text style={styles.infoValue}>{roomData.name || 'N/A'}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <MaterialCommunityIcons name="barcode" size={20} color="#3B82F6" />
                  <Text style={styles.infoLabel}>Mã phòng</Text>
                </View>
                <Text style={styles.infoValue}>{roomData.roomCode || 'N/A'}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <MaterialCommunityIcons name="currency-usd" size={20} color="#3B82F6" />
                  <Text style={styles.infoLabel}>Giá phòng/tháng</Text>
                </View>
                <Text style={styles.infoValue}>
                  {formatCurrency(roomData.roomType?.currentPrice)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Deposit Info */}
        {contractData.deposit && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin cọc</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <MaterialCommunityIcons name="account" size={20} color="#10B981" />
                  <Text style={styles.infoLabel}>Người cọc</Text>
                </View>
                <Text style={styles.infoValue}>{contractData.deposit.name || 'N/A'}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <MaterialCommunityIcons name="currency-usd" size={20} color="#10B981" />
                  <Text style={styles.infoLabel}>Số tiền cọc</Text>
                </View>
                <Text style={styles.infoValue}>{formatCurrency(contractData.deposit.amount)}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                  <Text style={styles.infoLabel}>Trạng thái</Text>
                </View>
                {depositStatusBadge && (
                  <View style={[styles.statusBadgeInline, { backgroundColor: depositStatusBadge.bg }]}>
                    <Text style={[styles.statusBadgeTextInline, { color: depositStatusBadge.text }]}>
                      {depositStatusBadge.label}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <MaterialCommunityIcons name="calendar" size={20} color="#10B981" />
                  <Text style={styles.infoLabel}>Ngày đặt cọc</Text>
                </View>
                <Text style={styles.infoValue}>{formatDate(contractData.deposit.createdDate)}</Text>
              </View>

              {contractData.deposit.phone && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelContainer}>
                      <MaterialCommunityIcons name="phone" size={20} color="#10B981" />
                      <Text style={styles.infoLabel}>Số điện thoại</Text>
                    </View>
                    <Text style={styles.infoValue}>{contractData.deposit.phone}</Text>
                  </View>
                </>
              )}

              {contractData.deposit.email && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelContainer}>
                      <MaterialCommunityIcons name="email" size={20} color="#10B981" />
                      <Text style={styles.infoLabel}>Email</Text>
                    </View>
                    <Text style={styles.infoValue}>{contractData.deposit.email}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Contract Images */}
        {contractData.image && contractData.image.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hình ảnh hợp đồng</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {contractData.image.map((imageUrl, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.imageContainer}
                  onPress={() => openContractImage(imageUrl)}
                >
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.contractImage}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlay}>
                    <MaterialCommunityIcons name="eye" size={24} color="#FFFFFF" />
                    <Text style={styles.imageOverlayText}>Xem ảnh</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.section}>
          {contractData.status === 'active' && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  // navigation.navigate('RenewContract', { contractId: contractData._id });
                  alert('Chức năng gia hạn hợp đồng đang được phát triển');
                }}
              >
                <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Gia hạn hợp đồng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonDanger]}
                onPress={() => {
                  // navigation.navigate('TerminateContract', { contractId: contractData._id });
                  alert('Chức năng thanh lý hợp đồng đang được phát triển');
                }}
              >
                <MaterialCommunityIcons name="close-circle" size={20} color="#EF4444" />
                <Text style={styles.actionButtonTextDanger}>Thanh lý hợp đồng</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={handleCallManager}
          >
            <MaterialCommunityIcons name="phone" size={20} color="#3B82F6" />
            <Text style={styles.actionButtonTextSecondary}>Liên hệ quản lý</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={closeImageModal}
          >
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={closeImageModal}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="close" size={30} color="#FFFFFF" />
            </TouchableOpacity>
            
            {imageLoading && (
              <View style={styles.imageLoadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.imageLoadingText}>Đang tải ảnh...</Text>
              </View>
            )}
            
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullscreenImage}
                resizeMode="contain"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  alert('Không thể tải ảnh');
                }}
              />
            )}
          </TouchableOpacity>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    gap: 8,
  },
  statusBannerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    gap: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  statusBadgeInline: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeTextInline: {
    fontSize: 12,
    fontWeight: '600',
  },
  imageContainer: {
    width: 280,
    height: 200,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  contractImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  imageOverlayText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLoadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  imageLoadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 14,
  },
  fullscreenImage: {
    width: width,
    height: height,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  actionButtonSecondary: {
    backgroundColor: '#DBEAFE',
  },
  actionButtonTextSecondary: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  actionButtonDanger: {
    backgroundColor: '#FEE2E2',
  },
  actionButtonTextDanger: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
});
