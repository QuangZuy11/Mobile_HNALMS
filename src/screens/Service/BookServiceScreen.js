import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../services/api.service';

// ── Helpers ──────────────────────────────────────────────────────────
const formatDate = (dateString) => {
  if (!dateString) return 'Chưa cập nhật';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const getStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return { bg: '#D1FAE5', text: '#047857', label: 'Đang hiệu lực', icon: 'check-circle' };
    case 'expired':
      return { bg: '#FEE2E2', text: '#991B1B', label: 'Đã hết hạn', icon: 'clock-alert' };
    case 'terminated':
      return { bg: '#FEE2E2', text: '#991B1B', label: 'Đã thanh lý', icon: 'close-circle' };
    case 'inactive':
      return { bg: '#FEF3C7', text: '#92400E', label: 'Chưa hiệu lực', icon: 'timer-sand' };
    case 'pending':
      return { bg: '#FEF3C7', text: '#92400E', label: 'Chờ xử lý', icon: 'timer-sand' };
    default:
      return { bg: '#F3F4F6', text: '#374151', label: status || 'Chưa xác định', icon: 'help-circle' };
  }
};

// ── Main Component ──────────────────────────────────────────────────
export default function BookServiceScreen({ navigation }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await apiClient.get('/contracts/my-contracts', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.data) {
        // Lấy tất cả hợp đồng có phòng
        const allContracts = response.data.data.filter((c) => c.roomId && c.roomId._id);
        setContracts(allContracts || []);
      } else {
        setContracts([]);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể tải danh sách phòng';
      setError(msg);
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchContracts();
    }, [fetchContracts])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchContracts();
  };

  const navigateToServices = (contract) => {
    if (contract.status?.toLowerCase() === 'inactive') {
      Alert.alert(
        'Chưa thể đặt dịch vụ',
        `Phòng này thuộc hợp đồng chưa hiệu lực.\nBạn chỉ có thể đặt dịch vụ kể từ ngày ${formatDate(contract.startDate)}.`
      );
      return;
    }
    navigation.navigate('ServiceList', { contractId: contract._id });
  };

  // ── Render contract card ──
  const renderContractCard = ({ item }) => {
    const room = item.roomId;
    const floor = room?.floorId;
    const roomType = room?.roomTypeId;
    const badge = getStatusBadge(item.status);
    const isInactive = item.status?.toLowerCase() === 'inactive';

    return (
      <TouchableOpacity
        style={[styles.card, isInactive && styles.cardInactive]}
        onPress={() => navigateToServices(item)}
        activeOpacity={isInactive ? 1 : 0.7}
        disabled={isInactive}
      >
        {/* Card header with room info */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.statusDot, { backgroundColor: badge.text }]} />
            <View style={styles.roomInfo}>
              <Text style={styles.roomName}>{room?.name || 'Phòng'}</Text>
              {floor && <Text style={styles.floorName}>{floor.name}</Text>}
            </View>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color="#D1D5DB"
          />
        </View>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
          <MaterialCommunityIcons name={badge.icon} size={14} color={badge.text} />
          <Text style={[styles.statusBadgeText, { color: badge.text }]}>
            {badge.label}
          </Text>
        </View>

        {/* Thông báo chưa đến ngày cho inactive */}
        {isInactive && (
          <View style={styles.inactiveNotice}>
            <MaterialCommunityIcons name="calendar-clock" size={14} color="#92400E" />
            <Text style={styles.inactiveNoticeText}>
              Đặt dịch vụ từ ngày {formatDate(item.startDate)}
            </Text>
          </View>
        )}

        {/* Room details row */}
        {roomType && (
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="door" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{roomType.typeName || 'Loại phòng'}</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="account-multiple" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{roomType.personMax || '–'} người</Text>
            </View>
          </View>
        )}

        {/* Date range */}
        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="calendar-range" size={16} color="#9CA3AF" />
          <Text style={styles.dateText}>
            {formatDate(item.startDate)} – {formatDate(item.endDate)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const ListEmpty = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="home-alert-outline"
        size={64}
        color="#D1D5DB"
      />
      <Text style={styles.emptyTitle}>Không có hợp đồng</Text>
      <Text style={styles.emptySubtitle}>
        Bạn hiện chưa có hợp đồng nào. Vui lòng liên hệ quản lý.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="chevron-left" size={28} color="#1F2937" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Chọn phòng</Text>
      <View style={{ width: 28 }} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Đang tải danh sách phòng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      {renderHeader()}

      <FlatList
        data={contracts}
        keyExtractor={(item) => item._id}
        renderItem={renderContractCard}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={
          contracts.length === 0 ? styles.flatListEmpty : styles.flatListContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#F59E0B']}
            tintColor="#F59E0B"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 14, color: '#6B7280' },

  flatListContent: { padding: 16 },
  flatListEmpty: { flex: 1 },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  cardInactive: {
    opacity: 0.7,
  },

  inactiveNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
  },

  inactiveNoticeText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  roomInfo: { flex: 1 },

  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },

  floorName: {
    fontSize: 13,
    color: '#6B7280',
  },

  statusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },

  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },

  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },

  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  detailText: {
    fontSize: 12,
    color: '#6B7280',
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
  },

  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});
