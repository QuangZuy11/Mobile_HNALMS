# VIEW MY CONTRACTS

**Description:**
Allows Tenant to view a list of all rental contracts associated with their account. Each contract is displayed as an expandable card showing summary information at the top (contract code, room, status, date range, duration) and full details when expanded. Expanded details include contract information, room information, co-residents, deposit information, and contract images. The expanded view also provides contextual action buttons based on contract status and timing: "Gia hạn hợp đồng" (Renew Contract), "Từ chối gia hạn" (Decline Renewal), "Trả phòng thanh lý" (Move-Out), and "Liên hệ quản lý" (Call Manager). Pull-to-refresh is supported to reload the contract list.

**Trigger:**
Tenant taps "Hợp đồng của tôi" from the profile or home navigation menu.

**Preconditions:**
PRE-1: Tenant has successfully logged in.
PRE-2: The mobile device has an active Internet connection.

**Postconditions:**
POST-1: The list of contracts is displayed with accurate and up-to-date information.
POST-2: Any expanded contract card shows its full details.
POST-3: If Tenant declines a renewal, the contract's renewal badge updates to reflect the declined state.

**Normal Flow:**
User View My Contracts Process

1. Tenant navigates to the "Hợp đồng của tôi" screen.
2. The system retrieves the list of all contracts associated with Tenant's account.
3. While retrieving, a centered loading spinner displays with text "Đang tải dữ liệu...".
4. On retrieval failure, the system displays an error state with an alert icon, the error message, and a "Thử lại" button. Tapping "Thử lại" re-fetches the contract list.
5. If no contracts exist for Tenant, the system displays an empty state with a document icon and the message "Bạn chưa có hợp đồng nào".
6. On success, the system displays a list of contract cards with a header showing the total count (e.g., "3 hợp đồng").
7. Each contract card shows a collapsed (summary) view containing:
   - A colored status dot and badge (Đang hiệu lực / Đã hết hạn / Đã thanh lý / Chưa hiệu lực / Chờ xử lý).
   - Contract code and room name with floor.
   - Date range (start date – end date) and contract duration in months.
   - A chevron icon indicating expandability.
8. Tenant taps on a contract card to expand it.
9. The system expands the card and simultaneously retrieves:
   - Renewal preview for the contract (available days left in renewal window, renewal status).
   - Move-out request status for the contract (whether a move-out request already exists).
10. The expanded card reveals the following sections:
    - **Contract Info**: contract code, start date, end date, duration, rent paid until date.
    - **Room Info** (if available): room name, room code, floor, room type, monthly price, maximum occupancy.
    - **Co-residents** (if any): list of co-residents with full name, CCCD, phone number, and date of birth.
    - **Deposit Info** (if available): depositor name, deposit amount, deposit status badge (Đang giữ / Đã hoàn trả / Đã tịch thu), deposit date, phone, email.
    - **Contract Images** (if any): horizontal scrollable thumbnails of contract images with an overlay "Xem" label.
    - **Renewal/Move-out badges**: contextual badges appear above the action buttons based on timing and status:
      - Purple badge "Đã gửi yêu cầu trả phòng" if a move-out request already exists.
      - Red badge "Đã hết hạn" if the contract has expired.
      - Red badge "Đã từ chối gia hạn" if Tenant has declined renewal.
      - Green badge "Đã gia hạn" if the contract has been renewed.
      - Amber badge "Còn X ngày" (≤7 days remaining) or blue badge "Còn X ngày gia hạn" (8–30 days remaining) during the renewal window.
    - **Action Buttons**: contextual action buttons based on contract status and timing.
11. Tenant can tap on a contract image thumbnail to open a fullscreen image viewer. The viewer has a close button and a loading spinner.
12. Tenant can collapse the expanded card by tapping it again. The chevron rotates back down.

**Alternative Flows:**

AF-1 Tenant declines a renewal offer
1. The contract is in "Active" status with 7–30 days remaining until end date, renewal has not been declined or renewed yet, and no move-out request exists.
2. The "Từ chối gia hạn" button is visible.
3. Tenant taps "Từ chối gia hạn". A confirmation alert appears with message: "Bạn chắc chắn từ chối gia hạn?\n\nBạn vẫn ở đến hết ngày [endDate]. Phòng sẽ mở cho khách đặt cọc sớm."
4. Tenant taps "Hủy" to cancel, or "Từ chối" (destructive) to confirm.
5. On confirmation, the system records the decline. On success, an alert displays "Bạn đã từ chối gia hạn. Phòng mở cho khách đặt cọc sớm."
6. The contract list refreshes and the renewal badge updates to "Đã từ chối gia hạn".
7. The "Gia hạn hợp đồng" and "Từ chối gia hạn" buttons are hidden.

AF-2 Tenant opens the renewal screen
1. The contract is in "Active" status with 7–30 days remaining until end date, renewal has not been declined or renewed yet, and no move-out request exists.
2. The "Gia hạn hợp đồng" button is visible.
3. Tenant taps "Gia hạn hợp đồng".
4. The system navigates to the Renew Contract screen.

AF-3 Tenant opens the move-out request modal
1. The contract is in "Active" status.
2. The "Trả phòng thanh lý" button is visible.
3. Tenant taps "Trả phòng thanh lý".
4. The system opens the Create Move-Out Request modal for this contract.
5. After the modal closes, the system refreshes the contract list and the move-out request status for the contract.
6. If a move-out request was created, the purple badge "Đã gửi yêu cầu trả phòng" appears on the card and the renewal buttons are hidden.

AF-4 Tenant contacts the manager
1. Tenant taps "Liên hệ quản lý".
2. The system initiates a phone call to the manager using the device's native dialer.

AF-5 Tenant views a contract image in fullscreen
1. Tenant taps on a contract image thumbnail.
2. The system opens a fullscreen image viewer with a dark overlay background.
3. A close button (X) appears in the top-right corner. A loading spinner displays while the image loads.
4. Tenant taps the close button or the dark background to return to the contract list.

AF-6 Tenant pulls to refresh the list
1. Tenant pulls down on the contract list.
2. A spinner appears at the top of the list.
3. The system re-fetches the contract list.
4. On success, the list updates with the latest data. On failure, the existing list remains and an error may appear.

AF-7 Contract has an existing move-out request
1. A move-out request already exists for this contract.
2. The system displays the purple badge "Đã gửi yêu cầu trả phòng" at the top of the expanded card.
3. Both "Gia hạn hợp đồng" and "Từ chối gia hạn" buttons are hidden even if within the renewal window.

AF-8 Contract renewal preview cannot be loaded
1. The system attempts to retrieve the renewal preview for an expanded contract.
2. The retrieval fails silently (e.g., endpoint not available).
3. The system uses local data from the contract object to determine renewal window and status.

**Exceptions:**

E1 - Login Session Expired
The session token is invalid or expired during data retrieval.
The system displays an error: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."

E2 - Cannot Load Contract List
The system cannot retrieve the contract list due to a network error or server error.
The system displays an error: "Không thể tải danh sách hợp đồng." or "Đã xảy ra lỗi khi tải dữ liệu." with a "Thử lại" button.

E3 - No Contracts Found
Tenant has no contracts associated with their account.
The system displays an empty state with a document icon and message "Bạn chưa có hợp đồng nào."

E4 - Decline Renewal Fails
The system cannot record the renewal decline.
The system displays an alert: "Từ chối gia hạn thất bại. Vui lòng thử lại."

E5 - Cannot Load Renewal Preview
The system cannot retrieve the renewal preview for an expanded contract.
The system falls back to local contract data to determine renewal window and status. No error is shown to Tenant.

E6 - Cannot Load Move-Out Request Status
The system cannot retrieve the move-out request status for an expanded contract.
The system silently sets the move-out request status to null and does not show the "Đã gửi yêu cầu trả phòng" badge.

E7 - Cannot Load Fullscreen Image
The contract image cannot be loaded in the fullscreen viewer.
The system displays an alert: "Không thể tải ảnh." and closes the viewer.

**Priority:**
High

**Frequency of Use:**
Regular (Tenant checks contract details, renewal window, or deposit status)

**Business Rules:**
BR-01: The contract list shows all contracts associated with the logged-in Tenant, regardless of status.
BR-02: Each contract card is expandable/collapsible. Only one card can be expanded at a time — tapping a second card collapses the first.
BR-03: The status badge colors are consistent: green for Active, red for Expired/Terminated, amber for Inactive/Pending, gray for Unknown.
BR-04: The deposit status badge uses blue for "Held", green for "Refunded", and red for "Forfeited".
BR-05: Renewal actions ("Gia hạn" and "Từ chối gia hạn") are only shown when the contract is Active, within the 7–30 day renewal window, and no move-out request exists.
BR-06: Once a renewal is declined, both renewal buttons are permanently hidden for that contract (until the contract expires or is renewed).
BR-07: The "Trả phòng thanh lý" button is shown for all Active contracts regardless of renewal window status.
BR-08: The "Đã gửi yêu cầu trả phòng" badge and the renewal action buttons are mutually exclusive — if a move-out request exists, the renewal buttons are hidden.
BR-09: Pull-to-refresh re-fetches the entire contract list and resets any expanded card back to collapsed state.
BR-10: The fullscreen image viewer uses a dark overlay and supports pinch-to-zoom and pan gestures through the native image component.
BR-11: Contract images are displayed as thumbnails in a horizontal ScrollView within the expanded card.
BR-12: Co-residents are only displayed if the contract has co-residents data.

**Other Information:**
The screen uses a FlatList with card-based layout. Each card has a header section (always visible) and an expandable body section (hidden until tapped). Status badges use pill-shaped backgrounds with bold text. Action buttons use color-coded styling: blue for primary actions, red for destructive/danger actions, light blue for secondary actions. The "Gia hạn" and "Từ chối gia hạn" buttons share the same section and are stacked. The fullscreen image viewer is a Modal with a fade animation and translucent status bar. The renewal badge uses an array pattern to support showing multiple badges simultaneously. The interface supports proper display on phone models with a notch design or Dynamic Island.

**Assumptions:**
The server is online and returns accurate contract data. The auth token is valid. The contract includes all related data (room, floor, room type, deposit, co-residents, images) as populated fields.
