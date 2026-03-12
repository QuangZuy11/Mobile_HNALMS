import React, { useState, useRef, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from './LoginStyles';
import { loginAPI } from '../../../services/auth.service';
import { AuthContext } from '../../../contexts/AuthContext';
import logoImage from "../../../../assets/images/z7463676981543_494642986e53789b49de728b4f4a3a1e.jpg";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationPopup, setValidationPopup] = useState({
    show: false,
    message: '',
  });

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const { signIn } = useContext(AuthContext);

  const showValidationPopup = (message) => {
    setValidationPopup({ show: true, message });
    setTimeout(() => {
      setValidationPopup({ show: false, message: '' });
    }, 4000);
  };

  const validateUsername = (usernameValue) => {
    if (!usernameValue.trim()) {
      showValidationPopup('Vui lòng nhập tên người dùng');
      return false;
    }
    if (usernameValue.trim().length < 3) {
      showValidationPopup('Tên người dùng phải có ít nhất 3 ký tự');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (loading) return;

    // Validation
    if (!validateUsername(username)) {
      usernameRef.current?.focus();
      return;
    }

    if (!password.trim()) {
      showValidationPopup('Vui lòng nhập mật khẩu');
      passwordRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      // Call login API
      const response = await loginAPI(username, password);
      
      console.log('Login successful:', response);
      
      // Call signIn từ AuthContext (tự động cập nhật navigation)
      await signIn(response.token || response.data?.token);
      
      setLoading(false);
    } catch (error) {
      let errorMessage = 'Đăng nhập thất bại';
      
      // Kiểm tra status code trước tiên (ưu tiên cho lỗi xác thực)
      if (error.status === 401 || error.status === 400) {
        errorMessage = 'Bạn đã nhập sai tài khoản hoặc mật khẩu';
      } else if (error.status === 500 && error.message === 'Server error') {
        // Nếu backend trả về Server error cho login sai, cũng xem như credential error
        errorMessage = 'Bạn đã nhập sai tài khoản hoặc mật khẩu';
      } else if (error.status === 404) {
        errorMessage = 'Tài khoản không tồn tại';
      } else if (error.status === 403) {
        errorMessage = 'Tài khoản chưa được kích hoạt';
      } else if (error.status === 500) {
        errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau';
      } else if (error.message && error.message !== 'Đăng nhập thất bại') {
        // Chỉ dùng error message nếu không phải là tin nhắn mặc định
        errorMessage = error.message;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }
      
      showValidationPopup(errorMessage);
      setLoading(false);
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

            {/* Form Container */}
            <View style={styles.formContainer}>
              {/* Logo */}
              <View style={styles.logoWrapper}>
                <Image
                  source={logoImage}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              {/* Username Input */}
              <View style={styles.inputSection}>
                <Text style={styles.label}>Tên người dùng</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <MaterialCommunityIcons name="account" size={18} color="#9CA3AF" />
                  </View>
                  <TextInput
                    ref={usernameRef}
                    style={styles.input}
                    placeholder="Nhập tên người dùng"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="default"
                    autoCapitalize="none"
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      if (validationPopup.show) {
                        setValidationPopup({ show: false, message: '' });
                      }
                    }}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputSection}>
                <Text style={styles.label}>Mật khẩu</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <MaterialCommunityIcons name="lock" size={18} color="#9CA3AF" />
                  </View>
                  <TextInput
                    ref={passwordRef}
                    style={styles.input}
                    placeholder="Nhập mật khẩu"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (validationPopup.show) {
                        setValidationPopup({ show: false, message: '' });
                      }
                    }}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeIconButton}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={16}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity
                style={styles.forgotPasswordContainer}
                onPress={() => navigation.navigate('ForgotPassword')}
                disabled={loading}
              >
                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, loading ? styles.loginButtonDisabled : null]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Đăng nhập</Text>
                )}
              </TouchableOpacity>

              {/* Footer */}
              <View style={styles.footer} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
