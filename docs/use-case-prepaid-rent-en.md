# PREPAID RENT

**Description:**
Allows Tenant to prepay room rental for multiple months in advance via QR code scan. The system calculates the minimum prepaid period (3 months), displays the total amount, and confirms payment upon successful bank transfer.

**Trigger:**
Tenant taps the "Trả trước tiền phòng" entry on the Invoice List screen.

**Preconditions:**
PRE-1: Tenant has successfully logged in.
PRE-2: Tenant has at least one active rental contract.
PRE-3: The mobile device has an active Internet connection.

**Postconditions:**
POST-1: If payment succeeds, the contract's rent-paid-through date is updated accordingly.
POST-2: Tenant is returned to the Invoice List screen upon completion or cancellation.

**Normal Flow:**
User Prepaid Rent Process

1. Tenant opens the Prepaid Rent screen.
2. The system retrieves the list of Tenant's active rental contracts. While loading, a spinner with "Đang tải thông tin hợp đồng..." is shown.
3. If no active contracts are found, the system displays an error screen with a warning icon and a "Quay lại" button.
4. The system displays contract selection. If Tenant has multiple contracts, a modal allows selection of which room to prepay. If only one contract exists, it is auto-selected.
5. Once a contract is selected, the system displays contract details: contract code, start date, end date, rent-paid-through date, room name, room type, and monthly room price.
6. The system calculates and displays the available months for prepayment based on the contract's end date and the minimum 3-month requirement. If all months are already prepaid, the system shows "Đã thanh toán toàn bộ hợp đồng" and the process ends.
7. Tenant taps the month picker to select the final month of the prepayment period. The number of prepaid months is auto-calculated (not manually entered) and displayed.
8. The system displays the full list of months to be prepaid and the total amount (number of months × room price).
9. Tenant taps "Xác nhận & Thanh toán QR".
10. The system shows a confirmation dialog summarizing the prepayment details. Tenant confirms.
11. The system generates a QR payment code and navigates Tenant to the payment screen.
12. The payment screen displays a countdown timer, the QR code, bank transfer details, and a "Hủy giao dịch" button.
13. Tenant scans the QR code with a banking app and completes the bank transfer.
14. The system detects the successful payment and displays a success confirmation with an invoice summary card.
15. Tenant taps "Quay về danh sách hóa đơn" and is navigated back to the Invoice List with the list refreshed.

**Alternative Flows:**

AF-1 Tenant has multiple contracts
1. The system displays a contract picker modal listing all available contracts with room name, contract code, and monthly price.
2. Tenant selects the desired contract. The month picker and price are recalculated accordingly.

AF-2 Tenant saves the QR code to gallery
1. Tenant taps "Lưu mã QR" to save the QR code image to the device photo gallery.
2. The system requests photo library permission. If granted, the QR image is saved to the "HNALMS" album and a success message is shown.

AF-3 Tenant cancels the transaction
1. Tenant taps "Hủy giao dịch" at any point during the payment session.
2. The system displays a confirmation dialog.
3. If Tenant confirms, the system cancels the payment session and navigates back. No changes are made to the contract.

AF-4 Tenant cancels before payment is confirmed
1. Tenant taps "Hủy thanh toán" on the PrepaidRentScreen before proceeding to the QR screen.
2. The system closes the confirmation dialog and returns to the main form. No prepayment is initiated.

**Exceptions:**

E1 No Active Contracts
1. The system cannot find any active rental contract for the authenticated user.
2. The system displays an error screen with message "Không có hợp đồng đang hoạt động" and a "Quay lại" button.

E2 System Unavailable During Contract Loading
1. The system cannot connect to the server while loading contract data.
2. The system displays an error screen with a warning icon and a "Quay lại" button.

E3 Prepayment Request Fails
1. The system fails to generate the prepayment request.
2. An alert displays the error message and the Tenant remains on the PrepaidRentScreen.

E4 Payment Session Expires
1. The 5-minute payment session timer reaches zero.
2. The system displays an expired screen with message "Giao dịch đã hết hạn" and a "Tạo yêu cầu mới" button.
3. Tenant taps the button to return to the PrepaidRentScreen and restart the process.

E5 Invalid Month Selection
1. Tenant selects a month that does not meet the minimum 3-month prepayment requirement.
2. The system displays a warning banner "Tháng đã chọn không hợp lệ. Phải đảm bảo tối thiểu 3 tháng trả trước."
3. The "Xác nhận & Thanh toán QR" button remains disabled.

**Priority:**
High

**Frequency of Use:**
Occasional (typically at the start of a new contract or when Tenant chooses to prepay)

**Business Rules:**
BR-01: The minimum prepayment period is 3 months. The system auto-calculates the number of months based on Tenant's selected end month.
BR-02: Prepayment is only available up to the contract end date. Months that have already been prepaid are excluded from selection.
BR-03: The system validates month selection in real-time. If the selected month violates business rules, the confirm button remains disabled.
BR-04: The total prepayment amount is calculated as: `room monthly price × number of prepaid months`.
BR-05: The system displays the full list of months to be prepaid, formatted as "Tháng M - YYYY".
BR-06: The countdown timer turns red when 60 seconds or less remain.
BR-07: The system polls for payment status every 3 seconds while in the pending phase. Polling errors are silently ignored.
BR-08: On success, the system displays a detailed invoice card showing: invoice code, room name, number of prepaid months, prepayment period, total amount, payment date, and transaction code.
BR-09: On success, the system navigates Tenant to the Invoice List screen with a refresh flag after confirmation.
BR-10: The transfer content (transaction code) is visually highlighted in the payment details to guide Tenant to enter it correctly in the banking app.

**Other Information:**
- The app uses a purple-based color theme (#7C3AED) to differentiate the Prepaid Rent feature from regular invoice payment (#3B82F6 blue).
- The contract picker and month picker use bottom-sheet modal styles for an intuitive, mobile-friendly experience.
- The success screen displays a formal invoice card with a purple header (#7C3AED) and a green "ĐÃ THANH TOÁN" badge.
- The interface supports proper display on phone models with a notch design or Dynamic Island.
- The countdown timer uses a sand timer icon and switches from yellow (#F59E0B) to red (#DC2626) when time is running low.

**Assumptions:**
The bank transfer and payment confirmation service (Sepay/VietQR) is online and responsive.
