import React from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ServiceListScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dịch vụ</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="briefcase" size={64} color="#D1D5DB" />
        <Text style={styles.emptyStateText}>Chưa có dịch vụ</Text>
        <Text style={styles.emptyStateSubtext}>Danh sách các dịch vụ sẽ hiển thị ở đây</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
});
