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
import {
  getAllServicesForTenantAPI,
  bookServiceAPI,
  cancelBookedServiceAPI,
} from '../../services/service.service';

// ── helpers ──────────────────────────────────────────────────────────
const formatCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return '–';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
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

// ── main component ──────────────────────────────────────────────────
export default function ServiceListScreen({ navigation }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actioningId, setActioningId] = useState(null); // serviceId being booked/cancelled

  const fetchServices = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await getAllServicesForTenantAPI();
      setServices(res.data || []);
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { fetchServices(); }, [fetchServices])
  );

  // ── book ───────────────────────────────────────────────────────────
  const handleBook = (item) => {
    Alert.alert(
      'Đăng ký dịch vụ',
      `Bạn có chắc muốn đăng ký dịch vụ "${item.name}"?\nGiá: ${formatCurrency(item.currentPrice ?? item.price)} / ${item.unit || 'tháng'}`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng ký',
          onPress: async () => {
            setActioningId(item._id);
            try {
              await bookServiceAPI(item._id);
              Alert.alert('Thành công', 'Đăng ký dịch vụ thành công!');
              fetchServices(true);
            } catch (err) {
              Alert.alert('Lỗi', err.message || 'Không thể đăng ký dịch vụ');
            } finally {
              setActioningId(null);
            }
          },
        },
      ]
    );
  };

  // ── cancel ─────────────────────────────────────────────────────────
  const handleCancel = (item) => {
    Alert.alert(
      'Hủy dịch vụ',
      `Bạn có chắc muốn hủy dịch vụ "${item.name}"?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy dịch vụ',
          style: 'destructive',
          onPress: async () => {
            setActioningId(item._id);
            try {
              await cancelBookedServiceAPI(item._id);
              Alert.alert('Thành công', 'Đã hủy dịch vụ.');
              fetchServices(true);
            } catch (err) {
              Alert.alert('Lỗi', err.message || 'Không thể hủy dịch vụ');
            } finally {
              setActioningId(null);
            }
          },
        },
      ]
    );
  };

  // ── render one card ────────────────────────────────────────────────
  const renderItem = ({ item }) => {
    // serviceCategory: 'Fixed' = hợp đồng cố định | 'Extension' = mở rộng
    const isFixed = item.serviceCategory === 'Fixed' || item.isFixed === true;
    const isBooked = item.isBooked === true;
    const isActioning = actioningId === item._id;
    const icon = getTypeIcon(item.type || item.serviceType);
    const price = item.currentPrice ?? item.price;
    const unit = item.unit || 'tháng';

    return (
      <View style={styles.card}>
        {/* Icon */}
        <View style={[styles.iconWrapper, { backgroundColor: isFixed ? '#EDE9FE' : '#FEF3C7' }]}>
          <MaterialCommunityIcons
            name={icon}
            size={26}
            color={isFixed ? '#7C3AED' : '#F59E0B'}
          />
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name || item.serviceName || 'Dịch vụ'}</Text>
            {/* Category badge */}
            <View style={[styles.catBadge, isFixed ? styles.catFixed : styles.catExtension]}>
              <Text style={[styles.catText, { color: isFixed ? '#7C3AED' : '#D97706' }]}>
                {isFixed ? 'Cố định' : 'Mở rộng'}
              </Text>
            </View>
          </View>

          {/* Type */}
          <View style={styles.typeRow}>
            <MaterialCommunityIcons name="tag-outline" size={13} color="#9CA3AF" />
            <Text style={styles.typeText}>{item.type || item.serviceType || '–'}</Text>
          </View>

          {/* Description */}
          {!!(item.description) && (
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          )}

          {/* Price */}
          <Text style={[styles.price, { color: isFixed ? '#7C3AED' : '#F59E0B' }]}>
            {formatCurrency(price)}{' '}
            <Text style={styles.unit}>/ {unit}</Text>
          </Text>

          {/* Action buttons – only for Extension */}
          {!isFixed && (
            <View style={styles.actionRow}>
              {isBooked ? (
                <TouchableOpacity
                  style={[styles.cancelBtn, isActioning && styles.btnDisabled]}
                  onPress={() => handleCancel(item)}
                  disabled={isActioning}
                >
                  {isActioning ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="close-circle-outline" size={15} color="#EF4444" />
                      <Text style={styles.cancelBtnText}>Hủy đăng ký</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.bookBtn, isActioning && styles.btnDisabled]}
                  onPress={() => handleBook(item)}
                  disabled={isActioning}
                >
                  {isActioning ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="plus-circle-outline" size={15} color="#FFFFFF" />
                      <Text style={styles.bookBtnText}>Đăng ký</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Booked status pill */}
              {isBooked && (
                <View style={styles.bookedPill}>
                  <MaterialCommunityIcons name="check-circle" size={13} color="#10B981" />
                  <Text style={styles.bookedPillText}>Đã đăng ký</Text>
                </View>
              )}
            </View>
          )}

          {/* Fixed: show "Có trong hợp đồng" note */}
          {isFixed && (
            <View style={styles.fixedNote}>
              <MaterialCommunityIcons name="shield-check-outline" size={13} color="#7C3AED" />
              <Text style={styles.fixedNoteText}>Có trong hợp đồng</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ── section separator ──────────────────────────────────────────────
  const fixedServices = services.filter(
    (s) => s.serviceCategory === 'Fixed' || s.isFixed === true
  );
  const extServices = services.filter(
    (s) => s.serviceCategory !== 'Fixed' && s.isFixed !== true
  );

  const sections = [
    ...(fixedServices.length > 0
      ? [{ _id: '__header_fixed', _isHeader: true, title: 'Dịch vụ cố định', icon: 'shield-check', color: '#7C3AED' }]
      : []),
    ...fixedServices,
    ...(extServices.length > 0
      ? [{ _id: '__header_ext', _isHeader: true, title: 'Dịch vụ mở rộng', icon: 'plus-box-multiple', color: '#F59E0B' }]
      : []),
    ...extServices,
  ];

  const renderRow = ({ item }) => {
    if (item._isHeader) {
      return (
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name={item.icon} size={16} color={item.color} />
          <Text style={[styles.sectionHeaderText, { color: item.color }]}>{item.title}</Text>
        </View>
      );
    }
    return renderItem({ item });
  };

  const ListEmpty = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="room-service-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Chưa có dịch vụ</Text>
      <Text style={styles.emptySubtitle}>Danh sách dịch vụ sẽ hiển thị ở đây</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dịch vụ</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item, idx) => item._id || String(idx)}
          renderItem={renderRow}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={
            sections.length === 0 ? styles.flatListEmpty : styles.flatListContent
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

// ── styles ──────────────────────────────────────────────────────────
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#6B7280' },
  flatListContent: { padding: 16 },
  flatListEmpty: { flex: 1 },

  // section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionHeaderText: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  // card
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
  cardBody: { flex: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', flex: 1, marginRight: 8 },

  // category badge
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  catFixed: { backgroundColor: '#EDE9FE' },
  catExtension: { backgroundColor: '#FEF3C7' },
  catText: { fontSize: 11, fontWeight: '600' },

  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  typeText: { fontSize: 12, color: '#9CA3AF' },
  description: { fontSize: 13, color: '#6B7280', marginBottom: 6, lineHeight: 18 },
  price: { fontSize: 14, fontWeight: '700', marginTop: 2, marginBottom: 8 },
  unit: { fontSize: 12, fontWeight: '400', color: '#9CA3AF' },

  // action
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  bookBtnText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: '#EF4444' },
  btnDisabled: { opacity: 0.5 },

  bookedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  bookedPillText: { fontSize: 12, fontWeight: '600', color: '#10B981' },

  fixedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fixedNoteText: { fontSize: 12, color: '#7C3AED', fontWeight: '500' },

  // empty
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center', lineHeight: 20 },
});
