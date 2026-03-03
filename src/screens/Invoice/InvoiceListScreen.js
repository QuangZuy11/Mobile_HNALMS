import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTenantInvoicesAPI } from '../../services/invoice.service';

const STATUS_CONFIG = {
  Unpaid: { label: 'Chưa thanh toán', color: '#DC2626', bg: '#FEE2E2', icon: 'clock-outline' },
  Paid: { label: 'Đã thanh toán', color: '#10B981', bg: '#D1FAE5', icon: 'check-circle-outline' },
  Overdue: { label: 'Quá hạn', color: '#F59E0B', bg: '#FEF3C7', icon: 'alert-circle-outline' },
  Cancelled: { label: 'Đã huỷ', color: '#6B7280', bg: '#F3F4F6', icon: 'cancel' },
};

const TYPE_LABEL = {
  Periodic: 'Định kỳ',
  Service: 'Dịch vụ',
  Other: 'Khác',
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

export default function InvoiceListScreen({ navigation }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  useEffect(() => {
    const loadUser = async () => {
      const raw = await AsyncStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw);
        setTenantId(user._id);
      } else {
        setError('Không tìm thấy thông tin người dùng');
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const fetchInvoices = useCallback(async (page = 1, append = false) => {
    if (!tenantId) return;
    try {
      setError(null);
      const res = await getTenantInvoicesAPI(tenantId, page, 10);
      const data = res?.data || [];
      setInvoices((prev) => (append ? [...prev, ...data] : data));
      setPagination({
        page: res?.pagination?.page || 1,
        totalPages: res?.pagination?.totalPages || 1,
      });
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) fetchInvoices(1);
  }, [tenantId, fetchInvoices]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoices(1);
  };

  const onLoadMore = () => {
    if (loadingMore || pagination.page >= pagination.totalPages) return;
    setLoadingMore(true);
    fetchInvoices(pagination.page + 1, true);
  };

  const renderStatusBadge = (status) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Unpaid;
    return (
      <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
        <MaterialCommunityIcons name={cfg.icon} size={12} color={cfg.color} />
        <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.Unpaid;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item._id })}
      >
        {/* Top row */}
        <View style={styles.cardTop}>
          <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
            <MaterialCommunityIcons name="receipt" size={24} color={cfg.color} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.invoiceCode}>{item.invoiceCode}</Text>
            <Text style={styles.invoiceTitle} numberOfLines={1}>{item.title}</Text>
          </View>
          {renderStatusBadge(item.status)}
        </View>

        <View style={styles.divider} />

        {/* Details row */}
        <View style={styles.cardBottom}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="home-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{item.roomId?.name || '—'}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="tag-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{TYPE_LABEL[item.type] || item.type}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="calendar-clock" size={14} color="#6B7280" />
            <Text style={styles.detailText}>Hạn: {formatDate(item.dueDate)}</Text>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Tổng tiền</Text>
          <Text style={[styles.amountValue, { color: cfg.color }]}>
            {formatCurrency(item.totalAmount)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hóa đơn</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchInvoices(1)}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={invoices.length === 0 ? styles.emptyWrapper : styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="receipt-outline" size={72} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Chưa có hóa đơn</Text>
              <Text style={styles.emptySubtext}>Hóa đơn của bạn sẽ xuất hiện ở đây</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#F3F4F6' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },

  // States
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  loadingText: { marginTop: 12, fontSize: 15, color: '#6B7280' },
  errorText: { marginTop: 12, fontSize: 15, color: '#DC2626', textAlign: 'center' },
  retryBtn: { marginTop: 20, backgroundColor: '#3B82F6', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 8 },
  retryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  // List
  listContent: { padding: 12 },
  emptyWrapper: { flexGrow: 1 },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardInfo: { flex: 1, marginRight: 8 },
  invoiceCode: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  invoiceTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },

  // Details
  cardBottom: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 12, color: '#6B7280' },

  // Amount
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  amountLabel: { fontSize: 13, color: '#6B7280' },
  amountValue: { fontSize: 16, fontWeight: '700' },

  // Footer loader
  footerLoader: { paddingVertical: 16, alignItems: 'center' },

  // Empty
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 16 },
  emptySubtext: { fontSize: 13, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },
});

