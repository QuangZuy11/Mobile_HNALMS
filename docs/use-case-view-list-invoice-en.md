# VIEW INVOICE LIST

**Description:**
Allows Tenant to view, search, and filter the list of their invoices in the rental management system.

**Trigger:**
Tenant opens the "Invoice" screen in the mobile application.

**Preconditions:**
PRE-1: Tenant has successfully logged in and has at least one invoice in the system.
PRE-2: The mobile device has an active Internet connection.

**Postconditions:**
POST-1: The system displays the invoice list with statistics and filtering options.
POST-2: Tenant can view invoice details or proceed to make a payment.

**Normal Flow:**
User View Invoice List Process

1. Tenant opens the "Invoice" screen.
2. The system retrieves the authenticated user's information. If the user information cannot be found, the system displays an error screen with a warning icon and a "Retry" button. Tenant taps "Retry" to restart the process.
3. The system loads the invoice list. While loading, the system displays a loading indicator with text "Đang tải dữ liệu...".
4. The system receives and displays the invoice list along with summary statistics (Total, Periodic, Incurred). If no invoices are found, the system displays an empty state with message "Không có hóa đơn".
5. Tenant views the invoice list. Each invoice item displays: status icon, title, invoice code, status badge (Unpaid / Paid / Overdue / Cancelled), sent date, due date, type (Periodic / Incurred), room name, and total amount.
6. Tenant pulls down on the list to refresh the data.
7. Tenant can perform additional actions: search for a specific invoice, apply filters, tap an invoice to view its details, or navigate to the Prepaid screen.

**Alternative Flows:**
N/A

**Exceptions:**

E1 User Information Not Found
1. The system cannot retrieve the authenticated user's information.
2. The system displays an error screen with a warning icon, the message "Không tìm thấy thông tin người dùng", and a "Retry" button.
3. Tenant taps "Retry" to restart the process from step 2.

E2 System Unavailable
1. The system cannot connect to the server or encounters an error while loading the invoice list.
2. The system displays an error screen with a warning icon, an appropriate error message, and a "Retry" button.
3. Tenant taps "Retry" to reload the invoice list from step 3.

E3 No Invoices Found
1. The system successfully connects to the server but finds no invoice records for the user.
2. The system displays an empty state with icon, title "Không có hóa đơn", and subtitle "Không tìm thấy hóa đơn phù hợp với bộ lọc".
3. Tenant may adjust filters or clear them to restore the full list.

E4 Filter Returns No Results
1. After applying one or more filters, the filtered invoice list is empty.
2. The system displays the empty state: icon, title "Không có hóa đơn", and a subtitle guiding Tenant to adjust the filters.
3. Tenant clears the filters to restore the full invoice list.

E5 Return to Screen (Auto-Refresh)
1. Tenant returns to the Invoice screen from another screen (e.g., after completing a payment).
2. The system automatically refreshes the invoice list with the latest data.
3. If a refresh flag was passed during navigation, the system prioritizes an immediate refresh upon arrival.

**Priority:**
High

**Frequency of Use:**
Frequent (multiple times/week)

**Business Rules:**
BR-01: The system classifies invoices into three types: Periodic, Incurred, and Other. Tenant only sees two main invoice types — Periodic and Incurred — in the invoice list screen.
BR-02: The system displays four invoice statuses, each with a distinct visual style:
   - Unpaid: red background, label "Chưa thanh toán"
   - Paid: green background, label "Đã thanh toán"
   - Overdue: orange background, label "Quá hạn"
   - Cancelled: gray background, label "Đã hủy"
BR-03: The system paginates the invoice list with a maximum of 5 invoices per page. The pagination bar is displayed only when the total number of invoices exceeds 5.
BR-04: The system supports real-time case-insensitive search across invoice title and invoice code. Results update as Tenant types each character.
BR-05: The system filters invoices by date using YYYY-MM-DD comparison. The sent date filter applies to the invoice creation date. The due date filter applies to the invoice due date.
BR-06: For Periodic invoices, the system retrieves the room name from the roomId or contractId roomId field. For Incurred invoices, the system retrieves the room name from the roomName field. If room information is unavailable, a dash "—" is displayed.
BR-07: Invoices with a code starting with "HD-PREPAID" are prepaid invoices. In the list view, the prepaid invoice displays "Ngày thanh toán" (Payment Date) instead of "Ngày gửi" (Sent Date), and the due date field is not shown.
BR-08: The system calculates and displays three statistics: Total invoices (all), Periodic invoices, and Incurred invoices. These values are recalculated whenever the invoice data changes.
BR-09: The system formats all monetary amounts using the Vietnamese currency format (VND), for example: "1.000.000 ₫".
BR-10: The system formats all dates using the Vietnamese date format, for example: "21/04/2026".
BR-11: When the screen regains focus, the system automatically refreshes the invoice list. If a refresh flag is passed during navigation, the system prioritizes an immediate refresh without waiting for the focus event.
BR-12: The system counts the number of active filters currently applied (Type is not All, Status is not All, Sent Date is set, Due Date is set). If the count is greater than 0, a numeric badge is displayed on the filter button and a "Xóa bộ lọc" (Clear Filters) button is shown.

**Other Information:**
The interface supports proper display on phone models with a notch design or Dynamic Island.

**Assumptions:**
The server is online and returns accurate invoice data for the authenticated user.
