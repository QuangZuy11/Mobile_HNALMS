import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyNotificationsAPI, checkAndShowNotifications } from '../../services/notification.service';
import NotificationDetailModal from './NotificationDetailScreen';

export default function NotificationListScreen({ navigation }) {
  const PAGE_LIMIT = 20;
  const READ_KEY = 'notification_read_ids';
  const LAST_VIEWED_KEY = 'notification_last_viewed_at';
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, total_count: 0, limit: PAGE_LIMIT });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all | unread | read
  const [readIds, setReadIds] = useState(() => new Set());
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const isFetchingRef = useRef(false);
  const didLoadOnFocusRef = useRef(false);

  const hydrateReadState = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(READ_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr)) setReadIds(new Set(arr));
    } catch {
      setReadIds(new Set());
    }
  }, []);

  const persistReadState = useCallback(async (nextSet) => {
    try {
      await AsyncStorage.setItem(READ_KEY, JSON.stringify(Array.from(nextSet)));
    } catch {
      // ignore
    }
  }, []);

  const loadPage = useCallback(async ({ page, replace } = {}) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      setError(null);
      const res = await getMyNotificationsAPI({ page, limit: PAGE_LIMIT });
      const nextItems = res?.notifications || res?.data?.notifications || [];
      const nextPagination = res?.pagination || res?.data?.pagination;

      if (nextPagination) setPagination((prev) => ({ ...prev, ...nextPagination }));
      setItems((prev) => {
        const merged = replace ? nextItems : [...prev, ...nextItems];
        // Ensure newest first even if backend changes sorting
        return merged.slice().sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
      });
    } catch (e) {
      setError(e?.message || 'Có lỗi xảy ra');
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  const initialLoad = useCallback(async () => {
    setIsLoading(true);
    setItems([]);
    try {
      // Lấy timestamp TRƯỚC KHI fetch để so sánh notification mới
      const lastViewedAt = await AsyncStorage.getItem(LAST_VIEWED_KEY);

      const res = await getMyNotificationsAPI({ page: 1, limit: PAGE_LIMIT });
      const nextItems = res?.notifications || res?.data?.notifications || [];
      const nextPagination = res?.pagination || res?.data?.pagination;

      if (nextPagination) setPagination((prev) => ({ ...prev, ...nextPagination }));
      setItems(nextItems.slice().sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)));

      // Hiện lock screen notification cho notification mới (trước khi cập nhật timestamp)
      await checkAndShowNotifications(nextItems, lastViewedAt);

      // Cập nhật timestamp SAU KHI check để lần sau biết notification nào là mới
      await AsyncStorage.setItem(LAST_VIEWED_KEY, new Date().toISOString());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!didLoadOnFocusRef.current) {
        didLoadOnFocusRef.current = true;
        hydrateReadState();
        initialLoad();
      }
      return () => {
        didLoadOnFocusRef.current = false;
        isFetchingRef.current = false;
      };
    }, [initialLoad, hydrateReadState])
  );

  const onRefresh = useCallback(async () => {
    if (isFetchingRef.current) return;
    setIsRefreshing(true);
    setItems([]);
    try {
      const lastViewedAt = await AsyncStorage.getItem(LAST_VIEWED_KEY);
      const res = await getMyNotificationsAPI({ page: 1, limit: PAGE_LIMIT });
      const nextItems = res?.notifications || res?.data?.notifications || [];
      const nextPagination = res?.pagination || res?.data?.pagination;

      if (nextPagination) setPagination((prev) => ({ ...prev, ...nextPagination }));
      setItems(nextItems.slice().sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)));

      // Hiện lock screen notification cho notification mới
      await checkAndShowNotifications(nextItems, lastViewedAt);

      await AsyncStorage.setItem(LAST_VIEWED_KEY, new Date().toISOString());
    } finally {
      setIsRefreshing(false);
    }
  }, [loadPage, readIds]);

  const onLoadMore = useCallback(async () => {
    if (isLoadingMore) return;
    if (pagination.current_page >= pagination.total_pages) return;
    if (isFetchingRef.current) return;
    setIsLoadingMore(true);
    try {
      await loadPage({ page: pagination.current_page + 1, replace: false });
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, pagination, loadPage]);

  const onPressItem = useCallback(async (item) => {
    const id = item?._id;
    if (id && !readIds.has(id)) {
      const next = new Set(readIds);
      next.add(id);
      setReadIds(next);
      persistReadState(next);
    }
    setSelectedNotification(item);
    setModalVisible(true);
  }, [readIds, persistReadState]);

  const onMarkAllRead = useCallback(async () => {
    const next = new Set(readIds);
    items.forEach((x) => {
      if (x?._id) next.add(x._id);
    });
    setReadIds(next);
    await persistReadState(next);
  }, [items, readIds, persistReadState]);

  const unreadCount = useMemo(() => items.filter((x) => x?._id && !readIds.has(x._id)).length, [items, readIds]);

  const filteredItems = useMemo(() => {
    if (filter === 'unread') return items.filter((x) => x?._id && !readIds.has(x._id));
    if (filter === 'read') return items.filter((x) => x?._id && readIds.has(x._id));
    return items;
  }, [filter, items, readIds]);

  const filterOptions = useMemo(() => ([
    { id: 'all', label: 'Tất cả', icon: 'format-list-bulleted' },
    { id: 'unread', label: 'Chưa đọc', icon: 'email-outline' },
    { id: 'read', label: 'Đã đọc', icon: 'check-circle-outline' },
  ]), []);

  const renderItem = useCallback(({ item }) => {
    const isUnread = item?._id ? !readIds.has(item._id) : false;
    const createdAt = item?.createdAt ? new Date(item.createdAt) : null;
    const timeText = createdAt && !Number.isNaN(createdAt.getTime())
      ? `${createdAt.toLocaleDateString('vi-VN')} ${createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
      : '';

    return (
      <TouchableOpacity style={[styles.requestItem, isUnread && styles.requestItemUnread]} onPress={() => onPressItem(item)}>
        <View style={styles.cardHeader}>
          <View style={styles.requestTypeBadge}>
            <MaterialCommunityIcons name={isUnread ? 'bell-badge-outline' : 'bell-outline'} size={14} color={isUnread ? '#EF4444' : '#6B7280'} />
            <Text style={[styles.requestTypeBadgeText, { color: isUnread ? '#EF4444' : '#6B7280' }]}>
              {isUnread ? 'Chưa đọc' : 'Đã đọc'}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
        </View>
        <View style={styles.requestItemContent}>
          <Text style={styles.requestItemTitle} numberOfLines={2}>{item?.title || 'Thông báo'}</Text>
          <Text style={styles.requestItemDate}>{timeText}</Text>
          {!!item?.content && <Text style={styles.requestItemDesc} numberOfLines={2}>{item.content}</Text>}
        </View>
      </TouchableOpacity>
    );
  }, [onPressItem, readIds]);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        <TouchableOpacity onPress={onMarkAllRead} disabled={items.length === 0} style={{ width: 28, alignItems: 'flex-end' }}>
          <MaterialCommunityIcons name="check-all" size={22} color={items.length === 0 ? '#D1D5DB' : '#2563EB'} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs (sync style with RequestListScreen) */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={filterOptions}
          keyExtractor={(i) => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
          renderItem={({ item: opt }) => (
            <TouchableOpacity
              style={[styles.filterTab, filter === opt.id && styles.filterTabActive]}
              onPress={() => setFilter(opt.id)}
            >
              <MaterialCommunityIcons
                name={opt.icon}
                size={18}
                color={filter === opt.id ? '#EF4444' : '#6B7280'}
              />
              <Text style={[styles.filterTabText, filter === opt.id && styles.filterTabTextActive]}>
                {opt.label}{opt.id === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.centerStateText}>Đang tải thông báo...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.centerStateText}>{error}</Text>
          <TouchableOpacity onPress={initialLoad} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="bell-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateText}>Chưa có thông báo</Text>
          <Text style={styles.emptyStateSubtext}>Bạn sẽ nhận được thông báo từ quản lí tòa nhà</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="filter-off-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateText}>
            {filter === 'unread' ? 'Không có thông báo chưa đọc' : filter === 'read' ? 'Không có thông báo đã đọc' : 'Không có kết quả'}
          </Text>
          <Text style={styles.emptyStateSubtext}>Hãy thử chọn bộ lọc khác</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.loadMore}>
                <ActivityIndicator size="small" color="#3B82F6" />
              </View>
            ) : null
          }
        />
      )}

      <NotificationDetailModal
        visible={modalVisible}
        notification={selectedNotification}
        onClose={() => {
          setModalVisible(false);
          setSelectedNotification(null);
        }}
      />
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
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  // Filter Tabs (match RequestListScreen)
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
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  centerStateText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 12,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  // Request-like item (sync with RequestListScreen)
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
  requestItemUnread: {
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFFBFB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
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
    backgroundColor: '#F3F4F6',
  },
  requestTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  requestItemContent: {
    flex: 1,
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
  requestItemDesc: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
  },
  loadMore: {
    paddingVertical: 12,
    alignItems: 'center',
  },
});
