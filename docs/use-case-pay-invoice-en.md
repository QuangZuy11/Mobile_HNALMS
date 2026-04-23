# PAY INVOICE

**Description:**
Allows Tenant to pay an invoice via QR code scan using a banking app. The system generates a time-limited QR payment code and automatically confirms payment once the bank transfer is detected.

**Trigger:**
Tenant taps the "Thanh toán" button on the Invoice Detail screen.

**Preconditions:**
PRE-1: Tenant has successfully logged in.
PRE-2: Tenant has opened the Invoice Detail screen for an Unpaid or Overdue invoice.
PRE-3: The mobile device has an active Internet connection.

**Postconditions:**
POST-1: If payment is successful, the invoice status is updated to "Paid" and Tenant is returned to the Invoice List.
POST-2: If Tenant cancels or the session expires, Tenant is returned to the Invoice Detail screen.

**Normal Flow:**
User Pay Invoice Process

1. Tenant taps "Thanh toán" on the Invoice Detail screen.
2. The system displays a loading indicator with text "Đang tạo mã QR thanh toán…".
3. The system generates a QR payment code. While generating, the system displays a loading screen.
4. On success, the system displays the payment screen with:
   a. A countdown timer showing the remaining time for the payment session.
   b. A QR code that Tenant scans with their banking app.
   c. Bank transfer details: bank name (BIDV), account number, account holder name, transfer amount, and transfer content.
   d. An option to download the QR code to the device gallery.
   e. A "Đang chờ xác nhận thanh toán…" status indicator.
   f. A "Hủy thanh toán" button.
5. Tenant scans the QR code with their banking app and completes the bank transfer.
6. The system automatically detects the successful payment and displays a success confirmation.
7. After 1.2 seconds, the system navigates Tenant back to the Invoice List screen with the list refreshed.

**Alternative Flows:**

AF-1 Tenant downloads the QR code
1. Tenant taps "Tải mã QR" to save the QR code image to the device photo gallery.
2. The system saves the QR code image and confirms with a success message.

AF-2 Tenant cancels the payment
1. Tenant taps "Hủy thanh toán".
2. The system displays a confirmation dialog asking whether Tenant is sure.
3. If Tenant confirms, the system cancels the payment session and navigates back to the Invoice Detail screen. The invoice remains Unpaid.

AF-3 Tenant returns to the app after payment
1. Tenant leaves the app to complete the bank transfer in another application.
2. Tenant returns to the app. If the payment has been confirmed, the system displays the success screen and navigates back to the Invoice List.

**Exceptions:**

E1 Missing Invoice Information
1. The system cannot identify the invoice to pay.
2. The system displays an error screen with message "Thiếu mã hóa đơn" and a "Quay lại" button.
3. Tenant taps "Quay lại" to return to the Invoice Detail screen.

E2 Payment Initialization Fails
1. The system cannot generate a QR payment code.
2. The system displays an error screen with the message "Không thể thanh toán" and a "Quay lại" button.
3. Tenant taps "Quay lại" to return to the Invoice Detail screen.

E3 QR Code Fails to Load
1. The QR code image cannot be loaded or displayed.
2. The system shows a placeholder indicating the QR code is unavailable.
3. Tenant may still proceed using the bank transfer details displayed on screen.

E4 Payment Session Expires
1. The 5-minute payment session timer reaches zero.
2. The system displays an "expired" screen with message "Giao dịch hết hạn" and a "Quay lại" button.
3. Tenant taps "Quay lại" to return to the Invoice Detail screen. The invoice remains Unpaid.

E5 Network Interruption During Polling
1. The system loses internet connectivity while waiting for payment confirmation.
2. The system displays a reconnection banner "Đang thử kết nối lại…" but continues polling.
3. Once connectivity is restored, the system resumes normal polling. If payment has been confirmed during the outage, the success screen is displayed.

**Priority:**
High

**Frequency of Use:**
Frequent (as needed when invoices are issued)

**Business Rules:**
BR-01: The payment session has a default duration of 5 minutes. The exact duration is set by the server when the QR code is generated.
BR-02: The countdown timer turns red and displays "Sắp hết hạn!" when 60 seconds or less remain.
BR-03: The system polls for payment status every 3 seconds while in the pending phase.
BR-04: Polling is automatically paused when the app moves to the background and resumes when the app returns to the foreground.
BR-05: A polling error banner is shown only after the system has successfully polled at least once before encountering a network issue.
BR-06: If the invoice status cannot be retrieved (HTTP 404), the system falls back to checking the payment transaction status.
BR-07: The system formats all monetary amounts using the Vietnamese currency format (VND), for example: "1.000.000 đ".
BR-08: The "Quay lại" button in the header navigates back to Invoice Detail during the pending phase, or back to Invoice List during the success/expired phase.
BR-09: On success, the system automatically navigates to the Invoice List screen after a 1.2-second delay, passing a refresh flag to reload the invoice data.
BR-10: The system saves the QR code image to the device photo gallery under the album named "HNALMS".
BR-11: The transfer content (payment description) is highlighted to guide Tenant to enter it correctly in the banking app.

**Other Information:**
The interface supports proper display on phone models with a notch design or Dynamic Island.

**Assumptions:**
The bank transfer and payment confirmation service (Sepay/VietQR) is online and responsive.
