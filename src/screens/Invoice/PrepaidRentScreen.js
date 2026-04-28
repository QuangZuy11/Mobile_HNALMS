// PrepaidRentScreen — Chọn tháng trả trước tiền phòng, chỉ cần chọn tháng cuối cùng
import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, TouchableOpacity,
    ScrollView, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
    getMyContractForPrepaidAPI,
    createPrepaidRentAPI,
} from '../../services/prepaid_rent.service';

const fmtMoney = (v) => {
    const n = Number(v);
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number.isFinite(n) ? n : 0);
};
const fmtDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
};

const MONTH_NAMES_SHORT = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

/** Chuyển {year, month} → index = year*12+month */
const toIdx = (y, m) => y * 12 + m;
/** Format hiển thị "Tháng M YYYY" */
const fmtMonthDisplay = (y, m) => `${MONTH_NAMES_SHORT[m]} ${y}`;

/* ──────────────── Main Screen ──────────────── */
function MonthPickerModal({ visible, title, minIdx, maxIdx, initialIdx,
    availableMonths, selectedIdx, onSelect, onClose }) {
    const [curIdx, setCurIdx] = useState(initialIdx ?? minIdx);

    useEffect(() => {
        if (visible) setCurIdx(initialIdx ?? minIdx);
    }, [visible, initialIdx, minIdx]);

    // Render các nút tháng grid 3 cột
    const renderMonthButtons = () => {
        const rows = [];
        for (let y = Math.floor(minIdx / 12); y <= Math.ceil(maxIdx / 12); y++) {
            for (let m = 0; m < 12; m++) {
                const idx = toIdx(y, m);
                if (idx < minIdx || idx > maxIdx) continue;

                // Kiểm tra xem tháng này có trong danh sách available không
                const isAvailable = !availableMonths || availableMonths.length === 0 || availableMonths.includes(idx);
                const isSelected = idx === curIdx;

                rows.push(
                    <TouchableOpacity
                        key={idx}
                        style={[
                            styles.monthItem,
                            isSelected && styles.monthItemActive,
                            !isAvailable && styles.monthItemDisabled,
                        ]}
                        onPress={() => isAvailable && setCurIdx(idx)}
                        disabled={!isAvailable}
                        activeOpacity={0.7}
                    >
                        <Text style={[
                            styles.monthItemText,
                            isSelected && styles.monthItemTextActive,
                            !isAvailable && styles.monthItemTextDisabled,
                        ]}>
                            {MONTH_NAMES_SHORT[m]} {y}
                        </Text>
                    </TouchableOpacity>
                );
            }
        }
        return rows;
    };

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
                        <ScrollView style={styles.monthScrollView} showsVerticalScrollIndicator={false}>
                            <View style={styles.monthScroll}>
                                {renderMonthButtons()}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

/* ──────────────── PrepaidMonthItem (hiển thị từng tháng như InvoiceDetailScreen) ──────────────── */
function PrepaidMonthItem({ label }) {
    return (
        <View style={styles.prepaidMonthItem}>
            <Text style={styles.prepaidMonthDot}>•</Text>
            <Text style={styles.prepaidMonthText}>{label}</Text>
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

    // Chỉ 1 picker: chọn tháng kết thúc trả trước
    const [endPickerVisible, setEndPickerVisible] = useState(false);
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

    // Reset khi đổi hợp đồng
    useEffect(() => {
        setSelectedEndIdx(null);
    }, [selectedContractId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const contractRes = await getMyContractForPrepaidAPI();
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

    // ─── Logic generate tháng có thể chọn ───
    const {
        availableMonths,    // mảng idx các tháng được phép chọn
        minAvailableIdx,    // idx nhỏ nhất
        maxAvailableIdx,    // idx lớn nhất
        fullyPaid,
        insufficientMonths, // HĐ >=6 tháng nhưng monthsRemaining < minPrepaidMonths
    } = useMemo(() => {
        if (!contractData) return { availableMonths: [], minAvailableIdx: 0, maxAvailableIdx: 0, fullyPaid: false };

        const rentPaidUntilDate = contractData.rentPaidUntil
            ? new Date(contractData.rentPaidUntil)
            : new Date(contractData.startDate);
        const endDate = new Date(contractData.endDate);

        // Normalize rentPaidUntil về ngày 1 UTC để tránh timezone overflow
        const normalizedPaidThrough = new Date(rentPaidUntilDate);
        normalizedPaidThrough.setUTCDate(1);
        normalizedPaidThrough.setUTCHours(0, 0, 0, 0);

        // rentPaidUntil → tháng kế tiếp (tháng đầu tiên có thể trả trước)
        const firstPayableMonth = new Date(normalizedPaidThrough);
        firstPayableMonth.setUTCMonth(firstPayableMonth.getUTCMonth() + 1);
        firstPayableMonth.setUTCDate(1);

        // Tháng kết thúc: tháng trước tháng của endDate (vì endDate không phải cuối tháng)
        const normalizedEnd = new Date(endDate);
        normalizedEnd.setUTCDate(1);
        normalizedEnd.setUTCHours(0, 0, 0, 0);
        const endMonthDate = new Date(normalizedEnd);
        endMonthDate.setUTCMonth(endMonthDate.getUTCMonth() - 1);

        // Luôn đảm bảo tối thiểu minPrepaidMonths tháng → bắt đầu từ tháng thứ minPrepaidMonths
        const minPrepaid = contractData.minPrepaidMonths || 1;
        const minMonthsLater = new Date(firstPayableMonth);
        minMonthsLater.setUTCMonth(minMonthsLater.getUTCMonth() + minPrepaid - 1);

        // Không chọn tháng quá khứ (trước tháng hiện tại)
        const now = new Date();
        const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

        // Xác định minIdx thực tế = max(minMonths, tháng hiện tại)
        const minCandidate = minMonthsLater > currentMonth ? minMonthsLater : currentMonth;
        const effectiveMin = minCandidate < endMonthDate ? minCandidate : endMonthDate;

        const minIdx = toIdx(effectiveMin.getUTCFullYear(), effectiveMin.getUTCMonth());
        const maxIdx = toIdx(endMonthDate.getUTCFullYear(), endMonthDate.getUTCMonth());

        if (minIdx > maxIdx) {
            return { availableMonths: [], minAvailableIdx: minIdx, maxAvailableIdx: maxIdx, fullyPaid: true, insufficientMonths: false };
        }

        // Kiểm tra HĐ >= 6 tháng nhưng số tháng còn lại không đủ minPrepaidMonths tháng
        const startIdx = toIdx(firstPayableMonth.getUTCFullYear(), firstPayableMonth.getUTCMonth());
        const monthsRemaining = maxIdx - startIdx + 1;
        const insufficient = minPrepaid >= 3 && monthsRemaining < 3;

        // Tạo mảng tất cả các tháng hợp lệ (đủ minPrepaidMonths tháng)
        const months = [];
        for (let idx = minIdx; idx <= maxIdx; idx++) {
            months.push(idx);
        }

        return { availableMonths: months, minAvailableIdx: minIdx, maxAvailableIdx: maxIdx, fullyPaid: false, insufficientMonths: insufficient };
    }, [contractData]);

    // ─── Số tháng trả trước auto-calculate ───
    const prepaidMonths = useMemo(() => {
        if (selectedEndIdx == null || availableMonths.length === 0) return null;
        if (!availableMonths.includes(selectedEndIdx)) return null;

        // Tính số tháng từ (rentPaidUntil + 1 tháng) → tháng user chọn
        const rentPaidUntilDate = contractData?.rentPaidUntil
            ? new Date(contractData.rentPaidUntil)
            : new Date(contractData?.startDate);
        const normalizedPaidThrough = new Date(rentPaidUntilDate);
        normalizedPaidThrough.setUTCDate(1);
        normalizedPaidThrough.setUTCHours(0, 0, 0, 0);
        const startNextMonth = new Date(normalizedPaidThrough);
        startNextMonth.setUTCMonth(startNextMonth.getUTCMonth() + 1);
        const startIdx = toIdx(startNextMonth.getUTCFullYear(), startNextMonth.getUTCMonth());

        // months = selectedEndIdx - startIdx + 1
        const months = selectedEndIdx - startIdx + 1;
        return months > 0 ? months : null;
    }, [selectedEndIdx, availableMonths, contractData]);

    const totalAmount = prepaidMonths ? prepaidMonths * roomPrice : 0;

    const selectedEndLabel = selectedEndIdx != null
        ? fmtMonthDisplay(Math.floor(selectedEndIdx / 12), selectedEndIdx % 12)
        : null;

    // ─── Danh sách tháng trả trước đã chọn (hiển thị như InvoiceDetailScreen) ───
    const prepaidMonthList = useMemo(() => {
        if (!contractData || selectedEndIdx == null || prepaidMonths == null) return [];

        const rentPaidUntilDate = contractData.rentPaidUntil
            ? new Date(contractData.rentPaidUntil)
            : new Date(contractData.startDate);
        const normalizedPaidThrough = new Date(rentPaidUntilDate);
        normalizedPaidThrough.setUTCDate(1);
        normalizedPaidThrough.setUTCHours(0, 0, 0, 0);
        const startNextMonth = new Date(normalizedPaidThrough);
        startNextMonth.setUTCMonth(startNextMonth.getUTCMonth() + 1);

        const months = [];
        const cur = new Date(startNextMonth);
        for (let i = 0; i < prepaidMonths; i++) {
            months.push(`Tháng ${cur.getUTCMonth() + 1} - ${cur.getUTCFullYear()}`);
            cur.setUTCMonth(cur.getUTCMonth() + 1);
        }
        return months;
    }, [contractData, selectedEndIdx, prepaidMonths]);

    // ─── Validation ───
    const isSelectionValid = selectedEndIdx != null
        && availableMonths.includes(selectedEndIdx)
        && prepaidMonths != null
        && prepaidMonths >= (contractData?.minPrepaidMonths || 1);

    const handleConfirm = async () => {
        if (!contractData) {
            Alert.alert('Thông báo', 'Vui lòng chọn phòng / hợp đồng.');
            return;
        }
        if (!isSelectionValid) {
            Alert.alert('Thông báo', `Vui lòng chọn tháng trả trước hợp lệ (tối thiểu ${contractData?.minPrepaidMonths || 1} tháng).`);
            return;
        }

        const [ey, em] = [Math.floor(selectedEndIdx / 12), selectedEndIdx % 12];

        Alert.alert(
            'Xác nhận thanh toán',
            `Bạn muốn đóng trước tiền phòng đến hết ${fmtMonthDisplay(ey, em)}?\n\n` +
            `Số tháng: ${prepaidMonths} tháng\n` +
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
                                prepaidMonths
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

                            {/* Tháng đã trả trước - hiển thị danh sách tháng */}
                            {contractData.rentPaidUntil && (
                                <>
                                    <InfoRow icon="calendar-check" label="Ngày đã trả đến"
                                        value={fmtDate(contractData.rentPaidUntil)} />
                                    {/* Danh sách tháng đã trả trước */}
                                    <View style={styles.infoRow}>
                                        <MaterialCommunityIcons name="calendar-month" size={16} color="#6B7280" style={styles.infoIcon} />
                                        <Text style={styles.infoLabel}>Tháng đã trả trước</Text>
                                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                            {(() => {
                                                const rentDate = new Date(contractData.rentPaidUntil);
                                                const endY = rentDate.getUTCFullYear();
                                                const endM = rentDate.getUTCMonth();
                                                const baseDate = contractData.startDate ? new Date(contractData.startDate) : new Date();
                                                baseDate.setUTCDate(1);
                                                baseDate.setUTCHours(0, 0, 0, 0);
                                                const startNext = new Date(baseDate);
                                                startNext.setUTCMonth(startNext.getUTCMonth() + 1);
                                                const startM = startNext.getUTCMonth();
                                                const startY = startNext.getUTCFullYear();
                                                const totalMonths = (endY - startY) * 12 + (endM - startM) + 1;
                                                const months = [];
                                                const cur = new Date(Date.UTC(startY, startM, 1));
                                                for (let i = 0; i < totalMonths && i < 60; i++) {
                                                    months.push(`Tháng ${cur.getUTCMonth() + 1} - ${cur.getUTCFullYear()}`);
                                                    cur.setUTCMonth(cur.getUTCMonth() + 1);
                                                }
                                                if (months.length === 0) {
                                                    return <Text style={styles.infoValue}>—</Text>;
                                                }
                                                return months.map((label, idx) => (
                                                    <PrepaidMonthItem key={idx} label={label} />
                                                ));
                                            })()}
                                        </View>
                                    </View>
                                </>
                            )}
                        </View>

                        {/* Thông tin phòng */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIconWrap, { backgroundColor: '#3B82F61A' }]}>
                                    <MaterialCommunityIcons name="home-outline" size={18} color="#3B82F6" />
                                </View>
                                <Text style={styles.sectionTitle}>Thông tin phòng </Text>
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
                        ) : insufficientMonths ? (
                            <View style={styles.section}>

                                <View style={[styles.fullyPaidBanner, { backgroundColor: '#FEF3C7' }]}>
                                    <MaterialCommunityIcons name="calendar-alert" size={32} color="#92400E" />
                                    <Text style={[styles.fullyPaidText, { color: '#92400E' }]}>
                                        Số tháng đóng trước còn lại không đủ {contractData?.minPrepaidMonths || 3} tháng.
                                        Vui lòng chờ đến kỳ thanh toán tiếp theo.
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
                                    Trả trước tối thiểu {contractData?.minPrepaidMonths || 1} tháng · Giá mỗi tháng: {fmtMoney(roomPrice)}
                                </Text>

                                {/* Picker tháng kết thúc */}
                                <TouchableOpacity
                                    style={styles.monthPickerRow}
                                    onPress={() => setEndPickerVisible(true)}
                                    activeOpacity={0.75}
                                >
                                    <View style={styles.monthPickerRowInner}>
                                        <MaterialCommunityIcons name="calendar-end" size={22} color="#7C3AED" />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.monthPickerLabel}>Trả trước đến hết tháng</Text>
                                            <Text style={[styles.monthPickerValue, !selectedEndLabel && styles.monthPickerPlaceholder]}>
                                                {selectedEndLabel || '— Chọn tháng —'}
                                            </Text>
                                        </View>
                                        <MaterialCommunityIcons name="chevron-down" size={20} color="#6B7280" />
                                    </View>
                                </TouchableOpacity>

                                {/* Số tháng trả trước (auto-calculate, không cho nhập) */}
                                {prepaidMonths != null && (
                                    <View style={styles.autoMonthsRow}>
                                        <View style={styles.autoMonthsLeft}>
                                            <MaterialCommunityIcons name="counter" size={18} color="#7C3AED" />
                                            <Text style={styles.autoMonthsLabel}>Số tháng trả trước</Text>
                                        </View>
                                        <View style={styles.autoMonthsValueBox}>
                                            <Text style={styles.autoMonthsValue}>{prepaidMonths}</Text>
                                            <Text style={styles.autoMonthsUnit}>tháng</Text>
                                        </View>
                                    </View>
                                )}

                                {/* Danh sách tháng trả trước */}
                                {prepaidMonthList.length > 0 && (
                                    <View style={styles.prepaidListSection}>
                                        <Text style={styles.prepaidListTitle}>Các tháng trả trước</Text>
                                        {prepaidMonthList.map((label, idx) => (
                                            <PrepaidMonthItem key={idx} label={label} />
                                        ))}
                                    </View>
                                )}

                                {/* Tổng hợp */}
                                {prepaidMonths != null && (
                                    <View style={styles.totalRow}>
                                        <View>
                                            <Text style={styles.totalLabel}>Tổng cộng</Text>
                                            <Text style={styles.totalMonths}>{prepaidMonths} tháng</Text>
                                        </View>
                                        <Text style={styles.totalValue}>{fmtMoney(totalAmount)}</Text>
                                    </View>
                                )}

                                {/* Cảnh báo chọn tháng quá khứ */}
                                {selectedEndIdx != null && !availableMonths.includes(selectedEndIdx) && (
                                    <View style={styles.monthErrorBanner}>
                                        <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC2626" />
                                        <Text style={styles.monthErrorText}>
                                            Tháng đã chọn không hợp lệ. Phải đảm bảo tối thiểu {contractData?.minPrepaidMonths || 1} tháng trả trước.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </>
                )}

                {/* Lịch sử trả trước */}
                <View style={{ height: 110 }} />
            </ScrollView>

            {/* Nút xác nhận */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[
                        styles.confirmBtn,
                        (!contractData || !isSelectionValid || submitting || fullyPaid || insufficientMonths) && styles.confirmBtnDisabled,
                    ]}
                    onPress={handleConfirm}
                    disabled={!contractData || !isSelectionValid || submitting || fullyPaid || insufficientMonths}
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

            {/* Modal chọn tháng */}
            <MonthPickerModal
                visible={endPickerVisible}
                title="Chọn tháng trả trước đến hết"
                minIdx={minAvailableIdx}
                maxIdx={maxAvailableIdx}
                initialIdx={selectedEndIdx}
                availableMonths={availableMonths}
                selectedIdx={selectedEndIdx}
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
        flexDirection: 'row', alignItems: 'flex-start',
        paddingHorizontal: 16, paddingVertical: 11,
        borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
    },
    infoIcon: { marginRight: 10, marginTop: 2 },
    infoLabel: { fontSize: 13, color: '#6B7280', marginRight: 8 },
    infoValue: { fontSize: 13, fontWeight: '600', color: '#1F2937' },

    monthHint: {
        fontSize: 12, color: '#6B7280',
        paddingHorizontal: 16, paddingVertical: 8,
        backgroundColor: '#F9FAFB',
    },

    monthPickerRow: { paddingHorizontal: 16, paddingVertical: 4 },
    monthPickerRowInner: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 12,
    },
    monthPickerLabel: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
    monthPickerValue: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
    monthPickerPlaceholder: { fontWeight: '600', color: '#9CA3AF' },

    /* Auto months row */
    autoMonthsRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: '#F5F3FF',
        borderTopWidth: 1, borderTopColor: '#EDE9FE',
    },
    autoMonthsLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    autoMonthsLabel: { fontSize: 13, color: '#6B7280' },
    autoMonthsValueBox: {
        flexDirection: 'row', alignItems: 'baseline', gap: 4,
    },
    autoMonthsValue: { fontSize: 22, fontWeight: '800', color: '#7C3AED' },
    autoMonthsUnit: { fontSize: 13, color: '#7C3AED', fontWeight: '600' },

    /* Prepaid month list */
    prepaidListSection: {
        paddingHorizontal: 16, paddingVertical: 10,
        backgroundColor: '#FAFAFA',
        borderTopWidth: 1, borderTopColor: '#F3F4F6',
    },
    prepaidListTitle: {
        fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 6,
    },
    prepaidMonthItem: {
        flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2,
    },
    prepaidMonthDot: {
        fontSize: 16, color: '#7C3AED', fontWeight: '700', lineHeight: 18,
    },
    prepaidMonthText: {
        fontSize: 13, color: '#1F2937', fontWeight: '600',
    },

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
    monthScrollView: { maxHeight: 320 },
    monthScroll: {
        flexDirection: 'row', flexWrap: 'wrap',
        paddingHorizontal: 12, paddingVertical: 8,
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
    monthItemDisabled: { backgroundColor: '#F9FAFB', opacity: 0.5 },
    monthItemText: { fontSize: 12, fontWeight: '600', color: '#374151', textAlign: 'center' },
    monthItemTextActive: { color: '#FFF' },
    monthItemTextDisabled: { color: '#D1D5DB' },
});
