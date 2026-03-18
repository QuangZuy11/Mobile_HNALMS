// Environment configuration
// Sử dụng địa chỉ IP thực thay vì localhost cho React Native
// Cấu hình trong file .env ở thư mục gốc

// Đọc từ .env
const API_HOST = process.env.API_HOST || '192.168.26.100';
const API_PORT = process.env.API_PORT || '9999';
const API_TIMEOUT = process.env.API_TIMEOUT || '30000';

export const ENV = {
  API_HOST,
  API_PORT,
  API_URL: `http://${API_HOST}:${API_PORT}/api`,
  API_TIMEOUT: parseInt(API_TIMEOUT),
};
  // Lưu ý: Thay đổi IP theo máy của bạn
  // Chạy lệnh 'ipconfig' (Windows) hoặc 'ifconfig' (Mac/Linux) để tìm IP
  
  // Ví dụ các cấu hình khác:
  // API_URL: 'http://localhost:9999/api', // Chỉ dùng cho web
  // API_URL: 'https://your-production-domain.com/api', // Production
