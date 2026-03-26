// Create Move-Out Request Screen – Modal Dialog
// Khớp với backend 5-bước: Requested → InvoiceReleased → Paid → Completed
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  getContractMoveOutInfoAPI,
  createMoveOutRequestAPI,
  getMyMoveOutRequestAPI,
} from '../../services/move-out.service';

// ─── Status helpers ──────────────────────────────────────────────────────────

const STATUS_MAP = {
  requested: {
    color: '#F59E0B',
    bg: '#FFFBEB',
    label: 'Đã yêu cầu',
    icon: 'file-clock',
    step: 1,
  },
  invoicereleased: {
    color: '#3B82F6',
    bg: '#EFF6FF',
    label: 'Chờ thanh toán',
    icon: 'receipt',
    step: 2,
  },
  paid: {
    color: '#8B5CF6',
    bg: '#F5F3FF',
    label: 'Đã thanh toán',
    icon: 'check-decagram',
    step: 3,
  },
  completed: {
    color: '#10B981',
    bg: '#ECFDF5',
    label: 'Hoàn thành',
    icon: 'home-check',
    step: 4,
  },
};

const getStatusInfo = (status) =>
  STATUS_MAP[status?.toLowerCase()] ?? {
    color: '#6B7280',
    bg: '#F3F4F6',
    label: status || 'Chưa xác định',
    icon: 'help-circle',
    step: 0,
  };

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CreateMoveOutRequestModal({
  visible,
  contractId,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [contractInfo, setContractInfo] = useState(null);
  const [existingRequest, setExistingRequest] = useState(null);
  const [expectedDate, setExpectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  // deposit-forfeiture preview (client-side estimate shown before submit)
  const [depositWarning, setDepositWarning] = useState(null);

  // ── Fetch on open ──
  useEffect(() => {
    if (visible) {
      fetchContractInfo();
      fetchExistingRequest();
      setExpectedDate(new Date());
      setReason('');
      setError(null);
      setDepositWarning(null);
    }
  }, [visible, contractId]);

  const fetchContractInfo = async () => {
    setFetchingInfo(true);
    setError(null);
    try {
      const res = await getContractMoveOutInfoAPI(contractId);
      setContractInfo(res);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Lỗi khi lấy thông tin hợp đồng');
    } finally {
      setFetchingInfo(false);
    }
  };

  const fetchExistingRequest = async () => {
    try {
      const res = await getMyMoveOutRequestAPI(contractId);
      setExistingRequest(res && (res._id || res.id) ? res : null);
    } catch {
      setExistingRequest(null);
    }
  };

  // ── Date picker ──
  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setExpectedDate(selectedDate);
      computeDepositWarning(selectedDate);
    }
    if (event.type === 'dismissed') setShowDatePicker(false);
  };

  // Client-side preview: tính trước cảnh báo mất cọc để hiện inline
  const computeDepositWarning = (date) => {
    if (!contractInfo) return;
    const now = new Date();
    const daysNotice = Math.floor((date - now) / (1000 * 60 * 60 * 24));
    const stayMonths = Math.floor(
      (date - new Date(contractInfo.startDate)) / (1000 * 60 * 60 * 24 * 30)
    );
    const warnings = [];
    if (daysNotice < 30)
      warnings.push(`Thông báo trước ${daysNotice} ngày (cần ≥ 30 ngày)`);
    if (stayMonths < 6)
      warnings.push(`Mới thuê ${stayMonths} tháng (cần ≥ 6 tháng)`);

    setDepositWarning(warnings.length > 0 ? warnings : null);
  };

  // ── Validation ──
  const validateForm = () => {
    if (!reason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do trả phòng');
      return false;
    }
    if (reason.trim().length < 10) {
      Alert.alert('Lỗi', 'Lý do phải có ít nhất 10 ký tự');
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expectedDate < today) {
      Alert.alert('Lỗi', 'Ngày trả phòng phải trong tương lai');
      return false;
    }
    return true;
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Nếu có cảnh báo mất cọc → confirm trước (chỉ 1 lần, không re-submit)
    if (depositWarning && depositWarning.length > 0) {
      Alert.alert(
        '⚠️ Cảnh báo mất cọc',
        `Điều kiện sau sẽ khiến bạn mất tiền cọc:\n• ${depositWarning.join('\n• ')}\n\nBạn có chắc chắn muốn tiếp tục?`,
        [
          { text: 'Quay lại', style: 'cancel' },
          {
            text: 'Xác nhận gửi',
            style: 'destructive',
            onPress: () => submitRequest(),
          },
        ]
      );
    } else {
      submitRequest();
    }
  };

  const submitRequest = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await createMoveOutRequestAPI({
        contractId,
        expectedMoveOutDate: expectedDate.toISOString(),
        reason: reason.trim(),
      });
      const data = response?.moveOutRequest || response?.data || response;
      const successMessage = response?.message || 'Yêu cầu trả phòng đã được gửi thành công.';

      Alert.alert('Thành công ✅', successMessage, [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
            onClose();
            if (onSuccess) onSuccess(data);
          },
        },
      ]);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể tạo yêu cầu trả phòng';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setReason('');
    setExpectedDate(new Date());
    setError(null);
    setDepositWarning(null);
  };

  // ── Formatters ──
  const formatDate = (date) =>
    new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount ?? 0);

  // ── Render existing request ──
  const renderExistingRequest = () => {
    const req = existingRequest;
    const statusInfo = getStatusInfo(req.status);

    return (
      <>
        {/* Timeline */}
        <View style={styles.timelineContainer}>
          {['Yêu cầu\ngửi', 'Hóa đơn\nphát hành', 'Thanh toán\nhoàn tất', 'Trả phòng\nhoàn tất'].map((label, idx) => {
            const stepNum = idx + 1;
            const done = statusInfo.step >= stepNum;
            const current = statusInfo.step === stepNum;
            return (
              <View key={idx} style={styles.timelineStep}>
                {idx > 0 && (
                  <View
                    style={[
                      styles.timelineLine,
                      { backgroundColor: statusInfo.step > idx ? statusInfo.color : '#E5E7EB' },
                    ]}
                  />
                )}
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor: done ? statusInfo.color : '#E5E7EB',
                      borderColor: current ? statusInfo.color : 'transparent',
                      borderWidth: current ? 2 : 0,
                    },
                  ]}
                >
                  {done && (
                    <MaterialCommunityIcons
                      name={current ? 'clock-outline' : 'check'}
                      size={12}
                      color="#FFF"
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.timelineLabel,
                    { color: done ? statusInfo.color : '#9CA3AF', fontWeight: current ? '700' : '400' },
                  ]}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Status badge */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Yêu cầu trả phòng của bạn</Text>
          <View style={[styles.statusBadgeLarge, { backgroundColor: statusInfo.bg, borderColor: statusInfo.color + '40' }]}>
            <MaterialCommunityIcons name={statusInfo.icon} size={22} color={statusInfo.color} />
            <Text style={[styles.statusBadgeLargeText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>

          {/* Basic info */}
          <View style={styles.infoBox}>
            <InfoRow label="Ngày yêu cầu" value={formatDate(req.requestDate)} />
            <InfoRow label="Ngày dự kiến trả phòng" value={formatDate(req.expectedMoveOutDate)} />
            <InfoRow label="Lý do" value={req.reason} isLast={!req.isEarlyNotice && !req.isUnderMinStay && !req.isDepositForfeited} />

            {/* Deposit warning flags */}
            {(req.isEarlyNotice || req.isUnderMinStay) && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.warningFlags}>
                  {req.isEarlyNotice && (
                    <View style={styles.warningFlag}>
                      <MaterialCommunityIcons name="alert-outline" size={15} color="#F59E0B" />
                      <Text style={styles.warningFlagText}>Thông báo gấp (dưới 30 ngày)</Text>
                    </View>
                  )}
                  {req.isUnderMinStay && (
                    <View style={styles.warningFlag}>
                      <MaterialCommunityIcons name="alert-outline" size={15} color="#F59E0B" />
                      <Text style={styles.warningFlagText}>Chưa đủ 6 tháng thuê</Text>
                    </View>
                  )}
                  {req.isDepositForfeited && (
                    <View style={[styles.warningFlag, { backgroundColor: '#FEE2E2', borderRadius: 6, padding: 8 }]}>
                      <MaterialCommunityIcons name="cash-remove" size={15} color="#DC2626" />
                      <Text style={[styles.warningFlagText, { color: '#DC2626' }]}>Tiền cọc sẽ bị tịch thu</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </View>

        {/* InvoiceReleased – show invoice info */}
        {(req.status?.toLowerCase() === 'invoicereleased' ||
          req.status?.toLowerCase() === 'paid' ||
          req.status?.toLowerCase() === 'completed') &&
          req.finalInvoiceId && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>📄 Hóa đơn cuối</Text>
              <View style={styles.infoBox}>
                {req.finalInvoiceId?.invoiceCode && (
                  <InfoRow label="Mã hóa đơn" value={req.finalInvoiceId.invoiceCode} />
                )}
                {req.finalInvoiceId?.totalAmount != null && (
                  <InfoRow
                    label="Tổng tiền"
                    value={formatCurrency(req.finalInvoiceId.totalAmount)}
                    valueStyle={{ color: '#DC2626', fontWeight: '700' }}
                  />
                )}
                {req.finalInvoiceId?.status && (
                  <InfoRow
                    label="Trạng thái hóa đơn"
                    value={req.finalInvoiceId.status === 'Paid' ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}
                    isLast={!req.managerInvoiceNotes}
                  />
                )}
                {req.managerInvoiceNotes && (
                  <InfoRow label="Ghi chú quản lý" value={req.managerInvoiceNotes} isLast />
                )}
              </View>
              {req.status?.toLowerCase() === 'invoicereleased' && (
                <View style={styles.actionHint}>
                  <MaterialCommunityIcons name="information-outline" size={16} color="#3B82F6" />
                  <Text style={styles.actionHintText}>
                    Vui lòng thanh toán hóa đơn để hoàn tất thủ tục trả phòng.
                  </Text>
                </View>
              )}
            </View>
          )}

        {/* Paid / Completed – show payment info */}
        {(req.status?.toLowerCase() === 'paid' || req.status?.toLowerCase() === 'completed') && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>💳 Thông tin thanh toán</Text>
            <View style={styles.infoBox}>
              {req.paymentMethod && (
                <InfoRow
                  label="Phương thức"
                  value={req.paymentMethod === 'online' ? '💻 Online' : '💵 Tiền mặt'}
                />
              )}
              {req.paymentTransactionCode && (
                <InfoRow label="Mã giao dịch" value={req.paymentTransactionCode} />
              )}
              {req.paymentDate && (
                <InfoRow label="Ngày thanh toán" value={formatDate(req.paymentDate)} />
              )}
              {req.depositRefundAmount != null && (
                <InfoRow
                  label="Hoàn cọc"
                  value={
                    req.isDepositForfeited
                      ? '❌ Bị tịch thu'
                      : req.depositRefundAmount > 0
                      ? `✅ ${formatCurrency(req.depositRefundAmount)}`
                      : 'Không có'
                  }
                  valueStyle={{
                    color: req.isDepositForfeited ? '#DC2626' : req.depositRefundAmount > 0 ? '#10B981' : '#6B7280',
                  }}
                  isLast={!req.accountantNotes}
                />
              )}
              {req.accountantNotes && (
                <InfoRow label="Ghi chú kế toán" value={req.accountantNotes} isLast />
              )}
            </View>
          </View>
        )}

        {/* Completed – show completion info */}
        {req.status?.toLowerCase() === 'completed' && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>🎉 Hoàn tất trả phòng</Text>
            <View style={styles.infoBox}>
              {req.completedDate && (
                <InfoRow label="Ngày hoàn thành" value={formatDate(req.completedDate)} />
              )}
              {req.managerCompletionNotes && (
                <InfoRow label="Ghi chú quản lý" value={req.managerCompletionNotes} isLast />
              )}
            </View>
            <View style={[styles.actionHint, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
              <MaterialCommunityIcons name="check-circle-outline" size={16} color="#10B981" />
              <Text style={[styles.actionHintText, { color: '#065F46' }]}>
                Cảm ơn bạn đã sử dụng dịch vụ!
              </Text>
            </View>
          </View>
        )}

        {/* Close button */}
        <View style={styles.formSection}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  // ── Render form (create new) ──
  const renderCreateForm = () => (
    <>
      {/* Contract Info */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Thông tin hợp đồng</Text>
        <View style={styles.infoBox}>
          {contractInfo.contractCode && (
            <InfoRow label="Mã hợp đồng" value={contractInfo.contractCode} />
          )}
          <InfoRow label="Ngày hết hạn" value={formatDate(contractInfo.endDate)} isLast />
        </View>
      </View>

      {/* Form */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Thông tin trả phòng</Text>

        {/* Expected date */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Ngày trả phòng dự kiến <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
            <MaterialCommunityIcons name="calendar-outline" size={20} color="#3B82F6" />
            <Text style={styles.dateText}>{formatDate(expectedDate)}</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={expectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Deposit warning preview */}
        {depositWarning && depositWarning.length > 0 && (
          <View style={styles.depositWarnBox}>
            <View style={styles.depositWarnHeader}>
              <MaterialCommunityIcons name="alert-octagon" size={18} color="#B45309" />
              <Text style={styles.depositWarnTitle}>Cảnh báo mất cọc</Text>
            </View>
            {depositWarning.map((w, i) => (
              <Text key={i} style={styles.depositWarnText}>• {w}</Text>
            ))}
          </View>
        )}

        {/* Reason */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Lý do trả phòng <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Nhập lý do trả phòng..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={reason}
            onChangeText={setReason}
            editable={!loading}
            maxLength={150}
          />
          <Text style={styles.helperText}>{reason.length}/150 ký tự</Text>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={20} color="#FFF" />
              <Text style={styles.submitBtnText}>Gửi yêu cầu</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
          <Text style={styles.cancelBtnText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ── JSX ──
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Trả phòng thanh lý</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Content */}
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {fetchingInfo ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.centerStateText}>Đang tải thông tin hợp đồng...</Text>
              </View>
            ) : error && !contractInfo ? (
              <View style={styles.centerState}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text style={styles.centerStateText}>{error}</Text>
                <TouchableOpacity onPress={fetchContractInfo} style={styles.retryBtn}>
                  <Text style={styles.retryBtnText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : existingRequest ? (
              renderExistingRequest()
            ) : contractInfo ? (
              renderCreateForm()
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ── InfoRow helper ───────────────────────────────────────────────────────────

function InfoRow({ label, value, isLast, valueStyle }) {
  return (
    <>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueStyle]}>{value ?? '—'}</Text>
      </View>
      {!isLast && <View style={styles.infoDivider} />}
    </>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoidingView: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    paddingVertical: 16,
    paddingBottom: 100,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  centerStateText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  retryBtnText: { color: '#FFF', fontWeight: '600' },

  // ── Timeline ──
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFF',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timelineStep: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    top: 10,
    left: '-50%',
    right: '50%',
    height: 2,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  timelineLabel: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },

  // ── Status badge large ──
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  statusBadgeLargeText: {
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Info sections ──
  infoSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoBox: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1.2,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },

  // ── Warning flags ──
  warningFlags: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  warningFlag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningFlagText: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '500',
    flex: 1,
  },

  // ── Action hint ──
  actionHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionHintText: {
    fontSize: 13,
    color: '#1D4ED8',
    flex: 1,
    lineHeight: 18,
  },

  // ── Deposit warning preview ──
  depositWarnBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    marginBottom: 16,
  },
  depositWarnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  depositWarnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  depositWarnText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 20,
  },

  // ── Form ──
  formSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  formGroup: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  required: { color: '#EF4444' },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    gap: 8,
  },
  dateText: { fontSize: 14, color: '#1F2937', flex: 1 },
  textInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  textArea: { textAlignVertical: 'top', minHeight: 100 },
  helperText: { marginTop: 4, fontSize: 12, color: '#9CA3AF' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, color: '#DC2626', flex: 1 },
  submitBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 13,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    marginBottom: 10,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  cancelBtn: {
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  cancelBtnText: { textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#6B7280' },
});
