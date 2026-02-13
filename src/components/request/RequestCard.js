import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * RequestCard Component
 * Displays a request item with status and information
 * 
 * @param {Object} props
 * @param {string} props.id - Request ID
 * @param {string} props.title - Request title
 * @param {string} props.type - Type of request (maintenance, complaint, moving, repair)
 * @param {string} props.status - Current status (pending, approved, rejected, completed)
 * @param {string} props.date - Request creation date
 * @param {string} props.description - Request description
 * @param {Function} props.onPress - Callback when card is pressed
 */
export default function RequestCard({
  id,
  title,
  type,
  status,
  date,
  description,
  onPress,
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'Done':
      case 'Hoàn thành':
      case 'completed':
        return { bg: '#D1FAE5', text: '#10B981' };
      case 'Pending':
      case 'Chờ xử lý':
      case 'pending':
        return { bg: '#FEF3C7', text: '#F59E0B' };
      case 'rejected':
      case 'Từ chối':
        return { bg: '#FEE2E2', text: '#EF4444' };
      case 'Processing':
      case 'Đang xử lý':
      case 'processing':
        return { bg: '#DBEAFE', text: '#3B82F6' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'maintenance':
      case 'Sửa chữa/Bảo trì':
        return 'wrench';
      case 'complaint':
      case 'Khiếu nại':
        return 'alert-circle';
      case 'moving':
      case 'Chuyển phòng':
        return 'home-move-outline';
      case 'repair':
      case 'Sửa chữa':
        return 'hammer-wrench';
      default:
        return 'clipboard-list';
    }
  };

  const statusColor = getStatusColor();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Left Side - Icon and Content */}
      <View style={styles.contentWrapper}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={getTypeIcon()}
            size={24}
            color="#3B82F6"
          />
        </View>

        <View style={styles.textContent}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.description} numberOfLines={1}>
            {description}
          </Text>
          <Text style={styles.date}>{date}</Text>
        </View>
      </View>

      {/* Right Side - Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
        <Text style={[styles.statusText, { color: statusColor.text }]}>
          {status}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  date: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
