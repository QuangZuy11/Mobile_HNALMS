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
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../services/api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleCallManager } from '../../utils/phoneHelper';

const { width } = Dimensions.get('window');

export default function MyRoomScreen({ navigation }) {
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchRoomData = async () => {
    try {
      setError(null);
      const token = await AsyncStorage.getItem('authToken');
      
      // Fetch room data using /room/my-room endpoint
      const roomResponse = await apiClient.get('/room/my-room', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('=== MY ROOM API RESPONSE ===');
      console.log('Full Response:', JSON.stringify(roomResponse.data, null, 2));
      console.log('Response keys:', Object.keys(roomResponse.data || {}));
      
      // Extract room data from response
      const responseData = roomResponse.data?.data;
      
      if (responseData && responseData.room) {
        console.log('=== EXTRACTED ROOM DATA ===');
        console.log('Room:', responseData.room);
        
        setRoomData(responseData.room);
      } else {
        setError('Không thể tải thông tin phòng');
      }
    } catch (err) {
      console.error('Room data error:', err);
      console.error('Error details:', err.response?.data || err.message);
      
      // Better error messages
      if (err.response?.status === 404) {
        setError('Bạn chưa được phân phòng');
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
    fetchRoomData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoomData();
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

  const getStatusBadgeColor = (status) => {
    const lowerStatus = status?.toLowerCase();
    switch (lowerStatus) {
      case 'active':
        return { bg: '#D1FAE5', text: '#047857', label: 'Đang hoạt động' };
      case 'inactive':
        return { bg: '#FEE2E2', text: '#991B1B', label: 'Không hoạt động' };
      case 'occupied':
        return { bg: '#DBEAFE', text: '#0369A1', label: 'Đang sử dụng' };
      case 'available':
        return { bg: '#D1FAE5', text: '#047857', label: 'Còn trống' };
      default:
        return { bg: '#F3F4F6', text: '#374151', label: status || 'Chưa xác định' };
    }
  };

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    // Handle MongoDB Decimal128 format
    const amount = value.$numberDecimal || value;
    return `${parseFloat(amount).toLocaleString('vi-VN')} VND`;
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
          <Text style={styles.headerTitle}>Thông tin phòng của tôi</Text>
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
          <Text style={styles.headerTitle}>Thông tin phòng của tôi</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              fetchRoomData();
            }}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!roomData) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông tin phòng của tôi</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="home-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>Không tìm thấy thông tin phòng</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusBadge = getStatusBadgeColor(roomData.status);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin phòng của tôi</Text>
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
        {/* Room Basic Info */}
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
                <MaterialCommunityIcons name="layers" size={20} color="#3B82F6" />
                <Text style={styles.infoLabel}>Tầng</Text>
              </View>
              <Text style={styles.infoValue}>
                {roomData.floor?.name || 'N/A'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#3B82F6" />
                <Text style={styles.infoLabel}>Trạng thái</Text>
              </View>
              <View style={[styles.statusBadgeInline, { backgroundColor: statusBadge.bg }]}>
                <Text style={[styles.statusBadgeTextInline, { color: statusBadge.text }]}>
                  {statusBadge.label}
                </Text>
              </View>
            </View>

            {roomData.capacity && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoLabelContainer}>
                    <MaterialCommunityIcons name="account-multiple" size={20} color="#3B82F6" />
                    <Text style={styles.infoLabel}>Sức chứa</Text>
                  </View>
                  <Text style={styles.infoValue}>{roomData.capacity} người</Text>
                </View>
              </>
            )}

            {roomData.area && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoLabelContainer}>
                    <MaterialCommunityIcons name="floor-plan" size={20} color="#3B82F6" />
                    <Text style={styles.infoLabel}>Diện tích</Text>
                  </View>
                  <Text style={styles.infoValue}>{roomData.area} m²</Text>
                </View>
              </>
            )}

            {roomData.description && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoLabelContainer}>
                    <MaterialCommunityIcons name="text" size={20} color="#3B82F6" />
                    <Text style={styles.infoLabel}>Mô tả</Text>
                  </View>
                </View>
                <Text style={styles.descriptionText}>
                  {roomData.description}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Room Type Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loại phòng</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialCommunityIcons name="information" size={20} color="#10B981" />
                <Text style={styles.infoLabel}>Loại phòng</Text>
              </View>
              <Text style={styles.infoValue}>
                {roomData.roomType?.typeName || 'N/A'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialCommunityIcons name="currency-usd" size={20} color="#10B981" />
                <Text style={styles.infoLabel}>Giá phòng/tháng</Text>
              </View>
              <Text style={styles.infoValue}>
                {formatCurrency(roomData.roomType?.currentPrice)}
              </Text>
            </View>

            {roomData.roomType?.description && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoLabelContainer}>
                    <MaterialCommunityIcons name="file-document" size={20} color="#10B981" />
                    <Text style={styles.infoLabel}>Mô tả loại phòng</Text>
                  </View>
                </View>
                <Text style={styles.descriptionText}>
                  {roomData.roomType.description}
                </Text>
              </>
            )}

            {roomData.roomType?.personMax && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoLabelContainer}>
                    <MaterialCommunityIcons name="account-group" size={20} color="#10B981" />
                    <Text style={styles.infoLabel}>Sức chứa tối đa</Text>
                  </View>
                  <Text style={styles.infoValue}>{roomData.roomType.personMax} người</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Assets/Facilities */}
        {roomData.assets && roomData.assets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tài sản trong phòng</Text>
            <View style={styles.infoCard}>
              <View style={styles.facilitiesContainer}>
                {roomData.assets.map((asset, index) => (
                  <View key={index} style={styles.facilityItem}>
                    <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
                    <Text style={styles.facilityText}>
                      {typeof asset === 'string' ? asset : asset.name || asset.assetName || 'Tài sản'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCallManager}
          >
            <MaterialCommunityIcons name="phone" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Liên hệ quản lý</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => {
              navigation.navigate('ContractList');
            }}
          >
            <MaterialCommunityIcons name="file-document" size={20} color="#3B82F6" />
            <Text style={styles.actionButtonTextSecondary}>Xem hợp đồng</Text>
          </TouchableOpacity>
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
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  roomImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E5E7EB',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
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
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 12,
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  facilitiesContainer: {
    padding: 16,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  facilityText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
});
