# VIEW REQUEST LIST

**Description:**
Allows Tenant to view, filter, and manage their service requests (complaint, maintenance/repair, and room transfer). Tenant can also open a request detail modal to view full information, manager responses, attached images, and perform edit or delete actions on pending requests.

**Trigger:**
Tenant opens the "Yêu cầu của tôi" screen from the app navigation.

**Preconditions:**
PRE-1: Tenant has successfully logged in.
PRE-2: The mobile device has an active Internet connection.

**Postconditions:**
POST-1: The system displays Tenant's request list with current statuses.
POST-2: Tenant can view request details, navigate to create a new request, or edit/delete a pending request.

**Normal Flow:**
User View Request List Process

1. Tenant opens the Request List screen.
2. The system validates the authentication session. If the session has expired, the system displays an alert and Tenant is prompted to re-login.
3. The system loads the request list. While loading, a spinner with "Đang tải..." is shown.
4. The system displays the screen with:
   a. A horizontal filter bar with tabs: Tất cả, Khiếu nại, Sửa chữa/Bảo trì, Chuyển phòng.
   b. A "Tạo yêu cầu mới" section with three quick-action cards for Maintenance, Complaint, and Room Transfer requests.
   c. The full request list sorted by creation date (newest first).
5. Each request item displays: type badge (color-coded), title, creation date, and status badge.
6. Tenant can tap a filter tab to narrow the list by request type. The filter is applied immediately and the list is refreshed.
7. Tenant can tap the pull-to-refresh gesture to reload the latest data.
8. Tenant taps a request item to open the detail modal.
9. The system displays the request detail modal with:
   a. A status banner with icon and label.
   b. Request information fields (type, category/device/target room, dates).
   c. Description or reason text.
   d. Manager's response (if any), shown in a blue-left-bordered box.
   e. Rejection reason (if status is Rejected or Cancelled), shown in a red-left-bordered box.
   f. Attached images (for maintenance requests), shown as a horizontal scrollable thumbnail strip. Tapping an image opens a full-screen preview.
   g. For pending requests: "Chỉnh sửa yêu cầu" and "Xóa yêu cầu" action buttons.
10. Tenant taps the close button to dismiss the detail modal and return to the list.

**Alternative Flows:**

AF-1 Create a new request
1. Tenant taps one of the three request type cards (Sửa chữa, Khiếu nại, Chuyển phòng).
2. The system navigates to the corresponding request creation screen.

AF-2 Edit a pending request
1. In the detail modal for a pending request, Tenant taps "Chỉnh sửa yêu cầu".
2. The system closes the modal and navigates to the edit screen with pre-filled data.

AF-3 Delete a pending request
1. In the detail modal for a pending request, Tenant taps "Xóa yêu cầu".
2. The system displays a confirmation dialog: "Bạn có chắc muốn xóa yêu cầu này không? Hành động này không thể hoàn tác."
3. If Tenant confirms, the system removes the request from the list and closes the modal.

AF-4 View full-screen image
1. In the detail modal, Tenant taps an attached image thumbnail.
2. The system opens a full-screen image viewer on a dark overlay (#rgba(0,0,0,0.92)).
3. Tenant taps the close button to return to the detail modal.

**Exceptions:**

E1 Authentication Expired
1. The system cannot retrieve the user's authentication token.
2. The system displays an alert: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
3. Tenant is redirected to the login screen.

E2 System Unavailable
1. The system cannot connect to the server while loading the request list.
2. The system displays an alert with the appropriate error message and the request list remains empty.

E3 No Requests Found
1. The system successfully connects but finds no request records for the user.
2. The system displays an empty state with icon, message "Bạn chưa có yêu cầu nào", and a subtitle guiding Tenant to create one.
3. If a filter is active, the subtitle reflects the filtered category.

E4 Filter Returns No Results
1. Tenant applies a filter (e.g., "Khiếu nại") that yields zero results.
2. The system displays the empty state with a message indicating no requests of that type exist.

**Priority:**
High

**Frequency of Use:**
Frequent (multiple times/month)

**Business Rules:**
BR-01: Requests are classified into three types: Complaint, Maintenance/Repair, and Room Transfer. Each type has a distinct icon and color scheme for easy recognition.
BR-02: The system maps raw status values from the server to Vietnamese labels and assigns a color style:
   - Pending: yellow (#FEF3C7) — "Chờ xử lý"
   - Processing: blue (#DBEAFE) — "Đang xử lý"
   - Done / Paid / Approved / Completed: green (#D1FAE5) — "Đã xử lý" / "Đã thanh toán" / "Đã duyệt"
   - Unpaid: yellow (#FEF9C3) — "Chờ thanh toán"
   - Rejected / Cancelled: red (#FEE2E2) — "Từ chối" / "Đã hủy"
BR-03: Request items are sorted by creation date in descending order (newest first).
BR-04: When "Tất cả" filter is active, the system merges general requests and transfer requests into a single list, removing duplicates by request ID.
BR-05: The detail modal is presented using iOS page sheet style (`presentationStyle="pageSheet"`).
BR-06: Only requests with status "Pending" are eligible for edit and delete actions. Edit and delete buttons are hidden for all other statuses.
BR-07: Images in the detail modal are displayed as thumbnails (110×110px) in a horizontally scrollable strip. Tapping opens a full-screen view with a dark overlay.
BR-08: The screen automatically refreshes when it regains focus (e.g., after returning from a request creation or edit screen).
BR-09: The filter bar uses a red accent color (#EF4444) for the active tab to distinguish it from the inactive tabs.

**Other Information:**
- The screen uses a red accent theme (#EF4444) for filters and empty states, contrasting with the blue (#3B82F6) used for edit buttons.
- The detail modal displays manager responses in a blue-left-bordered box (#EFF6FF background, #3B82F6 border), rejection reasons in a red-left-bordered box (#FEF2F2 background, #EF4444 border), and general notes in a yellow-left-bordered box (#FEF3C7 background, #F59E0B border).
- Full-screen image preview uses a near-black overlay (rgba(0,0,0,0.92)) with a white close button positioned at the top-right.
- The interface supports proper display on phone models with a notch design or Dynamic Island.

**Assumptions:**
The server is online and returns accurate request data for the authenticated user. Maintenance and transfer request details are retrieved from the list response (no separate detail call required).
