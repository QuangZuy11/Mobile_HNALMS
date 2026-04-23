# RENEW CONTRACT

**Description:**
Allows Tenant to view the renewal preview for an active contract and choose to either renew or decline the renewal. The screen displays contract details, renewal window status (days remaining, whether renewal or decline is available), and updated room pricing. Tenant can select the number of months to extend, preview the new end date, and confirm the renewal via a confirmation modal. Tenant can also decline the renewal via an alert confirmation. A status badge displays if the contract has already been renewed or declined.

**Trigger:**
Tenant taps "Gia hạn hợp đồng" on the View My Contracts screen (MyContractScreen).

**Preconditions:**
PRE-1: Tenant has successfully logged in.
PRE-2: The contract is in "Active" status and within the renewal window (7–30 days before expiration).
PRE-3: The mobile device has an active Internet connection.

**Postconditions:**
POST-1: If the renewal is confirmed, the contract's end date is extended and the renewal status updates to "renewed".
POST-2: If the renewal is declined, the renewal status updates to "declined" and the renewal action buttons are hidden.
POST-3: After a successful renewal or decline, the screen refreshes the renewal preview and navigates back to the previous screen.

**Normal Flow:**
User Renew Contract Process

1. Tenant taps "Gia hạn hợp đồng" on the View My Contracts screen.
2. The system navigates to the Renew Contract screen.
3. The system retrieves the renewal preview for the contract, including contract information, renewal window details, and price information.
4. While retrieving, a centered loading spinner displays with text "Đang tải thông tin gia hạn...".
5. On retrieval failure, the system displays an error state with an alert icon, the error message, and a "Thử lại" button. Tapping "Thử lại" re-fetches the renewal preview.
6. On successful retrieval, the screen displays three information cards and action buttons:
   - **Contract Info Card**: contract code, room name with room code, floor name, room type, start date, current end date.
   - **Renewal Window Card**: days remaining in the renewal window, whether renewal is possible ("Có" or "Không"), whether decline is possible ("Có" or "Không"), and a blocking reason warning if renewal is not possible.
   - **Price Info Card**: current room price, new room price, and a price change warning if the price has changed.
   - **Month Selector** (visible only if renewal is available): a stepper with minus/plus buttons and a text input for selecting 1–24 months, along with a new end date preview.
   - **Action Buttons** at the bottom: "Gia hạn hợp đồng" (blue, visible if can renew) and "Từ chối gia hạn" (red outline, visible if decline is available).
7. If the contract has already been renewed or declined, a status badge is displayed above the action buttons:
   - Green badge with check icon: "Đã gia hạn hợp đồng".
   - Red badge with close icon: "Đã từ chối gia hạn".
8. Tenant adjusts the number of extension months using the minus/plus buttons or by directly typing in the text input. The new end date preview updates in real-time. The value is clamped between 1 and 24.
9. Tenant taps "Gia hạn hợp đồng".
10. The system opens the confirmation modal containing:
    - A circular blue refresh icon.
    - Title: "Xác nhận gia hạn".
    - Body: "Bạn muốn gia hạn hợp đồng [X] tháng?\n\nNgày kết thúc mới: [date]".
    - A warning box (if price has changed): amber background with message "Giá phòng mới: [amount]".
    - Cancel and Confirm buttons.
11. Tenant taps "Hủy" to cancel the confirmation. The modal closes and no action is taken.
12. Tenant taps "Xác nhận" to confirm.
13. A submitting overlay appears covering the entire screen with a spinner and text "Đang xử lý...". The modal closes.
14. The system records the renewal with the selected extension months. On success, the system re-fetches the renewal preview to update the display.
15. The system displays a success alert: "Gia hạn thành công đến ngày [newEndDate]."
16. Tenant taps "OK". The system navigates back to the View My Contracts screen.

**Alternative Flows:**

AF-1 Tenant declines the renewal offer
1. The contract is in the renewal window and decline is available.
2. The "Từ chối gia hạn" button is visible.
3. Tenant taps "Từ chối gia hạn". An alert appears with title "Từ chối gia hạn" and message: "Bạn chắc chắn từ chối gia hạn?\n\nBạn vẫn ở đến hết ngày [endDate]. Phòng sẽ mở cho khách đặt cọc sớm."
4. Tenant taps "Hủy" to cancel, or "Xác nhận từ chối" (destructive) to confirm.
5. On confirmation, a submitting overlay appears.
6. The system records the decline. On success, the renewal preview is refreshed.
7. The red badge "Đã từ chối gia hạn" appears, and both action buttons are hidden.

AF-2 Tenant adjusts extension months via keyboard input
1. Tenant taps on the month text input.
2. Tenant types a number (e.g., "6").
3. The system parses the input and clamps it to the valid range (1–24). If empty or invalid, the input is ignored.
4. The new end date preview updates accordingly.

AF-3 Tenant cancels renewal confirmation
1. Tenant taps "Gia hạn hợp đồng".
2. The confirmation modal opens.
3. Tenant taps "Hủy".
4. The modal closes. The renewal is not submitted. Tenant remains on the Renew Contract screen and can continue adjusting.

AF-4 Renewal fails due to server error
1. Tenant confirms the renewal in the modal.
2. The submitting overlay appears.
3. The system cannot record the renewal due to a server error.
4. The overlay closes.
5. The system displays an error alert: "Gia hạn thất bại. Vui lòng thử lại."

AF-5 Decline fails due to server error
1. Tenant confirms the decline.
2. The submitting overlay appears.
3. The system cannot record the decline due to a server error.
4. The overlay closes.
5. The system displays an error alert: "Từ chối gia hạn thất bại. Vui lòng thử lại."

AF-6 Renewal window has expired
1. The renewal preview shows that renewalWindowDaysRemaining is 0 or less.
2. The system displays a warning box: "Cửa sổ gia hạn đã hết hạn. Không thể thực hiện thao tác."
3. Both "Gia hạn hợp đồng" and "Từ chối gia hạn" buttons are hidden.

AF-7 Renewal is blocked by a system reason
1. The renewal preview shows canRenew is false and a blockingReason is provided.
2. The system displays a warning box with the blocking reason text (amber background).
3. Both action buttons are hidden.

AF-8 Tenant taps back during submission
1. Tenant triggers a renewal or decline action and the submitting overlay appears.
2. Tenant taps the back button on the header or device.
3. The submission continues in the background. The overlay remains visible until the operation completes or fails.

AF-9 Tenant views the screen after already renewing
1. The renewal preview shows renewalStatus is "renewed".
2. The green badge "Đã gia hạn hợp đồng" is displayed.
3. Both action buttons are hidden.

AF-10 Tenant views the screen after already declining
1. The renewal preview shows renewalStatus is "declined".
2. The red badge "Đã từ chối gia hạn" is displayed.
3. Both action buttons are hidden.

AF-11 Room price has not changed
1. The renewal preview shows currentRoomPrice equals newRoomPrice.
2. No price change warning is displayed in either the Price Info Card or the confirmation modal.
3. The renewal can proceed without a price disclaimer.

**Exceptions:**

E1 - Missing Contract Information
The system cannot determine the contractId or the renewal preview data is missing.
The system displays an error: "Không có thông tin hợp đồng." or "Không có dữ liệu."

E2 - Cannot Load Renewal Preview
The system cannot retrieve the renewal preview due to a network error or server error.
The system displays an error: "Không thể tải thông tin gia hạn." with a "Thử lại" button.

E3 - Renewal Confirmation Fails
The system cannot record the renewal.
The system displays an alert: "Gia hạn thất bại. Vui lòng thử lại."

E4 - Decline Confirmation Fails
The system cannot record the renewal decline.
The system displays an alert: "Từ chối gia hạn thất bại. Vui lòng thử lại."

E5 - Extension Months Out of Range
Tenant enters an extension month value less than 1 or greater than 24 via keyboard input.
The system clamps the value to the valid range (1–24) automatically.

**Priority:**
High

**Frequency of Use:**
Occasional (once per contract, near the end of the renewal window)

**Business Rules:**
BR-01: The renewal window is only open when there are 7–30 days remaining before the contract end date.
BR-02: Extension months must be between 1 and 24 inclusive. The default value is the server-provided extensionMonths or 3 (whichever is smaller, capped at 12).
BR-03: The new end date is calculated by adding the selected extension months to the current end date.
BR-04: If the room price has changed (currentRoomPrice ≠ newRoomPrice), a price change warning must be displayed both on the screen and in the confirmation modal.
BR-05: The "Gia hạn hợp đồng" button is only visible when canRenew is true.
BR-06: The "Từ chối gia hạn" button is only visible when declineRenewalAvailable is true.
BR-07: Once the renewal status is "renewed" or "declined", both action buttons are permanently hidden for that session.
BR-08: If the renewal window has expired (renewalWindowDaysRemaining ≤ 0) or a blocking reason exists, both action buttons are hidden and a warning message is displayed.
BR-09: The confirmation modal and the submitting overlay are mutually exclusive — only one can be displayed at a time.
BR-10: After a successful renewal, the success alert includes the new end date and navigating back to the previous screen.
BR-11: After a successful decline, the screen immediately updates the renewal preview to show the declined badge without a success alert.
BR-12: The blocking reason warning (amber) takes precedence over the expired window warning.

**Other Information:**
The screen uses a card-based layout with three information sections arranged vertically in a ScrollView. Action buttons are pinned to the bottom of the screen with a top border. The month selector uses a circular stepper design with a large numeric input in the center. The confirmation modal uses a centered card design with an icon, title, body text, optional warning, and two side-by-side buttons. The submitting overlay covers the entire screen with a translucent dark background to prevent interaction. The status badges use bold text with icon + color coding (green for renewed, red for declined). The interface supports proper display on phone models with a notch design or Dynamic Island.

**Assumptions:**
The contract is within the renewal window and the auth token is valid. The renewal preview endpoint returns accurate data including the correct canRenew and declineRenewalAvailable flags.
