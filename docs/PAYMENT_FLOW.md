# Luồng Thanh Toán Hóa Đơn - QR Payment Flow

## 📌 Tổng quan

Tính năng thanh toán hóa đơn qua QR sử dụng **Sepay/VietQR** cho phép cư dân thanh toán hóa đơn phát sinh (Incurred) bằng cách quét mã QR ngân hàng.

---

## 🔄 Luồng dữ liệu (Data Flow)

```
┌─────────────────┐    navigate     ┌───────────────────┐    navigate     ┌─────────────────┐
│ InvoiceListScreen│ ─────────────► │ InvoiceDetailScreen│ ─────────────► │ PayInvoiceScreen │
└─────────────────┘                 └───────────────────┘                 └─────────────────┘
        │                                   │                                     │
        │ item._id                          │ invoiceId (từ route.params)         │ invoiceId
        │ item.type                         │ invoiceType                         │
        ▼                                   ▼                                     ▼
   Danh sách hóa đơn               Chi tiết hóa đơn                    Thanh toán QR
```

---

## 📱 Các màn hình liên quan

### 1. InvoiceListScreen
**File**: `src/screens/Invoice/InvoiceListScreen.js`

- Hiển thị danh sách hóa đơn của cư dân
- Khi nhấn vào hóa đơn → navigate đến `InvoiceDetail` với params:
  ```javascript
  navigation.navigate('InvoiceDetail', {
    invoiceId: item._id,      // ID của hóa đơn
    invoiceType: item.type    // 'Periodic' | 'Incurred'
  })
  ```

### 2. InvoiceDetailScreen  
**File**: `src/screens/Invoice/InvoiceDetailScreen.js`

- Nhận `invoiceId` và `invoiceType` từ route.params
- Gọi API lấy chi tiết:
  - `getInvoiceDetailAPI(invoiceId)` cho hóa đơn định kỳ (Periodic)
  - `getIncurredInvoiceDetailAPI(invoiceId)` cho hóa đơn phát sinh (Incurred)
- Nút "Thanh toán" → navigate đến `PayInvoice`:
  ```javascript
  navigation.navigate('PayInvoice', { invoiceId })
  // ⚠️ Quan trọng: Sử dụng invoiceId từ route.params, 
  //    KHÔNG dùng invoice._id vì API có thể trả về field khác (id vs _id)
  ```

### 3. PayInvoiceScreen
**File**: `src/screens/Invoice/PayInvoiceScreen.js`

- Nhận `invoiceId` từ route.params
- Thực hiện toàn bộ flow thanh toán QR

---

## 🔐 API Endpoints

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/invoices/:id/payment/initiate` | POST | Khởi tạo thanh toán, nhận QR code |
| `/invoices/payment/status/:transactionCode` | GET | Kiểm tra trạng thái thanh toán |
| `/invoices/payment/cancel/:transactionCode` | POST | Hủy giao dịch đang chờ |

### API Functions (invoice.service.js)

```javascript
// Khởi tạo thanh toán
initiatePaymentAPI(invoiceId)
// Response: { success, data: { qrUrl, transactionCode, bankInfo, expireAt, ... } }

// Kiểm tra trạng thái
getPaymentStatusAPI(transactionCode)
// Response: { success, data: { status: 'Pending' | 'Success' | 'Expired' | 'Failed' } }

// Hủy thanh toán
cancelPaymentAPI(transactionCode)
// Response: { success, message }
```

---

## 🎯 PayInvoiceScreen - Flow chi tiết

### Phase States
```
loading → pending → success
                 └→ expired
                 └→ error
```

### 1. **Loading Phase**
```
Mount component
    │
    ▼
invoiceId có trong route.params?
    │
    ├─ NO → setPhase('error') + "Thiếu mã hóa đơn"
    │
    └─ YES → Gọi initiatePaymentAPI(invoiceId)
                │
                ├─ Success → setPaymentData(res.data) + setPhase('pending')
                │
                └─ Error → setPhase('error') + hiển thị message
```

### 2. **Pending Phase** (Hiển thị QR)

**UI bao gồm:**
- ⏱️ Countdown timer (5 phút từ `expireAt`)
- 📱 QR Code image từ `qrUrl`
- 💰 Số tiền cần thanh toán
- 🏦 Thông tin ngân hàng (BIDV, số TK, chủ TK)
- 📋 Nội dung chuyển khoản (transactionCode) - có nút copy
- ⌛ Indicator "Đang chờ xác nhận..."
- ❌ Nút "Hủy thanh toán"

**Polling Logic:**
```
Mỗi 4 giây:
    │
    ▼
Gọi getPaymentStatusAPI(transactionCode)
    │
    ├─ status = 'Success' → stopTimers() + setPhase('success')
    │
    ├─ status = 'Expired' → stopTimers() + setPhase('expired')
    │
    ├─ status = 'Failed'  → stopTimers() + setPhase('error')
    │
    └─ status = 'Pending' → tiếp tục polling
```

**Countdown hết hạn:**
```
expireAt - Date.now() <= 0
    │
    ▼
stopTimers() + setPhase('expired')
```

**Failsafe timeout:** Tự động dừng sau 6 phút (backup nếu countdown fail)

### 3. **Success Phase**
- ✅ Hiển thị icon success màu xanh
- 💵 Hiển thị số tiền đã thanh toán
- 🔘 Nút "Hoàn tất" → `navigation.goBack()`

### 4. **Expired Phase**
- ⚠️ Hiển thị icon cảnh báo màu vàng
- 📝 Message: "Phiên thanh toán đã hết 5 phút"
- 🔘 Nút "Quay lại" → `navigation.goBack()`

### 5. **Error Phase**
- ❌ Hiển thị icon lỗi màu đỏ
- 📝 Hiển thị error message từ API hoặc default
- 🔘 Nút "Quay lại" → `navigation.goBack()`

---

## ⚙️ Xử lý đặc biệt

### App State Handling
```javascript
// Khi app vào background → pause polling (tiết kiệm resource)
// Khi app quay lại foreground → resume polling
AppState.addEventListener('change', ...)
```

### Cancel Payment
```javascript
// Khi user nhấn "Hủy thanh toán"
Alert.alert(...)  // Confirm
    │
    ▼
stopTimers()      // Dừng polling & timeout
    │
    ▼
cancelPaymentAPI(transactionCode)  // Thông báo backend hủy
    │
    ▼
navigation.goBack()
```

### Cleanup on Unmount
```javascript
// Component unmount → dọn dẹp tất cả timers
useEffect(() => () => {
    clearInterval(pollingRef.current);
    clearTimeout(failsafeRef.current);
}, []);
```

---

## 🐛 Lỗi thường gặp

### "Thiếu mã hóa đơn"
**Nguyên nhân:** `invoiceId` không được truyền qua route.params

**Giải pháp:**
- Kiểm tra navigation ở màn trước (InvoiceDetailScreen)
- Đảm bảo dùng `invoiceId` từ route.params, không dùng `invoice._id`
- API có thể trả về `id` thay vì `_id`, nên dùng biến đã có sẵn

```javascript
// ❌ SAI - có thể undefined nếu API trả về "id" thay vì "_id"
onPress={() => navigation.navigate('PayInvoice', { invoiceId: invoice._id })}

// ✅ ĐÚNG - dùng invoiceId đã có từ route.params
const { invoiceId } = route.params;
onPress={() => navigation.navigate('PayInvoice', { invoiceId })}
```

### "Không thể khởi tạo thanh toán"
**Nguyên nhân có thể:**
- Hóa đơn đã được thanh toán
- Hóa đơn không tồn tại
- Đang có giao dịch pending cho hóa đơn này
- Lỗi server

### QR không hiển thị
**Nguyên nhân có thể:**
- URL QR không hợp lệ
- Network timeout
- Image component không load được

---

## 📁 Cấu trúc file liên quan

```
src/
├── config/
│   └── api.config.js          # PAYMENT_INITIATE, PAYMENT_STATUS, PAYMENT_CANCEL
├── services/
│   └── invoice.service.js     # initiatePaymentAPI, getPaymentStatusAPI, cancelPaymentAPI
├── screens/Invoice/
│   ├── InvoiceListScreen.js   # navigate → InvoiceDetail
│   ├── InvoiceDetailScreen.js # navigate → PayInvoice
│   └── PayInvoiceScreen.js    # QR Payment flow
└── navigation/
    └── MainNavigator.js       # Route: PayInvoice
```

---

## 📊 Sequence Diagram

```
User          InvoiceDetail       PayInvoice        Backend         Sepay
  │                 │                 │                │               │
  │──tap Pay───────►│                 │                │               │
  │                 │──navigate──────►│                │               │
  │                 │                 │──initiate─────►│               │
  │                 │                 │                │──create QR───►│
  │                 │                 │◄──qrUrl────────│◄──────────────│
  │                 │                 │                │               │
  │◄──────────show QR────────────────│                │               │
  │                 │                 │                │               │
  │                 │                 │──poll status──►│               │
  │                 │                 │◄───Pending─────│               │
  │                 │                 │     ... (mỗi 4s)               │
  │                 │                 │                │               │
  │──scan & pay────────────────────────────────────────────────────────►│
  │                 │                 │                │◄──webhook─────│
  │                 │                 │──poll status──►│               │
  │                 │                 │◄───Success─────│               │
  │                 │                 │                │               │
  │◄──────────show Success───────────│                │               │
  │                 │                 │                │               │
```

---

## ✅ Checklist Testing

- [ ] Navigate từ InvoiceList → InvoiceDetail → PayInvoice
- [ ] QR hiển thị đúng với số tiền, mã giao dịch
- [ ] Countdown đếm ngược đúng
- [ ] Copy nội dung chuyển khoản hoạt động
- [ ] Polling cập nhật status đúng
- [ ] Success screen hiển thị khi thanh toán thành công
- [ ] Expired screen hiển thị khi hết 5 phút
- [ ] Cancel payment hoạt động và gọi API
- [ ] App background/foreground không crash
- [ ] Back button xử lý đúng theo phase

---

*Cập nhật: March 2026*
