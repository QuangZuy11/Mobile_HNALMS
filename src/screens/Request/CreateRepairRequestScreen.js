import React, { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createRepairRequestAPI } from '../../services/request.service';
import { getDevicesByRoomAPI } from '../../services/device.service';
import { getTenantRoomsAPI } from '../../services/profile.service';
import { uploadMultipleImages } from '../../services/upload.service';

export default function CreateRepairRequestScreen({ navigation }) {
  const [type, setType] = useState('Sửa chữa'); // "Sửa chữa" or "Bảo trì"
  const [itemType, setItemType] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState([]);
  const [fetchingDevices, setFetchingDevices] = useState(true);
  const [devicesError, setDevicesError] = useState(null);

  // Room selection states
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [fetchingRooms, setFetchingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState(null);

  // Map device types to icons (MaterialCommunityIcons)
  const getDeviceIcon = (deviceName) => {
    const name = deviceName?.toLowerCase() || '';
    if (name.includes('tủ lạnh')) return 'fridge-outline';
    if (name.includes('máy giặt')) return 'washing-machine';
    if (name.includes('điều hòa') || name.includes('máy lạnh')) return 'snowflake';
    if (name.includes('quạt trần') || name.includes('quạt')) return 'fan';
    if (name.includes('tivi') || name.includes('tv') || name.includes('ti vi')) return 'television';
    if (name.includes('wifi') || name.includes('router') || name.includes('mạng')) return 'wifi';
    if (name.includes('toilet') || name.includes('bồn cầu') || name.includes('vệ sinh')) return 'toilet';
    if (name.includes('vòi') || name.includes('bồn rửa') || name.includes('chậu')) return 'faucet';
    if (name.includes('nước') || name.includes('bình nước')) return 'water-pump';
    if (name.includes('khóa')) return 'lock';
    if (name.includes('cửa sổ')) return 'window-closed-variant';
    if (name.includes('cửa')) return 'door';
    if (name.includes('đèn') || name.includes('bóng đèn')) return 'lightbulb-outline';
    if (name.includes('ổ điện') || name.includes('ổ cắm')) return 'power-socket-eu';
    if (name.includes('điện')) return 'lightning-bolt';
    if (name.includes('giường')) return 'bed';
    if (name.includes('ghế') || name.includes('sofa')) return 'sofa';
    if (name.includes('bàn')) return 'table-furniture';
    if (name.includes('tủ')) return 'wardrobe-outline';
    if (name.includes('sàn')) return 'texture-box';
    if (name.includes('tường') || name.includes('trần')) return 'bricks';
    if (name.includes('máy')) return 'cog-outline';
    return 'wrench';
  };

  // Fetch rooms of current tenant from API
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setFetchingRooms(true);
        setRoomsError(null);
        const response = await getTenantRoomsAPI();

        if (response.success && response.data && response.data.length > 0) {
          setRooms(response.data);
          // Set first room as selected by default
          setSelectedRoom(response.data[0]._id);
        } else {
          setRoomsError('Không tìm thấy phòng nào');
          setRooms([]);
        }
      } catch (error) {
        setRoomsError(error.message);
        Alert.alert(
          'Thông báo',
          'Không thể tải danh sách phòng. ' + error.message,
          [
            { text: 'Thử lại', onPress: () => fetchRooms() },
            { text: 'Hủy', onPress: () => navigation.goBack() },
          ]
        );
      } finally {
        setFetchingRooms(false);
      }
    };

    fetchRooms();
  }, []);

  // Fetch devices of tenant's room from API
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setFetchingDevices(true);
        setDevicesError(null);
        const response = await getDevicesByRoomAPI();

        if (response.success && response.data) {
          const roomDevices = response.data.devices || response.data || [];

          // Each item: { _id, deviceId: { _id, name, category, ... }, quantity, ... }
          const mappedDevices = roomDevices.map((item) => {
            const info = item.deviceId || {};
            const deviceId = info._id;
            const deviceName = info.name;
            const deviceCategory = info.category;

            return {
              id: deviceId,
              label: deviceName || 'Thiết bị',
              icon: getDeviceIcon(deviceName),
              category: deviceCategory,
            };
          }).filter((d) => d.id); // bỏ qua item không có device ID

          setDevices(mappedDevices);
        }
      } catch (error) {
        setDevicesError(error.message);
        Alert.alert(
          'Thông báo',
          'Không thể tải danh sách thiết bị. ' + error.message,
          [
            { text: 'Thử lại', onPress: () => fetchDevices() },
            { text: 'Hủy', onPress: () => navigation.goBack() },
          ]
        );
      } finally {
        setFetchingDevices(false);
      }
    };

    fetchDevices();
  }, []);

  // Request camera/gallery permissions
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
      }
    })();
  }, []);

  const MAX_IMAGES = 10;

  const pickImage = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Thông báo', `Chỉ được đính kèm tối đa ${MAX_IMAGES} ảnh.`);
      return;
    }
    try {
      const remaining = MAX_IMAGES - images.length;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.7,
        base64: false,
      });

      if (!result.canceled) {
        const newImages = result.assets.map(asset => asset.uri);
        const combined = [...images, ...newImages];
        if (combined.length > MAX_IMAGES) {
          Alert.alert('Thông báo', `Chỉ được đính kèm tối đa ${MAX_IMAGES} ảnh. Một số ảnh đã bị bỏ qua.`);
        }
        setImages(combined.slice(0, MAX_IMAGES));
      }
    } catch (error) {
      Alert.alert('Thông báo', 'Không thể chọn ảnh');
    }
  };

  const takePhoto = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Thông báo', `Chỉ được đính kèm tối đa ${MAX_IMAGES} ảnh.`);
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        base64: false,
      });

      if (!result.canceled) {
        setImages([...images, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Thông báo', 'Không thể chụp ảnh');
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const showImageOptions = () => {
    Alert.alert(
      'Chọn ảnh',
      'Đính kèm hình ảnh vấn đề',
      [
        { text: 'Chụp ảnh', onPress: takePhoto },
        { text: 'Chọn từ thư viện', onPress: pickImage },
        { text: 'Hủy', style: 'cancel' },
      ]
    );
  };

  const types = [
    { id: 'repair', label: 'Sửa chữa', value: 'Sửa chữa', icon: 'hammer-wrench' },
    { id: 'maintenance', label: 'Bảo trì', value: 'Bảo trì', icon: 'cog' },
  ];

  const handleSubmit = async () => {
    // Validation
    if (!selectedRoom) {
      Alert.alert('Thông báo', 'Vui lòng chọn phòng gửi yêu cầu');
      return;
    }
    if (!itemType) {
      Alert.alert('Thông báo', 'Vui lòng chọn thiết bị cần ' + type.toLowerCase());
      return;
    }
    if (!description.trim()) {
      Alert.alert('Thông báo', 'Vui lòng mô tả vấn đề');
      return;
    }
    if (description.trim().length < 10) {
      Alert.alert('Thông báo', 'Mô tả phải có ít nhất 10 ký tự');
      return;
    }

    setLoading(true);
    try {
      // Upload images to Cloudinary if any
      let imageUrls = [];
      if (images.length > 0) {

        try {
          imageUrls = await uploadMultipleImages(
            images,
            'ml_default', // Upload preset - ensure this exists in Cloudinary
            (current, total) => {
              setUploadProgress({ current, total });
            }
          );

          if (imageUrls.length < images.length) {
            Alert.alert(
              'Cảnh báo',
              `Chỉ tải lên được ${imageUrls.length}/${images.length} ảnh. Bạn có muốn tiếp tục?`,
              [
                { text: 'Hủy', style: 'cancel', onPress: () => { setLoading(false); return; } },
                { text: 'Tiếp tục', onPress: () => { } },
              ]
            );
          }
        } catch (uploadError) {
          Alert.alert(
            'Lỗi tải ảnh',
            uploadError.message + '\n\nBạn có muốn tiếp tục không có ảnh?',
            [
              { text: 'Hủy', style: 'cancel', onPress: () => { setLoading(false); return; } },
              { text: 'Tiếp tục', onPress: () => { } },
            ]
          );
          imageUrls = [];
        }

        // Reset upload progress
        setUploadProgress({ current: 0, total: 0 });
      }

      // Find selected device
      const selectedDevice = devices.find((d) => d.id === itemType);

      const repairData = {
        roomId: selectedRoom, // Room ID where repair is needed
        devicesId: itemType, // Device ID from database (_id)
        type: type, // "Sửa chữa" or "Bảo trì"
        description: description.trim(),
        images: imageUrls, // Array of Cloudinary URLs
      };

      const response = await createRepairRequestAPI(repairData);

      Alert.alert(
        'Thành công',
        response.message || `Yêu cầu ${type.toLowerCase()} đã được gửi thành công`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Thông báo', error.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.headerTitle}>{type}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Section */}
        <View style={styles.formContainer}>
          {/* Room Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Chọn phòng *</Text>
            {fetchingRooms ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.loadingText}>Đang tải danh sách phòng...</Text>
              </View>
            ) : rooms.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#9CA3AF" />
                <Text style={styles.emptyText}>Không có phòng nào</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.roomScroll}
              >
                {rooms.map((room) => (
                  <TouchableOpacity
                    key={room._id}
                    style={[
                      styles.roomButton,
                      selectedRoom === room._id && styles.roomButtonSelected,
                    ]}
                    onPress={() => setSelectedRoom(room._id)}
                  >
                    <MaterialCommunityIcons
                      name="door-open"
                      size={24}
                      color={selectedRoom === room._id ? '#3B82F6' : '#9CA3AF'}
                    />
                    <Text
                      style={[
                        styles.roomButtonText,
                        selectedRoom === room._id && styles.roomButtonTextSelected,
                      ]}
                    >
                      {room.name}
                    </Text>
                    {room.roomTypeId?.currentPrice && (
                      <Text style={styles.roomPrice}>
                        {new Intl.NumberFormat('vi-VN').format(room.roomTypeId.currentPrice)} VNĐ
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Item Type Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Thiết bị cần {type.toLowerCase()} *</Text>
            {fetchingDevices ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.loadingText}>Đang tải danh sách thiết bị...</Text>
              </View>
            ) : devices.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#9CA3AF" />
                <Text style={styles.emptyText}>Không có thiết bị nào</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.itemTypeScroll}
              >
                {devices.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.itemTypeButton,
                      itemType === item.id && styles.itemTypeButtonSelected,
                    ]}
                    onPress={() => {
                      setItemType(item.id); // Store device ID, not name
                    }}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={24}
                      color={
                        itemType === item.id ? '#3B82F6' : '#9CA3AF'
                      }
                    />
                    <Text
                      style={[
                        styles.itemTypeLabel,
                        itemType === item.id && styles.itemTypeLabelSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Description Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Mô tả chi tiết * (tối thiểu 10 ký tự)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Mô tả chi tiết vấn đề:\n- Tình trạng hiện tại (hỏng, rò rỉ, không hoạt động...)\n- Thời gian bắt đầu xảy ra\n- Mức độ ảnh hưởng\n- Các triệu chứng khác"
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

            {images.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imagePreviewContainer}
              >
                {images.map((uri, index) => (
                  <View key={index} style={styles.imagePreviewWrapper}>
                    <Image source={{ uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <MaterialCommunityIcons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={showImageOptions}
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
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color="#3B82F6"
            />
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
            <View style={styles.loadingContent}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              {uploadProgress.total > 0 ? (
                <Text style={styles.loadingText}>
                  Đang tải ảnh {uploadProgress.current}/{uploadProgress.total}...
                </Text>
              ) : (
                <Text style={styles.loadingText}>Đang gửi...</Text>
              )}
            </View>
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
  itemTypeScroll: {
    marginHorizontal: -4,
  },
  roomScroll: {
    marginHorizontal: -4,
  },
  roomButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    minWidth: 120,
  },
  roomButtonSelected: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: '#DBEAFE',
  },
  roomButtonText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  roomButtonTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  roomPrice: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 10,
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 10,
  },
  itemTypeButton: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
  },
  itemTypeButtonSelected: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: '#DBEAFE',
  },
  itemTypeLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
  itemTypeLabelSelected: {
    color: '#3B82F6',
    fontWeight: '600',
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
  imagePickerButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 24,
    alignItems: 'center',
    marginTop: 8,
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
    textAlign: 'center',
  },
  imagePreviewContainer: {
    marginBottom: 12,
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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
    backgroundColor: '#10B981',
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
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
