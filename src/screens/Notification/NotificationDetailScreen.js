// View Notification Detail Screen - Modal Dialog (Center)
import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function NotificationDetailModal({
    visible,
    notification,
    onClose,
}) {
    if (!notification) return null;

    // Handle different data structures
    const notifData = notification || {};
    const title = notifData.title || notifData.content?.substring(0, 50) || notifData.name || 'Thông báo';
    const content = notifData.content || notifData.message || notifData.body || 'Không có nội dung';

    const createdAt = notifData.createdAt || notifData.created_at
        ? new Date(notifData.createdAt || notifData.created_at)
        : null;
    const timeText = createdAt && !Number.isNaN(createdAt.getTime())
        ? `${format(createdAt, 'EEEE, dd MMMM yyyy', { locale: vi })} lúc ${format(createdAt, 'HH:mm')}`
        : '';

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <TouchableOpacity
                    style={styles.overlayBackground}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={styles.dialog}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.iconContainer}>
                                <MaterialCommunityIcons name="bell-ring" size={22} color="#EF4444" />
                            </View>
                            <Text style={styles.headerTitle}>Chi tiết</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeIconButton}>
                            <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={styles.contentInner}
                        showsVerticalScrollIndicator={false}
                    >
                        <Text style={styles.title}>{title}</Text>

                        {!!timeText && (
                            <View style={styles.timeContainer}>
                                <MaterialCommunityIcons name="clock-outline" size={14} color="#9CA3AF" />
                                <Text style={styles.timeText}>{timeText}</Text>
                            </View>
                        )}

                        <View style={styles.divider} />

                        <Text style={styles.contentText}>{content}</Text>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.closeButtonFull} onPress={onClose}>
                            <Text style={styles.closeButtonText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    dialog: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        width: '95%',
        maxHeight: '70%',
        minHeight: 350,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    closeIconButton: {
        padding: 4,
    },
    content: {
        flex: 1,
    },
    contentInner: {
        padding: 16,
        flexGrow: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 10,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    timeText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginLeft: 5,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginBottom: 16,
    },
    contentText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 22,
    },
    footer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    closeButtonFull: {
        backgroundColor: '#EF4444',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
});
