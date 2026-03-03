// View Invoice Detail Screen
import React from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function InvoiceDetailScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết hóa đơn</Text>
                <View style={{ width: 40 }} />
            </View>
            <View style={styles.center}>
                <MaterialCommunityIcons name="receipt-outline" size={64} color="#D1D5DB" />
                <Text style={styles.placeholder}>Đang phát triển...</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#FFFFFF', paddingVertical: 14, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    placeholder: { marginTop: 12, fontSize: 15, color: '#9CA3AF' },
});
