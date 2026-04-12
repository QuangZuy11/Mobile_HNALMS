import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';

LocaleConfig.locales['vi'] = {
  monthNames: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
  monthNamesShort: ['Th.1', 'Th.2', 'Th.3', 'Th.4', 'Th.5', 'Th.6', 'Th.7', 'Th.8', 'Th.9', 'Th.10', 'Th.11', 'Th.12'],
  dayNames: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'],
  dayNamesShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
};
LocaleConfig.defaultLocale = 'vi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTenantInvoicesAPI } from '../../services/invoice.service';

const PAGE_SIZE = 5;

const STATUS_CONFIG = {
  Unpaid: { label: 'Chưa thanh toán', color: '#DC2626', bg: '#FEE2E2', icon: 'clock-alert-outline' },
  Paid: { label: 'Đã thanh toán', color: '#10B981', bg: '#D1FAE5', icon: 'check-circle-outline' },
  Overdue: { label: 'Quá hạn', color: '#F59E0B', bg: '#FEF3C7', icon: 'alert-circle-outline' },
  Cancelled: { label: 'Đã huỷ', color: '#6B7280', bg: '#F3F4F6', icon: 'cancel' },
};

const TYPE_LABEL = {
  Periodic: 'Định kỳ',
  Incurred: 'Phát sinh',
  Other: 'Khác',
};

const STATUS_OPTIONS = [
  { key: 'all', label: 'Tất cả trạng thái' },
  { key: 'Unpaid', label: 'Chưa thanh toán' },
  { key: 'Paid', label: 'Đã thanh toán' },
];

const TYPE_OPTIONS = [
  { key: 'all', label: 'Tất cả loại' },
  { key: 'Periodic', label: 'Định kỳ' },
  { key: 'Incurred', label: 'Phát sinh' },
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount ?? 0);

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

// Lấy phần ngày YYYY-MM-DD từ ISO string
const toDateKey = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString).toISOString().slice(0, 10);
};

function StatCard({ icon, label, count, active, onPress, color }) {
  return (
    <TouchableOpacity
      style={[styles.statCard, active && { borderColor: color, borderWidth: 2 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      {count !== undefined && <Text style={[styles.statCount, { color }]}>{count}</Text>}
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function DatePickerModal({ visible, title, selected, onSelect, onClose }) {
  const today = new Date().toISOString().slice(0, 10);
  const markedDates = selected ? { [selected]: { selected: true, selectedColor: '#3B82F6' } } : {};

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.dateModalOverlay}>
        <View style={styles.dateModalBox}>
          {/* Header */}
          <View style={styles.dateModalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Calendar
            current={selected || today}
            markedDates={markedDates}
            onDayPress={(day) => { onSelect(day.dateString); onClose(); }}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              selectedDayBackgroundColor: '#3B82F6',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#3B82F6',
              dayTextColor: '#1F2937',
              textDisabledColor: '#D1D5DB',
              arrowColor: '#3B82F6',
              monthTextColor: '#1F2937',
              textDayFontSize: 14,
              textMonthFontSize: 15,
              textDayHeaderFontSize: 12,
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
            }}
          />

          {/* Nút xóa lọc */}
          {selected && (
            <TouchableOpacity
              style={styles.dateModalClear}
              onPress={() => { onSelect(null); onClose(); }}
            >
              <MaterialCommunityIcons name="close-circle-outline" size={16} color="#DC2626" />
              <Text style={styles.dateModalClearText}>Xóa lọc ngày này</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const ListHeader = React.memo(({
  stats, typeFilter, searchText,
  onSetTypeFilter, onSetSearchText,
  showFilters, onToggleShowFilters, activeFilterCount,
  statusFilter, sentDate, dueDate,
  onSetStatusFilter, onSetSentDate, onSetDueDate,
  onClearSearch,
  onToggleTypeModal, onToggleStatusModal,
  onToggleSentModal, onToggleDueModal,
  resetFilters, onNavigatePrepaid
}) => {
  return (
    <View style={styles.listHeaderContainer}>
      <View style={styles.statsRow}>
        <StatCard icon="receipt-text-outline" label="Tổng hóa đơn" count={stats.all}
          active={typeFilter === 'all'} color="#3B82F6" onPress={() => onSetTypeFilter('all')} />
        <StatCard icon="calendar-sync-outline" label="Định kỳ" count={stats.Periodic}
          active={typeFilter === 'Periodic'} color="#F59E0B" onPress={() => onSetTypeFilter('Periodic')} />
        <StatCard icon="sim-alert-outline" label="Phát sinh" count={stats.Incurred}
          active={typeFilter === 'Incurred'} color="#c52222" onPress={() => onSetTypeFilter('Incurred')} />
        <StatCard icon="wallet-outline" label="Trả trước"
          color="#7C3AED" onPress={onNavigatePrepaid} />
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tiêu đề, mã hóa đơn..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={onSetSearchText}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            blurOnSubmit={false}
          />
          {!!searchText && (
            <TouchableOpacity onPress={onClearSearch}>
              <MaterialCommunityIcons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterToggleBtn, activeFilterCount > 0 && styles.filterToggleBtnActive]}
          onPress={onToggleShowFilters}
        >
          <MaterialCommunityIcons name="tune-variant" size={20}
            color={activeFilterCount > 0 ? '#3B82F6' : '#6B7280'} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filterPanel}>
          <View style={styles.filterRow}>
            <Text style={styles.filterRowLabel}>Loại</Text>
            <TouchableOpacity style={styles.filterSelect} onPress={onToggleTypeModal}>
              <Text style={[styles.filterSelectText, typeFilter !== 'all' && { color: '#3B82F6' }]}>
                {TYPE_OPTIONS.find((o) => o.key === typeFilter)?.label}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterRowLabel}>Trạng thái</Text>
            <TouchableOpacity style={styles.filterSelect} onPress={onToggleStatusModal}>
              <Text style={[styles.filterSelectText, statusFilter !== 'all' && { color: '#3B82F6' }]}>
                {STATUS_OPTIONS.find((o) => o.key === statusFilter)?.label}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterRowLabel}>Ngày gửi</Text>
            <TouchableOpacity style={styles.filterSelect} onPress={onToggleSentModal}>
              <MaterialCommunityIcons name="calendar-range" size={14} color={sentDate ? '#3B82F6' : '#6B7280'} />
              <Text style={[styles.filterSelectText, sentDate && { color: '#3B82F6' }]}>
                {sentDate ? new Date(sentDate).toLocaleDateString('vi-VN') : 'Chọn ngày'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterRowLabel}>Ngày đến hạn</Text>
            <TouchableOpacity style={styles.filterSelect} onPress={onToggleDueModal}>
              <MaterialCommunityIcons name="calendar-range" size={14} color={dueDate ? '#3B82F6' : '#6B7280'} />
              <Text style={[styles.filterSelectText, dueDate && { color: '#3B82F6' }]}>
                {dueDate ? new Date(dueDate).toLocaleDateString('vi-VN') : 'Chọn ngày'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {activeFilterCount > 0 && (
            <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
              <MaterialCommunityIcons name="refresh" size={14} color="#DC2626" />
              <Text style={styles.resetBtnText}>Xóa bộ lọc</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
});

export default function InvoiceListScreen({ navigation, route }) {
  const [allInvoices, setAllInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const lastRefreshRef = useRef(null);

  const [typeFilter, setTypeFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sentDate, setSentDate] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showSentModal, setShowSentModal] = useState(false);
  const [showDueModal, setShowDueModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    AsyncStorage.getItem('user').then((raw) => {
      if (raw) setTenantId(JSON.parse(raw)._id);
      else { setError('Không tìm thấy thông tin người dùng'); setLoading(false); }
    });
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const res = await getTenantInvoicesAPI(tenantId, 1, 200);
      setAllInvoices(res?.data?.data || res?.data || []);
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId]);

  useEffect(() => { if (tenantId) fetchAll(); }, [tenantId]);

  // Reload khi navigate từ PayInvoice về với refresh param
  useEffect(() => {
    const refreshParam = route.params?.refresh;
    if (refreshParam && refreshParam !== lastRefreshRef.current && tenantId) {
      lastRefreshRef.current = refreshParam;
      setRefreshing(true);
      fetchAll();
    }
  }, [route.params?.refresh, tenantId, fetchAll]);

  // Auto-refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (tenantId && !lastRefreshRef.current) {
        fetchAll();
      }
      lastRefreshRef.current = null;
    });
    return unsubscribe;
  }, [navigation, tenantId, fetchAll]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchAll(); }, [fetchAll]);

  const handleSetSearchText = useCallback((text) => setSearchText(text), []);
  const handleSetTypeFilter = useCallback((val) => setTypeFilter(val), []);
  const handleSetShowFilters = useCallback(() => setShowFilters(prev => !prev), []);
  const handleSetStatusFilter = useCallback((val) => { setStatusFilter(val); setShowStatusModal(false); }, []);
  const handleSetSentDate = useCallback((val) => { setSentDate(val); setShowSentModal(false); }, []);
  const handleSetDueDate = useCallback((val) => { setDueDate(val); setShowDueModal(false); }, []);
  const handleClearSearch = useCallback(() => setSearchText(''), []);
  const handleToggleTypeModal = useCallback(() => setShowTypeModal(true), []);
  const handleToggleStatusModal = useCallback(() => setShowStatusModal(true), []);
  const handleToggleSentModal = useCallback(() => setShowSentModal(true), []);
  const handleToggleDueModal = useCallback(() => setShowDueModal(true), []);

  const handleNavigatePrepaid = useCallback(() => {
    navigation.navigate('PrepaidRent');
  }, [navigation]);

  const stats = useMemo(() => ({
    all: allInvoices.length,
    Periodic: allInvoices.filter((i) => i.invoiceType === 'Periodic').length,
    Incurred: allInvoices.filter((i) => i.invoiceType === 'Incurred').length,
  }), [allInvoices]);

  const filtered = useMemo(() => {
    let list = allInvoices;
    if (typeFilter !== 'all') list = list.filter((i) => i.invoiceType === typeFilter);
    if (searchText.trim()) list = list.filter((i) =>
      i.title?.toLowerCase().includes(searchText.toLowerCase()) ||
      i.invoiceCode?.toLowerCase().includes(searchText.toLowerCase()));
    if (statusFilter !== 'all') {
      list = list.filter((i) => {
        // Chuẩn hóa status từ API về PascalCase để so sánh
        const rawStatus = i.status || i.paymentStatus || '';
        const normalizedStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
        return normalizedStatus === statusFilter;
      });
    }
    if (sentDate) list = list.filter((i) => toDateKey(i.createdAt) === sentDate);
    if (dueDate) list = list.filter((i) => toDateKey(i.dueDate) === dueDate);
    return list;
  }, [allInvoices, typeFilter, searchText, statusFilter, sentDate, dueDate]);

  useEffect(() => { setCurrentPage(1); }, [typeFilter, searchText, statusFilter, sentDate, dueDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const activeFilterCount = [typeFilter !== 'all', statusFilter !== 'all', !!sentDate, !!dueDate].filter(Boolean).length;

  const resetFilters = useCallback(() => {
    setTypeFilter('all'); setStatusFilter('all'); setSentDate(null); setDueDate(null); setSearchText('');
  }, []);

  const renderItem = ({ item }) => {
    // Hỗ trợ cả status và paymentStatus, chuẩn hóa thành PascalCase
    const rawStatus = item.status || item.paymentStatus || 'Unpaid';
    const normalizedStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
    const cfg = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.Unpaid;

    // Xác định tên phòng: Periodic lấy từ roomId.name / contractId.roomId.name,
    // Incurred lấy từ roomName (string)
    const roomName =
      item.invoiceType === 'Incurred'
        ? item.roomName
        : item.roomId?.name ?? item.contractId?.roomId?.name ?? null;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item._id, invoiceType: item.invoiceType })}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBox, { backgroundColor: cfg.bg }]}>
            <MaterialCommunityIcons name="receipt" size={22} color={cfg.color} />
          </View>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.cardCode}>{item.invoiceCode}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <MaterialCommunityIcons name={cfg.icon} size={11} color={cfg.color} />
            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="calendar-plus" size={13} color="#6B7280" />
            <Text style={styles.metaLabel}>
              {item.invoiceCode?.toUpperCase().startsWith('HD-PREPAID') ? 'Ngày thanh toán' : 'Ngày gửi'}
            </Text>
            <Text style={styles.metaValue}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.metaSep} />
          {!item.invoiceCode?.toUpperCase().startsWith('HD-PREPAID') && (
            <>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="calendar-clock" size={13} color="#6B7280" />
                <Text style={styles.metaLabel}>Đến hạn</Text>
                <Text style={[styles.metaValue, item.status === 'Overdue' && { color: '#F59E0B' }]}>
                  {formatDate(item.dueDate)}
                </Text>
              </View>
              <View style={styles.metaSep} />
            </>
          )}
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="tag-outline" size={13} color="#6B7280" />
            <Text style={styles.metaLabel}>Loại</Text>
            <Text style={styles.metaValue}>{TYPE_LABEL[item.invoiceType] || item.invoiceType}</Text>
          </View>
          <View style={styles.metaSep} />
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="home-outline" size={13} color="#6B7280" />
            <Text style={styles.metaLabel}>Phòng</Text>
            <Text style={styles.metaValue} numberOfLines={1}>{roomName || '—'}</Text>
          </View>
        </View>

        <View style={[styles.amountRow, { borderTopColor: cfg.bg }]}>
          <Text style={styles.amountLabel}>Tổng tiền</Text>
          <Text style={[styles.amountValue, { color: cfg.color }]}>
            {formatCurrency(item.totalAmount)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <View style={styles.paginationBar}>
        <TouchableOpacity
          style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
          onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          <MaterialCommunityIcons name="chevron-left" size={20} color={currentPage === 1 ? '#D1D5DB' : '#3B82F6'} />
        </TouchableOpacity>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.pageNum, p === currentPage && styles.pageNumActive]}
            onPress={() => setCurrentPage(p)}
          >
            <Text style={[styles.pageNumText, p === currentPage && styles.pageNumTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
          onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          <MaterialCommunityIcons name="chevron-right" size={20} color={currentPage === totalPages ? '#D1D5DB' : '#3B82F6'} />
        </TouchableOpacity>
        <Text style={styles.pageInfo}>{filtered.length} hóa đơn</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hóa đơn</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchAll}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={pageData}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            ListHeaderComponent={
              <ListHeader
                stats={stats}
                typeFilter={typeFilter}
                searchText={searchText}
                onSetTypeFilter={handleSetTypeFilter}
                onSetSearchText={handleSetSearchText}
                showFilters={showFilters}
                onToggleShowFilters={handleSetShowFilters}
                activeFilterCount={activeFilterCount}
                statusFilter={statusFilter}
                sentDate={sentDate}
                dueDate={dueDate}
                onSetStatusFilter={handleSetStatusFilter}
                onSetSentDate={handleSetSentDate}
                onSetDueDate={handleSetDueDate}
                onClearSearch={handleClearSearch}
                onToggleTypeModal={handleToggleTypeModal}
                onToggleStatusModal={handleToggleStatusModal}
                onToggleSentModal={handleToggleSentModal}
                onToggleDueModal={handleToggleDueModal}
                resetFilters={resetFilters}
                onNavigatePrepaid={handleNavigatePrepaid}
              />
            }
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="receipt-outline" size={72} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>Không có hóa đơn</Text>
                <Text style={styles.emptySubtext}>Không tìm thấy hóa đơn phù hợp với bộ lọc</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
          {renderPagination()}
        </>
      )}

      <Modal visible={showStatusModal} transparent animationType="fade" onRequestClose={() => setShowStatusModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowStatusModal(false)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Lọc theo trạng thái</Text>
            {STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.monthOption, statusFilter === opt.key && styles.monthOptionActive]}
                onPress={() => { setStatusFilter(opt.key); setShowStatusModal(false); }}
              >
                <Text style={[styles.monthOptionText, statusFilter === opt.key && styles.monthOptionTextActive]}>
                  {opt.label}
                </Text>
                {statusFilter === opt.key && <MaterialCommunityIcons name="check" size={16} color="#3B82F6" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showTypeModal} transparent animationType="fade" onRequestClose={() => setShowTypeModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTypeModal(false)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Lọc theo loại</Text>
            {TYPE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.monthOption, typeFilter === opt.key && styles.monthOptionActive]}
                onPress={() => { setTypeFilter(opt.key); setShowTypeModal(false); }}
              >
                <Text style={[styles.monthOptionText, typeFilter === opt.key && styles.monthOptionTextActive]}>
                  {opt.label}
                </Text>
                {typeFilter === opt.key && <MaterialCommunityIcons name="check" size={16} color="#3B82F6" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <DatePickerModal
        visible={showSentModal}
        title="Chọn ngày gửi"
        selected={sentDate}
        onSelect={setSentDate}
        onClose={() => setShowSentModal(false)}
      />

      <DatePickerModal
        visible={showDueModal}
        title="Chọn ngày đến hạn"
        selected={dueDate}
        onSelect={setDueDate}
        onClose={() => setShowDueModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  loadingText: { marginTop: 12, fontSize: 15, color: '#6B7280' },
  errorText: { marginTop: 12, fontSize: 15, color: '#DC2626', textAlign: 'center' },
  retryBtn: { marginTop: 20, backgroundColor: '#3B82F6', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 8 },
  retryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  listContent: { paddingBottom: 12 },
  listHeaderContainer: { backgroundColor: '#F3F4F6' },
  statsRow: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8,
  },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10,
    padding: 8, alignItems: 'center', gap: 3,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, borderWidth: 2, borderColor: 'transparent',
  },
  statIcon: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statCount: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 9, color: '#6B7280', textAlign: 'center' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingBottom: 8,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1F2937', padding: 0 },
  filterToggleBtn: {
    width: 42, height: 42, borderRadius: 10, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
  },
  filterToggleBtnActive: { borderColor: '#93C5FD', backgroundColor: '#EFF6FF' },
  filterBadge: {
    position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center',
  },
  filterBadgeText: { fontSize: 9, color: '#FFF', fontWeight: '700' },
  filterPanel: {
    backgroundColor: '#FFFFFF', marginHorizontal: 12, marginBottom: 8,
    borderRadius: 12, padding: 14, gap: 10,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3,
  },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterRowLabel: { fontSize: 13, color: '#374151', fontWeight: '600', flex: 1 },
  filterSelect: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, flex: 1.8,
  },
  filterSelectText: { flex: 1, fontSize: 13, color: '#6B7280' },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', paddingVertical: 4,
  },
  resetBtnText: { fontSize: 13, color: '#DC2626', fontWeight: '600' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, marginHorizontal: 12,
    marginBottom: 10, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10 },
  cardIconBox: { width: 42, height: 42, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  cardTitleWrap: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937', lineHeight: 20 },
  cardCode: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 14 },
  metaRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10 },
  metaItem: { flex: 1, alignItems: 'center', gap: 3 },
  metaSep: { width: 1, backgroundColor: '#E5E7EB', marginVertical: 2 },
  metaLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  metaValue: { fontSize: 12, fontWeight: '600', color: '#374151' },
  amountRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#FAFAFA',
  },
  amountLabel: { fontSize: 13, color: '#6B7280' },
  amountValue: { fontSize: 16, fontWeight: '800' },
  paginationBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap',
    gap: 6, paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  pageBtn: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  pageBtnDisabled: { opacity: 0.4 },
  pageNum: { minWidth: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, backgroundColor: '#F3F4F6' },
  pageNumActive: { backgroundColor: '#3B82F6' },
  pageNumText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  pageNumTextActive: { color: '#FFFFFF' },
  pageInfo: { fontSize: 12, color: '#9CA3AF', marginLeft: 8 },
  emptyState: { justifyContent: 'center', alignItems: 'center', padding: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 16 },
  emptySubtext: { fontSize: 13, color: '#9CA3AF', marginTop: 6, textAlign: 'center' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  modalBox: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, width: '100%', maxWidth: 340,
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  monthOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  monthOptionActive: {},
  monthOptionText: { fontSize: 14, color: '#374151' },
  monthOptionTextActive: { color: '#3B82F6', fontWeight: '600' },
  // Calendar date picker modal
  dateModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dateModalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 28,
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12, shadowRadius: 10,
  },
  dateModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  dateModalClear: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 16,
    marginTop: 6,
  },
  dateModalClearText: { fontSize: 14, color: '#DC2626', fontWeight: '600' },
});