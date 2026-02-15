import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CreateMaintenanceRequestScreen({ navigation }) {
  const [type, setType] = useState('Sửa chữa');
  const [deviceId, setDeviceId] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock devices list - TODO: Fetch from API
  const devices = [
    { id: '1', name: 'Điều hòa phòng ngủ', category: 'Điện lạnh' },
    { id: '2', name: 'Bồn cầu', category: 'Vệ sinh' },
    { id: '3', name: 'Vòi sen', category: 'Vệ sinh' },
    { id: '4', name: 'Cửa chính', category: 'Cơ sở' },
    { id: '5', name: 'Khóa cửa', category: 'Cơ sở' },
    { id: '6', name: 'Ổ cắm điện', category: 'Điện' },
    { id: '7', name: 'Đèn trần', category: 'Điện' },
    { id: '8', name: 'Quạt trần', category: 'Điện' },
  ];

  const types = [
    { id: 'repair', label: 'Sửa chữa', value: 'Sửa chữa' },
    { id: 'maintenance', label: 'Bảo trì', value: 'Bảo trì' },
  ];

  const handleSubmit = async () => {
    // Validation
    if (!deviceId.trim()) {
      Alert.alert('Lỗi', 'Vui lòng chọn thiết bị cần sửa chữa/bảo trì');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả vấn đề');
      return;
    }

    setLoading(true);
    try {
      // TODO: Call API to create repair request
      // const response = await createRepairRequest({
      //   devicesId: deviceId,
      //   type: type,
      //   description: description,
      //   images: images,
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert(
        'Thành công',
        `Yêu cầu ${type.toLowerCase()} đã được gửi thành công`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể gửi yêu cầu. Vui lòng thử lại.');
      console.error('Error creating repair request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = () => {
    // TODO: Implement image picker
    Alert.alert(
      'Chọn ảnh',
      'Chức năng chọn ảnh sẽ được triển khai sau',
      [{ text: 'OK' }]
    );
  };

  const selectedDevice = devices.find((d) => d.id === deviceId);

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sửa chữa/Bảo trì</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Section */}
        <View style={styles.formContainer}>
          {/* Type Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Loại yêu cầu *</Text>
            <View style={styles.typeGrid}>
              {types.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.typeButton,
                    type === t.value && styles.typeButtonSelected,
                  ]}
                  onPress={() => setType(t.value)}
                >
                  <MaterialCommunityIcons
                    name={t.id === 'repair' ? 'hammer-wrench' : 'cog'}
                    size={24}
                    color={type === t.value ? '#3B82F6' : '#9CA3AF'}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === t.value && styles.typeButtonTextSelected,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Device Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Thiết bị cần {type.toLowerCase()} *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.deviceScroll}
            >
              {devices.map((device) => (
                <TouchableOpacity
                  key={device.id}
                  style={[
                    styles.deviceButton,
                    deviceId === device.id && styles.deviceButtonSelected,
                  ]}
                  onPress={() => setDeviceId(device.id)}
                >
                  <Text
                    style={[
                      styles.deviceName,
                      deviceId === device.id && styles.deviceNameSelected,
                    ]}
                  >
                    {device.name}
                  </Text>
                  <Text
                    style={[
                      styles.deviceCategory,
                      deviceId === device.id && styles.deviceCategorySelected,
                    ]}
                  >
                    {device.category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Description Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Mô tả chi tiết *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Mô tả chi tiết vấn đề: triệu chứng, thời gian bắt đầu, mức độ ảnh hưởng..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              maxLength={1000}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length}/1000</Text>
          </View>

          {/* Images Section */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Hình ảnh (tùy chọn)</Text>
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={handlePickImage}
            >
              <MaterialCommunityIcons name="camera-plus" size={32} color="#9CA3AF" />
              <Text style={styles.imagePickerText}>Thêm hình ảnh</Text>
              <Text style={styles.imagePickerSubtext}>
                Hình ảnh giúp xác định vấn đề nhanh hơn
              </Text>
            </TouchableOpacity>
            {images.length > 0 && (
              <Text style={styles.imageCount}>{images.length} ảnh đã chọn</Text>
            )}
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information-outline" size={20} color="#3B82F6" />
            <Text style={styles.infoText}>
              Yêu cầu sẽ được xử lý trong vòng 24-48 giờ. Chi phí (nếu có) sẽ được thông báo sau khi kiểm tra.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Gửi yêu cầu</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
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
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 120,
    paddingVertical: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'right',
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  typeButtonSelected: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: '#DBEAFE',
  },
  typeButtonText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  typeButtonTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  deviceScroll: {
    marginHorizontal: -4,
  },
  deviceButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    minWidth: 120,
  },
  deviceButtonSelected: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: '#DBEAFE',
  },
  deviceName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  deviceNameSelected: {
    color: '#3B82F6',
  },
  deviceCategory: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  deviceCategorySelected: {
    color: '#60A5FA',
  },
  imagePickerButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 24,
    alignItems: 'center',
  },
  imagePickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
  },
  imagePickerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  imageCount: {
    fontSize: 13,
    color: '#3B82F6',
    marginTop: 8,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 20,
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    marginLeft: 10,
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
