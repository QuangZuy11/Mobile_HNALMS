import React, { useState, useCallback } from 'react';
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
import { getMyBookedServicesAPI } from '../../services/service.service';

// ── helpers ────────────────────────────────────────────────────────────────
const formatCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return '–';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return '–';
  try {
    const d = new Date(dateString);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return dateString;
  }
};

const getStatusInfo = (status) => {
  switch (status) {
    case 'Active':
      return { label: 'Đang sử dụng', bg: '#D1FAE5', text: '#10B981' };
    case 'Cancelled':
      return { label: 'Đã hủy', bg: '#FEE2E2', text: '#EF4444' };
    case 'Pending':
      return { label: 'Chờ duyệt', bg: '#FEF3C7', text: '#F59E0B' };
    default:
      return { label: status || 'Không rõ', bg: '#F3F4F6', text: '#6B7280' };
  }
};

const TYPE_ICON = {
  'Điện':     'lightning-bolt',
  'Nước':     'water',
  'Internet': 'wifi',
  'Giữ xe':   'motorbike',
  'Vệ sinh':  'broom',
  'Giặt ủi':  'washing-machine',
  'Ăn uống':  'food',
  'Khác':     'room-service-outline',
};
const getTypeIcon = (type) => TYPE_ICON[type] || 'room-service-outline';

// ── main component ──────────────────────────────────────────────────────────
export default function BookServiceScreen({ navigation }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchServices = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await getMyBookedServicesAPI();
      const normalized = (res.data || []).map((item) => {
        const svc =
          item?.serviceId && typeof item.serviceId === 'object'
            ? item.serviceId
            : item;
        return {
          _id:          item._id || svc._id,
          name:         svc.name        || svc.serviceName || 'Dịch vụ',
          type:         svc.type        || svc.serviceType || 'Khác',
          currentPrice: svc.currentPrice ?? svc.price ?? null,
          unit:         svc.unit        || 'tháng',
          description:  svc.description || '',
          status:       item.status     || svc.status     || 'Active',
          startDate:    item.startDate  || null,
          endDate:      item.endDate    || null,
        };
      });
      setServices(normalized);
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchServices();
    }, [fetchServices])
  );

  const renderItem = ({ item }) => {
    const statusInfo = getStatusInfo(item.status);
    const icon = getTypeIcon(item.type);
    return (
      <View style={styles.card}>
        <View style={[styles.iconWrapper, { backgroundColor: '#FEF3C7' }]}>
          <MaterialCommunityIcons name={icon} size={26} color="#F59E0B" />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
              <Text style={[styles.statusText, { color: statusInfo.text }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>
          <View style={styles.typeRow}>
            <MaterialCommunityIcons name="tag-outline" size={13} color="#9CA3AF" />
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
          {!!item.description && (
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          )}
          {(item.startDate || item.endDate) && (
            <View style={styles.dateRow}>
              {item.startDate && (
                <View style={styles.dateItem}>
                  <MaterialCommunityIcons name="calendar-start" size={13} color="#6B7280" />
                  <Text style={styles.dateText}>Từ: {formatDate(item.startDate)}</Text>
                </View>
              )}
              {item.endDate && (
                <View style={styles.dateItem}>
                  <MaterialCommunityIcons name="calendar-end" size={13} color="#6B7280" />
                  <Text style={styles.dateText}>Đến: {formatDate(item.endDate)}</Text>
                </View>
              )}
            </View>
          )}
          <View style={styles.priceRow}>
            <MaterialCommunityIcons name="currency-usd" size={15} color="#F59E0B" />
            <Text style={styles.priceText}>
              {formatCurrency(item.currentPrice)}
              <Text style={styles.priceUnit}> / {item.unit}</Text>
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const ListEmpty = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="room-service-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Chưa có dịch vụ</Text>
      <Text style={styles.emptySubtitle}>
        Các dịch vụ trong hợp đồng của bạn sẽ hiển thị ở đây
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dịch vụ của tôi</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item, idx) => item._id || String(idx)}
          renderItem={renderItem}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={
            services.length === 0 ? styles.flatListEmpty : styles.flatListContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchServices(true)}
              colors={['#F59E0B']}
              tintColor="#F59E0B"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

// ── styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeContainer:    { flex: 1, backgroundColor: '#F9FAFB' },
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
  headerTitle:      { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText:      { fontSize: 14, color: '#6B7280' },
  flatListContent:  { padding: 16 },
  flatListEmpty:    { flex: 1 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  cardBody:    { flex: 1 },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle:   { fontSize: 15, fontWeight: '700', color: '#1F2937', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText:  { fontSize: 11, fontWeight: '600' },
  typeRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  typeText:    { fontSize: 12, color: '#9CA3AF' },
  description: { fontSize: 13, color: '#6B7280', marginBottom: 6, lineHeight: 18 },
  dateRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },
  dateItem:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dateText:    { fontSize: 12, color: '#6B7280' },
  priceRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  priceText:   { fontSize: 14, fontWeight: '700', color: '#F59E0B' },
  priceUnit:   { fontSize: 12, fontWeight: '400', color: '#9CA3AF' },
  emptyState:  { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 80 },
  emptyTitle:  { fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center', lineHeight: 20 },
});
