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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getComplaintRequestDetailAPI, updateComplaintRequestAPI } from '../../services/request.service';

export default function UpdateRequestScreen({ navigation, route }) {
  const { requestId } = route.params || {};
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('Low');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [requestStatus, setRequestStatus] = useState('');

  // Load request details from API
  const loadRequestDetails = async () => {
    try {
      setInitialLoading(true);
      console.log('Loading complaint for update, ID:', requestId);
      
      const response = await getComplaintRequestDetailAPI(requestId);
      
      if (response.success && response.data) {
        const data = response.data;
        
        // Check if status is Pending (only Pending can be edited)
        if (data.status !== 'Pending') {
          Alert.alert(
            'Không thể chỉnh sửa',
            'Chỉ có thể chỉnh sửa yêu cầu đang ở trạng thái "Chờ xử lý"',
            [
              {
                text: 'Quay lại',
                onPress: () => navigation.goBack(),
              },
            ]
          );
          return;
        }
        
        setCategory(data.category);
        setContent(data.content);
        setPriority(data.priority);
        setRequestStatus(data.status);
        
        console.log('Loaded complaint data:', { category: data.category, priority: data.priority });
      }
    } catch (error) {
      console.error('Error loading request details:', error);
      
      let errorMessage = 'Không thể tải thông tin yêu cầu. Vui lòng thử lại.';
      
      if (error.status === 403) {
        errorMessage = 'Bạn không có quyền chỉnh sửa yêu cầu này';
      } else if (error.status === 404) {
        errorMessage = 'Không tìm thấy yêu cầu này';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Lỗi',
        errorMessage,
        [
          {
            text: 'Quay lại',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (requestId) {
      loadRequestDetails();
    } else {
      Alert.alert('Lỗi', 'Không tìm thấy ID yêu cầu', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [requestId]);

  // Categories for complaint
  const categories = [
    { id: 'Tiếng ồn', label: 'Tiếng ồn' },
    { id: 'Vệ sinh', label: 'Vệ sinh' },
    { id: 'An niên', label: 'An ninh' },
    { id: 'Cơ sở vật chất', label: 'Cơ sở vật chất' },
    { id: 'Thái độ phục vụ', label: 'Thái độ phục vụ' },
    { id: 'Khác', label: 'Khác' },
  ];

  const priorities = [
    { id: 'Low', label: 'Thấp', color: '#3B82F6' },
    { id: 'Medium', label: 'Trung bình', color: '#F59E0B' },
    { id: 'High', label: 'Cao', color: '#EF4444' },
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
      // Call API to update request
      const response = await updateComplaintRequestAPI(requestId, {
        content: content.trim(),
        category: category,
        priority: priority,
      });

      Alert.alert(
        'Thành công',
        response.message || 'Yêu cầu đã được cập nhật thành công',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating request:', error);
      
      const errorMessage = error.message || 
                          error.data?.message || 
                          'Không thể cập nhật yêu cầu. Vui lòng thử lại.';
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cập nhật yêu cầu</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Cập nhật yêu cầu</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Box */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information-outline" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Bạn chỉ có thể chỉnh sửa yêu cầu khi nó đang ở trạng thái "Chờ xử lý"
          </Text>
        </View>

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

          {/* Priority Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Mức độ ưu tiên</Text>
            <View style={styles.priorityGrid}>
              {priorities.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.priorityButton,
                    priority === p.id && {
                      borderWidth: 2,
                      borderColor: p.color,
                      backgroundColor: '#F3F4F6',
                    },
                  ]}
                  onPress={() => setPriority(p.id)}
                >
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: p.color },
                    ]}
                  />
                  <Text
                    style={[
                      styles.priorityLabel,
                      priority === p.id && { fontWeight: '600' },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Warning Box */}
          <View style={styles.warningBox}>
            <MaterialCommunityIcons name="alert-outline" size={20} color="#F59E0B" />
            <Text style={styles.warningText}>
              Các thay đổi sẽ được lưu và gửi cho quản lý để xem xét.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Cập nhật</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    marginLeft: 10,
    flex: 1,
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
  priorityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
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
  priorityBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  priorityLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 20,
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    marginLeft: 10,
    flex: 1,
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
    flexDirection: 'row',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
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
    marginLeft: 8,
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
