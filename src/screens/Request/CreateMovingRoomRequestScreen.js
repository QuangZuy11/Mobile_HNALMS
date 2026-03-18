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
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getAvailableRoomsForTransferAPI,
  createTransferRequestAPI,
} from '../../services/request.service';
import { getTenantRoomsAPI } from '../../services/profile.service';

export default function CreateMovingRoomRequestScreen({ navigation }) {
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [transferDate, setTransferDate] = useState('');   // DD/MM/YYYY display
  const [selectedDateObj, setSelectedDateObj] = useState(null); // JS Date
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  
  // Current room selection states
  const [currentRooms, setCurrentRooms] = useState([]);
  const [selectedCurrentRoom, setSelectedCurrentRoom] = useState(null);
  const [fetchingCurrentRooms, setFetchingCurrentRooms] = useState(true);
  
  const today = new Date(); today.setHours(0,0,0,0);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  useEffect(() => {
    fetchAvailableRooms();
  }, []);

  // Fetch current rooms of tenant
  useEffect(() => {
    const fetchCurrentRooms = async () => {
      try {
        setFetchingCurrentRooms(true);
        const response = await getTenantRoomsAPI();

        if (response.success && response.data && response.data.length > 0) {
          setCurrentRooms(response.data);
          // Set first room as selected by default
          setSelectedCurrentRoom(response.data[0]._id);
        } else {
          setCurrentRooms([]);
          Alert.alert('Lỗi', 'Không tìm thấy phòng hiện tại của bạn');
        }
      } catch (error) {
        setCurrentRooms([]);
        Alert.alert('Lỗi', error.message || 'Không thể tải danh sách phòng hiện tại');
      } finally {
        setFetchingCurrentRooms(false);
      }
    };

    fetchCurrentRooms();
  }, []);

  const fetchAvailableRooms = async () => {
    try {
      setLoadingRooms(true);
      const response = await getAvailableRoomsForTransferAPI();
      if (response && response.success) {
        // Backend trả về { currentContract, availableRooms }
        const rooms = Array.isArray(response.data?.availableRooms)
          ? response.data.availableRooms
          : [];
        setAvailableRooms(rooms);
      } else {
        setAvailableRooms([]);
      }
    } catch (error) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tải danh sách phòng trống. Vui lòng thử lại.');
      setAvailableRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getRoomDisplayName = (room) => {
    return room?.name || room?.roomCode || 'Phòng không xác định';
  };

  const getRoomPrice = (room) => {
    return room?.roomTypeId?.currentPrice ?? null;
  };

  // No area field in populate, use personMax instead
  const getRoomPersonMax = (room) => {
    return room?.roomTypeId?.personMax ?? null;
  };

  const getRoomFloor = (room) => {
    // floorId populated with { name } only
    return room?.floorId?.name ?? null;
  };

  const getRoomType = (room) => {
    // roomTypeId populated with typeName
    return room?.roomTypeId?.typeName ?? null;
  };

  const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month}-${day}`).toISOString();
  };

  const MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
    'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  const DAY_NAMES = ['CN','T2','T3','T4','T5','T6','T7'];

  const buildCalendarDays = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  const onCalendarDayPress = (day) => {
    if (!day) return;
    const date = new Date(calYear, calMonth, day);
    date.setHours(0,0,0,0);
    if (date <= today) return; // disable today and past
    setSelectedDateObj(date);
    const dd = String(day).padStart(2,'0');
    const mm = String(calMonth + 1).padStart(2,'0');
    setTransferDate(`${dd}/${mm}/${calYear}`);
    setShowDateModal(false);
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const handleSubmit = async () => {
    if (!selectedCurrentRoom) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn phòng hiện tại của bạn');
      return;
    }
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
        roomId: selectedCurrentRoom, // Current room ID
        targetRoomId: selectedRoom._id,
        transferDate: parseDate(transferDate.trim()),
        reason: reason.trim(),
      };

      await createTransferRequestAPI(payload);

      Alert.alert(
        'Gửi thành công',
        'Yêu cầu chuyển phòng của bạn đã được gửi. Vui lòng đợi quản lý xác nhận.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.';
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
            <MaterialCommunityIcons
              name="door"
              size={22}
              color={isSelected ? '#F59E0B' : '#6B7280'}
            />
          </View>
          <View style={styles.roomItemInfo}>
            <Text style={[styles.roomItemName, isSelected && styles.roomItemNameSelected]}>
              {getRoomDisplayName(item)}
            </Text>
            {roomType && (
              <Text style={styles.roomItemType}>{roomType}</Text>
            )}
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
        <Text style={styles.headerTitle}>Yêu cầu chuyển phòng</Text>
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
            Chọn phòng trống, ngày chuyển và lý do. Quản lý sẽ xem xét và xác nhận yêu cầu của bạn.
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* Step 0: Select Current Room */}
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Phòng hiện tại của bạn</Text>
          </View>

          {fetchingCurrentRooms ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.loadingText}>Đang tải danh sách phòng...</Text>
            </View>
          ) : currentRooms.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#9CA3AF" />
              <Text style={styles.emptyText}>Không có phòng nào</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.currentRoomScroll}
            >
              {currentRooms.map((room) => (
                <TouchableOpacity
                  key={room._id}
                  style={[
                    styles.currentRoomButton,
                    selectedCurrentRoom === room._id && styles.currentRoomButtonSelected,
                  ]}
                  onPress={() => setSelectedCurrentRoom(room._id)}
                >
                  <MaterialCommunityIcons
                    name="door"
                    size={24}
                    color={selectedCurrentRoom === room._id ? '#3B82F6' : '#9CA3AF'}
                  />
                  <Text
                    style={[
                      styles.currentRoomButtonText,
                      selectedCurrentRoom === room._id && styles.currentRoomButtonTextSelected,
                    ]}
                  >
                    {room.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Step 1: Select Target Room */}
          <View style={[styles.stepHeader, { marginTop: 28 }]}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Chọn phòng muốn chuyển đến</Text>
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
                  <Text style={styles.roomPickerSelectedName}>
                    {getRoomDisplayName(selectedRoom)}
                  </Text>
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
                  {availableRooms.length === 0 && !loadingRooms
                    ? 'Không có phòng trống'
                    : 'Chọn phòng trống...'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Step 2: Transfer Date */}
          <View style={[styles.stepHeader, { marginTop: 28 }]}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>Ngày chuyển phòng</Text>
          </View>

          <TouchableOpacity
            style={[styles.datePickerBtn, selectedDateObj && styles.datePickerBtnSelected]}
            onPress={() => setShowDateModal(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="calendar"
              size={20}
              color={selectedDateObj ? '#F59E0B' : '#9CA3AF'}
            />
            <Text style={[styles.datePickerText, selectedDateObj && styles.datePickerTextSelected]}>
              {transferDate || 'Chọn ngày chuyển phòng...'}
            </Text>
            {selectedDateObj && (
              <MaterialCommunityIcons name="check-circle" size={18} color="#F59E0B" />
            )}
          </TouchableOpacity>
          <Text style={styles.helperText}>Ngày chuyển phải từ ngày mai trở đi</Text>

          {/* Step 3: Reason */}
          <View style={[styles.stepHeader, { marginTop: 28 }]}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>4</Text>
            </View>
            <Text style={styles.stepTitle}>Lý do chuyển phòng</Text>
          </View>

          <TextInput
            style={styles.textArea}
            placeholder={`Mô tả lý do bạn muốn chuyển phòng (ít nhất 10 ký tự)\nVí dụ: Cần phòng rộng hơn để làm việc, muốn ở tầng thấp hơn...`}
            placeholderTextColor="#9CA3AF"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={5}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{reason.length}/500</Text>

          {/* Policy Note */}
          <View style={styles.policyBox}>
            <Text style={styles.policyTitle}>
              Lưu ý chính sách
            </Text>
            <Text style={styles.policyItem}>• Tiền cọc được bảo lưu và chuyển sang hợp đồng mới</Text>
            <Text style={styles.policyItem}>• Tiền thuê được tính theo số ngày thực tế khi chuyển giữa tháng</Text>
            <Text style={styles.policyItem}>• Phòng mới sẽ được giữ ngay khi yêu cầu được duyệt</Text>
            <Text style={styles.policyItem}>• Bạn cần bàn giao phòng cũ cho quản lý vào ngày chuyển</Text>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.submitButton, (loading || !selectedCurrentRoom || !selectedRoom) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || !selectedCurrentRoom || !selectedRoom}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Gửi yêu cầu chuyển phòng</Text>
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
              <MaterialCommunityIcons name="home-off-outline" size={56} color="#D1D5DB" />
              <Text style={styles.modalEmptyTitle}>Không có phòng trống</Text>
              <Text style={styles.modalEmptyText}>
                Hiện tại không có phòng nào đang trống. Vui lòng thử lại sau.
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchAvailableRooms}>
                <Text style={styles.retryButtonText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.modalSubTitle}>{availableRooms.length} phòng đang trống</Text>
              <FlatList
                data={availableRooms}
                keyExtractor={(item) => item._id}
                renderItem={renderRoomItem}
                contentContainerStyle={styles.roomList}
                showsVerticalScrollIndicator={false}
              />
            </>
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
            <Text style={styles.modalTitle}>Chọn ngày chuyển phòng</Text>
            <TouchableOpacity onPress={() => setShowDateModal(false)} style={styles.modalClose}>
              <MaterialCommunityIcons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarContainer}>
            {/* Month navigation */}
            <View style={styles.calMonthRow}>
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
                if (!day) {
                  return <View key={`empty-${index}`} style={styles.calCell} />;
                }
                const cellDate = new Date(calYear, calMonth, day);
                cellDate.setHours(0,0,0,0);
                const isPast = cellDate <= today;
                const isToday = cellDate.getTime() === today.getTime();
                const isSelected = selectedDateObj &&
                  cellDate.getTime() === new Date(selectedDateObj).setHours(0,0,0,0);
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

            {/* Selected date display */}
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
  safeContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Header
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

  // Scroll & Form
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 19,
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // Step header
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Current Room Selection
  currentRoomScroll: {
    marginHorizontal: -4,
  },
  currentRoomButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    minWidth: 100,
  },
  currentRoomButtonSelected: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: '#DBEAFE',
  },
  currentRoomButtonText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  currentRoomButtonTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },

  // Loading & Empty States
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

  // Room Picker Button
  roomPickerBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  roomPickerBtnSelected: {
    borderColor: '#F59E0B',
    borderWidth: 2,
    backgroundColor: '#FFFBEB',
  },
  roomPickerPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomPickerPlaceholderText: {
    flex: 1,
    fontSize: 14,
    color: '#9CA3AF',
  },
  roomPickerSelected: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomPickerSelectedName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  roomPickerSelectedDetail: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Date Input
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputWithIcon: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: '#1F2937',
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 5,
    marginLeft: 2,
  },

  // Reason TextArea
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 120,
  },
  charCount: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },

  // Policy
  policyBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 14,
    marginTop: 24,
    marginBottom: 8,
  },
  policyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D97706',
    marginBottom: 8,
  },
  policyItem: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 20,
  },

  // Submit Button
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
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  },
  submitButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalClose: {
    padding: 4,
  },
  modalSubTitle: {
    fontSize: 13,
    color: '#6B7280',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  modalLoadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  modalEmptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  modalEmptyText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  roomList: {
    padding: 12,
  },

  // Room Item
  roomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  roomItemSelected: {
    borderColor: '#F59E0B',
    borderWidth: 2,
    backgroundColor: '#FFFBEB',
  },
  roomItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  roomIconBg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomIconBgSelected: {
    backgroundColor: '#FEF3C7',
  },
  roomItemInfo: {
    flex: 1,
  },
  roomItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  roomItemNameSelected: {
    color: '#D97706',
  },
  roomItemType: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 5,
  },
  roomItemMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaTagText: {
    fontSize: 11,
    color: '#6B7280',
  },
  roomItemRight: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  roomItemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  roomItemPriceSelected: {
    color: '#D97706',
  },
  roomItemPriceUnit: {
    fontSize: 10,
    color: '#9CA3AF',
  },

  // Date Picker Button
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  datePickerBtnSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  datePickerText: {
    flex: 1,
    fontSize: 14,
    color: '#9CA3AF',
  },
  datePickerTextSelected: {
    color: '#1F2937',
    fontWeight: '500',
  },

  // Calendar
  calendarContainer: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  calMonthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  calNavBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  calMonthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  calDayHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  calDayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 8,
  },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  calCellToday: {
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  calCellSelected: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
  },
  calCellDisabled: {
    opacity: 0.35,
  },
  calDayText: {
    fontSize: 14,
    color: '#1F2937',
  },
  calDaySunday: {
    color: '#EF4444',
  },
  calDayTextToday: {
    fontWeight: '700',
    color: '#D97706',
  },
  calDayTextSelected: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  calDayTextDisabled: {
    color: '#D1D5DB',
  },
  calSelectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  calSelectedText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#92400E',
  },
});
