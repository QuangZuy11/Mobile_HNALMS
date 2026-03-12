import React, { useState, useEffect } from 'react';
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
import { updateProfileAPI } from '../../services/profile.service';

// Gender mapping - Backend expects: Male, Female, Other
const GENDER_VALUES = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
};

const GENDER_LABELS = {
  male: 'Nam',
  female: 'Nữ',
  other: 'Khác',
  Male: 'Nam',
  Female: 'Nữ',
  Other: 'Khác',
};

// Normalize gender from backend response to internal format
const normalizeGender = (value) => {
  if (!value) return '';
  const lowerValue = String(value).toLowerCase().trim();
  
  // Handle common variations - always return lowercase for internal use
  if (lowerValue === 'nam' || lowerValue === 'male' || lowerValue === 'm') return 'male';
  if (lowerValue === 'nữ' || lowerValue === 'female' || lowerValue === 'f') return 'female';
  if (lowerValue === 'khác' || lowerValue === 'other' || lowerValue === 'o') return 'other';
  
  return lowerValue; // Return original if no match
};

// Format date input - auto format dd-mm-yyyy with proper backspace handling
const formatDateInput = (value) => {
  if (!value) return '';
  
  // Remove all non-numeric characters
  const cleaned = value.replace(/\D/g, '');
  
  // Limit to 8 digits (ddmmyyyy)
  const limited = cleaned.slice(0, 8);
  
  // Format as dd-mm-yyyy
  if (limited.length === 0) {
    return '';
  } else if (limited.length <= 2) {
    return limited;
  } else if (limited.length <= 4) {
    return `${limited.slice(0, 2)}-${limited.slice(2)}`;
  } else {
    return `${limited.slice(0, 2)}-${limited.slice(2, 4)}-${limited.slice(4, 8)}`;
  }
};

// Validate date format and values
const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  // Check format dd-mm-yyyy
  const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
  const match = dateString.match(regex);
  
  if (!match) return false;
  
  const dd = parseInt(match[1], 10);
  const mm = parseInt(match[2], 10);
  const yyyy = parseInt(match[3], 10);
  
  // Validate day
  if (dd < 1 || dd > 31) return false;
  
  // Validate month
  if (mm < 1 || mm > 12) return false;
  
  // Validate year (reasonable range)
  if (yyyy < 1900 || yyyy > 2100) return false;
  
  return true;
};

// Convert dd-mm-yyyy to yyyy-mm-dd for backend
const convertDateToBackendFormat = (dateString) => {
  if (!dateString) return null;
  
  // Validate format first
  if (!isValidDate(dateString)) {
    return dateString; // Return as-is if invalid, let backend handle error
  }
  
  // Parse dd-mm-yyyy
  const parts = dateString.split('-');
  const dd = parts[0];
  const mm = parts[1];
  const yyyy = parts[2];
  
  // Convert to yyyy-mm-dd
  return `${yyyy}-${mm}-${dd}`;
};

// Convert yyyy-mm-dd to dd-mm-yyyy for display
const convertDateToDisplayFormat = (dateString) => {
  if (!dateString) return '';
  
  // Check if already in dd-mm-yyyy format (length should be 10 and first part is 2 digits)
  if (dateString.length === 10) {
    const parts = dateString.split('-');
    if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
      // Already in dd-mm-yyyy format
      return dateString;
    }
  }
  
  // Try to convert from yyyy-mm-dd to dd-mm-yyyy
  if (dateString.length === 10) {
    const parts = dateString.split('-');
    if (parts.length === 3 && parts[0].length === 4 && parts[1].length === 2 && parts[2].length === 2) {
      // yyyy-mm-dd format
      const yyyy = parts[0];
      const mm = parts[1];
      const dd = parts[2];
      return `${dd}-${mm}-${yyyy}`;
    }
  }
  
  return dateString;
};

export default function UpdateProfileScreen({ route, navigation }) {
  const initialProfile = route?.params?.profile || {};

  const [formData, setFormData] = useState({
    fullname: initialProfile?.fullname || '',
    email: initialProfile?.email || '',
    phoneNumber: initialProfile?.phoneNumber || '',
    cccd: initialProfile?.cccd || '',
    dob: convertDateToDisplayFormat(initialProfile?.dob),
    gender: normalizeGender(initialProfile?.gender),
    address: initialProfile?.address || '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    if (!email) return true; // Allow empty email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone) => {
    if (!phone) return true; // Allow empty phone
    // Allow phone with digits, spaces, dashes, +
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 9;
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate email if provided
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Validate phone if provided
    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ (tối thiểu 9 chữ số)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Convert dob from dd-mm-yyyy to yyyy-mm-dd before sending
      const dataToSend = {
        ...formData,
        dob: convertDateToBackendFormat(formData.dob),
      };
      
      const response = await updateProfileAPI(dataToSend);

      // Backend returns { success: true, message, data: updatedProfile }
      if (response && response.success) {
        Alert.alert('Thành công', response.message || 'Cập nhật thông tin cá nhân thành công', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Lỗi', response?.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Đã xảy ra lỗi khi cập nhật');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    // Auto-format date of birth input
    let finalValue = value;
    let newErrors = { ...errors };
    
    if (field === 'dob') {
      finalValue = formatDateInput(value);
      
      // Validate if it's complete (dd-mm-yyyy format)
      if (finalValue && finalValue.length === 10) {
        if (!isValidDate(finalValue)) {
          newErrors.dob = 'Ngày tháng năm không hợp lệ (dd-mm-yyyy)';
        } else {
          newErrors.dob = null;
        }
      } else if (finalValue && finalValue.length > 0) {
        newErrors.dob = null; // Clear error while typing
      } else {
        newErrors.dob = null;
      }
    } else if (field === 'email') {
      // Real-time email validation
      if (value && !validateEmail(value)) {
        newErrors.email = 'Email không hợp lệ';
      } else {
        newErrors.email = null;
      }
    } else if (field === 'phoneNumber') {
      // Real-time phone validation
      if (value && !validatePhoneNumber(value)) {
        newErrors.phoneNumber = 'Số điện thoại không hợp lệ (tối thiểu 9 chữ số)';
      } else {
        newErrors.phoneNumber = null;
      }
    }
    
    setFormData((prev) => ({
      ...prev,
      [field]: finalValue,
    }));
    
    // Clear error for this field when user starts typing (except email and phone)
    if (errors[field] && field !== 'dob' && field !== 'email' && field !== 'phoneNumber') {
      newErrors[field] = null;
    }
    
    setErrors(newErrors);
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
        <Text style={styles.headerTitle}>Cập nhật thông tin</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {/* Fullname - Read Only */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Họ và tên</Text>
            <View style={styles.readOnlyContainer}>
              <MaterialCommunityIcons
                name="account-outline"
                size={20}
                color="#6B7280"
                style={styles.inputIcon}
              />
              <Text style={styles.readOnlyText}>{formData.fullname || 'N/A'}</Text>
            </View>
            
          </View>

          {/* Email */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[
              styles.inputContainer,
              errors.email && styles.inputError,
            ]}>
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color="#6B7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nhập email"
                placeholderTextColor="#D1D5DB"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                selectTextOnFocus
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Phone Number */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Số điện thoại</Text>
            <View style={[
              styles.inputContainer,
              errors.phoneNumber && styles.inputError,
            ]}>
              <MaterialCommunityIcons
                name="phone-outline"
                size={20}
                color="#6B7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#D1D5DB"
                value={formData.phoneNumber}
                onChangeText={(value) => handleInputChange('phoneNumber', value)}
                keyboardType="phone-pad"
                selectTextOnFocus
              />
            </View>
            {errors.phoneNumber && (
              <Text style={styles.errorText}>{errors.phoneNumber}</Text>
            )}
          </View>

          {/* CCCD/CMND - Read Only */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>CCCD/CMND</Text>
            <View style={styles.readOnlyContainer}>
              <MaterialCommunityIcons
                name="card-account-details-outline"
                size={20}
                color="#6B7280"
                style={styles.inputIcon}
              />
              <Text style={styles.readOnlyText}>{formData.cccd || 'N/A'}</Text>
            </View>
            
          </View>

          {/* Date of Birth */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ngày sinh</Text>
            <View style={[
              styles.inputContainer,
              errors.dob && styles.inputError,
            ]}>
              <MaterialCommunityIcons
                name="cake-variant"
                size={20}
                color="#6B7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="dd-mm-yyyy"
                placeholderTextColor="#D1D5DB"
                value={formData.dob}
                onChangeText={(value) => handleInputChange('dob', value)}
                keyboardType="numeric"
                maxLength={10}
                selectTextOnFocus
              />
            </View>
            {errors.dob && (
              <Text style={styles.errorText}>{errors.dob}</Text>
            )}
            <Text style={styles.helperText}>Ví dụ: 01-01-1990</Text>
          </View>

          {/* Gender */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Giới tính</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'male' && styles.genderButtonActive,
                ]}
                onPress={() => handleInputChange('gender', 'male')}
                disabled={loading}
              >
                <MaterialCommunityIcons
                  name="gender-male"
                  size={20}
                  color={formData.gender === 'male' ? '#3B82F6' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.genderButtonText,
                    formData.gender === 'male' && styles.genderButtonTextActive,
                  ]}
                >
                  Nam
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'female' && styles.genderButtonActive,
                ]}
                onPress={() => handleInputChange('gender', 'female')}
                disabled={loading}
              >
                <MaterialCommunityIcons
                  name="gender-female"
                  size={20}
                  color={formData.gender === 'female' ? '#3B82F6' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.genderButtonText,
                    formData.gender === 'female' && styles.genderButtonTextActive,
                  ]}
                >
                  Nữ
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'other' && styles.genderButtonActive,
                ]}
                onPress={() => handleInputChange('gender', 'other')}
                disabled={loading}
              >
                <MaterialCommunityIcons
                  name="gender-male-female"
                  size={20}
                  color={formData.gender === 'other' ? '#3B82F6' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.genderButtonText,
                    formData.gender === 'other' && styles.genderButtonTextActive,
                  ]}
                >
                  Khác
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Address */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Địa chỉ</Text>
            <View style={[
              styles.inputContainer,
              styles.textAreaContainer,
              errors.address && styles.inputError,
            ]}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={20}
                color="#6B7280"
                style={[styles.inputIcon, styles.textAreaIcon]}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Nhập địa chỉ"
                placeholderTextColor="#D1D5DB"
                value={formData.address}
                onChangeText={(value) => handleInputChange('address', value)}
                multiline
                numberOfLines={4}
                editable={!loading}
              />
            </View>
            {errors.address && (
              <Text style={styles.errorText}>{errors.address}</Text>
            )}
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
              onPress={handleUpdate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Cập nhật</Text>
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
  },
  inputError: {
    borderColor: '#DC2626',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    padding: 0,
  },
  textAreaContainer: {
    height: 120,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textAreaIcon: {
    marginTop: 8,
  },
  textArea: {
    height: '100%',
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 6,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    gap: 8,
  },
  genderButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  genderButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  genderButtonTextActive: {
    color: '#3B82F6',
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
  readOnlyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  readOnlyText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  readOnlyNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    fontStyle: 'italic',
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    fontStyle: 'italic',
  },
});
