import { Alert, Linking } from 'react-native';

// Số điện thoại quản lý - có thể lấy từ API hoặc config
export const MANAGER_PHONE = '0399053755';

/**
 * Mở app gọi điện với số điện thoại quản lý
 */
export const handleCallManager = () => {
  const phoneUrl = `tel:${MANAGER_PHONE}`;
  
  Linking.canOpenURL(phoneUrl)
    .then((supported) => {
      if (supported) {
        return Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Lỗi', 'Không thể mở ứng dụng gọi điện');
      }
    })
    .catch((err) => {
      Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi');
    });
};
