// PrepaidRentQR — Màn hình QR thanh toán trả trước tiền phòng + Polling
import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, SafeAreaView, StyleSheet, TouchableOpacity,
    ScrollView, ActivityIndicator, Image, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
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

/* ────────────────────────── SuccessCheckmark ────────────────────────── */
function SuccessCheckmark() {
    return (
        <View style={styles.successIconWrap}>
            <MaterialCommunityIcons name="check-circle" size={64} color="#10B981" />
        </View>
    );
}

export default function PrepaidRentQR({ navigation, route }) {
    const { paymentData } = route.params ?? {};

    const [phase, setPhase] = useState('loading'); // loading | pending | success | expired | error
    const [expireSeconds, setExpireSeconds] = useState(paymentData?.expireInSeconds || 300);
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
            const { status, expireInSeconds } = res.data || {};

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

            if (exppireInSeconds !== undefined) {
                setExpireSeconds(expireInSeconds);
            }
        } catch (err) {
            // Lỗi polling bỏ qua, tiếp tục poll
            console.log('Poll error:', err.message);
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

    const handleCopyCode = async () => {
        await Clipboard.setStringAsync(paymentData.transactionCode);
        Alert.alert('Đã sao chép', 'Mã giao dịch đã được sao chép.');
    };

    const handleDownloadQR = async () => {
        try {
            const perm = await MediaLibrary.requestPermissionsAsync();
            if (!perm.granted) {
                Alert.alert('Lỗi', 'Vui lòng cấp quyền truy cập thư viện ảnh.');
                return;
            }
            const uri = FileSystem.documentDirectory + 'qr_hnalms.png';
            const { uri: downloaded } = await FileSystem.downloadAsync(paymentData.qrUrl, uri);
            const asset = await MediaLibrary.createAssetAsync(downloaded);
            const album = await MediaLibrary.getAlbumAsync('HNALMS');
            if (album) {
                await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            } else {
                await MediaLibrary.createAlbumAsync('HNALMS', asset, false);
            }
            Alert.alert('Thành công', 'QR đã được lưu vào album HNALMS.');
        } catch (err) {
            Alert.alert('Lỗi', 'Không thể tải QR. Vui lòng thử lại.');
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
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.successContainer}>
                    <SuccessCheckmark />
                    <Text style={styles.successTitle}>Thanh toán thành công!</Text>
                    <Text style={styles.successSubtitle}>
                        Hóa đơn trả trước tiền phòng của bạn đã được xác nhận.
                    </Text>
                    <View style={styles.successDetailCard}>
                        <View style={styles.successDetailRow}>
                            <Text style={styles.successDetailLabel}>Mã giao dịch</Text>
                            <Text style={styles.successDetailValue}>{paymentData.transactionCode}</Text>
                        </View>
                        <View style={styles.successDetailDivider} />
                        <View style={styles.successDetailRow}>
                            <Text style={styles.successDetailLabel}>Số tháng</Text>
                            <Text style={styles.successDetailValue}>{paymentData.prepaidMonths} tháng</Text>
                        </View>
                        <View style={styles.successDetailDivider} />
                        <View style={styles.successDetailRow}>
                            <Text style={styles.successDetailLabel}>Số tiền</Text>
                            <Text style={[styles.successDetailValue, { color: '#10B981' }]}>
                                {fmtMoney(paymentData.totalAmount)}
                            </Text>
                        </View>
                    </View>
                </View>
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
                        <View style={styles.copyRow}>
                            <Text style={[styles.infoValue, { color: '#7C3AED', fontWeight: '700' }]}>
                                {paymentData.transactionCode}
                            </Text>
                            <TouchableOpacity onPress={handleCopyCode} style={styles.copyBtn}>
                                <MaterialCommunityIcons name="content-copy" size={16} color="#7C3AED" />
                            </TouchableOpacity>
                        </View>
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

            {/* Nút hủy */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
                    <MaterialCommunityIcons name="close-circle-outline" size={20} color="#DC2626" />
                    <Text style={styles.cancelBtnText}>Hủy giao dịch</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadQR} activeOpacity={0.85}>
                    <MaterialCommunityIcons name="download-outline" size={20} color="#FFF" />
                    <Text style={styles.downloadBtnText}>Lưu mã QR</Text>
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
    infoValue: { fontSize: 13, fontWeight: '600', color: '#1F2937', textAlign: 'right' },
    copyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    copyBtn: { padding: 4 },

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
    downloadBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

    /* success */
    successContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 32,
    },
    successIconWrap: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: '#D1FAE5',
        justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    },
    successTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937', textAlign: 'center' },
    successSubtitle: {
        fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, marginBottom: 24,
    },
    successDetailCard: {
        backgroundColor: '#FFFFFF', borderRadius: 14,
        paddingVertical: 4, width: '100%',
        elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 3,
    },
    successDetailRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
    },
    successDetailDivider: { height: 1, backgroundColor: '#F3F4F6' },
    successDetailLabel: { fontSize: 13, color: '#6B7280' },
    successDetailValue: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
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
