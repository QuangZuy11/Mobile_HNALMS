import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  FlatList,
  SectionList,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export default function RequestListScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Simulate fetching requests when screen is focused
  useFocusEffect(
    useCallback(() => {
      // TODO: Fetch requests from API
      // loadRequests();
    }, [])
  );

  const requestTypes = [
    {
      id: 'maintenance',
      title: 'Yêu cầu sửa chữa/Bảo trì',
      subtitle: 'Báo cáo hư hỏng',
      icon: 'tools',
      color: '#3B82F6',
      bgColor: '#DBEAFE',
      screen: 'CreateMaintenanceRequest',
    },
    {
      id: 'complaint',
      title: 'Yêu cầu khiếu nại',
      subtitle: 'Gửi khiếu nại',
      icon: 'alert-circle',
      color: '#EF4444',
      bgColor: '#FEE2E2',
      screen: 'CreateComplaintRequest',
    },
    {
      id: 'moving',
      title: 'Yêu cầu chuyển phòng',
      subtitle: 'Đổi phòng ở',
      icon: 'home-move-outline',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      screen: 'CreateMovingRoomRequest',
    },
  ];

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Yêu cầu của tôi</Text>
            <Text style={styles.headerSubtitle}>
              Tạo yêu cầu hoặc xem lịch sử yêu cầu
            </Text>
          </View>
        </View>

        {/* Create Request Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Tạo yêu cầu mới</Text>
          <View style={styles.requestGrid}>
            {requestTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={styles.requestCard}
                onPress={() => {
                  // Navigation to create request screen
                  if (type.screen) {
                    navigation.navigate(type.screen);
                  }
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.cardIconContainer,
                    { backgroundColor: type.bgColor },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={type.icon}
                    size={36}
                    color={type.color}
                  />
                </View>
                <Text style={styles.cardTitle}>{type.title}</Text>
                <Text style={styles.cardSubtitle}>{type.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Requests Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderWithAction}>
            <Text style={styles.sectionTitle}>Yêu cầu gần đây</Text>
            <TouchableOpacity
              onPress={() => {
                // TODO: Navigate to full request history
              }}
            >
              <Text style={styles.viewAllLink}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {requests.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="inbox-outline"
                size={48}
                color="#D1D5DB"
              />
              <Text style={styles.emptyStateText}>
                Chưa có yêu cầu nào
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Tạo yêu cầu mới từ phía trên
              </Text>
            </View>
          ) : (
            <FlatList
              data={requests}
              scrollEnabled={false}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.requestItem}
                  onPress={() => {
                    // TODO: Navigate to request detail
                  }}
                >
                  <View style={styles.requestItemContent}>
                    <Text style={styles.requestItemTitle}>
                      {item.title}
                    </Text>
                    <Text style={styles.requestItemDate}>
                      {item.createdDate}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.requestStatus,
                      {
                        backgroundColor:
                          item.status === 'Hoàn thành'
                            ? '#D1FAE5'
                            : item.status === 'Chờ xử lý'
                            ? '#FEF3C7'
                            : '#FEE2E2',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.requestStatusText,
                        {
                          color:
                            item.status === 'Hoàn thành'
                              ? '#10B981'
                              : item.status === 'Chờ xử lý'
                              ? '#F59E0B'
                              : '#EF4444',
                        },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Section
  sectionContainer: {
    paddingHorizontal: 12,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllLink: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },

  // Request Grid
  requestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  requestCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    minHeight: 140,
  },
  cardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Recent Requests
  requestItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  requestItemContent: {
    flex: 1,
  },
  requestItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  requestItemDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  requestStatus: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 12,
  },
  requestStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
});
