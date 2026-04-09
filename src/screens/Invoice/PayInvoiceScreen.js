// Pay Invoice Screen — QR Payment for all invoice types (Periodic & Incurred) via Sepay/VietQR
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, TouchableOpacity,
    ScrollView, ActivityIndicator, Image, Alert, AppState,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import {
    initiatePaymentAPI,
    getInvoiceStatusAPI,
    getPaymentStatusAPI,
    cancelPaymentAPI,
} from '../../services/invoice.service';

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
                {mins}:{String(secs).padStart(2, '0')}
            </Text>
            {isWarning && <Text style={styles.timerWarningLabel}>Sắp hết hạn!</Text>}
        </View>
    );
}

/* ────────────────────────── CopyRow ────────────────────────── */
function CopyRow({ label, value, icon }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        await Clipboard.setStringAsync(String(value));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <View style={styles.bankRow}>
            <MaterialCommunityIcons name={icon} size={16} color="#6B7280" />
            <View style={styles.bankRowContent}>
                <Text style={styles.bankLabel}>{label}</Text>
                <Text style={styles.bankValue}>{value}</Text>
            </View>
            <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
                <MaterialCommunityIcons
                    name={copied ? 'check-circle' : 'content-copy'}
                    size={16}
                    color={copied ? '#10B981' : '#3B82F6'}
                />
            </TouchableOpacity>
        </View>
    );
}

/* ══════════════════════════ MAIN SCREEN ══════════════════════════ */
export default function PayInvoiceScreen({ navigation, route }) {
    const { invoiceId, invoiceType } = route.params ?? {};

    const [phase, setPhase] = useState('loading'); // loading | pending | success | expired | error
    const [paymentData, setPaymentData] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [qrError, setQrError] = useState(false);
    const [pollError, setPollError] = useState(false);
    const [hasPolledOnce, setHasPolledOnce] = useState(false);
    const [expireInSeconds, setExpireInSeconds] = useState(300);

    const pollingRef = useRef(null);
    const failsafeRef = useRef(null);
    const appStateRef = useRef(AppState.currentState);

    /* ── Khởi tạo thanh toán ── */
    useEffect(() => {
        if (!invoiceId) { setErrorMsg('Thiếu mã hóa đơn'); setPhase('error'); return; }

        let cancelled = false;
        (async () => {
            try {
                const res = await initiatePaymentAPI(invoiceId, invoiceType);
                if (cancelled) return;
                if (res?.success && res?.data) {
                    setPaymentData(res.data);
                    setExpireInSeconds(res.data.expireInSeconds ?? 300);
                    setPollError(false);
                    setHasPolledOnce(false);
                    setQrError(false);
                    setPhase('pending');
                } else {
                    setErrorMsg(res?.message || 'Không thể khởi tạo thanh toán');
                    setPhase('error');
                }
            } catch (err) {
                if (cancelled) return;
                const msg = err?.response?.data?.message || err.message || 'Lỗi kết nối';
                setErrorMsg(msg);
                setPhase('error');
            }
        })();
        return () => { cancelled = true; };
    }, [invoiceId]);

    /* ── Cleanup on unmount ── */
    const stopTimers = useCallback(() => {
        if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
        if (failsafeRef.current) { clearTimeout(failsafeRef.current); failsafeRef.current = null; }
    }, []);

    useEffect(() => () => stopTimers(), [stopTimers]);

    /* ── Auto-navigate on success ── */
    useEffect(() => {
        if (phase !== 'success') return;
        const t = setTimeout(() => {
            navigation.navigate('InvoiceList', { refresh: Date.now() });
        }, 1200);
        return () => clearTimeout(t);
    }, [phase, navigation]);

    /* ── Polling ── */
    useEffect(() => {
        if (phase !== 'pending' || !paymentData?.transactionCode) return;

        const poll = async () => {
            try {
                // Poll invoice status thay vì payment status
                // BE webhook đã cập nhật Invoice.status → 'Paid' khi thanh toán thành công
                const res = await getInvoiceStatusAPI(invoiceId, invoiceType);
                const st = res?.data?.status;
                setPollError(false);
                setHasPolledOnce(true);

                if (st === 'Paid') {
                    stopTimers(); setPhase('success');
                }
                // status === 'Unpaid' hoặc 'Draft' → tiếp tục polling
            } catch (err) {
                const status = err?.response?.status;
                // 404 → invoice không tìm thấy
                if (status === 404) {
                    // Thử polling payment status thay thế
                    try {
                        const paymentRes = await getPaymentStatusAPI(paymentData.transactionCode);
                        setPollError(false);
                        setHasPolledOnce(true);
                        const pSt = paymentRes?.data?.status;
                        if (pSt === 'Success') { stopTimers(); setPhase('success'); }
                        else if (pSt === 'Expired') { stopTimers(); setPhase('expired'); }
                    } catch {
                        // Nếu cả 2 đều lỗi → tạm thời bỏ qua, tiếp tục polling
                        setPollError(true);
                    }
                    return;
                }
                // Network error hoặc lỗi khác → hiển thị banner, vẫn tiếp tục polling
                setPollError(true);
            }
        };

        pollingRef.current = setInterval(poll, POLL_INTERVAL);

        // failsafe — tự dừng sau expireInSeconds + 30s buffer
        failsafeRef.current = setTimeout(() => {
            stopTimers();
            setPhase('expired');
        }, (expireInSeconds + 30) * 1000);

        return stopTimers;
    }, [phase, paymentData, invoiceId, invoiceType, stopTimers, expireInSeconds]);

    /* ── Pause polling khi app background ── */
    useEffect(() => {
        const sub = AppState.addEventListener('change', (nextState) => {
            if (appStateRef.current === 'active' && nextState.match(/inactive|background/)) {
                if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
            } else if (nextState === 'active' && phase === 'pending' && paymentData?.transactionCode) {
                if (!pollingRef.current) {
                    pollingRef.current = setInterval(async () => {
                        try {
                            const res = await getInvoiceStatusAPI(invoiceId, invoiceType);
                            const st = res?.data?.status;
                            setPollError(false);
                            setHasPolledOnce(true);
                            if (st === 'Paid') { stopTimers(); setPhase('success'); }
                        } catch {
                            setPollError(true);
                        }
                    }, POLL_INTERVAL);
                }
            }
            appStateRef.current = nextState;
        });
        return () => sub.remove();
    }, [phase, paymentData, invoiceId, invoiceType, stopTimers, hasPolledOnce]);

    /* ── Hủy giao dịch ── */
    const handleCancel = () => {
        Alert.alert(
            'Hủy thanh toán',
            'Bạn có chắc muốn hủy giao dịch này? Hóa đơn sẽ vẫn ở trạng thái Chưa thanh toán.',
            [
                { text: 'Tiếp tục thanh toán', style: 'cancel' },
                {
                    text: 'Hủy giao dịch', style: 'destructive', onPress: async () => {
                        stopTimers();
                        try {
                            if (paymentData?.transactionCode) {
                                await cancelPaymentAPI(paymentData.transactionCode);
                            }
                        } catch { /* ignore cancel errors */ }
                        navigation.goBack();
                    }
                },
            ]
        );
    };

    /* ── Back handler for success/expired ── */
    const handleDone = (isSuccess = false) => {
        if (isSuccess) {
            navigation.navigate('InvoiceList', { refresh: Date.now() });
        } else {
            navigation.goBack();
        }
    };

    /* ── Tải QR về thư viện ── */
    const [downloading, setDownloading] = useState(false);
    const handleDownloadQR = async () => {
        if (!paymentData?.qrUrl || downloading) return;
        setDownloading(true);
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Quyền bị từ chối', 'Vui lòng cấp quyền truy cập thư viện ảnh để tải mã QR.');
                setDownloading(false);
                return;
            }
            const fileName = `QR_${paymentData.transactionCode || 'payment'}_${Date.now()}.png`;
            const fileUri = FileSystem.cacheDirectory + fileName;
            const downloadResult = await FileSystem.downloadAsync(paymentData.qrUrl, fileUri);
            if (downloadResult.status !== 200) {
                throw new Error('Không thể tải ảnh');
            }
            const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
            await MediaLibrary.createAlbumAsync('HNALMS', asset, false);
            Alert.alert('Thành công', 'Đã lưu mã QR vào thư viện ảnh.');
        } catch (err) {
            Alert.alert('Lỗi', err.message || 'Không thể tải mã QR.');
        } finally {
            setDownloading(false);
        }
    };

    /* ═══════════════════════ RENDER ═══════════════════════ */
    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={phase === 'pending' ? handleCancel : handleDone} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thanh toán hóa đơn</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* ── LOADING ── */}
            {phase === 'loading' && (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.centerText}>Đang tạo mã QR thanh toán…</Text>
                </View>
            )}

            {/* ── ERROR ── */}
            {phase === 'error' && (
                <View style={styles.center}>
                    <View style={styles.resultIconWrap}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={56} color="#DC2626" />
                    </View>
                    <Text style={[styles.resultTitle, { color: '#DC2626' }]}>Không thể thanh toán</Text>
                    <Text style={styles.resultDesc}>{errorMsg}</Text>
                    <TouchableOpacity style={styles.resultBtn} onPress={handleDone}>
                        <Text style={styles.resultBtnText}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── SUCCESS ── */}
            {phase === 'success' && (
                <View style={styles.center}>
                    <View style={[styles.resultIconWrap, { backgroundColor: '#D1FAE5' }]}>
                        <MaterialCommunityIcons name="check-circle" size={56} color="#10B981" />
                    </View>
                    <Text style={[styles.resultTitle, { color: '#10B981' }]}>Thanh toán thành công!</Text>
                    <Text style={styles.resultDesc}>
                        Hóa đơn {paymentData?.invoiceCode} đã được thanh toán.
                    </Text>
                    <Text style={styles.resultAmount}>{fmtMoney(paymentData?.invoiceAmount)}</Text>
                    <TouchableOpacity style={[styles.resultBtn, { backgroundColor: '#10B981' }]} onPress={() => handleDone(true)}>
                        <MaterialCommunityIcons name="check" size={18} color="#FFF" />
                        <Text style={styles.resultBtnText}>Hoàn tất</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── EXPIRED ── */}
            {phase === 'expired' && (
                <View style={styles.center}>
                    <View style={[styles.resultIconWrap, { backgroundColor: '#FEF3C7' }]}>
                        <MaterialCommunityIcons name="clock-alert-outline" size={56} color="#F59E0B" />
                    </View>
                    <Text style={[styles.resultTitle, { color: '#F59E0B' }]}>Giao dịch hết hạn</Text>
                    <Text style={styles.resultDesc}>
                        Phiên thanh toán đã hết 5 phút.{'\n'}Vui lòng thử lại.
                    </Text>
                    <TouchableOpacity style={[styles.resultBtn, { backgroundColor: '#F59E0B' }]} onPress={handleDone}>
                        <MaterialCommunityIcons name="refresh" size={18} color="#FFF" />
                        <Text style={styles.resultBtnText}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── PENDING — QR SCREEN ── */}
            {phase === 'pending' && paymentData && (
                <>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* Countdown */}
                        <CountdownTimer
                            initialSeconds={expireInSeconds}
                            onExpire={() => { stopTimers(); setPhase('expired'); }}
                        />

                        {/* Polling error notice — chỉ hiện sau khi đã poll thành công ít nhất 1 lần */}
                        {pollError && hasPolledOnce && (
                            <View style={styles.pollErrorBanner}>
                                <MaterialCommunityIcons name="wifi-off" size={16} color="#DC2626" />
                                <Text style={styles.pollErrorText}>Đang thử kết nối lại...</Text>
                            </View>
                        )}

                        {/* QR Card */}
                        <View style={styles.qrCard}>
                            <Text style={styles.qrCardTitle}>Quét mã QR để thanh toán</Text>
                            <View style={styles.qrImageWrap}>
                                {!qrError ? (
                                    <Image
                                        source={{ uri: paymentData.qrUrl }}
                                        style={styles.qrImage}
                                        resizeMode="contain"
                                        onError={() => setQrError(true)}
                                    />
                                ) : (
                                    <View style={styles.qrErrorWrap}>
                                        <MaterialCommunityIcons name="image-off-outline" size={40} color="#9CA3AF" />
                                        <Text style={styles.qrErrorText}>Không tải được mã QR</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.qrAmount}>{fmtMoney(paymentData.invoiceAmount)}</Text>
                            <Text style={styles.qrInvoiceCode}>{paymentData.invoiceCode}</Text>
                            {paymentData.roomName && (
                                <Text style={styles.qrRoom}>{paymentData.roomName}</Text>
                            )}
                            {/* Download button */}
                            <TouchableOpacity
                                style={styles.downloadBtn}
                                onPress={handleDownloadQR}
                                disabled={downloading}
                                activeOpacity={0.8}
                            >
                                {downloading ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <MaterialCommunityIcons name="download" size={18} color="#FFF" />
                                )}
                                <Text style={styles.downloadBtnText}>
                                    {downloading ? 'Đang tải...' : 'Tải mã QR'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Bank info */}
                        <View style={styles.bankCard}>
                            <View style={styles.bankCardHeader}>
                                <MaterialCommunityIcons name="bank-outline" size={18} color="#1E40AF" />
                                <Text style={styles.bankCardTitle}>Thông tin chuyển khoản</Text>
                            </View>
                            <CopyRow icon="bank" label="Ngân hàng" value="BIDV" />
                            <CopyRow icon="credit-card-outline" label="Số tài khoản" value={paymentData.bankInfo?.bankAccount} />
                            <CopyRow icon="account-outline" label="Chủ tài khoản" value={paymentData.bankInfo?.bankAccountName} />
                            <CopyRow icon="cash" label="Số tiền" value={fmtMoney(paymentData.invoiceAmount)} />
                            <View style={styles.bankRowHighlight}>
                                <CopyRow icon="text-box-outline" label="Nội dung CK" value={paymentData.bankInfo?.content || paymentData.transactionCode} />
                            </View>
                        </View>

                        {/* Hint */}
                        {/* <View style={styles.hintCard}>
                            <MaterialCommunityIcons name="information-outline" size={16} color="#3B82F6" />
                            <Text style={styles.hintText}>
                                Vui lòng nhập <Text style={{ fontWeight: '700' }}>đúng nội dung chuyển khoản</Text> để hệ thống tự động xác nhận thanh toán.
                            </Text>
                        </View> */}

                        {/* Waiting indicator */}
                        <View style={styles.waitingRow}>
                            <ActivityIndicator size="small" color="#3B82F6" />
                            <Text style={styles.waitingText}>Đang chờ xác nhận thanh toán…</Text>
                        </View>

                        <View style={{ height: 90 }} />
                    </ScrollView>

                    {/* Cancel footer */}
                    <View style={styles.footerBar}>
                        <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.85} onPress={handleCancel}>
                            <MaterialCommunityIcons name="close-circle-outline" size={20} color="#DC2626" />
                            <Text style={styles.cancelBtnText}>Hủy thanh toán</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}

/* ═══════════════════════ STYLES ═══════════════════════ */
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#FFF', paddingVertical: 14, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    centerText: { marginTop: 12, fontSize: 15, color: '#6B7280' },

    scrollContent: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 20 },

    /* timer */
    timerBox: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#FFFBEB', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 12,
        borderWidth: 1, borderColor: '#FDE68A',
    },
    timerBoxWarning: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
    timerText: { fontSize: 22, fontWeight: '800', color: '#F59E0B', fontVariant: ['tabular-nums'] },
    timerTextWarning: { color: '#DC2626' },
    timerWarningLabel: { fontSize: 12, fontWeight: '600', color: '#DC2626' },

    /* poll error */
    pollErrorBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: '#FEF2F2', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, marginBottom: 12,
        borderWidth: 1, borderColor: '#FECACA',
    },
    pollErrorText: { fontSize: 13, color: '#DC2626', fontWeight: '600' },

    /* QR card */
    qrCard: {
        backgroundColor: '#FFF', borderRadius: 16, padding: 20, alignItems: 'center',
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4,
        marginBottom: 12,
    },
    qrCardTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12 },
    qrImageWrap: {
        width: 220, height: 220, backgroundColor: '#FFFFFF',
        borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: '#E5E7EB',
        justifyContent: 'center', alignItems: 'center',
    },
    qrImage: { width: 200, height: 200 },
    qrErrorWrap: { alignItems: 'center', justifyContent: 'center', gap: 8 },
    qrErrorText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
    qrAmount: { fontSize: 24, fontWeight: '800', color: '#DC2626', marginTop: 14 },
    qrInvoiceCode: { fontSize: 13, color: '#6B7280', marginTop: 4 },
    qrRoom: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
    downloadBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#3B82F6', borderRadius: 10,
        paddingVertical: 10, paddingHorizontal: 20, marginTop: 14,
        minWidth: 140,
    },
    downloadBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF' },

    /* bank card */
    bankCard: {
        backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden', marginBottom: 12,
        elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
    },
    bankCardHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#DBEAFE',
    },
    bankCardTitle: { fontSize: 14, fontWeight: '700', color: '#1E40AF' },
    bankRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingVertical: 11,
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    bankRowContent: { flex: 1 },
    bankLabel: { fontSize: 11, color: '#9CA3AF' },
    bankValue: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginTop: 1 },
    copyBtn: { padding: 6 },
    bankRowHighlight: {
        backgroundColor: '#FFFBEB',
        borderLeftWidth: 3, borderLeftColor: '#F59E0B',
    },

    /* hint */
    hintCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12,
        borderWidth: 1, borderColor: '#DBEAFE', marginBottom: 12,
    },
    hintText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 20 },

    /* waiting */
    waitingRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        paddingVertical: 8,
    },
    waitingText: { fontSize: 13, color: '#3B82F6', fontWeight: '600' },

    /* result states */
    resultIconWrap: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    },
    resultTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
    resultDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 8 },
    resultAmount: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginBottom: 20 },
    resultBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#3B82F6', borderRadius: 12,
        paddingHorizontal: 32, paddingVertical: 14, marginTop: 12,
    },
    resultBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

    /* footer */
    footerBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 12,
        borderTopWidth: 1, borderTopColor: '#E5E7EB',
        elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08, shadowRadius: 6,
    },
    cancelBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 14,
        borderWidth: 1, borderColor: '#FECACA',
    },
    cancelBtnText: { fontSize: 16, fontWeight: '700', color: '#DC2626' },
});
