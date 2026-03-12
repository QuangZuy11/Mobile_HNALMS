import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import axios from 'axios';
import { ENV } from '../config/env';

// Thay đổi địa chỉ IP trong file src/config/env.js
const API_BASE_URL = `http://${ENV.API_HOST}:${ENV.API_PORT}`;

const TestDBScreen = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(`${API_BASE_URL}/test-db`, {
                timeout: 30000,
            });

            setData(response.data);
        } catch (err) {
            setError(err.message || 'Không thể kết nối đến server');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'manager':
                return '#FF6B6B';
            case 'tenant':
                return '#4ECDC4';
            case 'owner':
                return '#FFD93D';
            default:
                return '#95A5A6';
        }
    };

    const getRoleText = (role) => {
        switch (role) {
            case 'manager':
                return 'Quản lý';
            case 'tenant':
                return 'Người thuê';
            case 'owner':
                return 'Chủ sở hữu';
            default:
                return role;
        }
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4ECDC4" />
                <Text style={styles.loadingText}>Đang kết nối database...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>Lỗi kết nối</Text>
                <Text style={styles.errorMessage}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
                    <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View style={styles.header}>
                <Text style={styles.title}>Test Database Connection</Text>
                <Text style={styles.subtitle}>Backend: {API_BASE_URL}</Text>
            </View>

            {data && (
                <>
                    {/* Status Card */}
                    <View style={[styles.card, styles.statusCard]}>
                        <View style={styles.statusRow}>
                            <Text style={styles.statusIcon}>
                                {data.success ? '✅' : '❌'}
                            </Text>
                            <View style={styles.statusInfo}>
                                <Text style={styles.statusTitle}>
                                    {data.success ? 'Kết nối thành công' : 'Kết nối thất bại'}
                                </Text>
                                <Text style={styles.statusMessage}>{data.message}</Text>
                            </View>
                        </View>
                        <View style={styles.totalUsersContainer}>
                            <Text style={styles.totalUsersLabel}>Tổng số users:</Text>
                            <Text style={styles.totalUsersValue}>{data.totalUsers}</Text>
                        </View>
                    </View>

                    {/* Users List */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Danh sách Users</Text>
                    </View>

                    {data.data && data.data.map((user, index) => (
                        <View key={user._id} style={styles.card}>
                            <View style={styles.userHeader}>
                                <Text style={styles.userIndex}>#{index + 1}</Text>
                                <View
                                    style={[
                                        styles.roleBadge,
                                        { backgroundColor: getRoleBadgeColor(user.role) },
                                    ]}
                                >
                                    <Text style={styles.roleBadgeText}>
                                        {getRoleText(user.role)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.userInfo}>
                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Email:</Text>
                                    <Text style={styles.value}>{user.email}</Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>User ID:</Text>
                                    <Text style={styles.valueSmall}>{user.user_id}</Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Role:</Text>
                                    <Text style={styles.value}>{user.role}</Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Status:</Text>
                                    <View style={styles.statusBadge}>
                                        <Text
                                            style={[
                                                styles.statusBadgeText,
                                                user.isactive && styles.statusActive,
                                            ]}
                                        >
                                            {user.isactive ? 'Active' : 'Inactive'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Created:</Text>
                                    <Text style={styles.valueSmall}>
                                        {new Date(user.create_at).toLocaleString('vi-VN')}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </>
            )}

            <TouchableOpacity style={styles.refreshButton} onPress={fetchData}>
                <Text style={styles.refreshButtonText}>🔄 Làm mới dữ liệu</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
        padding: 20,
    },
    header: {
        backgroundColor: '#4ECDC4',
        padding: 20,
        paddingTop: 50,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.9,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
    },
    errorIcon: {
        fontSize: 60,
        marginBottom: 15,
    },
    errorText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#E74C3C',
        marginBottom: 10,
    },
    errorMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    retryButton: {
        backgroundColor: '#4ECDC4',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginBottom: 15,
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#4ECDC4',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    statusIcon: {
        fontSize: 40,
        marginRight: 15,
    },
    statusInfo: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 5,
    },
    statusMessage: {
        fontSize: 14,
        color: '#7F8C8D',
    },
    totalUsersContainer: {
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalUsersLabel: {
        fontSize: 16,
        color: '#2C3E50',
        fontWeight: '600',
    },
    totalUsersValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4ECDC4',
    },
    sectionHeader: {
        paddingHorizontal: 15,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    userHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ECF0F1',
    },
    userIndex: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#95A5A6',
    },
    roleBadge: {
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 15,
    },
    roleBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    userInfo: {
        gap: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#7F8C8D',
        width: 80,
    },
    value: {
        fontSize: 14,
        color: '#2C3E50',
        flex: 1,
    },
    valueSmall: {
        fontSize: 12,
        color: '#2C3E50',
        flex: 1,
    },
    statusBadge: {
        flex: 1,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#E74C3C',
    },
    statusActive: {
        color: '#27AE60',
    },
    refreshButton: {
        backgroundColor: '#4ECDC4',
        marginHorizontal: 15,
        marginVertical: 20,
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    refreshButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default TestDBScreen;
