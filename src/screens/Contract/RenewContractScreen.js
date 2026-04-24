import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  LogBox,
} from 'react-native';

// Ẩn các lỗi API không cần thiết khỏi LogBox overlay
LogBox.ignoreLogs([
  'confirmRenewalAPI error',
  'getRenewalPreviewAPI error',
  'declineRenewalAPI error',
]);

import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getRenewalPreviewAPI,
  confirmRenewalAPI,
  declineRenewalAPI,
} from '../../services/contract.service';

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

const addMonths = (dateString, months) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  date.setMonth(date.getMonth() + months);
  return date;
};

const hasPriceChange = (preview) => {
  return (
    preview?.newRoomPrice !== null &&
    preview?.newRoomPrice !== undefined &&
    preview?.currentRoomPrice !== preview?.newRoomPrice
  );
};

// Lấy trạng thái renewal từ response (backend trả về renewalStatus: "renewed" | "declined" | null)
const getRenewalStatus = (preview) => {
  if (!preview) return null;
  return preview.renewalStatus || null;
};

// Nút gia hạn: chỉ hiện khi hợp đồng trong cửa sổ gia hạn
const canShowRenewButton = (preview) => {
  if (!preview) return false;
  return preview.canRenew === true;
};

// Nút từ chối: chỉ hiện khi hợp đồng trong cửa sổ gia hạn
const canShowDeclineButton = (preview) => {
  if (!preview) return false;
  return preview.declineRenewalAvailable === true;
};

// Kiểm tra đã từ chối
const isDeclined = (preview) => {
  if (!preview) return false;
  return preview.renewalStatus === 'declined';
};

// Kiểm tra đã gia hạn
const isRenewed = (preview) => {
  if (!preview) return false;
  return preview.renewalStatus === 'renewed';
};

// ── Main Component ──────────────────────────────────────────────────────────

export default function RenewContractScreen({ navigation, route }) {
  const { contractId } = route.params || {};

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [extensionMonths, setExtensionMonths] = useState(3);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [declineModalVisible, setDeclineModalVisible] = useState(false);

  const fetchPreview = useCallback(async () => {
    if (!contractId) {
      setError('Không có thông tin hợp đồng');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await getRenewalPreviewAPI(contractId);
      setPreview(data);
      if (data?.extensionMonths && data.extensionMonths > 0) {
        setExtensionMonths(Math.min(12, data.extensionMonths));
      }
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin gia hạn');
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  // ── Computed preview values ──

  const newEndDate = preview?.endDate
    ? addMonths(preview.endDate, extensionMonths)
    : null;

  const priceChanged = preview ? hasPriceChange(preview) : false;
  const showRenew = preview ? canShowRenewButton(preview) : false;
  const showDecline = preview ? canShowDeclineButton(preview) : false;
  const declined = preview ? isDeclined(preview) : false;
  const renewed = preview ? isRenewed(preview) : false;

  // ── Actions ──

  const handleConfirmRenew = async () => {
    if (extensionMonths < 1 || extensionMonths > 24) {
      Alert.alert('Lỗi', 'Số tháng gia hạn phải từ 1 đến 24 tháng');
      return;
    }
    setConfirmModalVisible(false);
    setSubmitting(true);
    try {
      const result = await confirmRenewalAPI({
        contractId,
        extensionMonths,
      });
      // Refresh preview để cập nhật trạng thái mới
      setLoading(true);
      const data = await getRenewalPreviewAPI(contractId);
      setPreview(data);
      Alert.alert(
        'Thành công',
        `Gia hạn thành công đến ngày ${formatDate(result.data?.newEndDate)}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Gia hạn thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const handleDeclineRenew = async () => {
    setDeclineModalVisible(false);
    setSubmitting(true);
    try {
      await declineRenewalAPI(contractId);
      // Refresh preview để cập nhật renewalDeclined (true = đã gia hạn)
      setLoading(true);
      const data = await getRenewalPreviewAPI(contractId);
      setPreview(data);
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Từ chối gia hạn thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const openDeclineModal = () => {
    if (!preview?.endDate) return;
    Alert.alert(
      'Từ chối gia hạn',
      `Bạn chắc chắn từ chối gia hạn?\n\nBạn vẫn ở đến hết ngày ${formatDate(preview.endDate)}. Phòng sẽ mở cho khách đặt cọc sớm.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xác nhận từ chối', style: 'destructive', onPress: handleDeclineRenew },
      ]
    );
  };

  // ── Header ──

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Gia hạn hợp đồng</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  // ── Loading / Error ──

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        {renderHeader()}
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.centeredText}>Đang tải thông tin gia hạn...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !preview) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        {renderHeader()}
        <View style={styles.centeredContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error || 'Không có dữ liệu'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => { setLoading(true); fetchPreview(); }}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Info Row ──

  const InfoRow = ({ icon, color, label, value, isLast }) => (
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

  // ── Main ──

  return (
    <SafeAreaView style={styles.safeContainer}>
      {renderHeader()}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Contract Info Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="file-document-outline" size={20} color="#1F2937" />
              <Text style={styles.sectionTitle}>Thông tin hợp đồng</Text>
            </View>
            <View style={styles.infoCard}>
              <InfoRow
                icon="barcode"
                color="#8B5CF6"
                label="Mã hợp đồng"
                value={preview.contractCode}
              />
              <InfoRow
                icon="door"
                color="#3B82F6"
                label="Phòng"
                value={preview.roomName || preview.roomCode ? `${preview.roomName || ''} (${preview.roomCode || ''})` : null}
              />
              {preview.floorName && (
                <InfoRow icon="office-building" color="#3B82F6" label="Tầng" value={preview.floorName} />
              )}
              {preview.roomTypeName && (
                <InfoRow icon="tag" color="#3B82F6" label="Loại phòng" value={preview.roomTypeName} />
              )}
              <InfoRow
                icon="calendar-start"
                color="#F59E0B"
                label="Ngày bắt đầu"
                value={formatDate(preview.startDate)}
              />
              <InfoRow
                icon="calendar-end"
                color="#EF4444"
                label="Ngày kết thúc hiện tại"
                value={formatDate(preview.endDate)}
                isLast
              />
            </View>
          </View>

          {/* Renewal Window Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#1F2937" />
              <Text style={styles.sectionTitle}>Cửa sổ gia hạn</Text>
            </View>
            <View style={styles.infoCard}>
              <InfoRow
                icon="calendar-clock"
                color="#7C3AED"
                label="Số ngày còn lại"
                value={
                  preview.renewalWindowDaysRemaining !== null && preview.renewalWindowDaysRemaining !== undefined
                    ? `${preview.renewalWindowDaysRemaining} ngày`
                    : null
                }
              />
              <InfoRow
                icon="check-circle"
                color="#10B981"
                label="Có thể gia hạn"
                value={preview.canRenew ? 'Có' : 'Không'}
              />
              <InfoRow
                icon="door-open"
                color="#3B82F6"
                label="Có thể từ chối"
                value={preview.declineRenewalAvailable ? 'Có' : 'Không'}
                isLast
              />
            </View>

            {/* Blocking Reason */}
            {!preview.canRenew && preview.blockingReason && (
              <View style={styles.warningBox}>
                <MaterialCommunityIcons name="alert" size={20} color="#92400E" />
                <Text style={styles.warningText}>{preview.blockingReason}</Text>
              </View>
            )}

            {/* Expired window warning */}
            {(preview.renewalWindowDaysRemaining ?? 0) <= 0 && (
              <View style={styles.warningBox}>
                <MaterialCommunityIcons name="clock-alert" size={20} color="#92400E" />
                <Text style={styles.warningText}>Cửa sổ gia hạn đã hết hạn. Không thể thực hiện thao tác.</Text>
              </View>
            )}
          </View>

          {/* Price Info Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="currency-usd" size={20} color="#1F2937" />
              <Text style={styles.sectionTitle}>Thông tin giá</Text>
            </View>
            <View style={styles.infoCard}>
              <InfoRow
                icon="cash"
                color="#10B981"
                label="Giá phòng hiện tại"
                value={formatCurrency(preview.currentRoomPrice)}
              />
              <InfoRow
                icon="cash-multiple"
                color="#3B82F6"
                label="Giá phòng mới"
                value={formatCurrency(preview.newRoomPrice)}
                isLast
              />
            </View>

            {/* Price change warning */}
            {priceChanged && (
              <View style={styles.warningBox}>
                <MaterialCommunityIcons name="alert-circle" size={20} color="#D97706" />
                <Text style={styles.warningText}>
                  Giá phòng đã thay đổi từ {formatCurrency(preview.currentRoomPrice)} →{' '}
                  {formatCurrency(preview.newRoomPrice)}. Vui lòng xác nhận trước khi gia hạn.
                </Text>
              </View>
            )}
          </View>

          {/* Month Selector */}
          {showRenew && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="calendar-plus" size={20} color="#1F2937" />
                <Text style={styles.sectionTitle}>Chọn số tháng gia hạn</Text>
              </View>

              <View style={styles.monthSelector}>
                <TouchableOpacity
                  style={[styles.monthButton, extensionMonths <= 1 && styles.monthButtonDisabled]}
                  onPress={() => setExtensionMonths((m) => Math.max(1, m - 1))}
                  disabled={extensionMonths <= 1}
                >
                  <MaterialCommunityIcons name="minus" size={22} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.monthInputContainer}>
                  <TextInput
                    style={styles.monthInput}
                    value={String(extensionMonths)}
                    keyboardType="number-pad"
                    textAlign="center"
                    maxLength={2}
                    onChangeText={(text) => {
                      const num = parseInt(text, 10);
                      if (!isNaN(num)) setExtensionMonths(Math.min(24, Math.max(1, num)));
                    }}
                  />
                  <Text style={styles.monthLabel}>tháng</Text>
                </View>

                <TouchableOpacity
                  style={[styles.monthButton, extensionMonths >= 24 && styles.monthButtonDisabled]}
                  onPress={() => setExtensionMonths((m) => Math.min(24, m + 1))}
                  disabled={extensionMonths >= 24}
                >
                  <MaterialCommunityIcons name="plus" size={22} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* New end date preview */}
              {newEndDate && (
                <View style={styles.newEndDatePreview}>
                  <MaterialCommunityIcons name="calendar-check" size={18} color="#3B82F6" />
                  <Text style={styles.newEndDateText}>
                    Ngày kết thúc mới: <Text style={styles.newEndDateHighlight}>{formatDate(newEndDate)}</Text>
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Trạng thái đã từ chối hoặc đã gia hạn */}
          {(declined || renewed) && (
            <View style={[styles.declinedBadge, renewed && styles.renewedBadge]}>
              <MaterialCommunityIcons
                name={renewed ? 'check-circle' : 'close-circle'}
                size={20}
                color={renewed ? '#10B981' : '#EF4444'}
              />
              <Text style={[styles.declinedText, renewed && styles.renewedText]}>
                {renewed ? 'Đã gia hạn hợp đồng' : 'Đã từ chối gia hạn'}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {showRenew && (
            <TouchableOpacity
              style={[styles.actionButton, styles.renewButton]}
              onPress={() => setConfirmModalVisible(true)}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Gia hạn hợp đồng</Text>
            </TouchableOpacity>
          )}

          {showDecline && (
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={openDeclineModal}
            >
              <MaterialCommunityIcons name="close" size={20} color="#EF4444" />
              <Text style={styles.declineButtonText}>Từ chối gia hạn</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Confirm Renewal Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconContainer}>
              <MaterialCommunityIcons name="refresh" size={40} color="#3B82F6" />
            </View>
            <Text style={styles.modalTitle}>Xác nhận gia hạn</Text>
            <Text style={styles.modalBody}>
              Bạn muốn gia hạn hợp đồng {extensionMonths} tháng?
              {'\n\n'}Ngày kết thúc mới: <Text style={styles.modalHighlight}>{newEndDate ? formatDate(newEndDate) : '-'}</Text>
            </Text>
            {priceChanged && (
              <View style={styles.modalWarning}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#D97706" />
                <Text style={styles.modalWarningText}>
                  Giá phòng mới: {formatCurrency(preview.newRoomPrice)}
                </Text>
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleConfirmRenew}
              >
                <Text style={styles.modalBtnConfirmText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Submitting Overlay */}
      {submitting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Đang xử lý...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },

  infoCard: {
    backgroundColor: '#FAFAFA',
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
    gap: 10,
    flex: 1,
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

  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    margin: 12,
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
    lineHeight: 18,
  },

  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 20,
  },
  monthButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  monthInputContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  monthInput: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  monthLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },

  newEndDatePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 8,
  },
  newEndDateText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
  newEndDateHighlight: {
    fontWeight: '700',
    color: '#1D4ED8',
  },

  declinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
    marginBottom: 14,
  },
  declinedText: {
    fontSize: 14,
    color: '#991B1B',
    fontWeight: '600',
    flex: 1,
  },
  renewedBadge: {
    backgroundColor: '#D1FAE5',
  },
  renewedText: {
    color: '#065F46',
  },

  actionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  renewButton: {
    backgroundColor: '#3B82F6',
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  declineButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  declineButtonText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  modalHighlight: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  modalWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 6,
    width: '100%',
  },
  modalWarningText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalBtnCancelText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 15,
  },
  modalBtnConfirm: {
    backgroundColor: '#3B82F6',
  },
  modalBtnConfirmText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },

  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 120,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
});
