// View Invoice Detail Screen
import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, TouchableOpacity,
    ScrollView, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getInvoiceDetailAPI, getIncurredInvoiceDetailAPI } from '../../services/invoice.service';

const STATUS_CONFIG = {
    Unpaid: { label: 'Chưa thanh toán', color: '#DC2626', bg: '#FEE2E2', icon: 'clock-alert-outline' },
    Paid: { label: 'Đã thanh toán', color: '#10B981', bg: '#D1FAE5', icon: 'check-circle-outline' },
    Overdue: { label: 'Quá hạn', color: '#F59E0B', bg: '#FEF3C7', icon: 'alert-circle-outline' },
    Cancelled: { label: 'Đã huỷ', color: '#6B7280', bg: '#F3F4F6', icon: 'cancel' },
};

const TYPE_LABEL = { Periodic: 'Định kỳ', Incurred: 'Phát sinh', Other: 'Khác' };

const FIXED_SERVICES = [
    { key: 'internet', label: 'Internet', icon: 'wifi', color: '#6366F1' },
    { key: 'vesinh', label: 'Vệ sinh', icon: 'broom', color: '#14B8A6' },
    { key: 'xemay', label: 'Gửi Xe Máy', icon: 'motorbike', color: '#F97316' },
    { key: 'xedap', label: 'Gửi Xe Đạp', icon: 'bicycle', color: '#3B82F6' },
    { key: 'xedapdien', label: 'Gửi Xe Đạp Điện', icon: 'bicycle-electric', color: '#10B981' },
    { key: 'thangmay', label: 'Thang Máy', icon: 'elevator-passenger', color: '#8B5CF6' },
    { key: 'phatsinh', label: 'Phát sinh', icon: 'plus-circle-outline', color: '#EF4444' },
];

const matchService = (itemName, key) => {
    const n = (itemName || '').toLowerCase();
    switch (key) {
        case 'internet': return n.includes('internet');
        case 'vesinh': return n.includes('vệ sinh');
        case 'xemay': return n.includes('xe máy');
        case 'xedapdien': return n.includes('xe đạp điện');
        case 'xedap': return n.includes('xe đạp') && !n.includes('xe đạp điện');
        case 'thangmay': return n.includes('thang máy');
        case 'phatsinh': return n.includes('phát sinh');
        default: return false;
    }
};

const getItemIcon = (itemName) => {
    const n = (itemName || '').toLowerCase();
    if (n.includes('thuê phòng') || n.includes('tiền phòng')) return { icon: 'home-city-outline', color: '#3B82F6' };
    if (n.includes('điện')) return { icon: 'flash', color: '#F59E0B' };
    if (n.includes('nước')) return { icon: 'water-outline', color: '#06B6D4' };
    if (n.includes('internet')) return { icon: 'wifi', color: '#6366F1' };
    if (n.includes('vệ sinh')) return { icon: 'broom', color: '#14B8A6' };
    if (n.includes('xe đạp điện')) return { icon: 'bicycle-electric', color: '#10B981' };
    if (n.includes('xe máy')) return { icon: 'motorbike', color: '#F97316' };
    if (n.includes('xe đạp')) return { icon: 'bicycle', color: '#3B82F6' };
    if (n.includes('thang máy')) return { icon: 'elevator-passenger', color: '#8B5CF6' };
    if (n.includes('phát sinh')) return { icon: 'plus-circle-outline', color: '#EF4444' };
    return { icon: 'receipt-text-outline', color: '#6B7280' };
};

const fmtNum = (v) => new Intl.NumberFormat('vi-VN').format(Math.round(v));

const formatCurrency = (v) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v ?? 0);

const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

/* ─── small reusable row ─── */
function InfoRow({ icon, label, value, valueStyle }) {
    return (
        <View style={styles.infoRow}>
            <MaterialCommunityIcons name={icon} size={16} color="#6B7280" style={styles.infoIcon} />
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={[styles.infoValue, valueStyle]} numberOfLines={2}>{value || '—'}</Text>
        </View>
    );
}

/* ─── section card ─── */
function Section({ icon, title, color, children }) {
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconWrap, { backgroundColor: color + '1A' }]}>
                    <MaterialCommunityIcons name={icon} size={18} color={color} />
                </View>
                <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            {children}
        </View>
    );
}

export default function InvoiceDetailScreen({ navigation, route }) {
    const { invoiceId, invoiceType } = route.params ?? {};
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isIncurred = invoiceType === 'Incurred' || invoice?.type === 'Incurred';

    useEffect(() => {
        if (!invoiceId) { setError('Không tìm thấy mã hóa đơn'); setLoading(false); return; }
        const fetchAPI = invoiceType === 'Incurred' ? getIncurredInvoiceDetailAPI : getInvoiceDetailAPI;
        console.log('InvoiceDetailScreen - invoiceId:', invoiceId, 'invoiceType:', invoiceType);
        fetchAPI(invoiceId)
            .then((res) => {
                console.log('InvoiceDetailScreen - response:', JSON.stringify(res?.data));
                setInvoice(res?.data);
            })
            .catch((err) => {
                console.log('InvoiceDetailScreen - error:', err.message);
                setError(err?.response?.data?.message || err.message || 'Đã xảy ra lỗi');
            })
            .finally(() => setLoading(false));
    }, [invoiceId, invoiceType]);

    // Chuẩn hóa status - hỗ trợ cả PascalCase và lowercase từ API
    const rawStatus = invoice?.status || invoice?.paymentStatus || '';
    const normalizedStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
    const cfg = STATUS_CONFIG[normalizedStatus] ?? STATUS_CONFIG.Unpaid;
    const room = invoice?.roomId;
    // Chỉ hiện nút thanh toán khi status là Unpaid hoặc Overdue
    const isUnpaid = normalizedStatus === 'Unpaid' || normalizedStatus === 'Overdue';

    const completeItems = useMemo(() => {
        const apiItems = invoice?.items || [];
        const result = [...apiItems];
        FIXED_SERVICES.forEach(svc => {
            const exists = apiItems.some(i => matchService(i.itemName, svc.key));
            if (!exists) {
                result.push({ itemName: svc.label, amount: null, _icon: svc.icon, _color: svc.color });
            }
        });
        return result;
    }, [invoice]);

    return (
        <SafeAreaView style={styles.safeContainer}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết hóa đơn</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* ── States ── */}
            {loading && (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.stateText}>Đang tải...</Text>
                </View>
            )}

            {!loading && error && (
                <View style={styles.center}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#DC2626" />
                    <Text style={[styles.stateText, { color: '#DC2626', marginTop: 12 }]}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.retryBtnText}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            )}

            {!loading && !error && invoice && (
                <>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* ── Hero card ── */}
                        <View style={styles.heroCard}>
                            <View style={[styles.heroIconWrap, { backgroundColor: cfg.bg }]}>
                                <MaterialCommunityIcons name="receipt-text" size={32} color={cfg.color} />
                            </View>
                            <Text style={styles.heroTitle}>{invoice.title}</Text>
                            <Text style={styles.heroCode}>{invoice.invoiceCode}</Text>
                            <View style={[styles.heroBadge, { backgroundColor: cfg.bg }]}>
                                <MaterialCommunityIcons name={cfg.icon} size={13} color={cfg.color} />
                                <Text style={[styles.heroBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                            </View>
                        </View>

                        {/* ── Summary amount ── */}
                        <View style={[styles.amountBanner, { backgroundColor: cfg.color }]}>
                            <View>
                                <Text style={styles.amountBannerLabel}>Tổng tiền phải trả</Text>
                                <Text style={styles.amountBannerValue}>{formatCurrency(invoice.totalAmount)}</Text>
                            </View>
                            <View style={styles.amountBannerMeta}>
                                <Text style={styles.amountBannerMetaLabel}>Đến hạn</Text>
                                <Text style={styles.amountBannerMetaValue}>{formatDate(invoice.dueDate)}</Text>
                            </View>
                        </View>

                        {/* ── Basic info ── */}
                        <Section icon="information-outline" title="Thông tin hóa đơn" color="#3B82F6">
                            <InfoRow icon="barcode" label="Mã hóa đơn" value={invoice.invoiceCode} />
                            <InfoRow icon="tag-outline" label="Loại Hóa Đơn" value={TYPE_LABEL[invoice.type] ?? invoice.type} />
                            {/* Periodic: room from roomId object */}
                            {!isIncurred && room && <InfoRow icon="home-outline" label="Phòng" value={`${room.name} `} />}
                            {!isIncurred && room?.roomTypeId?.currentPrice != null && (
                                <InfoRow icon="currency-usd" label="Giá phòng" value={formatCurrency(room.roomTypeId.currentPrice)} />
                            )}
                            {/* Incurred: roomName is a string */}
                            {isIncurred && invoice.roomName && (
                                <InfoRow icon="home-outline" label="Phòng" value={invoice.roomName} />
                            )}
                            <InfoRow icon="calendar-plus" label="Ngày tạo" value={formatDate(invoice.createdAt)} />
                            <InfoRow icon="calendar-clock" label="Đến hạn" value={formatDate(invoice.dueDate)}
                                valueStyle={invoice.status === 'Overdue' ? { color: '#F59E0B', fontWeight: '700' } : {}} />
                        </Section>

                        {/* ── Incurred: device info ── */}
                        {isIncurred && (
                            <Section icon="wrench" title="Chi tiết khoản thu" color="#EF4444">
                                <View style={styles.incurredCard}>
                                    <View style={styles.incurredDeviceRow}>
                                        <View style={[styles.svcIconWrap, { backgroundColor: '#EF44441A' }]}>
                                            <MaterialCommunityIcons name="cog-outline" size={18} color="#EF4444" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.incurredDeviceName}>{invoice.deviceName || 'Thiết bị'}</Text>
                                            <Text style={styles.incurredTitle}>{invoice.title}</Text>
                                        </View>
                                        <Text style={styles.incurredAmount}>{formatCurrency(invoice.totalAmount)}</Text>
                                    </View>
                                    {invoice.description ? (
                                        <View style={styles.incurredDescBox}>
                                            <MaterialCommunityIcons name="text-box-outline" size={14} color="#6B7280" />
                                            <Text style={styles.incurredDescText}>{invoice.description}</Text>
                                        </View>
                                    ) : null}
                                </View>
                                <View style={styles.svcTotalRow}>
                                    <Text style={styles.svcTotalLabel}>TỔNG CỘNG</Text>
                                    <Text style={styles.svcTotalValue}>{formatCurrency(invoice.totalAmount)}</Text>
                                </View>
                            </Section>
                        )}

                        {/* ── Periodic: Chi tiết khoản thu ── */}
                        {!isIncurred && (
                            <Section icon="format-list-bulleted" title="Chi tiết khoản thu" color="#F59E0B">
                                {completeItems.map((item, idx) => {
                                    const display = item._icon
                                        ? { icon: item._icon, color: item._color }
                                        : getItemIcon(item.itemName);
                                    const hasAmount = item.amount != null && item.amount > 0;
                                    const hasUsage = item.usage != null && item.usage > 0 && item.unitPrice != null;
                                    return (
                                        <View key={item._id ?? `svc-${idx}`}
                                            style={[styles.svcRow, idx < completeItems.length - 1 && styles.svcRowBorder]}>
                                            <View style={styles.svcTop}>
                                                <View style={[styles.svcIconWrap, { backgroundColor: display.color + '15' }]}>
                                                    <MaterialCommunityIcons name={display.icon} size={16} color={display.color} />
                                                </View>
                                                <Text style={styles.svcName} numberOfLines={2}>{item.itemName}</Text>
                                                <Text style={[styles.svcAmount, !hasAmount && styles.svcAmountEmpty]}>
                                                    {hasAmount ? fmtNum(item.amount) : '—'}
                                                </Text>
                                            </View>
                                            {hasUsage && (
                                                <View style={styles.svcMeta}>
                                                    <Text style={styles.svcMetaText}>
                                                        SL: {item.usage} × {fmtNum(item.unitPrice)}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                                <View style={styles.svcTotalRow}>
                                    <Text style={styles.svcTotalLabel}>TỔNG CỘNG</Text>
                                    <Text style={styles.svcTotalValue}>{formatCurrency(invoice.totalAmount)}</Text>
                                </View>
                            </Section>
                        )}

                        <View style={{ height: 90 }} />
                    </ScrollView>

                    {/* ── Floating pay button (chỉ hiển thị khi chưa thanh toán) ── */}
                    {isUnpaid && (
                        <View style={styles.payBar}>
                            <TouchableOpacity
                                style={styles.payBtn}
                                activeOpacity={0.85}
                                onPress={() => navigation.navigate('PayInvoice', { invoiceId })}
                            >
                                <MaterialCommunityIcons name="credit-card-outline" size={20} color="#FFF" />
                                <Text style={styles.payBtnText}>Thanh toán</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: { flex: 1, backgroundColor: '#F3F4F6' },

    /* header */
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#FFFFFF', paddingVertical: 14, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },

    /* loading / error */
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    stateText: { marginTop: 8, fontSize: 15, color: '#6B7280', textAlign: 'center' },
    retryBtn: { marginTop: 20, backgroundColor: '#3B82F6', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
    retryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

    scrollContent: { paddingBottom: 12 },

    /* hero */
    heroCard: {
        backgroundColor: '#FFFFFF', marginHorizontal: 12, marginTop: 14, marginBottom: 0,
        borderRadius: 16, padding: 20, alignItems: 'center', gap: 6,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4,
    },
    heroIconWrap: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    heroTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', textAlign: 'center' },
    heroCode: { fontSize: 13, color: '#9CA3AF' },
    heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 2 },
    heroBadgeText: { fontSize: 13, fontWeight: '700' },

    /* amount banner */
    amountBanner: {
        marginHorizontal: 12, marginTop: 10, borderRadius: 14,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 16,
    },
    amountBannerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
    amountBannerValue: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
    amountBannerMeta: { alignItems: 'flex-end' },
    amountBannerMetaLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
    amountBannerMetaValue: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

    /* section */
    section: {
        backgroundColor: '#FFFFFF', marginHorizontal: 12, marginTop: 10, borderRadius: 14,
        overflow: 'hidden',
        elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
    },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    sectionIconWrap: { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },

    /* info row */
    infoRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 11,
        borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
    },
    infoIcon: { marginRight: 10 },
    infoLabel: { fontSize: 13, color: '#6B7280', width: 110 },
    infoValue: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1F2937', textAlign: 'right' },

    /* service items */
    svcRow: { paddingHorizontal: 14, paddingVertical: 12 },
    svcRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    svcTop: { flexDirection: 'row', alignItems: 'center' },
    svcIconWrap: {
        width: 32, height: 32, borderRadius: 9,
        justifyContent: 'center', alignItems: 'center', marginRight: 10,
    },
    svcName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1F2937' },
    svcAmount: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginLeft: 8 },
    svcAmountEmpty: { color: '#D1D5DB' },
    svcMeta: { marginLeft: 42, marginTop: 4 },
    svcMetaText: { fontSize: 11, color: '#9CA3AF' },
    svcTotalRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 12,
        backgroundColor: '#FEF9C3', borderTopWidth: 1.5, borderTopColor: '#E5E7EB',
    },
    svcTotalLabel: { fontSize: 14, fontWeight: '800', color: '#1F2937' },
    svcTotalValue: { fontSize: 16, fontWeight: '800', color: '#DC2626' },

    /* incurred card */
    incurredCard: { padding: 14 },
    incurredDeviceRow: { flexDirection: 'row', alignItems: 'center' },
    incurredDeviceName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
    incurredTitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    incurredAmount: { fontSize: 16, fontWeight: '800', color: '#EF4444', marginLeft: 8 },
    incurredDescBox: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        marginTop: 12, backgroundColor: '#FEF2F2', borderRadius: 10,
        padding: 12, borderLeftWidth: 3, borderLeftColor: '#EF4444',
    },
    incurredDescText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 20 },

    /* pay bar */
    payBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12,
        borderTopWidth: 1, borderTopColor: '#E5E7EB',
        elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08, shadowRadius: 6,
    },
    payBtn: {
        backgroundColor: '#3B82F6', borderRadius: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 14,
    },
    payBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});

