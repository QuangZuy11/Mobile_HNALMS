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
  Dimensions,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../services/api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleCallManager } from '../../utils/phoneHelper';
import { declineRenewalAPI, getRenewalPreviewAPI } from '../../services/contract.service';
import CreateMoveOutRequestModal from './CreateMoveOutRequestModal';

const { width, height } = Dimensions.get('window');

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateString) => {
  if (!dateString) return 'Chưa cập nhật';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A';
  const amount = typeof value === 'object' && value.$numberDecimal ? value.$numberDecimal : value;
  return `${parseFloat(amount).toLocaleString('vi-VN')} VNĐ`;
};

const getStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return { bg: '#D1FAE5', text: '#047857', label: 'Đang hiệu lực', icon: 'check-circle' };
    case 'expired':
      return { bg: '#FEE2E2', text: '#991B1B', label: 'Đã hết hạn', icon: 'clock-alert' };
    case 'terminated':
      return { bg: '#FEE2E2', text: '#991B1B', label: 'Đã thanh lý', icon: 'close-circle' };
    case 'pending':
      return { bg: '#FEF3C7', text: '#92400E', label: 'Chờ xử lý', icon: 'timer-sand' };
    default:
      return { bg: '#F3F4F6', text: '#374151', label: status || 'Chưa xác định', icon: 'help-circle' };
  }
};

const getDepositStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
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

const calculateRemainingDays = (endDate) => {
  if (!endDate) return null;
  const end = new Date(endDate);
  const today = new Date();
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
};

// ── Main Component ──────────────────────────────────────────────────────────

export default function MyContractScreen({ navigation }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [moveOutModalVisible, setMoveOutModalVisible] = useState(false);
  const [selectedContractForMoveOut, setSelectedContractForMoveOut] = useState(null);

  // ── Renewal Preview state (keyed by contractId) ──
  const [renewalPreviews, setRenewalPreviews] = useState({}); // { [contractId]: previewData }

  // ── Renewal helpers ──
  const getPreview = (contractId) => renewalPreviews[contractId];

  const getRenewalBadge = (contract, preview) => {
    const daysLeftToEnd = calculateRemainingDays(contract.endDate);
    const contractExpired =
      contract.status?.toLowerCase() === 'expired' ||
      (daysLeftToEnd !== null && daysLeftToEnd <= 0);

    const windowDays = preview?.renewalWindowDaysRemaining ?? contract.renewalWindowDaysRemaining;
    const renewalStatus = preview?.renewalStatus ?? contract.renewalStatus ?? null;

    if (contractExpired) {
      return { bg: '#FEE2E2', text: '#991B1B', label: 'Đã hết hạn', icon: 'clock-alert' };
    }

    if (renewalStatus === 'declined') {
      return { bg: '#FEE2E2', text: '#991B1B', label: 'Đã từ chối gia hạn', icon: 'close-circle' };
    }

    if (renewalStatus === 'renewed') {
      return { bg: '#D1FAE5', text: '#047857', label: 'Đã gia hạn', icon: 'check-circle' };
    }

    if ((windowDays ?? 0) <= 0) {
      return null;
    }
    if ((windowDays ?? 0) <= 7) {
      return { bg: '#FEF3C7', text: '#92400E', label: `Còn ${windowDays} ngày`, icon: 'clock-outline' };
    }
    if ((windowDays ?? 0) <= 30) {
      return { bg: '#DBEAFE', text: '#1D4ED8', label: `Còn ${windowDays} ngày gia hạn`, icon: 'clock-outline' };
    }
    return null;
  };

  // Nút "Gia hạn" — hiện khi contract active
  const canRenewContract = (contract, preview) => {
    if (contract.status !== 'active') return false;
    return true;
  };

  // Nút "Từ chối" — chỉ hiện khi CHƯA từ chối và trong cửa sổ gia hạn
  const canDeclineContract = (contract, preview) => {
    if (contract.status !== 'active') return false;
    if (preview?.renewalStatus === 'declined') return false; // đã từ chối rồi
    return true;
  };

  const fetchRenewalPreview = useCallback(async (contractId) => {
    try {
      const data = await getRenewalPreviewAPI(contractId);
      setRenewalPreviews((prev) => ({ ...prev, [contractId]: data }));
    } catch (err) {
      // Silent fail - preview not available
    }
  }, []);

  const openRenewalScreen = (contract) => {
    navigation.navigate('RenewContract', { contractId: contract._id });
  };

  const handleDeclineRenewal = async (contract) => {
    Alert.alert(
      'Xác nhận từ chối',
      `Bạn chắc chắn từ chối gia hạn?\n\nBạn vẫn ở đến hết ngày ${formatDate(contract.endDate)}. Phòng sẽ mở cho khách đặt cọc sớm.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: async () => {
            try {
              await declineRenewalAPI(contract._id);
              Alert.alert('Thành công', 'Bạn đã từ chối gia hạn. Phòng mở cho khách đặt cọc sớm.');
              fetchContracts();
              fetchRenewalPreview(contract._id);
            } catch (err) {
              Alert.alert('Lỗi', err.message || 'Từ chối gia hạn thất bại. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  const fetchContracts = useCallback(async () => {
    try {
      setError(null);
      const token = await AsyncStorage.getItem('authToken');

      const response = await apiClient.get('/contracts/my-contracts', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        setContracts(response.data.data || []);
      } else {
        setError('Không thể tải danh sách hợp đồng');
      }
    } catch (err) {
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
    fetchContracts();
  }, [fetchContracts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchContracts();
  };

  const toggleExpand = (id) => {
    const willExpand = expandedId !== id;
    setExpandedId((prev) => (prev === id ? null : id));
    if (willExpand) {
      fetchRenewalPreview(id);
    }
  };

  // ── Image modal ──

  const openContractImage = (imageUrl) => {
    setSelectedImage(imageUrl);
    setImageLoading(true);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setImageLoading(false);
    setTimeout(() => setSelectedImage(null), 300);
  };

  // ── Move-Out Request Modal ──

  const openMoveOutModal = (contractId) => {
    setSelectedContractForMoveOut(contractId);
    setMoveOutModalVisible(true);
  };

  const closeMoveOutModal = () => {
    setMoveOutModalVisible(false);
    setTimeout(() => setSelectedContractForMoveOut(null), 300);
  };

  const handleMoveOutSuccess = (moveOutData) => {
    // Refetch contracts to update status
    fetchContracts();
  };

  // ── Header ──

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Hợp đồng của tôi</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  // ── Loading / Error / Empty states ──

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
            onPress={() => { setLoading(true); fetchContracts(); }}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!contracts.length) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        {renderHeader()}
        <View style={styles.centeredContainer}>
          <MaterialCommunityIcons name="file-document-outline" size={48} color="#9CA3AF" />
          <Text style={styles.centeredText}>Bạn chưa có hợp đồng nào</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render one contract card ──

  const renderContractCard = ({ item: contract }) => {
    const badge = getStatusBadge(contract.status);
    const isExpanded = expandedId === contract._id;
    const remainingDays = calculateRemainingDays(contract.endDate);
    const preview = getPreview(contract._id);
    const renewalBadge = getRenewalBadge(contract, preview);
    const canRenew = canRenewContract(contract, preview);
    const canDecline = canDeclineContract(contract, preview);
    const room = contract.roomId;
    const roomType = room?.roomTypeId;
    const floor = room?.floorId;
    const deposit = contract.depositId;
    const depositBadge = deposit ? getDepositStatusBadge(deposit.status) : null;

    return (
      <View style={styles.cardWrapper}>
        {/* ── Card Header (always visible) ── */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => toggleExpand(contract._id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.statusDot, { backgroundColor: badge.text }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.contractCode}>{contract.contractCode || 'N/A'}</Text>
              <Text style={styles.roomLabel}>
                {room?.name || 'N/A'}{floor ? ` • ${floor.name}` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.cardHeaderRight}>
            <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
            </View>
            <MaterialCommunityIcons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={22}
              color="#6B7280"
            />
          </View>
        </TouchableOpacity>

        {/* ── Renewal badge(s) ── */}
        {renewalBadge && (
          Array.isArray(renewalBadge) ? (
            renewalBadge.map((b, idx) => (
              <View key={idx} style={[styles.renewalBadgeContainer, { backgroundColor: b.bg }]}>
                <MaterialCommunityIcons name={b.icon} size={16} color={b.text} />
                <Text style={[styles.renewalBadgeText, { color: b.text }]}>{b.label}</Text>
              </View>
            ))
          ) : (
            <View style={[styles.renewalBadgeContainer, { backgroundColor: renewalBadge.bg }]}>
              <MaterialCommunityIcons name={renewalBadge.icon} size={16} color={renewalBadge.text} />
              <Text style={[styles.renewalBadgeText, { color: renewalBadge.text }]}>
                {renewalBadge.label}
              </Text>
            </View>
          )
        )}

        {/* ── Summary row (always visible) ── */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="calendar-range" size={16} color="#6B7280" />
            <Text style={styles.summaryText}>
              {formatDate(contract.startDate)} – {formatDate(contract.endDate)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#6B7280" />
            <Text style={styles.summaryText}>{contract.duration || '–'} tháng</Text>
          </View>
        </View>

        {/* ── Expanded Details ── */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Contract Info */}
            <Text style={styles.sectionTitle}>Thông tin hợp đồng</Text>
            <View style={styles.infoCard}>
              <InfoRow icon="barcode" color="#8B5CF6" label="Mã hợp đồng" value={contract.contractCode} />
              <InfoRow icon="calendar-start" color="#8B5CF6" label="Ngày bắt đầu" value={formatDate(contract.startDate)} />
              <InfoRow icon="calendar-end" color="#8B5CF6" label="Ngày kết thúc" value={formatDate(contract.endDate)} />
              <InfoRow icon="timer-sand" color="#8B5CF6" label="Thời hạn" value={`${contract.duration || '–'} tháng`} />
              <InfoRow icon="cash-check" color="#8B5CF6" label="Tiền thuê thanh toán đến" value={formatDate(contract.rentPaidUntil)} isLast />
            </View>

            {/* Room Info */}
            {room && (
              <>
                <Text style={styles.sectionTitle}>Thông tin phòng</Text>
                <View style={styles.infoCard}>
                  <InfoRow icon="door" color="#3B82F6" label="Tên phòng" value={room.name} />
                  <InfoRow icon="barcode" color="#3B82F6" label="Mã phòng" value={room.roomCode} />
                  {floor && <InfoRow icon="office-building" color="#3B82F6" label="Tầng" value={floor.name} />}
                  {roomType && (
                    <>
                      <InfoRow icon="tag" color="#3B82F6" label="Loại phòng" value={roomType.typeName} />
                      <InfoRow icon="currency-usd" color="#3B82F6" label="Giá phòng/tháng" value={formatCurrency(roomType.currentPrice)} />
                      <InfoRow icon="account-multiple" color="#3B82F6" label="Số người tối đa" value={`${roomType.personMax || '–'} người`} isLast />
                    </>
                  )}
                </View>
              </>
            )}

            {/* Co-residents */}
            {contract.coResidents && contract.coResidents.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Người ở cùng</Text>
                <View style={styles.infoCard}>
                  {contract.coResidents.map((person, idx) => (
                    <View key={idx}>
                      <View style={styles.coResidentRow}>
                        <MaterialCommunityIcons name="account" size={20} color="#6366F1" />
                        <View style={styles.coResidentInfo}>
                          <Text style={styles.coResidentName}>{person.fullName || 'N/A'}</Text>
                          {person.cccd && <Text style={styles.coResidentDetail}>CCCD: {person.cccd}</Text>}
                          {person.phone && <Text style={styles.coResidentDetail}>SĐT: {person.phone}</Text>}
                          {person.dob && <Text style={styles.coResidentDetail}>Ngày sinh: {formatDate(person.dob)}</Text>}
                        </View>
                      </View>
                      {idx < contract.coResidents.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Deposit Info */}
            {deposit && (
              <>
                <Text style={styles.sectionTitle}>Thông tin cọc</Text>
                <View style={styles.infoCard}>
                  <InfoRow icon="account" color="#10B981" label="Người cọc" value={deposit.name} />
                  <InfoRow icon="currency-usd" color="#10B981" label="Số tiền cọc" value={formatCurrency(deposit.amount)} />
                  {depositBadge && (
                    <View style={styles.infoRow}>
                      <View style={styles.infoLabelContainer}>
                        <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                        <Text style={styles.infoLabel}>Trạng thái</Text>
                      </View>
                      <View style={[styles.statusBadgeInline, { backgroundColor: depositBadge.bg }]}>
                        <Text style={[styles.statusBadgeTextInline, { color: depositBadge.text }]}>
                          {depositBadge.label}
                        </Text>
                      </View>
                    </View>
                  )}
                  <InfoRow icon="calendar" color="#10B981" label="Ngày đặt cọc" value={formatDate(deposit.createdAt)} />
                  {deposit.phone && <InfoRow icon="phone" color="#10B981" label="SĐT" value={deposit.phone} />}
                  {deposit.email && <InfoRow icon="email" color="#10B981" label="Email" value={deposit.email} isLast />}
                </View>
              </>
            )}

            {/* Contract Images */}
            {contract.images && contract.images.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Hình ảnh hợp đồng</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  {contract.images.map((imgUrl, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.imageContainer}
                      onPress={() => openContractImage(imgUrl)}
                    >
                      <Image source={{ uri: imgUrl }} style={styles.contractImage} resizeMode="cover" />
                      <View style={styles.imageOverlay}>
                        <MaterialCommunityIcons name="eye" size={20} color="#FFF" />
                        <Text style={styles.imageOverlayText}>Xem</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Action Buttons */}
            <View style={styles.actionSection}>
              {contract.status === 'active' && (
                <>
                  {/* Gia hạn button - hiện khi trong cửa sổ 30 ngày & chưa gia hạn */}
                  {canRenew && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openRenewalScreen(contract)}
                    >
                      <MaterialCommunityIcons name="refresh" size={18} color="#FFF" />
                      <Text style={styles.actionButtonText}>Gia hạn hợp đồng</Text>
                    </TouchableOpacity>
                  )}

                  {/* Từ chối gia hạn button - chỉ hiện khi declineRenewalAvailable & trong cửa sổ 30 ngày */}
                  {canDecline && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.declineRenewButton]}
                      onPress={() => handleDeclineRenewal(contract)}
                    >
                      <MaterialCommunityIcons name="close" size={18} color="#EF4444" />
                      <Text style={styles.declineRenewButtonText}>Từ chối gia hạn</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonDanger]}
                    onPress={() => openMoveOutModal(contract._id)}
                  >
                    <MaterialCommunityIcons name="door-open" size={18} color="#EF4444" />
                    <Text style={styles.actionButtonTextDanger}>Trả phòng thanh lý</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSecondary]}
                onPress={handleCallManager}
              >
                <MaterialCommunityIcons name="phone" size={18} color="#3B82F6" />
                <Text style={styles.actionButtonTextSecondary}>Liên hệ quản lý</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  // ── Main return ──

  return (
    <SafeAreaView style={styles.safeContainer}>
      {renderHeader()}

      <FlatList
        data={contracts}
        keyExtractor={(item) => item._id}
        renderItem={renderContractCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
        ListHeaderComponent={
          <Text style={styles.listCount}>
            {contracts.length} hợp đồng
          </Text>
        }
      />

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeImageModal}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalBackground} activeOpacity={1} onPress={closeImageModal}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={closeImageModal} activeOpacity={0.8}>
              <MaterialCommunityIcons name="close" size={30} color="#FFF" />
            </TouchableOpacity>

            {imageLoading && (
              <View style={styles.imageLoadingContainer}>
                <ActivityIndicator size="large" color="#FFF" />
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
                onError={() => { setImageLoading(false); alert('Không thể tải ảnh'); }}
              />
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Move-Out Request Modal */}
      <CreateMoveOutRequestModal
        visible={moveOutModalVisible}
        contractId={selectedContractForMoveOut}
        onClose={closeMoveOutModal}
        onSuccess={handleMoveOutSuccess}
      />
    </SafeAreaView>
  );
}

// ── Reusable InfoRow component ──────────────────────────────────────────────

function InfoRow({ icon, color, label, value, subtitle, isLast }) {
  return (
    <>
      <View style={styles.infoRow}>
        <View style={styles.infoLabelContainer}>
          <MaterialCommunityIcons name={icon} size={20} color={color} />
          <View>
            <Text style={styles.infoLabel}>{label}</Text>
            {subtitle ? <Text style={styles.infoSubtitle}>{subtitle}</Text> : null}
          </View>
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

  // ── List ──
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  listCount: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },

  // ── Card ──
  cardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  contractCode: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  roomLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Summary row ──
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryText: {
    fontSize: 12,
    color: '#6B7280',
  },

  // ── Alert banner ──
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    gap: 6,
  },
  alertText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
  },

  // ── Renewal badge ──
  renewalBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    gap: 6,
  },
  renewalBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // ── Expanded content ──
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
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
  infoSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
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
  statusBadgeInline: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeTextInline: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Co-residents ──
  coResidentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  coResidentInfo: {
    flex: 1,
  },
  coResidentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  coResidentDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // ── Images ──
  imageContainer: {
    width: 200,
    height: 140,
    marginRight: 10,
    borderRadius: 10,
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  imageOverlayText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Actions ──
  actionSection: {
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
    gap: 6,
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
  actionButtonDanger: {
    backgroundColor: '#FEE2E2',
  },
  actionButtonTextDanger: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },
  declineRenewButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  declineRenewButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },

  // ── Modal ──
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
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
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    color: '#FFF',
    marginTop: 12,
    fontSize: 14,
  },
  fullscreenImage: {
    width: width,
    height: height,
  },
});
