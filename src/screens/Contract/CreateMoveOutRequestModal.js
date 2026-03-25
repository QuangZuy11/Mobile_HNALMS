// Create Move-Out Request Screen - Modal Dialog
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
  const [warnings, setWarnings] = useState([]);
  const [showWarningConfirm, setShowWarningConfirm] = useState(false);
  const [error, setError] = useState(null);

  // Fetch contract info and check for existing move-out request
  useEffect(() => {
    if (visible) {
      fetchContractInfo();
      fetchExistingRequest();
      setExpectedDate(new Date());
      setReason('');
      setError(null);
      setWarnings([]);
      setShowWarningConfirm(false);
    }
  }, [visible, contractId]);

  const fetchContractInfo = async () => {
    setFetchingInfo(true);
    setError(null);
    try {
      const res = await getContractMoveOutInfoAPI(contractId);
      console.log('Contract move-out info response:', res);
      setContractInfo(res);
    } catch (err) {
      console.error('Fetch contract info error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Lỗi khi lấy thông tin hợp đồng';
      setError(errorMessage);
    } finally {
      setFetchingInfo(false);
    }
  };

  const fetchExistingRequest = async () => {
    try {
      const res = await getMyMoveOutRequestAPI(contractId);
      console.log('Existing move-out request:', res);
      // Check if request exists - res should be the move-out request object
      if (res && (res._id || res.id)) {
        setExistingRequest(res);
      } else {
        setExistingRequest(null);
      }
    } catch (err) {
      // No existing request
      console.log('No existing move-out request:', err.message);
      setExistingRequest(null);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setExpectedDate(selectedDate);
    }
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const moveOutData = {
        contractId,
        expectedMoveOutDate: expectedDate.toISOString(),
        reason: reason.trim(),
      };

      const response = await createMoveOutRequestAPI(moveOutData);
      const data = response?.moveOutRequest || response?.data || response;
      const warnings = response?.warnings || [];
      const successMessage = response?.message || 'Yêu cầu trả phòng đã được gửi thành công.';

      // Check for warnings
      if (warnings && warnings.length > 0) {
        setWarnings(warnings);
        setShowWarningConfirm(true);
      } else {
        // No warnings, hiển thị message từ backend
        Alert.alert(
          'Thành công',
          successMessage,
          [
            {
              text: 'OK',
              onPress: () => {
                resetForm();
                onClose();
                if (onSuccess) onSuccess(data);
              },
            },
          ]
        );
      }
    } catch (err) {
      console.error('Create move-out error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tạo yêu cầu trả phòng';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleWarningConfirm = async () => {
    setShowWarningConfirm(false);
    setLoading(true);
    setError(null);

    try {
      // Submit again with warnings acknowledged
      const moveOutData = {
        contractId,
        expectedMoveOutDate: expectedDate.toISOString(),
        reason: reason.trim(),
        acknowledgedWarnings: warnings.map((w) => w.type),
      };

      const response = await createMoveOutRequestAPI(moveOutData);
      const data = response?.moveOutRequest || response?.data || response;
      const successMessage = response?.message || 'Yêu cầu trả phòng đã được gửi thành công.';

      Alert.alert(
        'Thành công',
        successMessage,
        [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              onClose();
              if (onSuccess) onSuccess(data);
            },
          },
        ]
      );
    } catch (err) {
      console.error('Warning confirm error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tạo yêu cầu trả phòng';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setReason('');
    setExpectedDate(new Date());
    setWarnings([]);
    setShowWarningConfirm(false);
    setError(null);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'requested':
        return { color: '#F59E0B', label: 'Đã yêu cầu', icon: 'file-upload' };
      case 'approved':
        return { color: '#10B981', label: 'Đã duyệt', icon: 'check-circle' };
      case 'completed':
        return { color: '#3B82F6', label: 'Hoàn thành', icon: 'check-all' };
      case 'cancelled':
        return { color: '#EF4444', label: 'Đã hủy', icon: 'close-circle' };
      default:
        return { color: '#6B7280', label: status || 'Chưa xác định', icon: 'help-circle' };
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount ?? 0);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          {/* Modal Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Trả phòng thanh lý</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Modal Content */}
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
            <>
              {/* Existing Request Display */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Yêu cầu trả phòng của bạn</Text>
                <View style={styles.infoBox}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Trạng thái</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBadge(existingRequest.status).color + '20' }]}>
                      <MaterialCommunityIcons name={getStatusBadge(existingRequest.status).icon} size={16} color={getStatusBadge(existingRequest.status).color} />
                      <Text style={[styles.statusBadgeText, { color: getStatusBadge(existingRequest.status).color }]}>
                        {getStatusBadge(existingRequest.status).label}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Ngày yêu cầu</Text>
                    <Text style={styles.infoValue}>{formatDate(existingRequest.requestDate)}</Text>
                  </View>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Ngày dự kiến trả phòng</Text>
                    <Text style={styles.infoValue}>{formatDate(existingRequest.expectedMoveOutDate)}</Text>
                  </View>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Lý do</Text>
                    <Text style={styles.infoValue}>{existingRequest.reason}</Text>
                  </View>

                  {/* Warning Flags */}
                  {(existingRequest.isEarlyNotice || existingRequest.isUnderMinStay) && (
                    <>
                      <View style={styles.infoDivider} />
                      <View style={styles.warningFlags}>
                        {existingRequest.isEarlyNotice && (
                          <View style={styles.warningFlag}>
                            <MaterialCommunityIcons name="alert-outline" size={16} color="#F59E0B" />
                            <Text style={styles.warningFlagText}>Thông báo sớm hơn 30 ngày</Text>
                          </View>
                        )}
                        {existingRequest.isUnderMinStay && (
                          <View style={styles.warningFlag}>
                            <MaterialCommunityIcons name="alert-outline" size={16} color="#F59E0B" />
                            <Text style={styles.warningFlagText}>Dưới thời gian tối thiểu</Text>
                          </View>
                        )}
                      </View>
                    </>
                  )}

                  {/* Deposit Info */}
                  {(existingRequest.isDepositForfeited || existingRequest.depositRefund > 0) && (
                    <>
                      <View style={styles.infoDivider} />
                      {existingRequest.isDepositForfeited && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Cọc</Text>
                          <Text style={[styles.infoValue, { color: '#DC2626' }]}>Bị tịch thu</Text>
                        </View>
                      )}
                      {existingRequest.depositRefund > 0 && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Hoàn cọc</Text>
                          <Text style={[styles.infoValue, { color: '#10B981' }]}>{formatCurrency(existingRequest.depositRefund)}</Text>
                        </View>
                      )}
                    </>
                  )}

                  {/* Approval Date */}
                  {existingRequest.managerApprovalDate && (
                    <>
                      <View style={styles.infoDivider} />
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Ngày duyệt</Text>
                        <Text style={styles.infoValue}>{formatDate(existingRequest.managerApprovalDate)}</Text>
                      </View>
                    </>
                  )}

                  {/* Completion Date */}
                  {existingRequest.completedDate && (
                    <>
                      <View style={styles.infoDivider} />
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Ngày hoàn thành</Text>
                        <Text style={styles.infoValue}>{formatDate(existingRequest.completedDate)}</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>

              {/* Close Button */}
              <View style={styles.formSection}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                >
                  <Text style={styles.cancelBtnText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : contractInfo ? (
            <>
              {/* Contract Info Section */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Thông tin hợp đồng</Text>
                <View style={styles.infoBox}>
                  {contractInfo.contractCode && (
                    <>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Mã hợp đồng</Text>
                        <Text style={styles.infoValue}>{contractInfo.contractCode}</Text>
                      </View>
                      <View style={styles.infoDivider} />
                    </>
                  )}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Ngày hết hạn</Text>
                    <Text style={styles.infoValue}>{formatDate(contractInfo.endDate)}</Text>
                  </View>
                </View>
              </View>

              {/* Form Section */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Thông tin trả phòng</Text>

                {/* Expected Move-Out Date */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    Ngày trả phòng dự kiến <Text style={styles.required}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <MaterialCommunityIcons name="calendar-outline" size={20} color="#3B82F6" />
                    <Text style={styles.dateText}>{formatDate(expectedDate)}</Text>
                  </TouchableOpacity>
                </View>

                {/* Date Picker */}
                {showDatePicker && (
                  <DateTimePicker
                    value={expectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )}

                {/* Reason for Move-Out */}
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
                  />
                  <Text style={styles.helperText}>
                    {reason.length}/150 ký tự
                  </Text>
                </View>

                {/* Error Message */}
                {error && (
                  <View style={styles.errorBox}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Submit Button */}
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

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  disabled={loading}
                >
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </ScrollView>

        {/* Warning Confirmation Modal */}
        {showWarningConfirm && warnings.length > 0 && (
          <Modal visible={true} animationType="fade" transparent onRequestClose={() => {}}>
            <View style={styles.warningOverlay}>
              <View style={styles.warningBox}>
                <View style={styles.warningHeader}>
                  <MaterialCommunityIcons name="alert-octagon" size={28} color="#F59E0B" />
                  <Text style={styles.warningTitle}>Cảnh báo</Text>
                </View>

                <ScrollView style={styles.warningContent} showsVerticalScrollIndicator={false}>
                  {warnings.map((warning, index) => (
                    <View key={index} style={styles.warningItem}>
                      <MaterialCommunityIcons
                        name="information-outline"
                        size={16}
                        color="#F59E0B"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.warningMessage}>{warning.message}</Text>
                    </View>
                  ))}

                  <View style={styles.warningConsequence}>
                    <Text style={styles.consequenceLabel}>⚠️ Hậu quả:</Text>
                    <Text style={styles.consequenceText}>
                      Tiền cọc sẽ bị mất. Hóa đơn thanh lý sẽ không hoàn lại tiền cọc.
                    </Text>
                  </View>
                </ScrollView>

                <View style={styles.warningActions}>
                  <TouchableOpacity
                    style={styles.warningCancelBtn}
                    onPress={() => setShowWarningConfirm(false)}
                    disabled={loading}
                  >
                    <Text style={styles.warningCancelBtnText}>Không, quay lại</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.warningConfirmBtn, loading && styles.warningConfirmBtnDisabled]}
                    onPress={handleWarningConfirm}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.warningConfirmBtnText}>Đồng ý tiếp tục</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
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
    fontSize: 18,
    fontWeight: '600',
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
    paddingVertical: 40,
  },
  centerStateText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#FFF',
    fontWeight: '600',
  },
  infoSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  warningFlags: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  warningFlag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  warningFlagText: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '500',
  },
  formSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  textInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    fontSize: 14,
    color: '#1F2937',
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 100,
  },
  helperText: {
    marginTop: 4,
    fontSize: 12,
    color: '#9CA3AF',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    marginBottom: 16,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
  },
  submitBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    marginBottom: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  cancelBtn: {
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    marginBottom: 8,
  },
  cancelBtnText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Warning Modal Styles
  warningOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningBox: {
    width: '85%',
    maxHeight: '80%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
  },
  warningTitle: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  warningContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  warningItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  warningMessage: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  warningConsequence: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
  },
  consequenceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  consequenceText: {
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
  },
  warningActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  warningCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  warningConfirmBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningConfirmBtnDisabled: {
    opacity: 0.6,
  },
  warningConfirmBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
});
