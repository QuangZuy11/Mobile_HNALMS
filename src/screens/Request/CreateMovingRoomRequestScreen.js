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

export default function CreateMovingRoomRequestScreen({ navigation }) {
  const [currentRoom, setCurrentRoom] = useState('');
  const [desiredRoom, setDesiredRoom] = useState('');
  const [reason, setReason] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [loading, setLoading] = useState(false);

  const reasons = [
    { id: 'noise', label: 'Tiếng ồn từ hàng xóm' },
    { id: 'light', label: 'Ánh sáng/thông gió' },
    { id: 'view', label: 'Vị trí/tầng' },
    { id: 'family', label: 'Lý do gia đình' },
    { id: 'work', label: 'Lý do công việc' },
    { id: 'other', label: 'Lý do khác' },
  ];

  const handleSubmit = async () => {
    // Validation
    if (!currentRoom.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập phòng hiện tại');
      return;
    }
    if (!desiredRoom.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập phòng mong muốn');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do chuyển phòng');
      return;
    }
    if (!preferredDate.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập thời gian dự kiến');
      return;
    }

    setLoading(true);
    try {
      // TODO: Call API to create moving room request
      // const response = await createMovingRoomRequest({
      //   currentRoom,
      //   desiredRoom,
      //   reason,
      //   preferredDate,
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert(
        'Thành công',
        'Yêu cầu chuyển phòng của bạn đã được gửi thành công',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể gửi yêu cầu. Vui lòng thử lại.');
      console.error('Error creating moving room request:', error);
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
        <Text style={styles.headerTitle}>Yêu cầu chuyển phòng</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Section */}
        <View style={styles.formContainer}>
          {/* Current Room Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Phòng hiện tại *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: 101, 205A, 3-15"
              placeholderTextColor="#9CA3AF"
              value={currentRoom}
              onChangeText={setCurrentRoom}
              maxLength={20}
            />
          </View>

          {/* Desired Room Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Phòng mong muốn *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập số phòng hoặc loại phòng mong muốn"
              placeholderTextColor="#9CA3AF"
              value={desiredRoom}
              onChangeText={setDesiredRoom}
              maxLength={50}
            />
            <Text style={styles.helperText}>
              Để trống nếu không có yêu cầu cụ thể
            </Text>
          </View>

          {/* Reason Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Lý do chuyển phòng *</Text>
            <View style={styles.reasonGrid}>
              {reasons.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    styles.reasonButton,
                    reason === r.id && styles.reasonButtonSelected,
                  ]}
                  onPress={() => setReason(r.id)}
                >
                  <Text
                    style={[
                      styles.reasonButtonText,
                      reason === r.id && styles.reasonButtonTextSelected,
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Preferred Date Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Thời gian dự kiến chuyển *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Tháng 3, 15/03/2024"
              placeholderTextColor="#9CA3AF"
              value={preferredDate}
              onChangeText={setPreferredDate}
              maxLength={50}
            />
          </View>

          {/* Additional Notes */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ghi chú thêm</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Thêm bất kỳ thông tin nào bạn muốn quản lý biết"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              maxLength={300}
              textAlignVertical="top"
            />
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color="#3B82F6"
            />
            <Text style={styles.infoText}>
              Yêu cầu chuyển phòng sẽ được xem xét dựa trên khả dụng và chính sách của tòa nhà. Bạn sẽ nhận được thông báo trong vòng 5-7 ngày.
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
    minHeight: 100,
    paddingVertical: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  reasonButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  reasonButtonSelected: {
    borderWidth: 2,
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  reasonButtonText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  reasonButtonTextSelected: {
    color: '#F59E0B',
    fontWeight: '600',
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
    backgroundColor: '#F59E0B',
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
