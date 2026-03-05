import React, { useState, useCallback, useMemo } from 'react';
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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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

const isFixedService = (s) => s.type === 'Fixed';
const isWashingMachine = (item) =>
  item?.type === 'Giặt ủi' || /máy\s*giặt/i.test(item?.name || '');

const TABS = [
  { key: 'fixed',     label: 'Cố định',  icon: 'shield-check',      color: '#2563EB' },
  { key: 'extension', label: 'Mở rộng',  icon: 'plus-box-multiple', color: '#F59E0B' },
];

// ── main component ──────────────────────────────────────────────────
export default function ServiceListScreen({ navigation }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actioningId, setActioningId] = useState(null);
  const [activeTab, setActiveTab] = useState('fixed');
  const [bookModal, setBookModal] = useState({ visible: false, item: null });
  const [quantity, setQuantity] = useState('1');

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

  // ── filtered data ──────────────────────────────────────────────────
  const fixedServices = useMemo(
    () => services.filter((s) => isFixedService(s)),
    [services]
  );
  const extServices = useMemo(
    () => services.filter((s) => !isFixedService(s)),
    [services]
  );
  const displayedServices = activeTab === 'fixed' ? fixedServices : extServices;

  // ── book ───────────────────────────────────────────────────────────
  const openBookModal = (item) => {
    setQuantity('1');
    setBookModal({ visible: true, item });
  };

  const closeBookModal = () => {
    setBookModal({ visible: false, item: null });
  };

  const confirmBook = async () => {
    const item = bookModal.item;
    if (!item) return;

    const qty = isWashingMachine(item) ? 1 : parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      Alert.alert('Lỗi', 'Số lượng người phải là số nguyên >= 1');
      return;
    }

    closeBookModal();
    setActioningId(item._id);
    try {
      await bookServiceAPI(item._id, qty);
      Alert.alert('Thành công', 'Đăng ký dịch vụ thành công!');
      fetchServices(true);
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể đăng ký dịch vụ');
    } finally {
      setActioningId(null);
    }
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

  // ── render fixed service card (display only) ──────────────────────
  const renderFixedCard = ({ item }) => {
    const icon = getTypeIcon(item.type || item.serviceType);
    const price = item.currentPrice ?? item.price;
    const unit = item.unit || 'tháng';

    return (
      <View style={[styles.card, styles.cardFixedBorder]}>
        <View style={[styles.iconWrapper, { backgroundColor: '#DBEAFE' }]}>
          <MaterialCommunityIcons name={icon} size={26} color="#2563EB" />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name || item.serviceName || 'Dịch vụ'}
          </Text>

          <View style={styles.typeRow}>
            <MaterialCommunityIcons name="tag-outline" size={13} color="#9CA3AF" />
            <Text style={styles.typeText}>{item.type || item.serviceType || '–'}</Text>
          </View>

          {!!item.description && (
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          )}

          <Text style={[styles.price, { color: '#2563EB' }]}>
            {formatCurrency(price)}{' '}
            <Text style={styles.unit}>/ {unit}</Text>
          </Text>

          <View style={styles.fixedNote}>
            <MaterialCommunityIcons name="shield-check-outline" size={14} color="#2563EB" />
            <Text style={styles.fixedNoteText}>Có trong hợp đồng</Text>
          </View>
        </View>
      </View>
    );
  };

  // ── render extension service card (with book/cancel) ──────────────
  const renderExtensionCard = ({ item }) => {
    const isBooked = item.isBooked === true;
    const canBook = item.canBook === true;
    const canCancel = item.canCancel === true;
    const isActioning = actioningId === item._id;
    const icon = getTypeIcon(item.type || item.serviceType);
    const price = item.currentPrice ?? item.price;
    const unit = item.unit || 'tháng';

    return (
      <View style={[styles.card, styles.cardExtBorder]}>
        <View style={[styles.iconWrapper, { backgroundColor: '#FEF3C7' }]}>
          <MaterialCommunityIcons name={icon} size={26} color="#F59E0B" />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.name || item.serviceName || 'Dịch vụ'}
            </Text>
            {isBooked && (
              <View style={styles.bookedPill}>
                <MaterialCommunityIcons name="check-circle" size={13} color="#10B981" />
                <Text style={styles.bookedPillText}>Đã đăng ký</Text>
              </View>
            )}
          </View>

          <View style={styles.typeRow}>
            <MaterialCommunityIcons name="tag-outline" size={13} color="#9CA3AF" />
            <Text style={styles.typeText}>{item.type || item.serviceType || '–'}</Text>
          </View>

          {!!item.description && (
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          )}

          <Text style={[styles.price, { color: '#F59E0B' }]}>
            {formatCurrency(price)}{' '}
            <Text style={styles.unit}>/ {unit}</Text>
          </Text>

          {/* Quantity info */}
          {isBooked && item.bookedQuantity != null && (
            <View style={styles.quantityInfo}>
              <MaterialCommunityIcons name="account-group" size={14} color="#6B7280" />
              <Text style={styles.quantityInfoText}>
                Số người đăng ký: <Text style={styles.quantityInfoBold}>{item.bookedQuantity}</Text>
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            {canCancel ? (
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
            ) : canBook ? (
              <TouchableOpacity
                style={[styles.bookBtn, isActioning && styles.btnDisabled]}
                onPress={() => openBookModal(item)}
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
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  // ── choose renderer by tab ────────────────────────────────────────
  const renderItem = activeTab === 'fixed' ? renderFixedCard : renderExtensionCard;

  const ListEmpty = () => {
    const isFixed = activeTab === 'fixed';
    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons
          name={isFixed ? 'shield-check-outline' : 'room-service-outline'}
          size={64}
          color="#D1D5DB"
        />
        <Text style={styles.emptyTitle}>
          {isFixed ? 'Không có dịch vụ cố định' : 'Không có dịch vụ mở rộng'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {isFixed
            ? 'Các dịch vụ cố định trong hợp đồng sẽ hiển thị ở đây'
            : 'Các dịch vụ mở rộng có thể đăng ký sẽ hiển thị ở đây'}
        </Text>
      </View>
    );
  };

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

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = tab.key === 'fixed' ? fixedServices.length : extServices.length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && { borderBottomColor: tab.color }]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={16}
                color={isActive ? tab.color : '#9CA3AF'}
              />
              <Text style={[styles.tabLabel, isActive && { color: tab.color, fontWeight: '700' }]}>
                {tab.label}
              </Text>
              <View style={[styles.tabBadge, { backgroundColor: isActive ? tab.color : '#E5E7EB' }]}>
                <Text style={[styles.tabBadgeText, { color: isActive ? '#FFFFFF' : '#6B7280' }]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedServices}
          keyExtractor={(item, idx) => item._id || String(idx)}
          renderItem={renderItem}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={
            displayedServices.length === 0 ? styles.flatListEmpty : styles.flatListContent
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
      {/* ── Book Quantity Modal ─────────────────────────────────── */}
      <Modal
        visible={bookModal.visible}
        transparent
        animationType="fade"
        onRequestClose={closeBookModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            {/* Title */}
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="plus-circle" size={24} color="#F59E0B" />
              <Text style={styles.modalTitle}>Đăng ký dịch vụ</Text>
            </View>

            {/* Service info */}
            {bookModal.item && (
              <View style={styles.modalServiceInfo}>
                <Text style={styles.modalServiceName}>{bookModal.item.name}</Text>
                <Text style={styles.modalServicePrice}>
                  {formatCurrency(bookModal.item.currentPrice ?? bookModal.item.price)}
                  <Text style={styles.modalServiceUnit}> / {bookModal.item.unit || 'tháng'}</Text>
                </Text>
              </View>
            )}

            {/* Quantity input – ẩn với dịch vụ máy giặt */}
            {!isWashingMachine(bookModal.item) && (
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Số lượng người</Text>
                <View style={styles.quantityRow}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => {
                      const val = Math.max(1, (parseInt(quantity, 10) || 1) - 1);
                      setQuantity(String(val));
                    }}
                  >
                    <MaterialCommunityIcons name="minus" size={20} color="#6B7280" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.qtyInput}
                    value={quantity}
                    onChangeText={(t) => setQuantity(t.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    maxLength={3}
                    selectTextOnFocus
                  />
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => {
                      const val = (parseInt(quantity, 10) || 0) + 1;
                      setQuantity(String(val));
                    }}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={closeBookModal}>
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmBook}>
                <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                <Text style={styles.modalConfirmText}>Đăng ký</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

  // tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 14, fontWeight: '500', color: '#9CA3AF' },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: { fontSize: 11, fontWeight: '700' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#6B7280' },
  flatListContent: { padding: 16 },
  flatListEmpty: { flex: 1 },

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
  cardFixedBorder: { borderLeftWidth: 3, borderLeftColor: '#2563EB' },
  cardExtBorder:   { borderLeftWidth: 3, borderLeftColor: '#F59E0B' },
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
    gap: 5,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  fixedNoteText: { fontSize: 12, color: '#2563EB', fontWeight: '600' },

  quantityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  quantityInfoText: { fontSize: 12, color: '#6B7280' },
  quantityInfoBold: { fontWeight: '700', color: '#1F2937' },

  // modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  modalServiceInfo: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  modalServiceName: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  modalServicePrice: { fontSize: 14, fontWeight: '700', color: '#F59E0B' },
  modalServiceUnit: { fontSize: 12, fontWeight: '400', color: '#9CA3AF' },
  modalInputGroup: { marginBottom: 20 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyInput: {
    flex: 1,
    height: 44,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginHorizontal: 10,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  modalConfirmBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  // empty
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center', lineHeight: 20 },
});
