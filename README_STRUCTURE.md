# HNALMS Mobile App - Cấu Trúc Dự Án

## 📁 Cấu Trúc Thư Mục

```
Mobile_HNALMS/
├── src/
│   ├── screens/              # Tất cả các màn hình
│   │   ├── auth/            # Màn hình xác thực
│   │   │   ├── LoginScreen.js
│   │   │   └── ForgotPasswordScreen.js
│   │   ├── home/            # Màn hình chính
│   │   │   └── HomeScreen.js
│   │   ├── profile/         # Quản lý hồ sơ
│   │   │   ├── ProfileScreen.js
│   │   │   ├── UpdateProfileScreen.js
│   │   │   ├── ChangePasswordScreen.js
│   │   │   └── MyRoomScreen.js
│   │   ├── contract/        # Quản lý hợp đồng
│   │   │   ├── ContractListScreen.js
│   │   │   ├── RenewContractScreen.js
│   │   │   └── TerminateContractScreen.js
│   │   ├── invoice/         # Quản lý hóa đơn
│   │   │   ├── InvoiceListScreen.js
│   │   │   ├── InvoiceDetailScreen.js
│   │   │   └── PayInvoiceScreen.js
│   │   ├── service/         # Quản lý dịch vụ
│   │   │   ├── ServiceListScreen.js
│   │   │   ├── BookServiceScreen.js
│   │   │   └── CancelServiceScreen.js
│   │   ├── request/         # Quản lý yêu cầu
│   │   │   ├── RequestListScreen.js
│   │   │   ├── RequestDetailScreen.js
│   │   │   ├── CreateMovingRoomRequestScreen.js
│   │   │   ├── CreateComplaintRequestScreen.js
│   │   │   ├── CreateRepairRequestScreen.js
│   │   │   ├── CreateMaintenanceRequestScreen.js
│   │   │   └── UpdateRequestScreen.js
│   │   └── notification/    # Quản lý thông báo
│   │       ├── NotificationListScreen.js
│   │       └── NotificationDetailScreen.js
│   │
│   ├── components/          # Các component tái sử dụng
│   │   ├── common/         # Component chung
│   │   │   ├── Button.js
│   │   │   ├── Input.js
│   │   │   ├── Loading.js
│   │   │   └── Card.js
│   │   ├── invoice/        # Component dành cho hóa đơn
│   │   │   └── InvoiceCard.js
│   │   ├── contract/       # Component dành cho hợp đồng
│   │   │   └── ContractCard.js
│   │   ├── service/        # Component dành cho dịch vụ
│   │   │   └── ServiceCard.js
│   │   ├── request/        # Component dành cho yêu cầu
│   │   │   └── RequestCard.js
│   │   └── notification/   # Component dành cho thông báo
│   │       └── NotificationCard.js
│   │
│   ├── navigation/         # Cấu hình điều hướng
│   │   ├── AppNavigator.js
│   │   ├── AuthNavigator.js
│   │   └── MainNavigator.js
│   │
│   ├── services/           # Các service gọi API
│   │   ├── api.service.js         # Service API cơ bản
│   │   ├── auth.service.js        # API xác thực
│   │   ├── profile.service.js     # API hồ sơ
│   │   ├── contract.service.js    # API hợp đồng
│   │   ├── invoice.service.js     # API hóa đơn
│   │   ├── service.service.js     # API dịch vụ
│   │   ├── request.service.js     # API yêu cầu
│   │   ├── notification.service.js # API thông báo
│   │   └── index.js               # Export tất cả services
│   │
│   ├── config/             # File cấu hình
│   │   ├── api.config.js   # Cấu hình API endpoints
│   │   └── env.js          # Biến môi trường
│   │
│   ├── contexts/           # React Context
│   │   └── AuthContext.js  # Context xác thực
│   │
│   ├── hooks/              # Custom hooks
│   │   ├── useAuth.js      # Hook xác thực
│   │   └── useApi.js       # Hook gọi API
│   │
│   ├── utils/              # Các hàm tiện ích
│   │   ├── storage.js      # Hỗ trợ AsyncStorage
│   │   ├── helpers.js      # Hàm hỗ trợ chung
│   │   └── validation.js   # Hàm validation
│   │
│   ├── constants/          # Hằng số ứng dụng
│   │   ├── theme.js        # Màu sắc, font chữ, kích thước
│   │   ├── appConstants.js # Hằng số toàn ứng dụng
│   │   └── requestTypes.js # Hằng số loại yêu cầu
│   │
│   ├── styles/             # Styles toàn cục
│   │   └── globalStyles.js
│   │
│   └── assets/             # Tài nguyên tĩnh
│       ├── images/         # File hình ảnh
│       └── icons/          # File biểu tượng
│
├── App.js                  # Component gốc
├── app.json               # Cấu hình Expo
├── package.json           # Thư viện phụ thuộc
├── .env.example          # Mẫu biến môi trường
├── .gitignore            # File Git ignore
└── README.md             # Tài liệu dự án

```

## 🔌 Cấu Hình Backend API

**Backend Server:** http://localhost:9999
**API Base URL:** http://localhost:9999/api

### Cấu Trúc API Endpoints:

- **Authentication:** `/api/auth/*`
- **Profile:** `/api/profile/*`
- **Contract:** `/api/contracts/*`
- **Invoice:** `/api/invoices/*`
- **Service:** `/api/services/*`
- **Request:** `/api/requests/*`
- **Notification:** `/api/notifications/*`

## 📦 Các Tính Năng Chính (Dựa Trên Use Case Diagram)

### 1. Authentication Module
- Login
- Logout  
- Forgot Password

### 2. Profile Management Module
- View Profile
- Update Profile
- Change Password
- View My Room

### 3. Contract Management Module
- View My Contract
- Renew Contract
- Terminate Contract

### 4. Invoice Management Module
- View Invoice List
- View Invoice Detail
- Pay Invoice

### 5. Service Management Module
- View Service List
- Book Service
- Cancel Extension Service

### 6. Request Management Module
- View List Request
- View Request Detail
- Create Moving Room Request
- Create Complaint Request
- Create Repair Request
- Create Maintenance Request
- Update Request
- Delete Request

### 7. Notification Management Module
- View Notification List
- View Notification Detail

## 🚀 Các Bước Tiếp Theo

1. Cài đặt các thư viện cần thiết (React Navigation, Axios, v.v.)
2. Triển khai tầng service API với axios
3. Thiết lập luồng xác thực
4. Triển khai từng màn hình theo các tính năng
5. Kết nối các màn hình với backend API

## 📝 Ghi Chú

- Đây là cấu trúc dự án khởi tạo ban đầu
- Tất cả các file hiện đang là placeholder với comments
- Sẵn sàng để push lên Git (các thư mục rỗng đã có placeholder files)
- Backend đang chạy ở cổng 9999
- Cập nhật file `.env` với URL backend thực tế khi deploy
