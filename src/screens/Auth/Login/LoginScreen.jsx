import { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
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

  const { signIn } = useContext(AuthContext);

  const showValidationPopup = (message) => {
    setValidationPopup({ show: true, message });
    setTimeout(() => {
      setValidationPopup({ show: false, message: '' });
    }, 4000);
  };

  const handleLogin = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const response = await loginAPI(username, password);

      console.log('Login successful:', response);

      await signIn(response.token || response.data?.token);

      setLoading(false);
    } catch (error) {
      let errorMessage = 'Đăng nhập thất bại';

      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.message && error.message !== 'Đăng nhập thất bại') {
        errorMessage = error.message;
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
