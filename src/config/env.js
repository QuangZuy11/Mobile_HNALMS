// Environment configuration
// Sử dụng địa chỉ IP thực thay vì localhost cho React Native

export const ENV = {
  API_URL: 'http://192.168.0.110:9999/api',
  API_TIMEOUT: 30000,
  
  // Lưu ý: Thay đổi IP theo máy của bạn
  // Chạy lệnh 'ipconfig' (Windows) hoặc 'ifconfig' (Mac/Linux) để tìm IP
  
  // Ví dụ các cấu hình khác:
  // API_URL: 'http://localhost:9999/api', // Chỉ dùng cho web
  // API_URL: 'https://your-production-domain.com/api', // Production
