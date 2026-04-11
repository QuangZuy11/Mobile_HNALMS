import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getProfileAPI } from '../../services/profile.service';

// Helper function to display role label
const getRoleLabel = (role) => {
  if (!role) return 'Cư Dân';
  switch (String(role).toLowerCase().trim()) {
    case 'tenant': return 'Cư Dân';
    case 'admin': return 'Quản trị viên';
    case 'staff': return 'Nhân viên';
    default: return role;
  }
};

// Helper function to display gender label
const getGenderLabel = (gender) => {
  if (!gender) return 'Chưa cập nhật';

  const lowerGender = String(gender).toLowerCase().trim();

  switch (lowerGender) {
    case 'male':
    case 'nam':
    case 'm':
      return 'Nam';
    case 'female':
    case 'nữ':
    case 'f':
      return 'Nữ';
    case 'other':
    case 'khác':
    case 'o':
      return 'Khác';
    default:
      return 'Chưa cập nhật';
  }
};

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      setError(null);
      const response = await getProfileAPI();

      // Backend returns { success: true, data: profile }
      if (response && response.data) {
        setProfile(response.data);
      } else if (response) {
        // Fallback nếu API trả về profile data trực tiếp
        setProfile(response);
      } else {
        setError('Không thể tải thông tin profile');
      }
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('UpdateProfile', { profile })}
        >
          <MaterialCommunityIcons name="pencil" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="account" size={64} color="#3B82F6" />
          </View>
          <Text style={styles.username}>{profile?.fullname || 'N/A'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{getRoleLabel(profile?.role)}</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Họ và tên</Text>
                <Text style={styles.infoValue}>{profile?.fullname || 'Chưa cập nhật'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile?.email || 'Chưa cập nhật'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="phone-outline" size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Số điện thoại</Text>
                <Text style={styles.infoValue}>{profile?.phoneNumber || 'Chưa cập nhật'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>CCCD/CMND</Text>
                <Text style={styles.infoValue}>{profile?.cccd || 'Chưa cập nhật'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="cake-variant" size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ngày sinh</Text>
                <Text style={styles.infoValue}>{formatDate(profile?.dob)}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="gender-male-female" size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Giới tính</Text>
                <Text style={styles.infoValue}>
                  {getGenderLabel(profile?.gender)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Địa chỉ</Text>
                <Text style={styles.infoValue}>{profile?.address || 'Chưa cập nhật'}</Text>
              </View>
            </View>
          </View>

          {/* Account Status */}
          <Text style={styles.sectionTitle}>Trạng thái tài khoản</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name={profile?.status === 'active' ? 'check-circle' : 'alert-circle'}
                size={20}
                color={profile?.status === 'active' ? '#10B981' : '#F59E0B'}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Trạng thái</Text>
                <Text style={[
                  styles.statusText,
                  profile?.status === 'active' ? styles.statusActive : styles.statusInactive
                ]}>
                  {profile?.status === 'active' ? 'Đang hoạt động' : 'Chưa kích hoạt'}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <Text style={styles.sectionTitle}>Hành động</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <MaterialCommunityIcons name="lock-reset" size={20} color="#3B82F6" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Đổi mật khẩu</Text>
              <Text style={styles.actionSubtitle}>Cập nhật mật khẩu của bạn</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#D1D5DB" />
          </TouchableOpacity>
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  infoSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusActive: {
    color: '#10B981',
  },
  statusInactive: {
    color: '#F59E0B',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
});
