import React, { useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../../contexts/AuthContext';
import { logoutAPI } from '../../services/auth.service';
import logoImage from '../../../assets/images/z7463676981543_494642986e53789b49de728b4f4a3a1e.jpg';

export default function HomeScreen({ navigation }) {
  const { signOut } = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          onPress: async () => {
            try {
              await logoutAPI();
            } catch (error) {
              // Bỏ qua lỗi API (token hết hạn hoặc không tồn tại)
              console.log('Logout API error (ignored):', error.message);
            } finally {
              // Luôn logout ở client và hiển thị thông báo thành công
              await signOut();
              Alert.alert(
                'Thành công',
                'Đã đăng xuất thành công',
                [{ text: 'OK' }]
              );
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

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
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout" size={24} color="#DC2626" />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Features Grid */}
          <View style={styles.featuresGrid}>
            {/* Profile Card */}
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={[styles.cardIconContainer, { backgroundColor: '#DBEAFE' }]}>
                <MaterialCommunityIcons name="account" size={40} color="#3B82F6" />
              </View>
              <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
              <Text style={styles.cardSubtitle}>Xem & cập nhật</Text>
            </TouchableOpacity>

            {/* Notifications Card */}
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('NotificationList')}
            >
              <View style={[styles.cardIconContainer, { backgroundColor: '#DBEAFE' }]}>
                <MaterialCommunityIcons name="bell" size={40} color="#3B82F6" />
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
              onPress={() => navigation.navigate('ServiceList')}
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
  logoutButton: {
    position: 'absolute',
    right: 16,
    top: 20,
    padding: 8,
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
