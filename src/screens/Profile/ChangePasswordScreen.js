import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { changePasswordAPI } from '../../services/profile.service';

export default function ChangePasswordScreen({ navigation }) {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.oldPassword?.trim()) {
      newErrors.oldPassword = 'Mật khẩu hiện tại không được để trống';
    }

    if (!formData.newPassword?.trim()) {
      newErrors.newPassword = 'Mật khẩu mới không được để trống';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu mới phải tối thiểu 6 ký tự';
    }

    if (!formData.confirmPassword?.trim()) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu không được để trống';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (formData.oldPassword === formData.newPassword) {
      newErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await changePasswordAPI(
        formData.oldPassword,
        formData.newPassword
      );

      if (response && response.success) {
        Alert.alert('Thành công', response.message || 'Đổi mật khẩu thành công', [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setFormData({
                oldPassword: '',
                newPassword: '',
                confirmPassword: '',
              });
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert('Lỗi', response?.message || 'Đổi mật khẩu thất bại');
      }
    } catch (error) {
      console.error('Change password error:', error);

      // Handle specific error messages
      let errorMessage = error.message || 'Đã xảy ra lỗi khi đổi mật khẩu';

      if (error.message.includes('incorrect')) {
        errorMessage = 'Mật khẩu hiện tại không chính xác';
      } else if (error.message.includes('not found')) {
        errorMessage = 'Không tìm thấy người dùng';
      }

      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {/* Info Card */}
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="information" size={20} color="#3B82F6" />
            <Text style={styles.infoText}>
              Vui lòng nhập mật khẩu hiện tại của bạn và mật khẩu mới để đổi mật khẩu
            </Text>
          </View>

          {/* Old Password */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Mật khẩu hiện tại <Text style={styles.required}>*</Text>
            </Text>
            <View style={[
              styles.inputContainer,
              errors.oldPassword && styles.inputError,
            ]}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color="#6B7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu hiện tại"
                placeholderTextColor="#D1D5DB"
                value={formData.oldPassword}
                onChangeText={(value) => handleInputChange('oldPassword', value)}
                secureTextEntry={!showPassword.oldPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => togglePasswordVisibility('oldPassword')}
                disabled={loading}
              >
                <MaterialCommunityIcons
                  name={showPassword.oldPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
            {errors.oldPassword && (
              <Text style={styles.errorText}>{errors.oldPassword}</Text>
            )}
          </View>

          {/* New Password */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Mật khẩu mới <Text style={styles.required}>*</Text>
            </Text>
            <View style={[
              styles.inputContainer,
              errors.newPassword && styles.inputError,
            ]}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color="#6B7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu mới"
                placeholderTextColor="#D1D5DB"
                value={formData.newPassword}
                onChangeText={(value) => handleInputChange('newPassword', value)}
                secureTextEntry={!showPassword.newPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => togglePasswordVisibility('newPassword')}
                disabled={loading}
              >
                <MaterialCommunityIcons
                  name={showPassword.newPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
            {errors.newPassword && (
              <Text style={styles.errorText}>{errors.newPassword}</Text>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Xác nhận mật khẩu <Text style={styles.required}>*</Text>
            </Text>
            <View style={[
              styles.inputContainer,
              errors.confirmPassword && styles.inputError,
            ]}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color="#6B7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor="#D1D5DB"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry={!showPassword.confirmPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => togglePasswordVisibility('confirmPassword')}
                disabled={loading}
              >
                <MaterialCommunityIcons
                  name={showPassword.confirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsCard}>
            <Text style={styles.requirementsTitle}>Yêu cầu mật khẩu:</Text>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons
                name={formData.newPassword.length >= 6 ? 'check-circle' : 'circle-outline'}
                size={16}
                color={formData.newPassword.length >= 6 ? '#10B981' : '#D1D5DB'}
              />
              <Text style={styles.requirementText}>Tối thiểu 6 ký tự</Text>
            </View>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons
                name={
                  formData.newPassword &&
                  formData.newPassword === formData.confirmPassword
                    ? 'check-circle'
                    : 'circle-outline'
                }
                size={16}
                color={
                  formData.newPassword && formData.newPassword === formData.confirmPassword
                    ? '#10B981'
                    : '#D1D5DB'
                }
              />
              <Text style={styles.requirementText}>Mật khẩu khớp nhau</Text>
            </View>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons
                name={
                  formData.newPassword && formData.oldPassword !== formData.newPassword
                    ? 'check-circle'
                    : 'circle-outline'
                }
                size={16}
                color={
                  formData.newPassword && formData.oldPassword !== formData.newPassword
                    ? '#10B981'
                    : '#D1D5DB'
                }
              />
              <Text style={styles.requirementText}>Khác với mật khẩu hiện tại</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Đổi mật khẩu</Text>
                </>
              )}
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
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#3B82F6',
    flex: 1,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  required: {
    color: '#DC2626',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  inputIcon: {
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    padding: 0,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 6,
  },
  requirementsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 13,
    color: '#6B7280',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
