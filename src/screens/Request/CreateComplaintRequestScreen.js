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
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createComplaintRequestAPI } from '../../services/request.service';

export default function CreateComplaintRequestScreen({ navigation }) {
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Categories now use API values directly
  const categories = [
    { id: 'Tiếng ồn', label: 'Tiếng ồn' },
    { id: 'Vệ sinh', label: 'Vệ sinh' },
    { id: 'An niên', label: 'An ninh' },
    { id: 'Cơ sở vật chất', label: 'Cơ sở vật chất' },
    { id: 'Thái độ phục vụ', label: 'Thái độ phục vụ' },
    { id: 'Khác', label: 'Khác' },
  ];

  const handleSubmit = async () => {
    // Validation
    if (!category.trim()) {
      Alert.alert('Lỗi', 'Vui lòng chọn loại khiếu nại');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung khiếu nại');
      return;
    }
    if (content.trim().length < 10) {
      Alert.alert('Lỗi', 'Nội dung khiếu nại phải có ít nhất 10 ký tự');
      return;
    }
    if (content.trim().length > 2000) {
      Alert.alert('Lỗi', 'Nội dung khiếu nại không được vượt quá 2000 ký tự');
      return;
    }

    setLoading(true);
    try {
      // Call API to create complaint request
      const response = await createComplaintRequestAPI({
        content: content.trim(),
        category: category,
      });

      // Show success message
      Alert.alert(
        'Thành công',
        response.message || 'Khiếu nại của bạn đã được gửi thành công. Chúng tôi sẽ xem xét và phản hồi sớm nhất.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      // Handle error
      const errorMessage = error.message || error.data?.message || 'Không thể gửi khiếu nại. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
      console.error('Error creating complaint request:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === category);

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
        <Text style={styles.headerTitle}>Khiếu nại</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Section */}
        <View style={styles.formContainer}>
          {/* Category Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Loại khiếu nại *</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    category === cat.id && styles.categoryButtonSelected,
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      category === cat.id && styles.categoryButtonTextSelected,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Content Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nội dung khiếu nại *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Mô tả chi tiết vấn đề, thời gian xảy ra, những ai liên quan... (tối thiểu 10 ký tự)"
              placeholderTextColor="#9CA3AF"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              maxLength={2000}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{content.length}/2000</Text>
          </View>

          {/* Warning Box */}
          <View style={styles.warningBox}>
            <MaterialCommunityIcons
              name="alert-outline"
              size={20}
              color="#F59E0B"
            />
            <Text style={styles.warningText}>
              Vui lòng cung cấp thông tin chính xác. Các khiếu nại giả mạo sẽ bị xử lý theo quy định.
            </Text>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color="#3B82F6"
            />
            <Text style={styles.infoText}>
              Khiếu nại sẽ được xem xét trong vòng 3-5 ngày làm việc. Bạn sẽ nhận được phản hồi qua thông báo.
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
              <Text style={styles.submitButtonText}>Gửi khiếu nại</Text>
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
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'right',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  categoryButtonSelected: {
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  categoryButtonText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  categoryButtonTextSelected: {
    color: '#EF4444',
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    marginLeft: 10,
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
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
    backgroundColor: '#EF4444',
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

