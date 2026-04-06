// PrepaidRentScreen — Chọn hợp đồng/phòng, chọn tháng bắt đầu+kết thúc, xem lịch sử trả trước
import React, { useState, useEffect } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, TouchableOpacity,
    ScrollView, ActivityIndicator, Alert, Modal, FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
    getMyContractForPrepaidAPI,
    createPrepaidRentAPI,
    getPrepaidRentHistoryAPI,
} from '../../services/prepaid_rent.service';

/** Số tháng tròn tính từ paidThrough đến endDate (≥ 0)
 *  paidThrough: rentPaidUntil hoặc startDate  */
const calcMonthsRemaining = (paidThrough, endDate) => {
    if (!endDate) return 0;
    const base = new Date(paidThrough);
    const end = new Date(endDate);
    let m = 0;
    for (let n = 1; n <= 240; n++) {
        const d = new Date(base);
        d.setMonth(d.getMonth() + n);
        if (d > end) break;
        m = n;
    }
    return m;
};

/** Tính số tháng từ startMonthIndex đến endMonthIndex (đều là index = year*12+month)
 *  VD: idx 2026*12+4 → idx 2026*12+6 → 2 tháng  */
const monthsBetweenIndices = (startIdx, endIdx) => Math.max(0, endIdx - startIdx + 1);

/** Chuyển {year, month} → index để so sánh */
const toIdx = (y, m) => y * 12 + m;
/** Chuyển index → {year, month} */
const fromIdx = (idx) => ({ year: Math.floor(idx / 12), month: idx % 12 });
const MONTH_NAMES = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

const fmtMoney = (v) => {
    const n = Number(v);
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number.isFinite(n) ? n : 0);
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const fmtMonthYear = (y, m) => `${MONTH_NAMES[m]} ${y}`;

/** Định dạng khoảng tháng cho lịch sử
 *  VD: endMonth 2026/5, prepaidMonths 2 → "Tháng 5, 6 năm 2026"
 *  VD: endMonth 2027/1, prepaidMonths 4 → "Tháng 11, 12 năm 2026 + Tháng 1 năm 2027" */
const formatPrepaidPeriod = (createdAt, prepaidMonths) => {
    if (!createdAt || !prepaidMonths) return '—';
    // endMonth = tháng tạo request (đã trả đến)
    const endDate = new Date(createdAt);
    const endY = endDate.getFullYear();
    const endM = endDate.getMonth(); // 0-indexed
    const startM = (endM - prepaidMonths + 1 + 12) % 12;
    const startY = endM - prepaidMonths + 1 < 0 ? endY - 1 : endY;

    const fmtMonth = (y, m) => `${MONTH_NAMES[m]} ${y}`;
    const fmtRange = (sy, sm, ey, em) => {
        if (sy === ey) {
            if (sm === em) return fmtMonth(sy, sm);
            return `Tháng ${sm + 1}, ${em + 1} năm ${sy}`;
        }
        return `${fmtMonth(sy, sm)} + ${fmtMonth(ey, em)}`;
    };

    return fmtRange(startY, startM, endY, endM);
};

/* ──────────────── MonthPicker Modal ──────────────── */
function MonthPickerModal({ visible, title, startIdx, endIdx: propEndIdx, minIdx, maxIdx,
    onSelect, onClose }) {
    const [curIdx, setCurIdx] = useState(startIdx ?? minIdx);

    // Reset khi mở
    useEffect(() => { setCurIdx(startIdx ?? minIdx); }, [visible, startIdx]);

    const handleDone = () => {
        onSelect(curIdx);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.monthPickerSheet} onStartShouldSetResponder={() => true}>
                    <View style={styles.monthPickerHeader}>
                        <TouchableOpacity onPress={onClose}><Text style={styles.monthPickerCancel}>Hủy</Text></TouchableOpacity>
                        <Text style={styles.monthPickerTitle}>{title}</Text>
                        <TouchableOpacity onPress={handleDone}><Text style={styles.monthPickerDone}>Xong</Text></TouchableOpacity>
                    </View>
                    <View style={styles.monthPickerBody}>
                        <View style={styles.monthScroll}>
                            {(() => {
                                const rows = [];
                                for (let y = Math.floor(minIdx / 12); y <= Math.ceil(maxIdx / 12); y++) {
                                    for (let m = 0; m < 12; m++) {
                                        const idx = toIdx(y, m);
                                        if (idx < minIdx || idx > maxIdx) continue;
                                        const active = idx === curIdx;
                                        rows.push(
                                            <TouchableOpacity
                                                key={idx}
                                                style={[styles.monthItem, active && styles.monthItemActive]}
                                                onPress={() => setCurIdx(idx)}
                                            >
                                                <Text style={[styles.monthItemText, active && styles.monthItemTextActive]}>
                                                    {MONTH_NAMES[m]} {y}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    }
                                }
                                return rows;
                            })()}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

/* ──────────────── Lịch sử trả trước ──────────────── */
function HistoryCard({ history, contractCode }) {
    // Chỉ hiện lịch sử của phòng/hợp đồng đang được chọn
    const filtered = history.filter(
        (item) => !contractCode || item.contractCode === contractCode
    );
    if (!filtered.length) return null;

    const getStatusStyle = (s) => {
        if (s === 'paid') return { bg: '#D1FAE5', color: '#065F46', icon: 'check-circle', label: 'Đã thanh toán' };
        if (s === 'pending') return { bg: '#FEF3C7', color: '#92400E', icon: 'clock-outline', label: 'Đang chờ' };
        if (s === 'expired') return { bg: '#FEE2E2', color: '#991B1B', icon: 'timer-sand-empty', label: 'Hết hạn' };
        return { bg: '#F3F4F6', color: '#374151', icon: 'help-circle-outline', label: s };
    };

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconWrap, { backgroundColor: '#10B9811A' }]}>
                    <MaterialCommunityIcons name="history" size={18} color="#10B981" />
                </View>
                <Text style={styles.sectionTitle}>Lịch sử trả trước tiền phòng</Text>
            </View>
            {filtered.map((item, idx) => {
                const st = getStatusStyle(item.status);
                const period = formatPrepaidPeriod(item.createdAt, item.prepaidMonths);
                return (
                    <View key={item._id} style={styles.historyItem}>
                        <View style={styles.historyItemLeft}>
                            <View style={[styles.historyDot, { backgroundColor: st.color }]} />
                            <View style={{ flex: 1 }}>
                                <View style={styles.historyHeader}>
                                    <Text style={styles.historyInvoice}>Lần {idx + 1}</Text>
                                    <View style={[styles.historyBadge, { backgroundColor: st.bg }]}>
                                        <MaterialCommunityIcons name={st.icon} size={10} color={st.color} />
                                        <Text style={[styles.historyBadgeText, { color: st.color }]}>{st.label}</Text>
                                    </View>
                                </View>
                                <Text style={styles.historyPeriod}>{period}</Text>
                                <Text style={styles.historyDate}>{fmtDate(item.createdAt)}</Text>
                            </View>
                        </View>
                        <View style={styles.historyRight}>
                            <Text style={styles.historyAmount}>{fmtMoney(item.totalAmount)}</Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

/* ──────────────── Main Screen ──────────────── */
export default function PrepaidRentScreen({ navigation }) {
    const [contracts, setContracts] = useState([]);
    const [selectedContractId, setSelectedContractId] = useState(null);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [history, setHistory] = useState([]);

    // Month picker states
    const [startPickerVisible, setStartPickerVisible] = useState(false);
    const [endPickerVisible, setEndPickerVisible] = useState(false);
    // Chỉ lưu index (year*12+month), không lưu tên
    const [selectedStartIdx, setSelectedStartIdx] = useState(null);
    const [selectedEndIdx, setSelectedEndIdx] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!contracts.length) return;
        if (contracts.length === 1) {
            setSelectedContractId(String(contracts[0].contractId));
        } else {
            setSelectedContractId(null);
        }
    }, [contracts]);

    // Reset month selection when contract changes
    useEffect(() => {
        setSelectedStartIdx(null);
        setSelectedEndIdx(null);
    }, [selectedContractId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [contractRes, historyRes] = await Promise.all([
                getMyContractForPrepaidAPI(),
                getPrepaidRentHistoryAPI(),
            ]);
            if (contractRes.success && contractRes.data) {
                const list = Array.isArray(contractRes.data.contracts)
                    ? contractRes.data.contracts
                    : contractRes.data.contractId ? [contractRes.data] : [];
                if (!list.length) {
                    setError('Không có hợp đồng đang hoạt động.');
                } else {
                    setContracts(list);
                }
            } else {
                setError(contractRes.message || 'Không có hợp đồng đang hoạt động.');
            }
            if (historyRes.success && Array.isArray(historyRes.data)) {
                setHistory(historyRes.data);
            }
        } catch (err) {
            setError(err?.response?.data?.message || err.message || 'Lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const contractData = contracts.find(
        (c) => String(c.contractId) === String(selectedContractId)
    );

    const roomPrice = Number.isFinite(Number(contractData?.room?.roomPrice))
        ? Number(contractData.room.roomPrice) : 0;

    // Tính các tháng còn lại có thể trả trước
    const paidThrough = contractData?.rentPaidUntil
        ? new Date(contractData.rentPaidUntil)
        : contractData?.startDate
            ? new Date(contractData.startDate)
            : new Date();
    const monthsRemaining = contractData
        ? calcMonthsRemaining(paidThrough, contractData.endDate)
        : 0;

    // Tính range picker từ paidThrough (tháng kế tiếp) đến endDate
    const pickerBaseDate = new Date(paidThrough);
    pickerBaseDate.setMonth(pickerBaseDate.getMonth() + 1); // bắt đầu từ tháng sau tháng đã trả
    const pickerMinIdx = toIdx(pickerBaseDate.getFullYear(), pickerBaseDate.getMonth());

    const endDateObj = contractData ? new Date(contractData.endDate) : null;
    const pickerMaxIdx = endDateObj ? toIdx(endDateObj.getFullYear(), endDateObj.getMonth()) : pickerMinIdx;

    // Nếu đã trả full (không còn tháng nào) → disabled
    const fullyPaid = monthsRemaining === 0;

    // Computed total months từ 2 picker
    const totalPrepaidMonths = (selectedStartIdx != null && selectedEndIdx != null)
        ? monthsBetweenIndices(selectedStartIdx, selectedEndIdx)
        : null;
    const totalAmount = totalPrepaidMonths ? totalPrepaidMonths * roomPrice : 0;

    // Validation: chọn phải trong range, end >= start
    const isSelectionValid =
        selectedStartIdx != null &&
        selectedEndIdx != null &&
        selectedEndIdx >= selectedStartIdx &&
        selectedStartIdx >= pickerMinIdx &&
        selectedEndIdx <= pickerMaxIdx;

    const handleConfirm = async () => {
        if (!contractData) {
            Alert.alert('Thông báo', 'Vui lòng chọn phòng / hợp đồng.');
            return;
        }
        if (!isSelectionValid) {
            Alert.alert('Thông báo', 'Vui lòng chọn tháng bắt đầu và kết thúc hợp lệ.');
            return;
        }

        const [sy, sm] = [Math.floor(selectedStartIdx / 12), selectedStartIdx % 12];
        const [ey, em] = [Math.floor(selectedEndIdx / 12), selectedEndIdx % 12];

        Alert.alert(
            'Xác nhận thanh toán',
            `Bạn muốn đóng trước tiền phòng từ ${fmtMonthYear(sy, sm)} đến ${fmtMonthYear(ey, em)}?\n\n` +
            `Số tháng: ${totalPrepaidMonths} tháng\n` +
            `Số tiền: ${fmtMoney(totalAmount)}\n\n` +
            'Hệ thống sẽ tạo mã QR để bạn thanh toán.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xác nhận',
                    onPress: async () => {
                        setSubmitting(true);
                        try {
                            const res = await createPrepaidRentAPI(
                                contractData.contractId,
                                totalPrepaidMonths
                            );
                            if (res.success && res.data) {
                                navigation.navigate('PrepaidRentQR', { paymentData: res.data });
                            } else {
                                Alert.alert('Lỗi', res.message || 'Tạo yêu cầu thất bại.');
                            }
                        } catch (err) {
                            const msg = err?.response?.data?.message || err.message || 'Lỗi khi tạo yêu cầu';
                            Alert.alert('Lỗi', msg);
                        } finally {
                            setSubmitting(false);
                        }
                    },
                },
            ]
        );
    };

    // ─── Loading ───
    if (loading) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#7C3AED" />
                    <Text style={styles.stateText}>Đang tải thông tin hợp đồng...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ─── Error ───
    if (error || !contracts.length) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.center}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#DC2626" />
                    <Text style={[styles.stateText, { color: '#DC2626', marginTop: 12 }]}>
                        {error || 'Không có hợp đồng đang hoạt động.'}
                    </Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.retryBtnText}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const multiContract = contracts.length > 1;
    const showDetails = !!contractData;

    const selectLabel = contractData
        ? `${contractData.room?.name || 'Phòng'} · ${contractData.contractCode || ''}`
        : 'Chọn phòng / hợp đồng';

    // Nhãn cho 2 picker
    const startLabel = selectedStartIdx != null
        ? fmtMonthYear(Math.floor(selectedStartIdx / 12), selectedStartIdx % 12)
        : null;
    const endLabel = selectedEndIdx != null
        ? fmtMonthYear(Math.floor(selectedEndIdx / 12), selectedEndIdx % 12)
        : null;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Trả trước tiền phòng</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Hero */}
                <View style={styles.heroCard}>
                    <View style={styles.heroIconWrap}>
                        <MaterialCommunityIcons name="wallet-outline" size={36} color="#7C3AED" />
                    </View>
                    <Text style={styles.heroTitle}>Thông tin hợp đồng</Text>
                </View>

                {/* Chọn phòng */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconWrap, { backgroundColor: '#6366F11A' }]}>
                            <MaterialCommunityIcons name="home-variant-outline" size={18} color="#6366F1" />
                        </View>
                        <Text style={styles.sectionTitle}>Chọn phòng thanh toán trước</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.selectRow}
                        onPress={() => setPickerVisible(true)}
                        activeOpacity={0.75}
                    >
                        <View style={styles.selectRowInner}>
                            <MaterialCommunityIcons name="format-list-bulleted" size={22} color="#7C3AED" />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.selectHint}>
                                    {multiContract
                                        ? 'Bạn có nhiều hợp đồng — chọn phòng cần đóng trước'
                                        : 'Hợp đồng đang áp dụng'}
                                </Text>
                                <Text
                                    style={[styles.selectValue, !contractData && multiContract && styles.selectValuePlaceholder]}
                                    numberOfLines={2}
                                >
                                    {selectLabel}
                                </Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-down" size={22} color="#6B7280" />
                        </View>
                    </TouchableOpacity>
                </View>

                {multiContract && !contractData && (
                    <View style={styles.hintBanner}>
                        <MaterialCommunityIcons name="information-outline" size={20} color="#92400E" />
                        <Text style={styles.hintBannerText}>
                            Vui lòng chọn một phòng để xem giá và thông tin trả trước.
                        </Text>
                    </View>
                )}

                {showDetails && (
                    <>
                        {/* Thông tin hóa đơn */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIconWrap, { backgroundColor: '#7C3AED1A' }]}>
                                    <MaterialCommunityIcons name="file-document-outline" size={18} color="#7C3AED" />
                                </View>
                                <Text style={styles.sectionTitle}>Thông tin hóa đơn</Text>
                            </View>
                            <InfoRow icon="barcode" label="Mã Hợp Đồng" value={contractData.contractCode} />
                            <InfoRow icon="calendar-check" label="Ngày bắt đầu" value={fmtDate(contractData.startDate)} />
                            <InfoRow icon="calendar-clock" label="Ngày kết thúc" value={fmtDate(contractData.endDate)} />
                            {contractData.rentPaidUntil && (
                                <InfoRow icon="calendar-check" label="Đã trả đến"
                                    value={`${fmtDate(contractData.rentPaidUntil)} — còn ${monthsRemaining} tháng có thể trả`} />
                            )}
                        </View>

                        {/* Thông tin phòng */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIconWrap, { backgroundColor: '#3B82F61A' }]}>
                                    <MaterialCommunityIcons name="home-outline" size={18} color="#3B82F6" />
                                </View>
                                <Text style={styles.sectionTitle}>Thông tin phòng</Text>
                            </View>
                            <InfoRow icon="home-outline" label="Phòng" value={contractData.room?.name} />
                            <InfoRow icon="door-open" label="Loại Phòng" value={contractData.room?.roomTypeName} />
                            <InfoRow icon="currency-usd" label="Giá Phòng" value={fmtMoney(roomPrice)} />
                        </View>

                        {/* Chọn tháng trả trước */}
                        {fullyPaid ? (
                            <View style={styles.section}>
                                <View style={[styles.sectionHeader, { backgroundColor: '#D1FAE5' }]}>
                                    <View style={[styles.sectionIconWrap, { backgroundColor: '#065F46' }]}>
                                        <MaterialCommunityIcons name="check-circle" size={18} color="#FFF" />
                                    </View>
                                    <Text style={[styles.sectionTitle, { color: '#065F46' }]}>
                                        Đã thanh toán toàn bộ hợp đồng
                                    </Text>
                                </View>
                                <View style={styles.fullyPaidBanner}>
                                    <MaterialCommunityIcons name="wallet-giftcard" size={32} color="#065F46" />
                                    <Text style={styles.fullyPaidText}>
                                        Bạn đã thanh toán trước toàn bộ tiền phòng đến ngày kết thúc hợp đồng.
                                        Không còn khoảng trống nào để tiếp tục trả trước.
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <View style={[styles.sectionIconWrap, { backgroundColor: '#F59E0B1A' }]}>
                                        <MaterialCommunityIcons name="calendar-month-outline" size={18} color="#F59E0B" />
                                    </View>
                                    <Text style={styles.sectionTitle}>Chọn tháng trả trước</Text>
                                </View>

                                <Text style={styles.monthHint}>
                                    Có thể đóng trước: {monthsRemaining} tháng
                                    {' · '}Giá mỗi tháng: {fmtMoney(roomPrice)}
                                </Text>

                                {/* Start month picker */}
                                <TouchableOpacity
                                    style={styles.monthPickerRow}
                                    onPress={() => setStartPickerVisible(true)}
                                    activeOpacity={0.75}
                                >
                                    <View style={styles.monthPickerRowInner}>
                                        <MaterialCommunityIcons name="calendar-start" size={22} color="#7C3AED" />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.monthPickerLabel}>Tháng bắt đầu</Text>
                                            <Text style={[styles.monthPickerValue, !startLabel && styles.monthPickerPlaceholder]}>
                                                {startLabel || '— Chọn tháng bắt đầu —'}
                                            </Text>
                                        </View>
                                        <MaterialCommunityIcons name="chevron-down" size={20} color="#6B7280" />
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.monthArrow}>
                                    <MaterialCommunityIcons name="arrow-down-bold" size={20} color="#9CA3AF" />
                                </View>

                                {/* End month picker */}
                                <TouchableOpacity
                                    style={styles.monthPickerRow}
                                    onPress={() => setEndPickerVisible(true)}
                                    activeOpacity={0.75}
                                >
                                    <View style={styles.monthPickerRowInner}>
                                        <MaterialCommunityIcons name="calendar-end" size={22} color="#7C3AED" />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.monthPickerLabel}>Tháng kết thúc</Text>
                                            <Text style={[styles.monthPickerValue, !endLabel && styles.monthPickerPlaceholder]}>
                                                {endLabel || '— Chọn tháng kết thúc —'}
                                            </Text>
                                        </View>
                                        <MaterialCommunityIcons name="chevron-down" size={20} color="#6B7280" />
                                    </View>
                                </TouchableOpacity>

                                {/* Tổng hợp */}
                                {totalPrepaidMonths != null && (
                                    <View style={styles.totalRow}>
                                        <View>
                                            <Text style={styles.totalLabel}>Tổng cộng</Text>
                                            <Text style={styles.totalMonths}>{totalPrepaidMonths} tháng</Text>
                                        </View>
                                        <Text style={styles.totalValue}>{fmtMoney(totalAmount)}</Text>
                                    </View>
                                )}

                                {isSelectionValid && selectedEndIdx < selectedStartIdx && (
                                    <View style={styles.monthErrorBanner}>
                                        <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC2626" />
                                        <Text style={styles.monthErrorText}>Tháng kết thúc phải lớn hơn hoặc bằng tháng bắt đầu.</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </>
                )}

                {/* Lịch sử trả trước — chỉ hiện khi đã chọn phòng */}
                {showDetails && (
                    <HistoryCard history={history} contractCode={contractData?.contractCode} />
                )}

                <View style={{ height: 110 }} />
            </ScrollView>

            {/* Nút xác nhận */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[
                        styles.confirmBtn,
                        (!contractData || !isSelectionValid || submitting || fullyPaid) && styles.confirmBtnDisabled,
                    ]}
                    onPress={handleConfirm}
                    disabled={!contractData || !isSelectionValid || submitting || fullyPaid}
                    activeOpacity={0.85}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="qrcode-scan" size={20} color="#FFF" />
                            <Text style={styles.confirmBtnText}>Xác nhận & Thanh toán QR</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Modal chọn phòng */}
            <Modal
                visible={pickerVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setPickerVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setPickerVisible(false)}
                >
                    <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Chọn hợp đồng</Text>
                        <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
                            {contracts.map((c) => {
                                const id = String(c.contractId);
                                const active = id === String(selectedContractId);
                                const pr = Number(c.room?.roomPrice);
                                return (
                                    <TouchableOpacity
                                        key={id}
                                        style={[styles.modalItem, active && styles.modalItemActive]}
                                        onPress={() => {
                                            setSelectedContractId(id);
                                            setPickerVisible(false);
                                        }}
                                    >
                                        <MaterialCommunityIcons name="door" size={22} color={active ? '#7C3AED' : '#6B7280'} />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.modalItemTitle}>{c.room?.name || 'Phòng'}</Text>
                                            <Text style={styles.modalItemSub}>{c.contractCode} · {fmtMoney(pr)}/tháng</Text>
                                        </View>
                                        {active && <MaterialCommunityIcons name="check-circle" size={22} color="#7C3AED" />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPickerVisible(false)}>
                            <Text style={styles.modalCloseBtnText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Modal chọn tháng bắt đầu */}
            <MonthPickerModal
                visible={startPickerVisible}
                title="Chọn tháng bắt đầu"
                startIdx={selectedStartIdx}
                minIdx={pickerMinIdx}
                maxIdx={selectedEndIdx ?? pickerMaxIdx}
                onSelect={(idx) => {
                    setSelectedStartIdx(idx);
                    // Nếu chưa chọn end hoặc end < start → set end = idx
                    if (selectedEndIdx == null || idx > selectedEndIdx) {
                        setSelectedEndIdx(idx);
                    }
                }}
                onClose={() => setStartPickerVisible(false)}
            />

            {/* Modal chọn tháng kết thúc */}
            <MonthPickerModal
                visible={endPickerVisible}
                title="Chọn tháng kết thúc"
                startIdx={selectedEndIdx}
                minIdx={selectedStartIdx ?? pickerMinIdx}
                maxIdx={pickerMaxIdx}
                onSelect={(idx) => setSelectedEndIdx(idx)}
                onClose={() => setEndPickerVisible(false)}
            />
        </SafeAreaView>
    );
}

/* ──────────────── InfoRow helper ──────────────── */
function InfoRow({ icon, label, value }) {
    return (
        <View style={styles.infoRow}>
            <MaterialCommunityIcons name={icon} size={16} color="#6B7280" style={styles.infoIcon} />
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]}>{value || '—'}</Text>
        </View>
    );
}

/* ──────────────── Styles ──────────────── */
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F3F4F6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    stateText: { marginTop: 8, fontSize: 15, color: '#6B7280', textAlign: 'center' },
    retryBtn: { marginTop: 20, backgroundColor: '#7C3AED', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
    retryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#FFFFFF', paddingVertical: 14, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
    scroll: { paddingBottom: 20 },

    heroCard: {
        backgroundColor: '#FFFFFF', marginHorizontal: 12, marginTop: 14,
        borderRadius: 16, padding: 20, alignItems: 'center', gap: 8,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07, shadowRadius: 4,
    },
    heroIconWrap: {
        width: 72, height: 72, borderRadius: 20,
        backgroundColor: '#7C3AED1A',
        justifyContent: 'center', alignItems: 'center',
    },
    heroTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },

    section: {
        backgroundColor: '#FFFFFF', marginHorizontal: 12, marginTop: 10,
        borderRadius: 14, overflow: 'hidden',
        elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 3,
    },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    sectionIconWrap: {
        width: 32, height: 32, borderRadius: 9,
        justifyContent: 'center', alignItems: 'center',
    },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },

    selectRow: { paddingHorizontal: 4, paddingBottom: 4 },
    selectRowInner: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
    },
    selectHint: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
    selectValue: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
    selectValuePlaceholder: { fontWeight: '600', color: '#9CA3AF' },

    hintBanner: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        marginHorizontal: 12, marginTop: 10,
        padding: 14, backgroundColor: '#FEF3C7', borderRadius: 12,
        borderWidth: 1, borderColor: '#FCD34D',
    },
    hintBannerText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 19 },

    infoRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 11,
        borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
    },
    infoIcon: { marginRight: 10 },
    infoLabel: { fontSize: 13, color: '#6B7280', marginRight: 8 },
    infoValue: { fontSize: 13, fontWeight: '600', color: '#1F2937' },

    monthHint: {
        fontSize: 12, color: '#6B7280',
        paddingHorizontal: 16, paddingVertical: 8,
        backgroundColor: '#F9FAFB',
    },

    /* Month picker rows */
    monthPickerRow: { paddingHorizontal: 16, paddingVertical: 4 },
    monthPickerRowInner: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 12,
    },
    monthPickerLabel: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
    monthPickerValue: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
    monthPickerPlaceholder: { fontWeight: '600', color: '#9CA3AF' },
    monthArrow: { alignItems: 'center', paddingVertical: 4 },

    totalRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: '#F5F3FF',
        borderTopWidth: 1.5, borderTopColor: '#7C3AED',
    },
    totalLabel: { fontSize: 12, color: '#6B7280' },
    totalMonths: { fontSize: 13, fontWeight: '700', color: '#374151' },
    totalValue: { fontSize: 20, fontWeight: '800', color: '#7C3AED' },

    monthErrorBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginHorizontal: 16, marginBottom: 12,
        padding: 10, backgroundColor: '#FEE2E2', borderRadius: 8,
    },
    monthErrorText: { flex: 1, fontSize: 12, color: '#991B1B' },

    /* Fully paid */
    fullyPaidBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 16, backgroundColor: '#F0FDF4',
    },
    fullyPaidText: { flex: 1, fontSize: 13, color: '#065F46', lineHeight: 19 },

    /* History */
    historyItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
    },
    historyItemLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
    historyDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
    historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    historyInvoice: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
    historyPeriod: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 2 },
    historyDate: { fontSize: 12, color: '#9CA3AF' },
    historyRight: { alignItems: 'flex-end', justifyContent: 'center' },
    historyAmount: { fontSize: 16, fontWeight: '800', color: '#7C3AED' },
    historyBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    },
    historyBadgeText: { fontSize: 10, fontWeight: '700' },

    /* Bottom bar */
    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12,
        borderTopWidth: 1, borderTopColor: '#E5E7EB',
        elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08, shadowRadius: 6,
    },
    confirmBtn: {
        backgroundColor: '#7C3AED', borderRadius: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 14,
    },
    confirmBtnDisabled: { backgroundColor: '#D1D5DB' },
    confirmBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

    /* Modal */
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        paddingTop: 16, paddingBottom: 24, maxHeight: '72%',
    },
    modalTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937', paddingHorizontal: 20, marginBottom: 8 },
    modalList: { maxHeight: 360 },
    modalItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    modalItemActive: { backgroundColor: '#F5F3FF' },
    modalItemTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
    modalItemSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    modalCloseBtn: {
        marginTop: 8, marginHorizontal: 20, paddingVertical: 14,
        alignItems: 'center', borderRadius: 12, backgroundColor: '#F3F4F6',
    },
    modalCloseBtnText: { fontSize: 16, fontWeight: '600', color: '#374151' },

    /* Month picker modal */
    monthPickerSheet: {
        backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        paddingBottom: 24,
    },
    monthPickerHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    },
    monthPickerCancel: { fontSize: 16, color: '#DC2626' },
    monthPickerTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
    monthPickerDone: { fontSize: 16, fontWeight: '700', color: '#7C3AED' },
    monthPickerBody: { paddingVertical: 8 },
    monthScroll: {
        flexDirection: 'row', flexWrap: 'wrap',
        paddingHorizontal: 12, paddingVertical: 8,
        maxHeight: 300,
    },
    monthItem: {
        width: '30%', marginHorizontal: '1.5%',
        marginVertical: 4,
        paddingVertical: 10, paddingHorizontal: 8,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    monthItemActive: { backgroundColor: '#7C3AED' },
    monthItemText: { fontSize: 12, fontWeight: '600', color: '#374151', textAlign: 'center' },
    monthItemTextActive: { color: '#FFF' },
});
