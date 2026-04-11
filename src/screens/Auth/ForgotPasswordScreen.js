import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { forgotPasswordAPI } from '../../services/auth.service';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationPopup, setValidationPopup] = useState({
    show: false,
    message: '',
  });

  const showValidationPopup = (message) => {
    setValidationPopup({ show: true, message });
    setTimeout(() => {
      setValidationPopup({ show: false, message: '' });
    }, 4000);
  };

  const handleForgotPassword = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const response = await forgotPasswordAPI(email);

      setLoading(false);

      if (response.newPassword) {
        Alert.alert(
          'Thành công',
          `Mật khẩu mới của bạn là:\n\n${response.newPassword}\n\nVui lòng ghi nhớ và đổi mật khẩu sau khi đăng nhập.`,
          [
            {
              text: 'Đã hiểu',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(
          'Thành công',
          'Mật khẩu mới đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      setLoading(false);
      let errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại sau.';

      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showValidationPopup(errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Validation Popup */}
            {validationPopup.show && (
              <View style={styles.validationPopup}>
                <View style={styles.validationPopupContent}>
                  <Text style={styles.validationPopupIcon}>⚠️</Text>
                  <Text style={styles.validationPopupText}>
                    {validationPopup.message}
                  </Text>
                </View>
              </View>
            )}

            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
            </TouchableOpacity>

            {/* Form Container */}
            <View style={styles.formContainer}>
              {/* Icon */}
              <View style={styles.iconWrapper}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons name="lock-reset" size={48} color="#3B82F6" />
                </View>
              </View>

              {/* Title */}
              <Text style={styles.title}>Quên mật khẩu?</Text>
              <Text style={styles.subtitle}>
                Nhập địa chỉ email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu
              </Text>

              {/* Email Input */}
              <View style={styles.inputSection}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <MaterialCommunityIcons name="email-outline" size={18} color="#9CA3AF" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập địa chỉ email"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (validationPopup.show) {
                        setValidationPopup({ show: false, message: '' });
                      }
                    }}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, loading ? styles.submitButtonDisabled : null]}
                onPress={handleForgotPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Gửi yêu cầu</Text>
                )}
              </TouchableOpacity>

              {/* Back to Login */}
              <TouchableOpacity
                style={styles.backToLoginContainer}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Text style={styles.backToLoginText}>
                  Quay lại đăng nhập
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  formContainer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 56,
    paddingHorizontal: 48,
  },
  iconWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: '#1F2937',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  backToLoginText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  validationPopup: {
    position: 'absolute',
    top: 20,
    left: 24,
    right: 24,
    zIndex: 1000,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  validationPopupContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  validationPopupIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    fontSize: 16,
  },
  validationPopupText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
});
