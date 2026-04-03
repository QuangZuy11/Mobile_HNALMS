import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyNotificationsAPI, checkAndShowNotifications } from '../../services/notification.service';
import logoImage from '../../../assets/images/z7463676981543_494642986e53789b49de728b4f4a3a1e.jpg';

export default function HomeScreen({ navigation }) {
  const LAST_VIEWED_KEY = 'notification_last_viewed_at';
  const [newCount, setNewCount] = useState(0);

  const refreshNewBadge = useCallback(async () => {
    try {
      const lastViewedRaw = await AsyncStorage.getItem(LAST_VIEWED_KEY);
      const lastViewed = lastViewedRaw ? new Date(lastViewedRaw).getTime() : 0;

      const res = await getMyNotificationsAPI({ page: 1, limit: 50 });
      const list = res?.data?.notifications || res?.notifications || [];
      const count = list.filter((n) => {
        const t = new Date(n?.createdAt || 0).getTime();
        return t > lastViewed;
      }).length;
      setNewCount(count);

      // Hiện notification lên lock screen cho notification mới (nếu có)
      await checkAndShowNotifications(list, lastViewedRaw);
    } catch {
      setNewCount(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshNewBadge();
      return () => { };
    }, [refreshNewBadge])
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Header */}
        <View style={styles.logoHeader}>
          <Image
            source={logoImage}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Features Grid */}
          <View style={styles.featuresGrid}>
            {/* Notifications Card */}
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('NotificationList')}
            >
              <View style={[styles.cardIconContainer, { backgroundColor: '#DBEAFE' }]}>
                <View style={styles.badgeIconWrap}>
                  <MaterialCommunityIcons name="bell" size={40} color="#3B82F6" />
                  {newCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{newCount > 99 ? '99+' : String(newCount)}</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.cardTitle}>Thông báo</Text>
              <Text style={styles.cardSubtitle}>Tin tức & cập nhật</Text>
            </TouchableOpacity>

            {/* My Room Card */}
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('MyRoom')}
            >
              <View style={[styles.cardIconContainer, { backgroundColor: '#DBEAFE' }]}>
                <MaterialCommunityIcons name="home-city" size={40} color="#3B82F6" />
              </View>
              <Text style={styles.cardTitle}>Phòng của tôi</Text>
              <Text style={styles.cardSubtitle}>Thông tin phòng</Text>
            </TouchableOpacity>

            {/* Contracts Card */}
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('ContractList')}
            >
              <View style={[styles.cardIconContainer, { backgroundColor: '#DBEAFE' }]}>
                <MaterialCommunityIcons name="file-document" size={40} color="#3B82F6" />
              </View>
              <Text style={styles.cardTitle}>Hợp đồng</Text>
              <Text style={styles.cardSubtitle}>Quản lý hợp đồng</Text>
            </TouchableOpacity>

            {/* Invoices Card */}
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('InvoiceList')}
            >
              <View style={[styles.cardIconContainer, { backgroundColor: '#DBEAFE' }]}>
                <MaterialCommunityIcons name="receipt" size={40} color="#3B82F6" />
              </View>
              <Text style={styles.cardTitle}>Hóa đơn</Text>
              <Text style={styles.cardSubtitle}>Thanh toán hóa đơn</Text>
            </TouchableOpacity>

            {/* Requests Card */}
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('RequestList')}
            >
              <View style={[styles.cardIconContainer, { backgroundColor: '#DBEAFE' }]}>
                <MaterialCommunityIcons name="clipboard-list" size={40} color="#3B82F6" />
              </View>
              <Text style={styles.cardTitle}>Yêu cầu</Text>
              <Text style={styles.cardSubtitle}>Tạo yêu cầu mới</Text>
            </TouchableOpacity>

            {/* Services Card */}
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('BookService')}
            >
              <View style={[styles.cardIconContainer, { backgroundColor: '#DBEAFE' }]}>
                <MaterialCommunityIcons name="briefcase" size={40} color="#3B82F6" />
              </View>
              <Text style={styles.cardTitle}>Dịch vụ</Text>
              <Text style={styles.cardSubtitle}>Đặt dịch vụ</Text>
            </TouchableOpacity>
          </View>
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

  // Logo Header
  logoHeader: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    position: 'relative',
  },
  logo: {
    width: 300,
    height: 140,
  },
  // Content
  contentContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 20,
  },

  // Features Grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
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
  },
  cardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeIconWrap: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 15,
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
});
