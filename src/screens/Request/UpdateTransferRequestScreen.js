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
  FlatList,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getAvailableRoomsForTransferAPI,
  updateTransferRequestAPI,
} from '../../services/request.service';

export default function UpdateTransferRequestScreen({ navigation, route }) {
  const { requestId, initialData } = route.params || {};

  const today = new Date(); today.setHours(0, 0, 0, 0);

  // Pre-fill from initialData
  const initDateObj = initialData?.transferDate ? new Date(initialData.transferDate) : null;
  const initDateStr = initDateObj
    ? `${String(initDateObj.getDate()).padStart(2, '0')}/${String(initDateObj.getMonth() + 1).padStart(2, '0')}/${initDateObj.getFullYear()}`
    : '';

  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(
    initialData?.targetRoomId && typeof initialData.targetRoomId === 'object'
      ? initialData.targetRoomId
      : null
  );
  const [transferDate, setTransferDate] = useState(initDateStr);
  const [selectedDateObj, setSelectedDateObj] = useState(initDateObj);
  const [reason, setReason] = useState(initialData?.reason || '');
  const [loading, setLoading] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  const [calYear, setCalYear] = useState(initDateObj?.getFullYear() ?? today.getFullYear());
  const [calMonth, setCalMonth] = useState(initDateObj?.getMonth() ?? today.getMonth());

  const MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
    'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  const DAY_NAMES = ['CN','T2','T3','T4','T5','T6','T7'];

  useEffect(() => {
    fetchAvailableRooms();
  }, []);

  const fetchAvailableRooms = async () => {
    try {
      setLoadingRooms(true);
      const response = await getAvailableRoomsForTransferAPI();
      if (response?.success) {
        const rooms = Array.isArray(response.data?.availableRooms)
          ? response.data.availableRooms
          : [];
        setAvailableRooms(rooms);
        // If initialData has targetRoomId as populated object, keep it selected
        // Also try to find it among available rooms for fresh data
        if (initialData?.targetRoomId?._id) {
          const found = rooms.find((r) => r._id === initialData.targetRoomId._id);
          if (found) setSelectedRoom(found);
        }
      }
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách phòng trống.');
    } finally {
      setLoadingRooms(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getRoomDisplayName = (room) => room?.name || room?.roomCode || 'Phòng không xác định';
  const getRoomPrice = (room) => room?.roomTypeId?.currentPrice ?? null;
  const getRoomPersonMax = (room) => room?.roomTypeId?.personMax ?? null;
  const getRoomFloor = (room) => room?.floorId?.name ?? null;
  const getRoomType = (room) => room?.roomTypeId?.typeName ?? null;

  const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month}-${day}`).toISOString();
  };

  const buildCalendarDays = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  const onCalendarDayPress = (day) => {
    if (!day) return;
    const date = new Date(calYear, calMonth, day);
    date.setHours(0, 0, 0, 0);
    if (date <= today) return; // disable today and past
    setSelectedDateObj(date);
    const dd = String(day).padStart(2, '0');
    const mm = String(calMonth + 1).padStart(2, '0');
    setTransferDate(`${dd}/${mm}/${calYear}`);
    setShowDateModal(false);
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };

  const handleSubmit = async () => {
    if (!selectedRoom) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn phòng muốn chuyển đến');
      return;
    }
    if (!selectedDateObj) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn ngày chuyển phòng');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập lý do chuyển phòng');
      return;
    }
    if (reason.trim().length < 10) {
      Alert.alert('Lý do quá ngắn', 'Lý do phải có ít nhất 10 ký tự');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        targetRoomId: selectedRoom._id,
        transferDate: parseDate(transferDate.trim()),
        reason: reason.trim(),
      };

      const response = await updateTransferRequestAPI(requestId, payload);

      Alert.alert(
        'Thành công',
        response?.message || 'Yêu cầu chuyển phòng đã được cập nhật thành công',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Không thể cập nhật yêu cầu. Vui lòng thử lại.';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  const renderRoomItem = ({ item }) => {
    const isSelected = selectedRoom?._id === item._id;
    const price = getRoomPrice(item);
    const personMax = getRoomPersonMax(item);
    const floor = getRoomFloor(item);
    const roomType = getRoomType(item);

    return (
      <TouchableOpacity
        style={[styles.roomItem, isSelected && styles.roomItemSelected]}
        onPress={() => {
          setSelectedRoom(item);
          setShowRoomModal(false);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.roomItemLeft}>
          <View style={[styles.roomIconBg, isSelected && styles.roomIconBgSelected]}>
            <MaterialCommunityIcons name="door" size={22} color={isSelected ? '#F59E0B' : '#6B7280'} />
          </View>
          <View style={styles.roomItemInfo}>
            <Text style={[styles.roomItemName, isSelected && styles.roomItemNameSelected]}>
              {getRoomDisplayName(item)}
            </Text>
            {roomType && <Text style={styles.roomItemType}>{roomType}</Text>}
            <View style={styles.roomItemMeta}>
              {floor !== null && (
                <View style={styles.metaTag}>
                  <MaterialCommunityIcons name="stairs" size={11} color="#6B7280" />
                  <Text style={styles.metaTagText}>Tầng {floor}</Text>
                </View>
              )}
              {personMax !== null && (
                <View style={styles.metaTag}>
                  <MaterialCommunityIcons name="account-multiple" size={11} color="#6B7280" />
                  <Text style={styles.metaTagText}>Tối đa {personMax} người</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={styles.roomItemRight}>
          {price !== null && (
            <Text style={[styles.roomItemPrice, isSelected && styles.roomItemPriceSelected]}>
              {formatCurrency(price)}
            </Text>
          )}
          {price !== null && <Text style={styles.roomItemPriceUnit}>/tháng</Text>}
          {isSelected && (
            <MaterialCommunityIcons name="check-circle" size={20} color="#F59E0B" style={{ marginTop: 4 }} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cập nhật yêu cầu chuyển phòng</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons name="information-outline" size={20} color="#3B82F6" />
          <Text style={styles.infoBannerText}>
            Chỉ có thể chỉnh sửa khi yêu cầu ở trạng thái "Chờ xử lý". Thay đổi sẽ được gửi lại cho quản lý xem xét.
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* Step 1: Room */}
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Phòng muốn chuyển đến</Text>
          </View>

          <TouchableOpacity
            style={[styles.roomPickerBtn, selectedRoom && styles.roomPickerBtnSelected]}
            onPress={() => setShowRoomModal(true)}
            activeOpacity={0.8}
          >
            {loadingRooms ? (
              <ActivityIndicator size="small" color="#6B7280" />
            ) : selectedRoom ? (
              <View style={styles.roomPickerSelected}>
                <View>
                  <Text style={styles.roomPickerSelectedName}>{getRoomDisplayName(selectedRoom)}</Text>
                  <Text style={styles.roomPickerSelectedDetail}>
                    {[
                      getRoomFloor(selectedRoom) !== null ? `Tầng ${getRoomFloor(selectedRoom)}` : null,
                      getRoomPersonMax(selectedRoom) !== null ? `Tối đa ${getRoomPersonMax(selectedRoom)} người` : null,
                      getRoomPrice(selectedRoom) !== null ? formatCurrency(getRoomPrice(selectedRoom)) + '/tháng' : null,
                    ].filter(Boolean).join(' • ')}
                  </Text>
                </View>
                <MaterialCommunityIcons name="pencil-outline" size={18} color="#F59E0B" />
              </View>
            ) : (
              <View style={styles.roomPickerPlaceholder}>
                <MaterialCommunityIcons name="door-open" size={20} color="#9CA3AF" />
                <Text style={styles.roomPickerPlaceholderText}>
                  {availableRooms.length === 0 && !loadingRooms ? 'Không có phòng trống' : 'Chọn phòng trống...'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Step 2: Date */}
          <View style={[styles.stepHeader, { marginTop: 28 }]}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Ngày chuyển phòng</Text>
          </View>

          <TouchableOpacity
            style={[styles.datePickerBtn, selectedDateObj && styles.datePickerBtnSelected]}
            onPress={() => setShowDateModal(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="calendar" size={20} color={selectedDateObj ? '#F59E0B' : '#9CA3AF'} />
            <Text style={[styles.datePickerText, selectedDateObj && styles.datePickerTextSelected]}>
              {transferDate || 'Chọn ngày chuyển phòng...'}
            </Text>
            {selectedDateObj && <MaterialCommunityIcons name="check-circle" size={18} color="#F59E0B" />}
          </TouchableOpacity>
          <Text style={styles.helperText}>Ngày chuyển phải từ ngày mai trở đi</Text>

          {/* Step 3: Reason */}
          <View style={[styles.stepHeader, { marginTop: 28 }]}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>Lý do chuyển phòng</Text>
          </View>

          <TextInput
            style={styles.textArea}
            placeholder={`Mô tả lý do bạn muốn chuyển phòng (ít nhất 10 ký tự)`}
            placeholderTextColor="#9CA3AF"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={5}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{reason.length}/500</Text>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, (loading || !selectedRoom) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || !selectedRoom}
          activeOpacity={0.8}
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

      {/* Room Selection Modal */}
      <Modal
        visible={showRoomModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRoomModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn phòng trống</Text>
            <TouchableOpacity onPress={() => setShowRoomModal(false)} style={styles.modalClose}>
              <MaterialCommunityIcons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {loadingRooms ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color="#F59E0B" />
              <Text style={styles.modalLoadingText}>Đang tải danh sách phòng...</Text>
            </View>
          ) : availableRooms.length === 0 ? (
            <View style={styles.modalEmpty}>
              <MaterialCommunityIcons name="home-off-outline" size={48} color="#D1D5DB" />
              <Text style={styles.modalEmptyText}>Hiện không có phòng trống nào</Text>
            </View>
          ) : (
            <FlatList
              data={availableRooms}
              keyExtractor={(item) => item._id}
              renderItem={renderRoomItem}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDateModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn ngày chuyển</Text>
            <TouchableOpacity onPress={() => setShowDateModal(false)} style={styles.modalClose}>
              <MaterialCommunityIcons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <View style={styles.calContainer}>
            {/* Month navigation */}
            <View style={styles.calNavRow}>
              <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}>
                <MaterialCommunityIcons name="chevron-left" size={28} color="#1F2937" />
              </TouchableOpacity>
              <Text style={styles.calMonthText}>{MONTH_NAMES[calMonth]} {calYear}</Text>
              <TouchableOpacity onPress={nextMonth} style={styles.calNavBtn}>
                <MaterialCommunityIcons name="chevron-right" size={28} color="#1F2937" />
              </TouchableOpacity>
            </View>

            {/* Day headers */}
            <View style={styles.calDayHeaderRow}>
              {DAY_NAMES.map((d) => (
                <Text key={d} style={[styles.calDayHeader, d === 'CN' && { color: '#EF4444' }]}>{d}</Text>
              ))}
            </View>

            {/* Day cells */}
            <View style={styles.calGrid}>
              {buildCalendarDays(calYear, calMonth).map((day, index) => {
                if (!day) return <View key={`empty-${index}`} style={styles.calCell} />;
                const cellDate = new Date(calYear, calMonth, day);
                cellDate.setHours(0, 0, 0, 0);
                const isPast = cellDate <= today;
                const isToday = cellDate.getTime() === today.getTime();
                const isSelected = selectedDateObj &&
                  cellDate.getTime() === new Date(selectedDateObj).setHours(0, 0, 0, 0);
                const isSunday = cellDate.getDay() === 0;

                return (
                  <TouchableOpacity
                    key={`day-${day}`}
                    style={[
                      styles.calCell,
                      isToday && styles.calCellToday,
                      isSelected && styles.calCellSelected,
                      isPast && styles.calCellDisabled,
                    ]}
                    onPress={() => onCalendarDayPress(day)}
                    disabled={isPast}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.calDayText,
                      isSunday && styles.calDaySunday,
                      isToday && styles.calDayTextToday,
                      isSelected && styles.calDayTextSelected,
                      isPast && styles.calDayTextDisabled,
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedDateObj && (
              <View style={styles.calSelectedInfo}>
                <MaterialCommunityIcons name="calendar-check" size={16} color="#F59E0B" />
                <Text style={styles.calSelectedText}>Đã chọn: {transferDate}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1F2937', flex: 1, textAlign: 'center' },
  scrollContainer: { flexGrow: 1, paddingBottom: 100 },
  infoBanner: {
    flexDirection: 'row', backgroundColor: '#EFF6FF',
    borderLeftWidth: 4, borderLeftColor: '#3B82F6',
    marginHorizontal: 16, marginTop: 16, borderRadius: 8,
    paddingVertical: 12, paddingHorizontal: 12, gap: 10,
  },
  infoBannerText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 19 },
  formContainer: { paddingHorizontal: 16, paddingTop: 20 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  stepBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center',
  },
  stepBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  stepTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937' },

  // Room picker
  roomPickerBtn: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 14,
  },
  roomPickerBtnSelected: { borderColor: '#F59E0B', borderWidth: 2, backgroundColor: '#FFFBEB' },
  roomPickerPlaceholder: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roomPickerPlaceholderText: { flex: 1, fontSize: 14, color: '#9CA3AF' },
  roomPickerSelected: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomPickerSelectedName: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
  roomPickerSelectedDetail: { fontSize: 12, color: '#6B7280' },

  // Date picker
  datePickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 14,
  },
  datePickerBtnSelected: { borderColor: '#F59E0B', borderWidth: 2, backgroundColor: '#FFFBEB' },
  datePickerText: { flex: 1, fontSize: 14, color: '#9CA3AF' },
  datePickerTextSelected: { color: '#1F2937', fontWeight: '500' },
  helperText: { fontSize: 12, color: '#9CA3AF', marginTop: 5, marginLeft: 2 },

  // Reason
  textArea: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
    fontSize: 14, color: '#1F2937', minHeight: 120,
  },
  charCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },

  // Footer buttons
  buttonContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB',
    paddingVertical: 12, paddingHorizontal: 16, paddingBottom: 20, flexDirection: 'row', gap: 12,
  },
  cancelButton: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 10,
    paddingVertical: 14, justifyContent: 'center', alignItems: 'center',
  },
  cancelButtonText: { color: '#6B7280', fontSize: 16, fontWeight: '600' },
  submitButton: {
    flex: 2, backgroundColor: '#F59E0B', borderRadius: 10,
    paddingVertical: 14, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 8, elevation: 2,
  },
  submitButtonDisabled: { backgroundColor: '#D1D5DB' },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  // Room List Modal
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#1F2937' },
  modalClose: { padding: 4 },
  modalLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  modalLoadingText: { fontSize: 14, color: '#6B7280' },
  modalEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  modalEmptyText: { fontSize: 15, color: '#9CA3AF' },

  // Room list items
  roomItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  roomItemSelected: { backgroundColor: '#FFFBEB', borderRadius: 10, paddingHorizontal: 10, marginHorizontal: -6 },
  roomItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  roomIconBg: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
  },
  roomIconBgSelected: { backgroundColor: '#FEF3C7' },
  roomItemInfo: { flex: 1 },
  roomItemName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  roomItemNameSelected: { color: '#D97706' },
  roomItemType: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  roomItemMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  metaTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F3F4F6', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  metaTagText: { fontSize: 10, color: '#6B7280' },
  roomItemRight: { alignItems: 'flex-end', marginLeft: 8 },
  roomItemPrice: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  roomItemPriceSelected: { color: '#D97706' },
  roomItemPriceUnit: { fontSize: 11, color: '#9CA3AF' },

  // Calendar
  calContainer: { paddingHorizontal: 16, paddingTop: 12 },
  calNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  calNavBtn: { padding: 4 },
  calMonthText: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  calDayHeaderRow: { flexDirection: 'row', marginBottom: 8 },
  calDayHeader: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#6B7280' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  calCellToday: { backgroundColor: '#FEF3C7', borderRadius: 20 },
  calCellSelected: { backgroundColor: '#F59E0B', borderRadius: 20 },
  calCellDisabled: { opacity: 0.3 },
  calDayText: { fontSize: 14, color: '#1F2937' },
  calDaySunday: { color: '#EF4444' },
  calDayTextToday: { fontWeight: '700', color: '#D97706' },
  calDayTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  calDayTextDisabled: { color: '#9CA3AF' },
  calSelectedInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFBEB', borderRadius: 8, padding: 10, marginTop: 16,
  },
  calSelectedText: { fontSize: 14, color: '#D97706', fontWeight: '500' },
});
