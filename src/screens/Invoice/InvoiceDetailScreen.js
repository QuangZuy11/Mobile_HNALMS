// View Invoice Detail Screen
import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, TouchableOpacity,
    ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getInvoiceDetailAPI, getIncurredInvoiceDetailAPI } from '../../services/invoice.service';

const STATUS_CONFIG = {
    Unpaid: { label: 'Chưa thanh toán', color: '#DC2626', bg: '#FEE2E2', icon: 'clock-alert-outline' },
    Paid: { label: 'Đã thanh toán', color: '#10B981', bg: '#D1FAE5', icon: 'check-circle-outline' },
    Overdue: { label: 'Quá hạn', color: '#F59E0B', bg: '#FEF3C7', icon: 'alert-circle-outline' },
    Cancelled: { label: 'Đã huỷ', color: '#6B7280', bg: '#F3F4F6', icon: 'cancel' },
    Draft: { label: 'Nháp', color: '#6B7280', bg: '#F3F4F6', icon: 'file-document-edit-outline' },
};

const TYPE_LABEL = { Periodic: 'Định kỳ', Incurred: 'Phát sinh', Other: 'Khác' };
const VIOLATION_TYPE_LABEL = { violation: 'Vi phạm', repair: 'Sửa chữa' };

/** Chuẩn hóa tiếng Việt để khớp tên dịch vụ dù thiếu dấu / sai dấu (vd: "may" vs "máy") */
const normalizeVN = (s) =>
    (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd');

/** Bỏ tiền tố "Dịch vụ " khi hiển thị */
const stripServicePrefix = (name) => {
    if (!name) return '';
    return name.replace(/^\s*dịch vụ\s+/i, '').trim();
};

const getItemIcon = (itemName) => {
    const n = (itemName || '').toLowerCase();
    const t = normalizeVN(itemName);
    if (n.includes('thuê phòng') || n.includes('tiền phòng') || t.includes('thue phong') || t.includes('tien phong')) {
        return { icon: 'home-city-outline', color: '#3B82F6' };
    }
    if (n.includes('nước') || t.includes('nuoc')) return { icon: 'water-outline', color: '#06B6D4' };
    if (n.includes('internet') || t.includes('internet')) return { icon: 'wifi', color: '#6366F1' };
    if (n.includes('vệ sinh') || t.includes('ve sinh')) return { icon: 'broom', color: '#14B8A6' };
    // Phải xử lý xe trước "tiền điện", vì "máy điện" cũng chứa chữ "điện"
    if (t.includes('xe dap dien')) return { icon: 'bicycle-electric', color: '#10B981' };
    if (t.includes('xe may dien')) return { icon: 'motorbike-electric', color: '#EA580C' };
    if (t.includes('xe may') && !t.includes('xe dap')) return { icon: 'motorbike', color: '#F97316' };
    if (t.includes('xe dap')) return { icon: 'bicycle', color: '#3B82F6' };
    if (n.includes('thang máy') || t.includes('thang may')) return { icon: 'elevator-passenger', color: '#8B5CF6' };
    if (n.includes('tiền điện') || t.includes('tien dien')) return { icon: 'flash', color: '#F59E0B' };
    if (n.includes('điện') || t.includes('dien')) return { icon: 'flash', color: '#F59E0B' };
    return { icon: 'receipt-text-outline', color: '#6B7280' };
};

const fmtNum = (v) => new Intl.NumberFormat('vi-VN').format(Math.round(v));

const formatCurrency = (v) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v ?? 0);

const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

/**
 * Parse date range từ itemName prepaid.
 * VD: "Tiền thuê phòng trả trước (từ 01/05/2026 đến 30/06/2026) (2 tháng)"
 * Trả về mảng label "Tháng M - YYYY", ví dụ: ["Tháng 5 - 2026", "Tháng 6 - 2026"]
 */
const parsePrepaidMonthsFromItemName = (itemName) => {
    if (!itemName) return [];
    // Tìm date range: (từ DD/MM/YYYY đến DD/MM/YYYY)
    const rangeMatch = itemName.match(/\(từ\s*(\d{2})\/(\d{2})\/(\d{4})\s*đến\s*(\d{2})\/(\d{2})\/(\d{4})\)/);
    if (!rangeMatch) return [];
    const [, , startMonth, startYear, , endMonth, endYear] = rangeMatch;
    const sMonth = parseInt(startMonth, 10);
    const sYear = parseInt(startYear, 10);
    const eMonth = parseInt(endMonth, 10);
    const eYear = parseInt(endYear, 10);
    const months = [];
    let y = sYear, m = sMonth;
    while (y < eYear || (y === eYear && m <= eMonth)) {
        months.push(`Tháng ${m} - ${y}`);
        m++;
        if (m > 12) { m = 1; y++; }
    }
    return months;
};

/* ─── item trong danh sách tháng trả trước ─── */
function PrepaidMonthItem({ label }) {
    return (
        <View style={styles.prepaidMonthItem}>
            <Text style={styles.prepaidMonthDot}>•</Text>
            <Text style={styles.prepaidMonthText}>{label}</Text>
        </View>
    );
}

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

    const isIncurred = invoiceType === 'Incurred' || invoice?.invoiceType === 'Incurred';
    const isViolation = invoice?.type === 'violation';
    const isRepair = invoice?.type === 'repair';
    const isPrepaidRent = invoice?.invoiceCode?.toUpperCase().startsWith('HD-PREPAID');
    const isPrepaidType = isPrepaidRent || invoice?.type === 'prepaid';

    useEffect(() => {
        if (!invoiceId) { setError('Không tìm thấy mã hóa đơn'); setLoading(false); return; }
        // HD-PREPAID nằm trong InvoiceIncurred → gọi API incurred
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
    // Periodic (Invoice): roomId is direct. Incurred (InvoiceIncurred): roomId is inside contractId.
    const room = invoice?.roomId ?? invoice?.contractId?.roomId;
    // Chỉ hiện nút thanh toán khi status là Unpaid hoặc Overdue, KHÔNG phải Draft
    const isUnpaid = (normalizedStatus === 'Unpaid' || normalizedStatus === 'Overdue') && normalizedStatus !== 'Draft';
    const isDraft = normalizedStatus === 'Draft';

    const invoiceItems = useMemo(() => invoice?.items || [], [invoice]);

    /** Danh sách tháng trả trước, parse từ itemName trong items */
    const prepaidMonthList = useMemo(() => {
        if (!isPrepaidType) return [];
        // Tìm item chứa date range trong prepaid invoice
        const prepaidItem = invoiceItems.find((item) =>
            item.itemName?.toLowerCase().includes('trả trước') ||
            item.itemName?.toLowerCase().includes('tra truoc')
        );
        if (!prepaidItem?.itemName) return [];
        return parsePrepaidMonthsFromItemName(prepaidItem.itemName);
    }, [invoiceItems, isPrepaidType]);

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
                        <View style={[styles.heroCard, isDraft && styles.heroCardDraft]}>
                            <View style={[styles.heroIconWrap, { backgroundColor: cfg.bg }]}>
                                <MaterialCommunityIcons name="receipt-text" size={32} color={isDraft ? '#9CA3AF' : cfg.color} />
                            </View>
                            <Text style={[styles.heroTitle, isDraft && styles.heroTitleDraft]}>{invoice.title}</Text>
                            <Text style={[styles.heroCode, isDraft && styles.heroCodeDraft]}>{invoice.invoiceCode}</Text>
                            <View style={[styles.heroBadge, { backgroundColor: cfg.bg }]}>
                                <MaterialCommunityIcons name={cfg.icon} size={13} color={isDraft ? '#9CA3AF' : cfg.color} />
                                <Text style={[styles.heroBadgeText, { color: isDraft ? '#9CA3AF' : cfg.color }]}>{cfg.label}</Text>
                            </View>
                        </View>

                        {/* ── Summary amount ── */}
                        <View style={[styles.amountBanner, { backgroundColor: isDraft ? '#6B7280' : cfg.color }]}>
                            <View>
                                <Text style={styles.amountBannerLabel}>Tổng tiền phải trả</Text>
                                <Text style={styles.amountBannerValue}>{formatCurrency(invoice.totalAmount)}</Text>
                            </View>
                            {!isPrepaidType && (
                                <View style={styles.amountBannerMeta}>
                                    <Text style={styles.amountBannerMetaLabel}>Đến hạn</Text>
                                    <Text style={styles.amountBannerMetaValue}>{formatDate(invoice.dueDate)}</Text>
                                </View>
                            )}
                            {isPrepaidType && (
                                <View style={styles.amountBannerMeta}>
                                </View>
                            )}
                        </View>

                        {isDraft && (
                            <View style={styles.draftNoteBox}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#6B7280" />
                                <Text style={styles.draftNoteBoxText}>
                                    • Hãy kiểm tra lại các mục trong hóa đơn nếu có vấn đề vui lòng báo lại cho Quản lý của tòa nhà.{'\n'}
                                    • Hóa đơn sẽ được phát hành và cho phép thanh toán sau 1 ngày.
                                </Text>
                            </View>
                        )}

                        {/* ── Basic info ── */}
                        <Section icon="information-outline" title="Thông tin hóa đơn" color={isDraft ? '#9CA3AF' : '#3B82F6'}>
                            <InfoRow icon="barcode" label="Mã hóa đơn" value={invoice.invoiceCode} />
                            {/* Hiển thị Loại Hóa Đơn theo từng loại */}
                            {isViolation && <InfoRow icon="tag-outline" label="Loại Hóa Đơn" value="Vi phạm" />}
                            {isRepair && <InfoRow icon="tag-outline" label="Loại Hóa Đơn" value="Sửa chữa" />}
                            {!isIncurred && !isPrepaidType && <InfoRow icon="tag-outline" label="Loại Hóa Đơn" value="Định kỳ" />}
                            {isPrepaidType && <InfoRow icon="tag-outline" label="Loại Hóa Đơn" value="Trả trước tiền phòng" />}
                            {/* Periodic: room from roomId object */}
                            {!isIncurred && !isPrepaidType && room && <InfoRow icon="home-outline" label="Phòng" value={`${room.name} `} />}
                            {!isIncurred && !isPrepaidType && room?.roomTypeId?.currentPrice != null && (
                                <InfoRow icon="currency-usd" label="Giá phòng" value={formatCurrency(room.roomTypeId.currentPrice)} />
                            )}
                            {/* Incurred: roomName is a string */}
                            {isIncurred && invoice.roomName && (
                                <InfoRow icon="home-outline" label="Phòng" value={invoice.roomName} />
                            )}
                            {/* HD-PREPAID: hiển thị tên phòng, loại phòng, giá phòng */}
                            {isPrepaidType && room && (
                                <>
                                    <InfoRow icon="home-outline" label="Tên phòng" value={room.name} />
                                    {room.roomTypeId?.typeName && (
                                        <InfoRow icon="door-open" label="Loại phòng" value={room.roomTypeId.typeName} />
                                    )}
                                    {room.roomTypeId?.currentPrice != null && (
                                        <InfoRow icon="currency-usd" label="Giá phòng" value={formatCurrency(room.roomTypeId.currentPrice)} />
                                    )}
                                    {prepaidMonthList.length > 0 && (
                                        <>
                                            <InfoRow icon="calendar-month" label="Số tháng trả trước" value={`${prepaidMonthList.length} tháng`} />
                                            <View style={styles.infoRow}>
                                                <MaterialCommunityIcons name="calendar-check" size={16} color="#6B7280" style={styles.infoIcon} />
                                                <Text style={styles.infoLabel}>Tháng trả trước</Text>
                                                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                                    {prepaidMonthList.map((label, idx) => (
                                                        <PrepaidMonthItem key={idx} label={label} />
                                                    ))}
                                                </View>
                                            </View>
                                        </>
                                    )}
                                </>
                            )}
                            <InfoRow
                                icon="calendar-check"
                                label={isPrepaidRent ? 'Ngày thanh toán' : 'Ngày gửi'}
                                value={formatDate(invoice.createdAt)}
                            />
                            {!isPrepaidType && (
                                <InfoRow icon="calendar-clock" label="Đến hạn" value={formatDate(invoice.dueDate)}
                                    valueStyle={invoice.status === 'Overdue' ? { color: '#F59E0B', fontWeight: '700' } : {}} />
                            )}
                        </Section>

                        {/* ── Incurred: Violation - Hiển thị hình ảnh ── */}
                        {isViolation && (
                            <Section icon="camera-outline" title="Hình ảnh vi phạm" color="#EF4444">
                                {invoice.images && invoice.images.length > 0 ? (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                                        {invoice.images.map((img, idx) => (
                                            <Image key={idx} source={{ uri: img }} style={styles.violationImage} />
                                        ))}
                                    </ScrollView>
                                ) : (
                                    <View style={styles.noImageBox}>
                                        <MaterialCommunityIcons name="image-off-outline" size={32} color="#D1D5DB" />
                                        <Text style={styles.noImageText}>Không có hình ảnh</Text>
                                    </View>
                                )}
                                {invoice.description ? (
                                    <View style={styles.incurredDescBox}>
                                        <MaterialCommunityIcons name="text-box-outline" size={14} color="#6B7280" />
                                        <Text style={styles.incurredDescText}>{invoice.description}</Text>
                                    </View>
                                ) : null}
                                <View style={styles.svcTotalRow}>
                                    <Text style={styles.svcTotalLabel}>TỔNG CỘNG</Text>
                                    <Text style={styles.svcTotalValue}>{formatCurrency(invoice.totalAmount)}</Text>
                                </View>
                            </Section>
                        )}

                        {/* ── Incurred: Repair - Hiển thị thông tin sửa chữa ── */}
                        {isRepair && (
                            <Section icon="wrench" title="Chi tiết sửa chữa" color="#EF4444">
                                <View style={styles.incurredCard}>
                                    <View style={styles.incurredDeviceRow}>
                                        <View style={[styles.svcIconWrap, { backgroundColor: '#EF44441A' }]}>
                                            <MaterialCommunityIcons name="cog-outline" size={18} color="#EF4444" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.incurredDeviceName}>{invoice.deviceName || 'Thiết bị'}</Text>
                                            {/* <Text style={styles.incurredTitle}>{invoice.title}</Text> */}
                                        </View>
                                        <Text style={styles.incurredAmount}>{formatCurrency(invoice.totalAmount)}</Text>
                                    </View>
                                    {invoice.repairDescription ? (
                                        <View style={styles.incurredDescBox}>
                                            <MaterialCommunityIcons name="text-box-outline" size={14} color="#6B7280" />
                                            <Text style={styles.incurredDescText}>{invoice.repairDescription}</Text>
                                        </View>
                                    ) : null}
                                </View>
                                <View style={styles.svcTotalRow}>
                                    <Text style={styles.svcTotalLabel}>TỔNG CỘNG</Text>
                                    <Text style={styles.svcTotalValue}>{formatCurrency(invoice.totalAmount)}</Text>
                                </View>
                            </Section>
                        )}

                        {/* ── Periodic: Chi tiết khoản thu (không hiển thị với HD-PREPAID) ── */}
                        {!isIncurred && !isPrepaidType && (
                            <Section icon="format-list-bulleted" title="Chi tiết khoản thu" color={isDraft ? '#9CA3AF' : '#F59E0B'}>
                                {invoiceItems.map((item, idx) => {
                                    const display = item._icon
                                        ? { icon: item._icon, color: item._color }
                                        : getItemIcon(item.itemName);
                                    const hasAmount = item.amount != null && item.amount > 0;
                                    const hasUsage = item.usage != null && item.usage > 0 && item.unitPrice != null;
                                    const tName = normalizeVN(item.itemName);
                                    const showMeterReadings =
                                        item.isIndex === true ||
                                        ((tName.includes('tien dien') || tName.includes('tien nuoc')) &&
                                            item.oldIndex != null &&
                                            item.newIndex != null);
                                    return (
                                        <View key={item._id ?? `svc-${idx}`}
                                            style={[styles.svcRow, idx < invoiceItems.length - 1 && styles.svcRowBorder]}>
                                            <View style={styles.svcTop}>
                                                <View style={[styles.svcIconWrap, { backgroundColor: display.color + '15' }]}>
                                                    <MaterialCommunityIcons name={display.icon} size={16} color={display.color} />
                                                </View>
                                                <Text style={styles.svcName} numberOfLines={2}>{stripServicePrefix(item.itemName)}</Text>
                                                <Text style={[styles.svcAmount, !hasAmount && styles.svcAmountEmpty]}>
                                                    {hasAmount ? fmtNum(item.amount) : '—'}
                                                </Text>
                                            </View>
                                            {(showMeterReadings || hasUsage) && (
                                                <View style={styles.svcMeta}>
                                                    {showMeterReadings && (
                                                        <Text style={styles.svcMetaText}>
                                                            Số cũ: {fmtNum(item.oldIndex)} → Số mới: {fmtNum(item.newIndex)}
                                                        </Text>
                                                    )}
                                                    {hasUsage && (
                                                        <Text style={[styles.svcMetaText, showMeterReadings && styles.svcMetaLine2]}>
                                                            Số Lượng: {item.usage} × {fmtNum(item.unitPrice)}
                                                        </Text>
                                                    )}
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
                                onPress={() => navigation.navigate('PayInvoice', { invoiceId, invoiceType: isIncurred ? 'incurred' : 'periodic' })}
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
    heroCardDraft: { backgroundColor: '#F9FAFB' },
    heroIconWrap: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    heroTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', textAlign: 'center' },
    heroTitleDraft: { color: '#9CA3AF' },
    heroCode: { fontSize: 13, color: '#9CA3AF' },
    heroCodeDraft: { color: '#D1D5DB' },
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
    svcMetaLine2: { marginTop: 3 },
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

    /* violation image */
    imageScroll: { paddingHorizontal: 14, paddingVertical: 10 },
    violationImage: { width: 150, height: 150, borderRadius: 10, marginRight: 10 },
    noImageBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30, backgroundColor: '#F9FAFB', marginHorizontal: 14, borderRadius: 10 },
    noImageText: { fontSize: 13, color: '#9CA3AF', marginTop: 8 },

    /* prepaid month list */
    prepaidMonthItem: {
        flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2,
    },
    prepaidMonthDot: {
        fontSize: 16, color: '#7C3AED', fontWeight: '700', lineHeight: 18,
    },
    prepaidMonthText: {
        fontSize: 13, color: '#1F2937', fontWeight: '600',
    },

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

    /* draft note */
    draftNoteBox: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        marginHorizontal: 12, marginTop: 10, paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: '#F3F4F6', borderRadius: 12,
        borderLeftWidth: 4, borderLeftColor: '#9CA3AF',
    },
    draftNoteBoxText: { flex: 1, fontSize: 13, color: '#6B7280', lineHeight: 22 },
});

