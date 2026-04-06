// PrepaidRentScreen — Chọn hợp đồng/phòng rồi chọn số tháng trả trước tiền phòng
import React, { useState, useEffect } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, TouchableOpacity,
    ScrollView, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getMyContractForPrepaidAPI, createPrepaidRentAPI } from '../../services/prepaid_rent.service';

/** @param {unknown} v — số tiền (hợp lệ hoặc không) */
const fmtMoney = (v) => {
    const n = Number(v);
    const x = Number.isFinite(n) ? n : 0;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(x);
};

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('vi-VN') : '—';

/** Số tháng tròn tính từ hôm nay đến endDate (≥ 0) */
const getRemainingMonths = (endDate) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const months =
        (end.getFullYear() - now.getFullYear()) * 12 +
        (end.getMonth() - now.getMonth()) -
        (end.getDate() < now.getDate() ? 1 : 0);
    return Math.max(0, months);
};

/** Chuẩn hóa phản hồi API: mảng hợp đồng */
function normalizeContractsPayload(data) {
    if (!data) return [];
    if (Array.isArray(data.contracts)) return data.contracts;
    if (data.contractId != null) return [data];
    return [];
}

export default function PrepaidRentScreen({ navigation }) {
    const [contracts, setContracts] = useState([]);
    const [selectedContractId, setSelectedContractId] = useState(null);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [monthPickerVisible, setMonthPickerVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMonths, setSelectedMonths] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchContracts();
    }, []);

    useEffect(() => {
        if (!contracts.length) return;
        if (contracts.length === 1) {
            setSelectedContractId(String(contracts[0].contractId));
        } else {
            setSelectedContractId(null);
        }
    }, [contracts]);

    useEffect(() => {
        const c = contracts.find((x) => String(x.contractId) === String(selectedContractId));
        if (!c) {
            setSelectedMonths(null);
            return;
        }
        // Hợp đồng ≤ 6 tháng → tối thiểu 1; > 6 tháng → tối thiểu 2
        const min = Number.isFinite(c.minPrepaidMonths) ? c.minPrepaidMonths : 2;
        if (Number.isFinite(c.maxPrepaidMonths) && c.maxPrepaidMonths >= min) {
            setSelectedMonths(min);
        } else {
            setSelectedMonths(null);
        }
    }, [selectedContractId, contracts]);

    const fetchContracts = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await getMyContractForPrepaidAPI();
            if (res.success && res.data) {
                const list = normalizeContractsPayload(res.data);
                if (!list.length) {
                    setError('Không có hợp đồng đang hoạt động.');
                } else {
                    setContracts(list);
                }
            } else {
                setError(res.message || 'Không có hợp đồng đang hoạt động.');
            }
        } catch (err) {
            const msg = err?.response?.data?.message || err.message || 'Lỗi khi tải hợp đồng';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const contractData = contracts.find(
        (c) => String(c.contractId) === String(selectedContractId)
    );

    const roomPriceNum = Number(contractData?.room?.roomPrice);
    const roomPrice = Number.isFinite(roomPriceNum) ? roomPriceNum : 0;

    const handleConfirm = async () => {
        if (!contractData) {
            Alert.alert('Thông báo', 'Vui lòng chọn phòng / hợp đồng thanh toán trước.');
            return;
        }
        if (!selectedMonths) {
            Alert.alert('Thông báo', 'Vui lòng chọn số tháng đóng trước.');
            return;
        }

        const totalAmount = selectedMonths * roomPrice;

        Alert.alert(
            'Xác nhận thanh toán',
            `Bạn muốn đóng trước ${selectedMonths} tháng tiền phòng?\n\n` +
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
                                selectedMonths
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
    const { room, contractCode, startDate, endDate, maxPrepaidMonths, minPrepaidMonths } = contractData || {};

    const totalAmount = selectedMonths ? selectedMonths * roomPrice : 0;

    const monthOptions = [];
    if (contractData) {
        const min = Number.isFinite(contractData.minPrepaidMonths)
            ? contractData.minPrepaidMonths
            : 2;
        const allowedMax = Number.isFinite(contractData.maxPrepaidMonths)
            ? contractData.maxPrepaidMonths
            : 0;
        const remaining = getRemainingMonths(endDate);
        const max = Math.min(allowedMax, remaining);
        for (let i = min; i <= max; i++) {
            monthOptions.push(i);
        }
    }

    const monthOptionsForPicker = monthOptions.length > 0 ? monthOptions : [];

    const selectLabel = contractData
        ? `${room?.name || 'Phòng'} · ${contractCode || ''}`
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
                <View style={styles.heroCard}>
                    <View style={styles.heroIconWrap}>
                        <MaterialCommunityIcons name="wallet-outline" size={36} color="#7C3AED" />
                    </View>
                    <Text style={styles.heroTitle}>Thông tin hợp đồng</Text>
                </View>

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
                            <MaterialCommunityIcons
                                name="format-list-bulleted"
                                size={22}
                                color="#7C3AED"
                            />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.selectHint}>
                                    {multiContract
                                        ? 'Bạn có nhiều hợp đồng — chọn phòng cần đóng trước'
                                        : 'Hợp đồng đang áp dụng'}
                                </Text>
                                <Text
                                    style={[
                                        styles.selectValue,
                                        !contractData && multiContract && styles.selectValuePlaceholder,
                                    ]}
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
                            Vui lòng chọn một phòng để xem giá và số tháng được phép đóng trước.
                        </Text>
                    </View>
                )}

                {showDetails && (
                    <>
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIconWrap, { backgroundColor: '#7C3AED1A' }]}>
                                    <MaterialCommunityIcons name="file-document-outline" size={18} color="#7C3AED" />
                                </View>
                                <Text style={styles.sectionTitle}>Thông tin hóa đơn</Text>
                            </View>

                            <InfoRow icon="barcode" label="Mã Hợp Đồng" value={contractCode} />
                            <InfoRow icon="calendar-check" label="Ngày bắt đầu" value={fmtDate(startDate)} />
                            <InfoRow icon="calendar-clock" label="Ngày kết thúc" value={fmtDate(endDate)} />
                        </View>

                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIconWrap, { backgroundColor: '#3B82F61A' }]}>
                                    <MaterialCommunityIcons name="home-outline" size={18} color="#3B82F6" />
                                </View>
                                <Text style={styles.sectionTitle}>Thông tin phòng</Text>
                            </View>

                            <InfoRow icon="home-outline" label="Phòng" value={room?.name} />
                            <InfoRow icon="door-open" label="Loại Phòng" value={room?.roomTypeName} />
                            <InfoRow icon="currency-usd" label="Giá Phòng" value={fmtMoney(roomPrice)} />
                        </View>

                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIconWrap, { backgroundColor: '#F59E0B1A' }]}>
                                    <MaterialCommunityIcons name="calendar-month-outline" size={18} color="#F59E0B" />
                                </View>
                                <Text style={styles.sectionTitle}>Số tháng đóng trước</Text>
                            </View>

                            <Text style={styles.monthHint}>
                                Tối thiểu {contractData?.minPrepaidMonths ?? '—'} tháng — Tối đa {monthOptions.length > 0 ? monthOptions[monthOptions.length - 1] : 0} tháng
                                {contractData?.endDate && ` · (còn ${getRemainingMonths(contractData.endDate)} tháng đến khi kết thúc)`}
                            </Text>

                            {monthOptions.length === 0 ? (
                                <Text style={styles.noMonthOptions}>
                                    Hiện không đủ điều kiện chọn số tháng đóng trước cho hợp đồng này.
                                </Text>
                            ) : (
                                <TouchableOpacity
                                    style={styles.selectRow}
                                    onPress={() => setMonthPickerVisible(true)}
                                    activeOpacity={0.75}
                                >
                                    <View style={styles.selectRowInner}>
                                        <MaterialCommunityIcons
                                            name="calendar-month"
                                            size={22}
                                            color="#7C3AED"
                                        />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.selectHint}>Chọn số tháng đóng trước</Text>
                                            <Text
                                                style={[
                                                    styles.selectValue,
                                                    !selectedMonths && styles.selectValuePlaceholder,
                                                ]}
                                            >
                                                {selectedMonths ? `${selectedMonths} tháng` : '— Chọn số tháng —'}
                                            </Text>
                                        </View>
                                        <MaterialCommunityIcons name="chevron-down" size={22} color="#6B7280" />
                                    </View>
                                </TouchableOpacity>
                            )}

                            {selectedMonths && (
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Tổng tiền</Text>
                                    <Text style={styles.totalValue}>{fmtMoney(totalAmount)}</Text>
                                </View>
                            )}
                        </View>
                    </>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[
                        styles.confirmBtn,
                        (!contractData || !selectedMonths || submitting || monthOptionsForPicker.length === 0) &&
                            styles.confirmBtnDisabled,
                    ]}
                    onPress={handleConfirm}
                    disabled={!contractData || !selectedMonths || submitting || monthOptionsForPicker.length === 0}
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
                                const p = Number(c.room?.roomPrice);
                                const pr = Number.isFinite(p) ? p : 0;
                                return (
                                    <TouchableOpacity
                                        key={id}
                                        style={[styles.modalItem, active && styles.modalItemActive]}
                                        onPress={() => {
                                            setSelectedContractId(id);
                                            setPickerVisible(false);
                                        }}
                                    >
                                        <MaterialCommunityIcons
                                            name="door"
                                            size={22}
                                            color={active ? '#7C3AED' : '#6B7280'}
                                        />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.modalItemTitle}>
                                                {c.room?.name || 'Phòng'}
                                            </Text>
                                            <Text style={styles.modalItemSub}>
                                                {c.contractCode} · {fmtMoney(pr)}/tháng
                                            </Text>
                                        </View>
                                        {active && (
                                            <MaterialCommunityIcons name="check-circle" size={22} color="#7C3AED" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => setPickerVisible(false)}
                        >
                            <Text style={styles.modalCloseBtnText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={monthPickerVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setMonthPickerVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setMonthPickerVisible(false)}
                >
                    <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Chọn số tháng đóng trước</Text>
                        <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
                            {monthOptionsForPicker.map((m) => {
                                const active = m === selectedMonths;
                                return (
                                    <TouchableOpacity
                                        key={m}
                                        style={[styles.modalItem, active && styles.modalItemActive]}
                                        onPress={() => {
                                            setSelectedMonths(m);
                                            setMonthPickerVisible(false);
                                        }}
                                    >
                                        <MaterialCommunityIcons
                                            name="calendar-month"
                                            size={22}
                                            color={active ? '#7C3AED' : '#6B7280'}
                                        />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.modalItemTitle}>{m} tháng</Text>
                                            <Text style={styles.modalItemSub}>{fmtMoney(m * roomPrice)}</Text>
                                        </View>
                                        {active && (
                                            <MaterialCommunityIcons name="check-circle" size={22} color="#7C3AED" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => setMonthPickerVisible(false)}
                        >
                            <Text style={styles.modalCloseBtnText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

function InfoRow({ icon, label, value }) {
    return (
        <View style={styles.infoRow}>
            <MaterialCommunityIcons name={icon} size={16} color="#6B7280" style={styles.infoIcon} />
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value || '—'}</Text>
        </View>
    );
}

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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    selectHint: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
    selectValue: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
    selectValuePlaceholder: { fontWeight: '600', color: '#9CA3AF' },

    hintBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginHorizontal: 12,
        marginTop: 10,
        padding: 14,
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FCD34D',
    },
    hintBannerText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 19 },

    infoRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 11,
        borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
    },
    infoIcon: { marginRight: 10 },
    infoLabel: { fontSize: 13, color: '#6B7280', width: 130 },
    infoValue: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1F2937', textAlign: 'right' },

    monthHint: {
        fontSize: 12, color: '#6B7280',
        paddingHorizontal: 16, paddingVertical: 8,
        backgroundColor: '#F9FAFB',
    },
    noMonthOptions: {
        fontSize: 13,
        color: '#6B7280',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },

    totalRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: '#F5F3FF',
        borderTopWidth: 1.5, borderTopColor: '#7C3AED',
    },
    totalLabel: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
    totalValue: { fontSize: 18, fontWeight: '800', color: '#7C3AED' },

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

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 16,
        paddingBottom: 24,
        maxHeight: '72%',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    modalList: { maxHeight: 360 },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalItemActive: { backgroundColor: '#F5F3FF' },
    modalItemTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
    modalItemSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    modalCloseBtn: {
        marginTop: 8,
        marginHorizontal: 20,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    modalCloseBtnText: { fontSize: 16, fontWeight: '600', color: '#374151' },
});
