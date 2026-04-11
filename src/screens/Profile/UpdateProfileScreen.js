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
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { updateProfileAPI } from '../../services/profile.service';

// Normalize gender from backend response to internal format
const normalizeGender = (value) => {
  if (!value) return '';
  const lowerValue = String(value).toLowerCase().trim();

  if (lowerValue === 'nam' || lowerValue === 'male' || lowerValue === 'm') return 'male';
  if (lowerValue === 'nữ' || lowerValue === 'female' || lowerValue === 'f') return 'female';
  if (lowerValue === 'khác' || lowerValue === 'other' || lowerValue === 'o') return 'other';

  return lowerValue;
};

// Parse date string to Date object (supports yyyy-mm-dd and dd-mm-yyyy)
const parseDate = (dateString) => {
  if (!dateString) return null;

  if (dateString.length === 10) {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      let year, month, day;
      if (parts[0].length === 4) {
        [year, month, day] = parts;
      } else if (parts[2].length === 4) {
        [day, month, year] = parts;
      } else {
        return null;
      }
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) return date;
    }
  }
  return null;
};

// Format Date to yyyy-mm-dd for backend
const formatDateForBackend = (date) => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format Date to dd-mm-yyyy for display
const formatDateForDisplay = (date) => {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function UpdateProfileScreen({ route, navigation }) {
  const initialProfile = route?.params?.profile || {};

  const [formData, setFormData] = useState({
    fullname: initialProfile?.fullname || '',
    email: initialProfile?.email || '',
    phoneNumber: initialProfile?.phoneNumber || '',
    cccd: initialProfile?.cccd || '',
    dob: parseDate(initialProfile?.dob),
    gender: normalizeGender(initialProfile?.gender),
    address: initialProfile?.address || '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  const validateEmail = (email) => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone) => {
    if (!phone) return true;
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10 && digitsOnly.length <= 11;
  };

  const handleUpdate = async () => {
    const newErrors = {};

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Số điện thoại phải từ 10-11 số';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const dataToSend = {
        ...formData,
        dob: formatDateForBackend(formData.dob),
      };

      const response = await updateProfileAPI(dataToSend);

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
      Alert.alert('Lỗi', error.data?.message || error.message || 'Đã xảy ra lỗi khi cập nhật');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    let newErrors = { ...errors };

    if (field === 'email' && value) {
      if (!validateEmail(value)) {
        newErrors.email = 'Email không hợp lệ';
      } else {
        newErrors.email = null;
      }
    } else if (field === 'phoneNumber' && value) {
      if (!validatePhoneNumber(value)) {
        newErrors.phoneNumber = 'Số điện thoại phải từ 10-11 số';
      } else {
        newErrors.phoneNumber = null;
      }
    } else if (errors[field]) {
      newErrors[field] = null;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

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
            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
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
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Phone Number */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Số điện thoại</Text>
            <View style={[styles.inputContainer, errors.phoneNumber && styles.inputError]}>
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
            {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
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
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => !loading && setShowDatePicker(true)}
              disabled={loading}
            >
              <MaterialCommunityIcons
                name="cake-variant"
                size={20}
                color="#6B7280"
                style={styles.inputIcon}
              />
              <Text style={[styles.input, !formData.dob && styles.placeholder]}>
                {formData.dob ? formatDateForDisplay(formData.dob) : 'dd-mm-yyyy'}
              </Text>
              <MaterialCommunityIcons
                name="calendar"
                size={20}
                color="#6B7280"
                style={styles.dateIcon}
              />
            </TouchableOpacity>
          </View>

          {/* DateTimePicker Modal */}
          <Modal
            visible={showDatePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowDatePicker(false)}
            >
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.datePickerCancel}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={styles.datePickerDone}>Xong</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={formData.dob || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setFormData((prev) => ({ ...prev, dob: selectedDate }));
                    }
                  }}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                />
              </View>
            </TouchableOpacity>
          </Modal>

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
  placeholder: {
    color: '#D1D5DB',
  },
  dateIcon: {
    marginLeft: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  datePickerDone: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
});
