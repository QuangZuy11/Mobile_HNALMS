// PrepaidRentQR — Màn hình QR thanh toán trả trước tiền phòng + Polling
import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, TouchableOpacity,
    ScrollView, ActivityIndicator, Image, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import {
    getPrepaidRentPaymentStatusAPI,
    cancelPrepaidRentAPI,
} from '../../services/prepaid_rent.service';

const POLL_INTERVAL = 3000; // 3 giây
const fmtMoney = (v) => new Intl.NumberFormat('vi-VN').format(Math.round(v ?? 0)) + ' đ';

/* ────────────────────────── CountdownTimer ────────────────────────── */
function CountdownTimer({ initialSeconds, onExpire }) {
    const [remaining, setRemaining] = useState(initialSeconds);
    const onExpireRef = useRef(onExpire);
    onExpireRef.current = onExpire;

    useEffect(() => {
        setRemaining(initialSeconds);
    }, [initialSeconds]);

    useEffect(() => {
        if (remaining <= 0) {
            setTimeout(() => onExpireRef.current?.(), 0);
            return;
        }
        const t = setInterval(() => {
            setRemaining((prev) => {
                const next = prev - 1;
                if (next <= 0) {
                    clearInterval(t);
                    setTimeout(() => onExpireRef.current?.(), 0);
                    return 0;
                }
                return next;
            });
        }, 1000);
        return () => clearInterval(t);
    }, []);

    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const isWarning = remaining <= 60;

    return (
        <View style={[styles.timerBox, isWarning && styles.timerBoxWarning]}>
            <MaterialCommunityIcons
                name="timer-sand"
                size={18}
                color={isWarning ? '#DC2626' : '#F59E0B'}
            />
            <Text style={[styles.timerText, isWarning && styles.timerTextWarning]}>
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </Text>
        </View>
    );
}

export default function PrepaidRentQR({ navigation, route }) {
    const { paymentData } = route.params ?? {};

    const [phase, setPhase] = useState('loading'); // loading | pending | success | expired | error
    const [expireSeconds, setExpireSeconds] = useState(paymentData?.expireInSeconds || 300);
    const [savingQR, setSavingQR] = useState(false);
    const pollingRef = useRef(null);

    const stopTimers = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    };

    // Bắt đầu polling khi vào màn hình
    useEffect(() => {
        if (!paymentData?.transactionCode) {
            setPhase('error');
            return;
        }
        startPolling();
        return () => stopTimers();
    }, []);

    const startPolling = () => {
        setPhase('pending');
        pollingRef.current = setInterval(poll, POLL_INTERVAL);
    };

    const poll = async () => {
        try {
            const res = await getPrepaidRentPaymentStatusAPI(paymentData.transactionCode);
            const { status, expireInSeconds: exp } = res.data || {};

            if (status === 'Success' || status === 'paid') {
                stopTimers();
                setPhase('success');
                return;
            }

            if (status === 'Expired' || status === 'expired') {
                stopTimers();
                setPhase('expired');
                return;
            }

            if (exp !== undefined) {
                setExpireSeconds(exp);
            }
        } catch (err) {
            // Lỗi polling bỏ qua, tiếp tục poll
        }
    };

    const handleExpire = () => {
        stopTimers();
        setPhase('expired');
    };

    const handleCancel = () => {
        Alert.alert(
            'Hủy thanh toán',
            'Bạn có chắc muốn hủy giao dịch này không?',
            [
                { text: 'Tiếp tục thanh toán', style: 'cancel' },
                {
                    text: 'Hủy giao dịch',
                    style: 'destructive',
                    onPress: async () => {
                        stopTimers();
                        try {
                            await cancelPrepaidRentAPI(paymentData.transactionCode);
                        } catch (_) { /* ignore */ }
                        navigation.goBack();
                    },
                },
            ]
        );
    };

    const handleSaveQR = async () => {
        if (!paymentData?.qrUrl || savingQR) return;
        setSavingQR(true);
        try {
            const { status: permStatus } = await MediaLibrary.requestPermissionsAsync();
            if (permStatus !== 'granted') {
                Alert.alert('Quyền bị từ chối', 'Vui lòng cấp quyền truy cập thư viện ảnh để tải mã QR.');
                setSavingQR(false);
                return;
            }
            const fileName = `QR_${paymentData.transactionCode || 'prepaid'}_${Date.now()}.png`;
            const fileUri = FileSystem.cacheDirectory + fileName;
            const downloadResult = await FileSystem.downloadAsync(paymentData.qrUrl, fileUri);
            if (downloadResult.status !== 200) {
                throw new Error('Không thể tải ảnh');
            }
            const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
            await MediaLibrary.createAlbumAsync('HNALMS', asset, false);
            Alert.alert('Thành công', 'Đã lưu mã QR vào thư viện ảnh.');
        } catch (err) {
            console.log('Save QR error:', err.message);
            Alert.alert('Lỗi', err.message || 'Không thể lưu mã QR. Vui lòng thử lại.');
        } finally {
            setSavingQR(false);
        }
    };

    // ─── Phase: Loading ───
    if (phase === 'loading' || !paymentData) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#7C3AED" />
                    <Text style={styles.stateText}>Đang tải mã QR...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ─── Phase: Success ───
    if (phase === 'success') {
        const payment = paymentData || {};
        return (
            <SafeAreaView style={styles.safe}>
                <ScrollView contentContainerStyle={styles.successScroll} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={styles.successTop}>
                        <View style={styles.successIconWrap}>
                            <MaterialCommunityIcons name="check-circle" size={72} color="#10B981" />
                        </View>
                        <Text style={styles.successTitle}>Thanh toán thành công!</Text>
                        <Text style={styles.successSubtitle}>
                            Hóa đơn trả trước tiền phòng của bạn đã được xác nhận.
                        </Text>
                    </View>

                    {/* Invoice Card */}
                    <View style={styles.invoiceCard}>
                        {/* Invoice Header */}
                        <View style={styles.invoiceCardHeader}>
                            <View style={styles.invoiceHeaderLeft}>
                                <MaterialCommunityIcons name="file-document-check" size={24} color="#7C3AED" />
                                <Text style={styles.invoiceHeaderTitle}>HÓA ĐƠN TRẢ TRƯỚC</Text>
                            </View>
                            <View style={styles.paidBadge}>
                                <Text style={styles.paidBadgeText}>ĐÃ THANH TOÁN</Text>
                            </View>
                        </View>

                        {/* Invoice Info */}
                        <View style={styles.invoiceInfoRow}>
                            <Text style={styles.invoiceLabel}>Mã hóa đơn</Text>
                            <Text style={styles.invoiceValue}>{payment.invoiceCode || payment.transactionCode}</Text>
                        </View>
                        <View style={styles.invoiceDivider} />
                        <View style={styles.invoiceInfoRow}>
                            <Text style={styles.invoiceLabel}>Phòng</Text>
                            <Text style={styles.invoiceValue}>{payment.roomName || '—'}</Text>
                        </View>
                        <View style={styles.invoiceDivider} />
                        <View style={styles.invoiceInfoRow}>
                            <Text style={styles.invoiceLabel}>Số tháng</Text>
                            <Text style={[styles.invoiceValue, { color: '#7C3AED', fontWeight: '800' }]}>
                                {payment.prepaidMonths || 0} tháng
                            </Text>
                        </View>
                        {payment.prepaidFromMonth && payment.prepaidToMonth && (
                            <>
                                <View style={styles.invoiceDivider} />
                                <View style={styles.invoiceInfoRow}>
                                    <Text style={styles.invoiceLabel}>Kỳ hạn</Text>
                                    <Text style={styles.invoiceValue}>
                                        {payment.prepaidFromMonth} — {payment.prepaidToMonth}
                                    </Text>
                                </View>
                            </>
                        )}
                        <View style={styles.invoiceDivider} />
                        <View style={styles.invoiceInfoRow}>
                            <Text style={styles.invoiceLabel}>Số tiền</Text>
                            <Text style={[styles.invoiceValue, { color: '#10B981', fontWeight: '800', fontSize: 18 }]}>
                                {fmtMoney(payment.totalAmount)}
                            </Text>
                        </View>
                        <View style={styles.invoiceDivider} />
                        <View style={styles.invoiceInfoRow}>
                            <Text style={styles.invoiceLabel}>Ngày thanh toán</Text>
                            <Text style={styles.invoiceValue}>
                                {new Date().toLocaleDateString('vi-VN')}
                            </Text>
                        </View>
                        <View style={styles.invoiceDivider} />
                        <View style={styles.invoiceInfoRow}>
                            <Text style={styles.invoiceLabel}>Mã giao dịch</Text>
                            <Text style={styles.invoiceValue}>{payment.transactionCode}</Text>
                        </View>
                    </View>

                    {/* Info Box */}
                    <View style={styles.successInfoBox}>
                        <MaterialCommunityIcons name="information-outline" size={18} color="#6B7280" />
                        <Text style={styles.successInfoText}>
                            Hóa đơn đã được ghi nhận. Tiền phòng của bạn đã được cập nhật đến hết kỳ trả trước.
                        </Text>
                    </View>
                </ScrollView>

                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={styles.successBtn}
                        onPress={() => navigation.navigate('InvoiceList', { refresh: Date.now() })}
                        activeOpacity={0.85}
                    >
                        <MaterialCommunityIcons name="home-outline" size={20} color="#FFF" />
                        <Text style={styles.successBtnText}>Quay về danh sách hóa đơn</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ─── Phase: Expired ───
    if (phase === 'expired') {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.center}>
                    <MaterialCommunityIcons name="timer-sand-empty" size={64} color="#DC2626" />
                    <Text style={[styles.stateText, { color: '#DC2626', marginTop: 16 }]}>
                        Giao dịch đã hết hạn
                    </Text>
                    <Text style={styles.stateTextSub}>
                        Mã QR không còn hiệu lực. Vui lòng tạo yêu cầu mới.
                    </Text>
                    <TouchableOpacity
                        style={styles.expiredBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.expiredBtnText}>Tạo yêu cầu mới</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ─── Phase: Pending ───
    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleCancel} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thanh toán QR</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* QR Card */}
                <View style={styles.qrCard}>
                    <View style={styles.qrCardHeader}>
                        <MaterialCommunityIcons name="wallet-outline" size={24} color="#7C3AED" />
                        <Text style={styles.qrCardTitle}>Quét mã QR để thanh toán</Text>
                    </View>

                    <View style={styles.qrWrapper}>
                        {paymentData.qrUrl ? (
                            <Image
                                source={{ uri: paymentData.qrUrl }}
                                style={styles.qrImage}
                                resizeMode="contain"
                            />
                        ) : (
                            <View style={styles.qrPlaceholder}>
                                <MaterialCommunityIcons name="qrcode" size={80} color="#D1D5DB" />
                            </View>
                        )}
                    </View>

                    <View style={styles.timerRow}>
                        <CountdownTimer initialSeconds={expireSeconds} onExpire={handleExpire} />
                    </View>
                </View>

                {/* Thông tin thanh toán */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Người thụ hưởng</Text>
                        <Text style={styles.infoValue}>{paymentData.bankInfo?.bankAccountName || 'HOANG NAM ALMS'}</Text>
                    </View>
                    <View style={styles.infoRowDivider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Số tài khoản</Text>
                        <Text style={styles.infoValue}>{paymentData.bankInfo?.bankAccount || '—'}</Text>
                    </View>
                    <View style={styles.infoRowDivider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Ngân hàng</Text>
                        <Text style={styles.infoValue}>{paymentData.bankInfo?.bankBin || '—'}</Text>
                    </View>
                    <View style={styles.infoRowDivider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Nội dung CK</Text>
                        <Text style={[styles.infoValue, { color: '#7C3AED', fontWeight: '700', flex: 1, textAlign: 'right' }]}
                            numberOfLines={2}>
                            {paymentData.transactionCode}
                        </Text>
                    </View>
                    <View style={styles.infoRowDivider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Số tiền</Text>
                        <Text style={[styles.infoValue, { color: '#DC2626', fontWeight: '800', fontSize: 18 }]}>
                            {fmtMoney(paymentData.totalAmount)}
                        </Text>
                    </View>
                    <View style={styles.infoRowDivider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Phòng</Text>
                        <Text style={styles.infoValue}>{paymentData.roomName || '—'}</Text>
                    </View>
                </View>

                {/* Cảnh báo */}
                <View style={styles.warningBox}>
                    <MaterialCommunityIcons name="information-outline" size={18} color="#F59E0B" />
                    <Text style={styles.warningText}>
                        Vui lòng nhập đúng nội dung chuyển khoản.{'\n'}
                        Sai nội dung = giao dịch không được xác nhận.
                    </Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Nút hủy + Lưu QR */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
                    <MaterialCommunityIcons name="close-circle-outline" size={20} color="#DC2626" />
                    <Text style={styles.cancelBtnText}>Hủy giao dịch</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.downloadBtn, savingQR && styles.downloadBtnDisabled]}
                    onPress={handleSaveQR}
                    disabled={savingQR}
                    activeOpacity={0.85}
                >
                    {savingQR ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="download-outline" size={20} color="#FFF" />
                            <Text style={styles.downloadBtnText}>Lưu mã QR</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F3F4F6' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },

    /* header */
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#FFFFFF', paddingVertical: 14, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },

    scroll: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 20 },

    /* QR card */
    qrCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08, shadowRadius: 4, alignItems: 'center',
    },
    qrCardHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginBottom: 16,
    },
    qrCardTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
    qrWrapper: {
        width: 220, height: 220, borderRadius: 12,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#F3F4F6',
    },
    qrImage: { width: 210, height: 210 },
    qrPlaceholder: { width: 210, height: 210, justifyContent: 'center', alignItems: 'center' },
    timerRow: { marginTop: 16, alignItems: 'center' },
    timerBox: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#FEF3C7', borderRadius: 8,
        paddingHorizontal: 14, paddingVertical: 8,
    },
    timerBoxWarning: { backgroundColor: '#FEE2E2' },
    timerText: { fontSize: 18, fontWeight: '700', color: '#F59E0B' },
    timerTextWarning: { color: '#DC2626' },

    /* info card */
    infoCard: {
        backgroundColor: '#FFFFFF', borderRadius: 14, marginTop: 12,
        overflow: 'hidden', elevation: 1, shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
    },
    infoRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 13,
    },
    infoRowDivider: { height: 1, backgroundColor: '#F3F4F6' },
    infoLabel: { fontSize: 13, color: '#6B7280' },
    infoValue: { fontSize: 13, fontWeight: '600', color: '#1F2937' },

    /* warning */
    warningBox: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: '#FFFBEB', borderRadius: 12,
        padding: 14, marginTop: 12,
        borderLeftWidth: 4, borderLeftColor: '#F59E0B',
    },
    warningText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },

    /* bottom bar */
    bottomBar: {
        flexDirection: 'row', gap: 10, alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1, borderTopColor: '#E5E7EB',
        elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08, shadowRadius: 6,
    },
    cancelBtn: {
        flex: 1, borderRadius: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 14,
        borderWidth: 1.5, borderColor: '#DC2626',
    },
    cancelBtnText: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
    downloadBtn: {
        flex: 1, backgroundColor: '#7C3AED', borderRadius: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 14,
    },
    downloadBtnDisabled: { backgroundColor: '#A78BFA' },
    downloadBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

    /* success */
    successScroll: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 20 },
    successTop: { alignItems: 'center', marginBottom: 24 },
    successIconWrap: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: '#D1FAE5',
        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    },
    successTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937', textAlign: 'center' },
    successSubtitle: {
        fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8,
    },

    /* Invoice Card */
    invoiceCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16,
        overflow: 'hidden', elevation: 2, shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
        marginBottom: 16,
    },
    invoiceCardHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#7C3AED', paddingHorizontal: 16, paddingVertical: 14,
    },
    invoiceHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    invoiceHeaderTitle: { fontSize: 13, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1 },
    paidBadge: {
        backgroundColor: '#10B981', borderRadius: 6,
        paddingHorizontal: 8, paddingVertical: 4,
    },
    paidBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
    invoiceInfoRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 13,
    },
    invoiceDivider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },
    invoiceLabel: { fontSize: 13, color: '#6B7280' },
    invoiceValue: { fontSize: 13, fontWeight: '600', color: '#1F2937' },

    /* Info Box */
    successInfoBox: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: '#F9FAFB', borderRadius: 12,
        padding: 14,
        borderWidth: 1, borderColor: '#E5E7EB',
    },
    successInfoText: { flex: 1, fontSize: 12, color: '#6B7280', lineHeight: 18 },

    successBtn: {
        flex: 1, backgroundColor: '#10B981', borderRadius: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 14,
    },
    successBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

    /* expired */
    stateText: { marginTop: 8, fontSize: 15, color: '#6B7280', textAlign: 'center' },
    stateTextSub: { marginTop: 8, fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 24 },
    expiredBtn: {
        backgroundColor: '#7C3AED', borderRadius: 12,
        paddingHorizontal: 28, paddingVertical: 14,
    },
    expiredBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
