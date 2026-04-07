// Create Move-Out Request Screen – Modal Dialog
// Khớp với backend 5-bước: Requested → InvoiceReleased → Paid → Completed
// Hỗ trợ Gap Contract: người thuê gap contract luôn được hoàn cọc
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
import {
  getContractMoveOutInfoAPI,
  createMoveOutRequestAPI,
  getMyMoveOutRequestAPI,
  getMoveOutDepositVsInvoiceAPI,
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

const getRefundTicketStatusLabel = (status) => {
  const normalized = String(status || '').toLowerCase();

  if (['paid', 'completed', 'success', 'done'].includes(normalized)) {
    return 'Đã chi';
  }
  if (['pending', 'waiting', 'processing'].includes(normalized)) {
    return 'Đang xử lý';
  }
  if (['cancelled', 'canceled', 'rejected', 'failed'].includes(normalized)) {
    return 'Đã hủy';
  }

  return status || 'Chưa cập nhật';
};

const getRefundTicketStatusColor = (status) => {
  const normalized = String(status || '').toLowerCase();

  if (['paid', 'completed', 'success', 'done'].includes(normalized)) return '#10B981';
  if (['pending', 'waiting', 'processing'].includes(normalized)) return '#F59E0B';
  if (['cancelled', 'canceled', 'rejected', 'failed'].includes(normalized)) return '#DC2626';

  return '#6B7280';
};

const getGapContractBadge = (isGapContract) => {
  if (!isGapContract) return null;
  return (
    <View style={styles.gapContractBadge}>
      <MaterialCommunityIcons name="shield-check" size={15} color="#059669" />
      <Text style={styles.gapContractBadgeText}>Gap Contract – Được bảo vệ hoàn cọc</Text>
    </View>
  );
};

const getPaymentVoucherDisplay = (paymentVoucher) => {
  if (!paymentVoucher) return null;
  if (typeof paymentVoucher === 'string') return paymentVoucher;

  if (typeof paymentVoucher === 'object') {
    return (
      paymentVoucher.voucherCode ||
      paymentVoucher.code ||
      paymentVoucher.referenceCode ||
      paymentVoucher.transactionCode ||
      paymentVoucher._id ||
      'Đã tạo'
    );
  }

  return String(paymentVoucher);
};

const DAY_IN_MS = 1000 * 60 * 60 * 24;
const NOTICE_DAYS_REQUIRED = 30;
const MIN_STAY_MONTHS_REQUIRED = 6;
const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];
const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const normalizeDateOnly = (value) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getMinMoveOutDate = () => {
  const minDate = normalizeDateOnly(new Date());
  minDate.setDate(minDate.getDate() + 1);
  return minDate;
};

const calculateFullMonthsBetween = (startDate, endDate) => {
  const start = normalizeDateOnly(startDate);
  const end = normalizeDateOnly(endDate);

  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());

  if (end.getDate() < start.getDate()) {
    months -= 1;
  }

  return Math.max(0, months);
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CreateMoveOutRequestModal({
  visible,
  contractId,
  onClose,
  onSuccess,
}) {
  const initialMinExpectedDate = getMinMoveOutDate();
  const [loading, setLoading] = useState(false);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [contractInfo, setContractInfo] = useState(null);
  const [existingRequest, setExistingRequest] = useState(null);
  const [depositVsInvoice, setDepositVsInvoice] = useState(null);
  const [fetchingDepositVsInvoice, setFetchingDepositVsInvoice] = useState(false);
  const [expectedDate, setExpectedDate] = useState(() => initialMinExpectedDate);
  const [showDateModal, setShowDateModal] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  // deposit-forfeiture preview (client-side estimate shown before submit)
  const [depositWarning, setDepositWarning] = useState(null);
  const [calYear, setCalYear] = useState(initialMinExpectedDate.getFullYear());
  const [calMonth, setCalMonth] = useState(initialMinExpectedDate.getMonth());

  // ── Fetch on open ──
  useEffect(() => {
    if (visible) {
      fetchContractInfo();
      fetchExistingRequest();
      const minDate = getMinMoveOutDate();
      setExpectedDate(minDate);
      setCalYear(minDate.getFullYear());
      setCalMonth(minDate.getMonth());
      setReason('');
      setError(null);
      setDepositWarning(null);
      setDepositVsInvoice(null);
      setFetchingDepositVsInvoice(false);
      setShowDateModal(false);
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
      const requestData = res && (res._id || res.id) ? res : null;

      setExistingRequest(requestData);

      if (requestData?._id || requestData?.id) {
        const moveOutRequestId = requestData._id || requestData.id;
        await fetchDepositVsInvoice(moveOutRequestId);
      } else {
        setDepositVsInvoice(null);
      }
    } catch {
      setExistingRequest(null);
      setDepositVsInvoice(null);
      setFetchingDepositVsInvoice(false);
    }
  };

  const fetchDepositVsInvoice = async (moveOutRequestId) => {
    if (!moveOutRequestId) {
      setDepositVsInvoice(null);
      return;
    }

    setFetchingDepositVsInvoice(true);
    try {
      const res = await getMoveOutDepositVsInvoiceAPI(moveOutRequestId);
      setDepositVsInvoice(res || null);
    } catch (err) {
      // Endpoint may not be available at early move-out stages; hide section silently.
      if (err?.status === 404 || err?.response?.status === 404) {
        setDepositVsInvoice(null);
        return;
      }
      setDepositVsInvoice(null);
    } finally {
      setFetchingDepositVsInvoice(false);
    }
  };

  useEffect(() => {
    if (visible && contractInfo?.startDate) {
      computeDepositWarning(expectedDate);
    }
  }, [visible, contractInfo, contractInfo?.isGapContract, expectedDate]);

  const evaluateDepositRisk = (date) => {
    if (!contractInfo?.startDate) return null;

    const todayDateOnly = normalizeDateOnly(new Date());
    const moveOutDateOnly = normalizeDateOnly(date);
    const startDateOnly = normalizeDateOnly(contractInfo.startDate);

    // Tính thời gian ở từ startDate → today (requestDate)
    const stayMonths = calculateFullMonthsBetween(startDateOnly, todayDateOnly);
    const stayDays = Math.floor(
      (todayDateOnly - startDateOnly) / DAY_IN_MS
    );

    const isUnderMinStayByMonth = stayMonths < MIN_STAY_MONTHS_REQUIRED;
    const isUnderMinStayByDay = stayDays < MIN_STAY_MONTHS_REQUIRED * 30;
    const isUnderMinStay = isUnderMinStayByMonth && isUnderMinStayByDay;

    // Tính khoảng cách từ today (requestDate) → endDate (phải >= 30 ngày)
    let daysBeforeContractEnd = null;
    let isEarlyNotice = false;

    if (contractInfo?.endDate) {
      const endDateOnly = normalizeDateOnly(contractInfo.endDate);
      daysBeforeContractEnd = Math.floor((endDateOnly - todayDateOnly) / DAY_IN_MS);
      isEarlyNotice = daysBeforeContractEnd < NOTICE_DAYS_REQUIRED;
    }

    return {
      daysBeforeContractEnd,
      stayMonths,
      stayDays,
      isEarlyNotice,
      isUnderMinStay,
    };
  };

  // Client-side preview: tính trước cảnh báo mất cọc để hiện inline
  // Gap contract: KHÔNG bao giờ hiện cảnh báo mất cọc
  const computeDepositWarning = (date) => {
    // Nếu là gap contract → không bao giờ hiện warning mất cọc
    if (contractInfo?.isGapContract) {
      setDepositWarning(null);
      return { warnings: [], isEarlyNotice: false, isUnderMinStay: false };
    }

    const risk = evaluateDepositRisk(date);
    if (!risk) {
      setDepositWarning(null);
      return { warnings: [], isEarlyNotice: false, isUnderMinStay: false };
    }

    const warnings = [];
    if (risk.isEarlyNotice) {
      warnings.push(
        `Ngày yêu cầu trả phòng cách ngày kết thúc hợp đồng ${risk.daysBeforeContractEnd ?? 0} ngày, chưa đủ tối thiểu ${NOTICE_DAYS_REQUIRED} ngày báo trước. Bạn có thể bị mất cọc.`
      );
    }
    if (risk.isUnderMinStay) {
      warnings.push(
        `Bạn sẽ không được hoàn cọc vì thời gian ở tính đến ngày yêu cầu là ${risk.stayMonths} tháng (${risk.stayDays} ngày), chưa đủ ${MIN_STAY_MONTHS_REQUIRED} tháng.`
      );
    }

    setDepositWarning(warnings.length > 0 ? warnings : null);
    return {
      warnings,
      isEarlyNotice: risk.isEarlyNotice,
      isUnderMinStay: risk.isUnderMinStay,
    };
  };

  const getResponseCandidates = (response) => {
    const candidates = [response, response?.data, response?.data?.data].filter(
      (item) => item && typeof item === 'object'
    );

    return candidates.filter((item, index) => candidates.indexOf(item) === index);
  };

  const getMaxExpectedDate = () => {
    if (!contractInfo?.endDate) return null;
    // Cho phép expectedMoveOutDate bằng endDate (không cần -1 ngày nữa)
    return normalizeDateOnly(contractInfo.endDate);
  };

  const minExpectedDate = getMinMoveOutDate();
  const maxExpectedDate = getMaxExpectedDate();
  const safeMaximumDate = maxExpectedDate || undefined;

  const buildCalendarDays = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i += 1) cells.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
    return cells;
  };

  const isSelectableDate = (date) => {
    const normalized = normalizeDateOnly(date);
    if (normalized < minExpectedDate) return false;
    if (safeMaximumDate && normalized > safeMaximumDate) return false;
    return true;
  };

  const openDateModal = () => {
    const baseDate = normalizeDateOnly(expectedDate);
    setCalYear(baseDate.getFullYear());
    setCalMonth(baseDate.getMonth());
    setShowDateModal((prev) => !prev);
  };

  const onCalendarDayPress = (day) => {
    if (!day) return;
    const pickedDate = new Date(calYear, calMonth, day);
    pickedDate.setHours(0, 0, 0, 0);
    if (!isSelectableDate(pickedDate)) return;
    setExpectedDate(pickedDate);
    setShowDateModal(false);
  };

  const prevMonth = () => {
    const prev = new Date(calYear, calMonth - 1, 1);
    const minMonth = new Date(minExpectedDate.getFullYear(), minExpectedDate.getMonth(), 1);
    if (prev < minMonth) return;
    setCalYear(prev.getFullYear());
    setCalMonth(prev.getMonth());
  };

  const nextMonth = () => {
    const next = new Date(calYear, calMonth + 1, 1);
    if (safeMaximumDate) {
      const maxMonth = new Date(safeMaximumDate.getFullYear(), safeMaximumDate.getMonth(), 1);
      if (next > maxMonth) return;
    }
    setCalYear(next.getFullYear());
    setCalMonth(next.getMonth());
  };

  const currentMonthDate = new Date(calYear, calMonth, 1);
  const minMonthDate = new Date(minExpectedDate.getFullYear(), minExpectedDate.getMonth(), 1);
  const maxMonthDate = safeMaximumDate
    ? new Date(safeMaximumDate.getFullYear(), safeMaximumDate.getMonth(), 1)
    : null;
  const disablePrevMonth = currentMonthDate <= minMonthDate;
  const disableNextMonth = maxMonthDate ? currentMonthDate >= maxMonthDate : false;

  // ── Validation ──
  const validateForm = () => {
    if (!contractInfo) {
      Alert.alert('Lỗi', 'Không có thông tin hợp đồng để tạo yêu cầu trả phòng');
      return false;
    }

    if (contractInfo.status && contractInfo.status.toLowerCase() !== 'active') {
      Alert.alert('Lỗi', `Hợp đồng không ở trạng thái hoạt động (hiện tại: ${contractInfo.status})`);
      return false;
    }

    if (existingRequest?._id || existingRequest?.id) {
      Alert.alert('Lỗi', 'Hợp đồng này đã có yêu cầu trả phòng. Mỗi hợp đồng chỉ tạo được một yêu cầu.');
      return false;
    }

    if (!reason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do trả phòng');
      return false;
    }
    if (reason.trim().length < 10) {
      Alert.alert('Lỗi', 'Lý do phải có ít nhất 10 ký tự');
      return false;
    }
    const moveOutDateOnly = normalizeDateOnly(expectedDate);
    if (moveOutDateOnly < minExpectedDate) {
      Alert.alert('Lỗi', 'Ngày trả phòng phải từ ngày mai trở đi');
      return false;
    }

    if (contractInfo.endDate) {
      const endDateOnly = normalizeDateOnly(contractInfo.endDate);

      if (moveOutDateOnly > endDateOnly) {
        Alert.alert(
          'Lỗi',
          `Ngày trả phòng (${formatDate(moveOutDateOnly)}) không được muộn hơn ngày kết thúc hợp đồng (${formatDate(endDateOnly)})`
        );
        return false;
      }
    }

    return true;
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!validateForm()) return;

    submitRequest(false);
  };

  const submitRequest = async (confirmContinue = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await createMoveOutRequestAPI({
        contractId,
        expectedMoveOutDate: expectedDate.toISOString(),
        reason: reason.trim(),
        confirmContinue,
      });

      const responseCandidates = getResponseCandidates(response);
      const confirmationPayload = responseCandidates.find(
        (item) => item?.requiresConfirmation === true
      );

      if (confirmationPayload) {
        const warnings = confirmationPayload.warnings || [];

        // Kiểm tra có gap contract warning không
        const gapContractWarning = warnings.find(
          (w) => w?.type === 'gap_contract_deposit_protection' || String(w?.message || '').toLowerCase().includes('gap contract')
        );
        const isGapContractWarning = Boolean(gapContractWarning);

        const warningMessages = warnings
          .map((warning) => (typeof warning === 'string' ? warning : warning?.message))
          .filter(Boolean);

        const confirmationText = warningMessages.length > 0
          ? warningMessages.join('\n\n')
          : 'Yêu cầu của bạn có thể bị mất cọc. Bạn có chắc chắn muốn tiếp tục?';

        Alert.alert(
          isGapContractWarning ? '✅ Thông tin hoàn cọc' : '⚠️ Cảnh báo hoàn cọc',
          isGapContractWarning
            ? `${confirmationText}\n\nBạn có muốn tiếp tục tạo yêu cầu trả phòng không?`
            : `${confirmationText}\n\nNếu đồng ý tiếp tục, hệ thống sẽ tính "Tiền cọc hoàn = 0" vào hóa đơn thanh lý.`,
          [
            { text: 'Quay lại', style: 'cancel' },
            {
              text: 'Đồng ý tiếp tục',
              style: isGapContractWarning ? 'default' : 'destructive',
              onPress: () => submitRequest(true),
            },
          ]
        );
        return;
      }

      const data =
        responseCandidates
          .map((item) => item?.moveOutRequest)
          .find((item) => item && typeof item === 'object') ||
        responseCandidates.find((item) => item?._id || item?.id) ||
        response;

      const successMessage =
        response?.message || response?.data?.message || 'Yêu cầu trả phòng đã được gửi thành công.';

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
      const errorCandidates = getResponseCandidates(err?.response?.data || err?.data || err);
      const confirmationFromError = errorCandidates.find(
        (item) => item?.requiresConfirmation === true
      );

      if (confirmationFromError) {
        const warnings = confirmationFromError.warnings || [];

        // Kiểm tra có gap contract warning không
        const gapContractWarning = warnings.find(
          (w) => w?.type === 'gap_contract_deposit_protection' || String(w?.message || '').toLowerCase().includes('gap contract')
        );
        const isGapContractWarning = Boolean(gapContractWarning);

        const warningMessages = warnings
          .map((warning) => (typeof warning === 'string' ? warning : warning?.message))
          .filter(Boolean);

        const confirmationText = warningMessages.length > 0
          ? warningMessages.join('\n\n')
          : 'Yêu cầu của bạn có thể bị mất cọc. Bạn có chắc chắn muốn tiếp tục?';

        Alert.alert(
          isGapContractWarning ? '✅ Thông tin hoàn cọc' : '⚠️ Cảnh báo hoàn cọc',
          isGapContractWarning
            ? `${confirmationText}\n\nBạn có muốn tiếp tục tạo yêu cầu trả phòng không?`
            : `${confirmationText}\n\nNếu đồng ý tiếp tục, hệ thống sẽ tính "Tiền cọc hoàn = 0" vào hóa đơn thanh lý.`,
          [
            { text: 'Quay lại', style: 'cancel' },
            {
              text: 'Đồng ý tiếp tục',
              style: isGapContractWarning ? 'default' : 'destructive',
              onPress: () => submitRequest(true),
            },
          ]
        );
        return;
      }

      const msg = err?.response?.data?.message || err?.message || 'Không thể tạo yêu cầu trả phòng';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const minDate = getMinMoveOutDate();
    setReason('');
    setExpectedDate(minDate);
    setCalYear(minDate.getFullYear());
    setCalMonth(minDate.getMonth());
    setError(null);
    setDepositWarning(null);
    setShowDateModal(false);
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
    const hasRefundToTenant = typeof depositVsInvoice?.refundToTenant === 'number';
    const refundTicket = depositVsInvoice?.refundTicket;
    const hasRefundTicket = Boolean(refundTicket);
    const paymentVoucherDisplay = getPaymentVoucherDisplay(refundTicket?.paymentVoucher);

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

          {/* Gap Contract protection badge */}
          {getGapContractBadge(req.isGapContract)}

          {/* Basic info */}
          <View style={styles.infoBox}>
            <InfoRow label="Ngày yêu cầu" value={formatDate(req.requestDate)} />
            <InfoRow label="Ngày dự kiến trả phòng" value={formatDate(req.expectedMoveOutDate)} />
            <InfoRow label="Lý do" value={req.reason} isLast={!req.isEarlyNotice && !req.isUnderMinStay && !req.isDepositForfeited} />

            {/* Deposit warning flags */}
            {(req.isEarlyNotice || req.isUnderMinStay || req.isGapContract) && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.warningFlags}>
                  {req.isGapContract && (
                    <View style={[styles.warningFlag, { backgroundColor: '#ECFDF5', borderRadius: 6, padding: 8 }]}>
                      <MaterialCommunityIcons name="shield-check" size={15} color="#059669" />
                      <Text style={[styles.warningFlagText, { color: '#059669' }]}>
                        Bạn là người thuê Gap Contract – Luôn được hoàn cọc khi trả phòng
                      </Text>
                    </View>
                  )}
                  {req.isEarlyNotice && (
                    <View style={styles.warningFlag}>
                      <MaterialCommunityIcons name="alert-outline" size={15} color="#F59E0B" />
                      <Text style={styles.warningFlagText}>Ngày trả phòng chưa trước ngày kết thúc 30 ngày</Text>
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

        {/* Deposit vs invoice result */}
        {(fetchingDepositVsInvoice || hasRefundToTenant || hasRefundTicket) && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>💰 Hoàn cọc cho tenant</Text>
            <View style={styles.infoBox}>
              {fetchingDepositVsInvoice ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text style={styles.loadingText}>Đang tính số tiền hoàn cọc...</Text>
                </View>
              ) : (
                <>
                  <InfoRow
                    label="Số tiền được hoàn"
                    value={
                      hasRefundToTenant
                        ? formatCurrency(depositVsInvoice.refundToTenant)
                        : 'Đang cập nhật'
                    }
                    valueStyle={{
                      color: hasRefundToTenant
                        ? depositVsInvoice.refundToTenant > 0
                          ? '#10B981'
                          : '#6B7280'
                        : '#6B7280',
                      fontWeight: '700',
                    }}
                    isLast={!hasRefundTicket}
                  />

                  {hasRefundTicket && (
                    <>
                      <InfoRow
                        label="Số tiền phiếu chi"
                        value={
                          refundTicket?.amount != null
                            ? formatCurrency(refundTicket.amount)
                            : '—'
                        }
                      />
                      <InfoRow
                        label="Trạng thái phiếu chi"
                        value={getRefundTicketStatusLabel(refundTicket?.status)}
                        valueStyle={{
                          color: getRefundTicketStatusColor(refundTicket?.status),
                          fontWeight: '700',
                        }}
                        isLast={!paymentVoucherDisplay}
                      />
                      {paymentVoucherDisplay && (
                        <InfoRow
                          label="Chứng từ chi"
                          value={paymentVoucherDisplay}
                          isLast
                        />
                      )}
                    </>
                  )}
                </>
              )}
            </View>
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
        {/* Gap Contract badge */}
        {getGapContractBadge(contractInfo?.isGapContract)}
      </View>

      {/* Form */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Thông tin trả phòng</Text>

        {contractInfo?.endDate && (
          <View style={styles.ruleHintBox}>
            <MaterialCommunityIcons name="information-outline" size={16} color="#1D4ED8" />
            <Text style={styles.ruleHintText}>
              Ngày trả phòng dự kiến phải nhỏ hơn ngày hết hạn hợp đồng ({formatDate(contractInfo.endDate)}).
            </Text>
          </View>
        )}

        {/* Expected date */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Ngày trả phòng dự kiến <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.datePickerBtn, showDateModal && styles.datePickerBtnSelected]}
            onPress={openDateModal}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="calendar" size={20} color="#F59E0B" />
            <Text style={[styles.datePickerText, styles.datePickerTextSelected]}>
              {formatDate(expectedDate)}
            </Text>
            <MaterialCommunityIcons
              name={showDateModal ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#F59E0B"
            />
          </TouchableOpacity>
          <Text style={styles.helperText}>Chọn ngày từ ngày mai và trước ngày kết thúc hợp đồng</Text>

          {showDateModal && (
            <View style={styles.calendarContainerInline}>
              <View style={styles.calMonthRow}>
                <TouchableOpacity
                  onPress={prevMonth}
                  style={[styles.calNavBtn, disablePrevMonth && styles.calNavBtnDisabled]}
                  disabled={disablePrevMonth}
                >
                  <MaterialCommunityIcons
                    name="chevron-left"
                    size={28}
                    color={disablePrevMonth ? '#D1D5DB' : '#1F2937'}
                  />
                </TouchableOpacity>

                <Text style={styles.calMonthText}>{MONTH_NAMES[calMonth]} {calYear}</Text>

                <TouchableOpacity
                  onPress={nextMonth}
                  style={[styles.calNavBtn, disableNextMonth && styles.calNavBtnDisabled]}
                  disabled={disableNextMonth}
                >
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={28}
                    color={disableNextMonth ? '#D1D5DB' : '#1F2937'}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.calDayHeaderRow}>
                {DAY_NAMES.map((d) => (
                  <Text key={d} style={[styles.calDayHeader, d === 'CN' && { color: '#EF4444' }]}>{d}</Text>
                ))}
              </View>

              <View style={styles.calGrid}>
                {buildCalendarDays(calYear, calMonth).map((day, index) => {
                  if (!day) {
                    return <View key={`empty-${index}`} style={styles.calCell} />;
                  }

                  const cellDate = new Date(calYear, calMonth, day);
                  cellDate.setHours(0, 0, 0, 0);

                  const isDisabled = !isSelectableDate(cellDate);
                  const isFirstSelectableDay = cellDate.getTime() === minExpectedDate.getTime();
                  const isSelected =
                    cellDate.getTime() === normalizeDateOnly(expectedDate).getTime();
                  const isSunday = cellDate.getDay() === 0;

                  return (
                    <TouchableOpacity
                      key={`day-${calYear}-${calMonth}-${day}`}
                      style={[
                        styles.calCell,
                        isFirstSelectableDay && styles.calCellToday,
                        isSelected && styles.calCellSelected,
                        isDisabled && styles.calCellDisabled,
                      ]}
                      onPress={() => onCalendarDayPress(day)}
                      disabled={isDisabled}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.calDayText,
                          isSunday && styles.calDaySunday,
                          isFirstSelectableDay && styles.calDayTextToday,
                          isSelected && styles.calDayTextSelected,
                          isDisabled && styles.calDayTextDisabled,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.calSelectedInfo}>
                <MaterialCommunityIcons name="calendar-check" size={16} color="#F59E0B" />
                <Text style={styles.calSelectedText}>Đã chọn: {formatDate(expectedDate)}</Text>
              </View>
            </View>
          )}
        </View>

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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
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

  // ── Gap Contract Badge ──
  gapContractBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  gapContractBadgeText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '700',
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
  ruleHintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  ruleHintText: {
    flex: 1,
    fontSize: 12,
    color: '#1D4ED8',
    lineHeight: 18,
  },
  formGroup: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  required: { color: '#EF4444' },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 13,
    paddingHorizontal: 12,
  },
  datePickerBtnSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  datePickerText: {
    flex: 1,
    fontSize: 14,
    color: '#9CA3AF',
  },
  datePickerTextSelected: {
    color: '#1F2937',
    fontWeight: '500',
  },
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

  // ── Date modal and calendar ──
  calendarContainer: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  calendarContainerInline: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  calMonthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  calNavBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  calNavBtnDisabled: {
    backgroundColor: '#F3F4F6',
  },
  calMonthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  calDayHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  calDayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 8,
  },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  calCellToday: {
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  calCellSelected: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
  },
  calCellDisabled: {
    opacity: 0.35,
  },
  calDayText: {
    fontSize: 14,
    color: '#1F2937',
  },
  calDaySunday: {
    color: '#EF4444',
  },
  calDayTextToday: {
    fontWeight: '700',
    color: '#D97706',
  },
  calDayTextSelected: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  calDayTextDisabled: {
    color: '#D1D5DB',
  },
  calSelectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  calSelectedText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#92400E',
  },

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
