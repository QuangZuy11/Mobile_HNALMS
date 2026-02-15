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

export default function CreateRepairRequestScreen({ navigation }) {
  const [itemType, setItemType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [loading, setLoading] = useState(false);

  const itemTypes = [
    { id: 'door', label: 'Cửa/Khóa cửa', icon: 'door' },
    { id: 'window', label: 'Cửa sổ', icon: 'window-closed' },
    { id: 'electrical', label: 'Hệ thống điện', icon: 'flash' },
    { id: 'plumbing', label: 'Hệ thống nước', icon: 'pipe' },
    { id: 'furniture', label: 'Đồ nội thất', icon: 'sofa' },
    { id: 'flooring', label: 'Sàn nhà', icon: 'floor-plan' },
    { id: 'ceiling', label: 'Trần/Tường', icon: 'wall' },
    { id: 'other', label: 'Khác', icon: 'tools' },
  ];

  const urgencies = [
    { id: 'low', label: 'Thấp', color: '#3B82F6' },
    { id: 'normal', label: 'Bình thường', color: '#F59E0B' },
    { id: 'high', label: 'Cao/Khẩn cấp', color: '#EF4444' },
  ];

  const handleSubmit = async () => {
    // Validation
    if (!itemType.trim()) {
      Alert.alert('Lỗi', 'Vui lòng chọn vật phẩm cần sửa');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng mô tả vấn đề');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập vị trí');
      return;
    }

    setLoading(true);
    try {
      // TODO: Call API to create repair request
      // const response = await createRepairRequest({
      //   itemType,
      //   description,
      //   location,
      //   urgency,
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert(
        'Thành công',
        'Yêu cầu sửa chữa đã được gửi thành công',
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

  const selectedItemType = itemTypes.find((item) => item.id === itemType);

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
        <Text style={styles.headerTitle}>Yêu cầu sửa chữa</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Section */}
        <View style={styles.formContainer}>
          {/* Item Type Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Vật phẩm cần sửa *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.itemTypeScroll}
            >
              {itemTypes.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemTypeButton,
                    itemType === item.id && styles.itemTypeButtonSelected,
                  ]}
                  onPress={() => setItemType(item.id)}
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
          </View>

          {/* Location Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Vị trí *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập vị trí cụ thể (ví dụ: Phòng 101, Phòng tắm)"
              placeholderTextColor="#9CA3AF"
              value={location}
              onChangeText={setLocation}
              maxLength={100}
            />
          </View>

          {/* Description Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Mô tả chi tiết *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Xác định chính xác vấn đề (hỏng, rò rỉ, không chức năng, v.v.)"
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>

          {/* Urgency Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Mức độ khẩn cấp</Text>
            <View style={styles.urgencyGrid}>
              {urgencies.map((u) => (
                <TouchableOpacity
                  key={u.id}
                  style={[
                    styles.urgencyButton,
                    urgency === u.id && {
                      borderWidth: 2,
                      borderColor: u.color,
                      backgroundColor: '#F3F4F6',
                    },
                  ]}
                  onPress={() => setUrgency(u.id)}
                >
                  <View
                    style={[
                      styles.urgencyBadge,
                      { backgroundColor: u.color },
                    ]}
                  />
                  <Text
                    style={[
                      styles.urgencyLabel,
                      urgency === u.id && { fontWeight: '600' },
                    ]}
                  >
                    {u.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color="#3B82F6"
            />
            <Text style={styles.infoText}>
              Các vấn đề khẩn cấp sẽ được ưu tiên xử lý trong vòng 24 giờ.
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
  itemTypeScroll: {
    marginHorizontal: -4,
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
  urgencyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  urgencyButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  urgencyBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  urgencyLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
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
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
