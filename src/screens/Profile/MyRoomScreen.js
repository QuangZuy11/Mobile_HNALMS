import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../services/api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleCallManager } from '../../utils/phoneHelper';

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A';
  const amount = typeof value === 'object' && value.$numberDecimal ? value.$numberDecimal : value;
  return `${parseFloat(amount).toLocaleString('vi-VN')} VNĐ`;
};

const getRoomStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
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

// ── Main Component ──────────────────────────────────────────────────────────

export default function MyRoomScreen({ navigation }) {
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const token = await AsyncStorage.getItem('authToken');

      const response = await apiClient.get('/contracts/my-contracts', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success && response.data.data?.length > 0) {
        const contracts = response.data.data;
        const active = contracts.find((c) => c.status === 'active') || contracts[0];
        if (active?.roomId) {
          setRoomData(active.roomId);
        } else {
          setError('Không tìm thấy thông tin phòng');
        }
      } else {
        setError('Bạn chưa được phân phòng');
      }
    } catch (err) {
      console.error('MyRoom fetch error:', err);
      if (err.status === 401) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại');
      } else {
        setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ── Header ──

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Phòng của tôi</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  // ── Loading / Error / Empty ──

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        {renderHeader()}
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.centeredText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        {renderHeader()}
        <View style={styles.centeredContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => { setLoading(true); fetchData(); }}
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
        {renderHeader()}
        <View style={styles.centeredContainer}>
          <MaterialCommunityIcons name="home-outline" size={48} color="#9CA3AF" />
          <Text style={styles.centeredText}>Không tìm thấy thông tin phòng</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Extract room info ──

  const roomType = roomData.roomTypeId;
  const floor = roomData.floorId;
  const statusBadge = getRoomStatusBadge(roomData.status);

  return (
    <SafeAreaView style={styles.safeContainer}>
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {/* ── Room Hero Card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIconWrapper}>
              <MaterialCommunityIcons name="door-open" size={32} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroRoomName}>{roomData.name || 'N/A'}</Text>
              <Text style={styles.heroRoomCode}>{roomData.roomCode || ''}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusBadge.text }]}>
                {statusBadge.label}
              </Text>
            </View>
          </View>

          {/* Quick stats */}
          <View style={styles.heroStatsRow}>
            {floor && (
              <View style={styles.heroStat}>
                <MaterialCommunityIcons name="office-building" size={18} color="#6B7280" />
                <Text style={styles.heroStatText}>{floor.name}</Text>
              </View>
            )}
            {roomType && (
              <View style={styles.heroStat}>
                <MaterialCommunityIcons name="tag" size={18} color="#6B7280" />
                <Text style={styles.heroStatText}>{roomType.typeName || 'N/A'}</Text>
              </View>
            )}
            {roomType?.personMax && (
              <View style={styles.heroStat}>
                <MaterialCommunityIcons name="account-group" size={18} color="#6B7280" />
                <Text style={styles.heroStatText}>Tối đa {roomType.personMax} người</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Room Type Images ── */}
        {roomType?.images && roomType.images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hình ảnh phòng</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {roomType.images.map((imgUrl, idx) => (
                <Image
                  key={idx}
                  source={{ uri: imgUrl }}
                  style={styles.roomImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Room Info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin phòng</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="door" color="#3B82F6" label="Tên phòng" value={roomData.name} />
            <InfoRow icon="barcode" color="#3B82F6" label="Mã phòng" value={roomData.roomCode} />
            {floor && <InfoRow icon="office-building" color="#3B82F6" label="Tầng" value={floor.name} />}
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#3B82F6" />
                <Text style={styles.infoLabel}>Trạng thái</Text>
              </View>
              <View style={[styles.statusBadgeSmall, { backgroundColor: statusBadge.bg }]}>
                <Text style={[styles.statusBadgeSmallText, { color: statusBadge.text }]}>
                  {statusBadge.label}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Room Type Detail ── */}
        {roomType && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Loại phòng</Text>
            <View style={styles.infoCard}>
              <InfoRow icon="tag" color="#10B981" label="Loại phòng" value={roomType.typeName} />
              <InfoRow icon="currency-usd" color="#10B981" label="Giá phòng/tháng" value={formatCurrency(roomType.currentPrice)} />
              <InfoRow icon="account-group" color="#10B981" label="Số người tối đa" value={`${roomType.personMax || '–'} người`} isLast={!roomType.description} />
              {roomType.description && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.descriptionWrapper}>
                    <MaterialCommunityIcons name="text" size={18} color="#10B981" />
                    <Text style={styles.descriptionText}>{roomType.description}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* ── Action Buttons ── */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCallManager}>
            <MaterialCommunityIcons name="phone" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Liên hệ quản lý</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => navigation.navigate('ContractList')}
          >
            <MaterialCommunityIcons name="file-document" size={20} color="#3B82F6" />
            <Text style={styles.actionButtonTextSecondary}>Xem hợp đồng</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Reusable InfoRow ────────────────────────────────────────────────────────

function InfoRow({ icon, color, label, value, isLast }) {
  return (
    <>
      <View style={styles.infoRow}>
        <View style={styles.infoLabelContainer}>
          <MaterialCommunityIcons name={icon} size={20} color={color} />
          <Text style={styles.infoLabel}>{label}</Text>
        </View>
        <Text style={styles.infoValue}>{value || 'N/A'}</Text>
      </View>
      {!isLast && <View style={styles.divider} />}
    </>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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

  // ── Centered states ──
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  centeredText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
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
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // ── Hero card ──
  heroCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  heroRoomName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  heroRoomCode: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  heroStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    gap: 12,
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  heroStatText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeSmallText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // ── Room images ──
  roomImage: {
    width: 220,
    height: 150,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#E5E7EB',
  },

  // ── Sections ──
  section: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
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
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  descriptionWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  descriptionText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
  },

  // ── Actions ──
  actionButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  actionButtonSecondary: {
    backgroundColor: '#DBEAFE',
  },
  actionButtonTextSecondary: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
  },
});
