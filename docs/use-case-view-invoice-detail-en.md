# VIEW INVOICE DETAIL

**Description:**
Allows Tenant to view the full details of a specific invoice, including its payment status, total amount, service breakdown, and any supporting materials such as violation or repair documentation.

**Trigger:**
Tenant taps on an invoice from the Invoice List screen.

**Preconditions:**
PRE-1: Tenant has successfully logged in.
PRE-2: Tenant has opened the Invoice List screen.

**Postconditions:**
POST-1: The system displays all available details of the selected invoice.
POST-2: If the invoice is Unpaid or Overdue, the system provides a payment action for Tenant.

**Normal Flow:**
User View Invoice Detail Process

1. Tenant taps on an invoice in the Invoice List.
2. The system retrieves the selected invoice information.
3. The system validates that the invoice exists in the system. If the invoice cannot be found, the system displays an error message and a "Quay lại" button. Tenant taps "Quay lại" to return to the previous screen.
4. The system determines the invoice type: Periodic, Incurred (Violation or Repair), or Prepaid.
5. The system retrieves the latest invoice data from the server. While waiting, the system displays a loading indicator with text "Đang tải...".
6. If the server cannot be reached or returns an error, the system displays an error message and a "Quay lại" button. Tenant taps "Quay lại" to return to the previous screen.
7. On success, the system renders the invoice detail screen as follows:
   a. **Hero card**: displays the invoice title, invoice code, and a status badge.
   b. **Amount banner**: displays the total amount to be paid, and the due date (hidden for prepaid invoices).
   c. **Invoice information section**: displays invoice code, invoice type, room name, room type, room price, payment date, and due date (where applicable).
   d. **Service breakdown section** (for Periodic invoices): displays each service item with an icon, service name, and amount. For electricity and water services, the system also shows the meter readings (previous index and current index) and the usage calculation.
   e. **Violation images section** (for violation invoices): displays any attached violation images and the violation description. If no images are available, the system shows a "Không có hình ảnh" placeholder.
   f. **Repair details section** (for repair invoices): displays the device name and repair description.
   g. **Prepaid months list** (for prepaid invoices): displays the list of months that have been prepaid.
8. If the invoice status is Unpaid or Overdue, the system displays a prominent "Thanh toán" button.
9. Tenant taps the "Thanh toán" button.
10. The system navigates Tenant to the payment screen.

**Alternative Flows:**
N/A

**Exceptions:**

E1 Invoice Not Found
1. The selected invoice does not exist in the system.
2. The system displays an error screen with a warning icon, the message "Không tìm thấy mã hóa đơn", and a "Quay lại" button.
3. Tenant taps "Quay lại" to return to the Invoice List screen.

E2 System Unavailable
1. The system cannot connect to the server or encounters an error while fetching invoice data.
2. The system displays an error screen with a warning icon, an appropriate error message, and a "Quay lại" button.
3. Tenant taps "Quay lại" to return to the Invoice List screen.

E3 Invoice is Paid or Cancelled
1. The retrieved invoice has status "Paid" or "Cancelled".
2. The system displays the correct status badge and amount banner.
3. The system does NOT display the "Thanh toán" button.
4. Use case ends after step 7 of the Normal Flow.

E4 Invoice is Overdue
1. The retrieved invoice has status "Overdue".
2. The system displays the "Quá hạn" badge in orange and shows the "Thanh toán" button.
3. The due date text is highlighted in orange and bold to indicate the overdue status.

**Priority:**
High

**Frequency of Use:**
Frequent (multiple times/month)

**Business Rules:**
BR-01: The system normalizes invoice status values to a consistent format for display, regardless of how the server returns them.
BR-02: The system maps each invoice status to a distinct visual style (color, background, icon, and label) for clear recognition:
   - Unpaid: red, label "Chưa thanh toán"
   - Paid: green, label "Đã thanh toán"
   - Overdue: orange, label "Quá hạn"
   - Cancelled: gray, label "Đã huỷ"
BR-03: The system classifies the invoice type based on its origin and content:
   - Periodic: standard recurring invoice for room rental and utilities
   - Incurred – Violation: incurred invoice triggered by a tenant rule violation, may include images
   - Incurred – Repair: incurred invoice triggered by a repair request, includes device information
   - Prepaid: invoice for advance room rental payment, identified by invoice code prefix "HD-PREPAID"
BR-04: For Periodic invoices, the system retrieves room information from the contract associated with the invoice. For Incurred and Prepaid invoices, the system retrieves room information from the related contract.
BR-05: For Periodic invoices, the system displays a breakdown of all service items including: room rental, water, electricity, internet, cleaning, and any other applicable services. Each item shows an icon, service name (without the "Dịch vụ " prefix), and amount. For electricity and water services, the system also displays the meter readings (previous and current index) and the usage calculation (quantity × unit price).
BR-06: For violation invoices, the system displays all attached violation images in a horizontally scrollable view. If no images are provided, a "Không có hình ảnh" placeholder is shown. The violation description, if available, is displayed below the images.
BR-07: For repair invoices, the system displays the device name and the repair description.
BR-08: For prepaid invoices, the system parses the prepaid period from the invoice item description and displays each prepaid month as "Tháng M - YYYY".
BR-09: For prepaid invoices, the system does not display the due date field. Instead, it displays the payment date and labels it as "Ngày thanh toán" (Payment Date) rather than "Ngày gửi" (Sent Date).
BR-10: The system formats all monetary amounts using the Vietnamese currency format (VND), for example: "1.000.000 ₫".
BR-11: The system formats all dates using the Vietnamese date format, for example: "21/04/2026". Missing or unavailable dates are displayed as "—".
BR-12: The "Thanh toán" (Pay) button is displayed only for invoices with status Unpaid or Overdue.

**Other Information:**
The interface supports proper display on phone models with a notch design or Dynamic Island.

**Assumptions:**
The server is online and returns accurate invoice data for all supported invoice types.
