# CREATE MOVE-OUT REQUEST

**Description:**
Allows Tenant to submit a move-out (trả phòng thanh lý) request for an active rental contract. The screen displays contract information, an inline calendar for selecting the expected move-out date, a reason input, and a client-side deposit warning preview. If an existing request already exists for the contract, the screen switches to a read-only view showing the request status timeline, deposit refund information, and an invoice section. Tenant can also delete the move-out request if its status is still "Requested".

**Trigger:**
Tenant taps the "Trả phòng thanh lý" action button on the Contract Detail screen.

**Preconditions:**
PRE-1: Tenant has successfully logged in.
PRE-2: The contract exists and is in "Active" status.
PRE-3: The mobile device has an active Internet connection.

**Postconditions:**
POST-1: If a new request is created successfully, it appears in the contract's move-out history with status "Requested".
POST-2: The modal closes and the parent screen refreshes to reflect the new state.
POST-3: If a request is deleted, the modal closes and the parent screen refreshes.

**Normal Flow:**
User Create Move-Out Request Process

1. Tenant taps "Trả phòng thanh lý" on the Contract Detail screen.
2. The system opens the modal and simultaneously retrieves:
   - Contract details: contract code, end date, and whether the contract is a gap contract (short-term contract with deposit protection).
   - Existing move-out request: checks whether a move-out request has already been submitted for this contract.
3. While retrieving data, a centered loading spinner displays with text "Đang tải thông tin hợp đồng...".
4. On data retrieval failure, the system displays an error state with an alert icon, the error message, and a "Thử lại" button. Tapping "Thử lại" re-initiates the data retrieval.
5. On successful data retrieval, the system evaluates two conditions:
   - If a move-out request already exists for this contract → display the existing request view (proceed to step 12).
   - If no existing request and contract details are available → display the create form (proceed to step 6).
6. The create form displays:
   - Contract Info section: contract code, end date, and a green badge "Hợp đồng ngắn hạn – Được bảo vệ hoàn cọc" if it is a gap contract.
   - A rule hint box explaining the date constraint: move-out date must be between tomorrow and the contract end date.
   - Expected move-out date picker with an inline calendar. Tomorrow is pre-selected by default.
   - A deposit warning preview box (amber/yellow) appears dynamically if Tenant has stayed less than 6 months. Gap contracts never show this warning.
   - Reason text area (maximum 150 characters, minimum 10 required).
   - Submit and Cancel buttons.
7. Tenant taps the date picker. The inline calendar expands showing the current month.
8. Tenant navigates months using previous/next arrows. Navigation is restricted if the current month is already at the earliest or latest selectable month. Tenant taps a selectable date (tomorrow through contract end date). The calendar collapses and the selected date updates.
9. Tenant enters a reason for moving out in the text area. The character counter updates in real-time.
10. If Tenant has stayed less than 6 months, the deposit warning preview updates to reflect the risk of losing the deposit.
11. Tenant taps "Gửi yêu cầu".
12. The system validates:
    - Contract details must be loaded.
    - Contract status must be "Active".
    - No move-out request must already exist for this contract.
    - Reason must not be empty.
    - Reason must be at least 10 characters long.
    - Expected move-out date must be tomorrow or later.
    - Expected move-out date must be on or before the contract end date.
    If any validation fails, an alert displays the specific error message.
13. On successful validation, the system submits the move-out request.
14. If the server responds with a deposit risk warning, the system shows a confirmation alert:
    - Title: "✅ Thông tin hoàn cọc" (for gap contracts) or "⚠️ Cảnh báo hoàn cọc" (for non-gap contracts).
    - Message lists the deposit risk warnings and asks Tenant to confirm.
    - "Quay lại" cancels the submission; "Đồng ý tiếp tục" re-submits with acknowledgment of the deposit risk.
15. On successful creation (no warning needed or Tenant has confirmed), the system displays a success alert: "Yêu cầu trả phòng đã được gửi thành công."
16. Tenant taps "OK". The form is reset, the modal closes, and the parent screen refreshes to reflect the new request.

**Alternative Flows:**

AF-1 Tenant cancels during form entry
1. Tenant taps the "Hủy" button or the back chevron in the header.
2. The modal closes. No data is submitted.

AF-2 Tenant views an existing move-out request
1. A move-out request already exists for this contract (from step 5).
2. The system fetches deposit refund and invoice information for the existing request.
3. The existing request view renders with:
   - A 4-step horizontal timeline: Yêu cầu gửi → Hóa đơn phát hành → Thanh toán hoàn tất → Trả phòng hoàn tất. Completed steps are highlighted in the status color.
   - A large status badge showing the current step label and icon.
   - A green shield badge if isGapContract is true: "Hợp đồng ngắn hạn – Được bảo vệ hoàn cọc".
   - Basic info: request date, expected move-out date, reason.
   - Warning flags if applicable: early notice, under-minimum-stay, deposit forfeited, gap contract protection.
   - If status is "InvoiceReleased", "Paid", or "Completed": invoice info section with invoice code, total amount, and payment status.
   - If refund data is available: refund amount section showing the estimated or final refund to Tenant.
   - If status is "Completed": completion info with completed date and manager notes.
   - A green action hint with guidance for the next step based on current status.
   - A "Xoá yêu cầu trả phòng" button (red, destructive) if status is "Requested".
4. Tenant taps "Đóng" or the back chevron. The modal closes.

AF-3 Tenant deletes an existing move-out request
1. An existing request with status "Requested" is displayed.
2. Tenant taps "Xoá yêu cầu trả phòng". A confirmation alert appears with message: "Bạn có chắc muốn xoá yêu cầu trả phòng ở trạng thái 'Requested' không?".
3. Tenant taps "Huỷ" to cancel, or "Xoá" (destructive) to confirm.
4. On confirmation, the system removes the request. While removing, the delete button shows a spinner and is disabled.
5. On success, the system displays "Yêu cầu trả phòng đã được xoá.", resets the form, closes the modal, and refreshes the parent screen.
6. On failure, an error alert displays the specific message and the button is re-enabled.

AF-4 Tenant acknowledges the deposit warning and resubmits
1. The server returns a deposit risk warning during initial submission (step 14).
2. Tenant reviews the warning and taps "Đồng ý tiếp tục".
3. The system re-submits the request with acknowledgment of the deposit risk.
4. The process continues from step 15.

AF-5 Tenant cancels after seeing the deposit warning
1. The server returns a deposit risk warning during initial submission.
2. Tenant taps "Quay lại" in the confirmation alert.
3. No submission occurs. Tenant remains on the form and can modify the date or reason.

AF-6 Fetching deposit and invoice details fails
1. The system attempts to retrieve deposit refund and invoice information for the existing request.
2. The retrieval fails with a "not found" response (this endpoint may not be available at early move-out stages).
3. The system silently hides the deposit refund section without showing an error to Tenant.

AF-7 Contract end date is not available
1. The contract info does not include an endDate.
2. The rule hint box is not displayed.
3. The calendar allows selection of any date from tomorrow onwards (no upper bound).

AF-8 Tenant is on a gap contract
1. The contract is flagged as isGapContract=true.
2. The green "Hợp đồng ngắn hạn – Được bảo vệ hoàn cọc" badge appears in both the contract info and the existing request view.
3. The deposit warning preview is never shown.
4. The confirmation alert (if triggered) uses a green checkmark title and a default (non-destructive) button style.

**Exceptions:**

E1 - Missing Contract Info
The system cannot retrieve contract information from the API.
The system displays an error state with "Lỗi khi lấy thông tin hợp đồng" and a "Thử lại" button.

E2 - Contract Not Active
The contract status is not "Active".
The system displays an alert: "Hợp đồng không ở trạng thái hoạt động (hiện tại: [status])."

E3 - Existing Request Already Exists
A move-out request already exists for this contract.
The system renders the existing request view instead of the create form.

E4 - Missing Reason
Tenant taps "Gửi yêu cầu" without entering a reason.
The system displays an alert: "Vui lòng nhập lý do trả phòng."

E5 - Reason Too Short
Tenant enters a reason with fewer than 10 characters.
The system displays an alert: "Lý do phải có ít nhất 10 ký tự."

E6 - Move-Out Date Too Early
Tenant selects a move-out date that is today or earlier.
The system displays an alert: "Ngày trả phòng phải từ ngày mai trở đi."

E7 - Move-Out Date After Contract End
Tenant selects a move-out date that is after the contract end date.
The system displays an alert: "Ngày trả phòng ([date]) không được muộn hơn ngày kết thúc hợp đồng ([date])."

E8 - Submission Fails
The submission fails and the response does not include a deposit risk warning.
The system displays the error message in an inline error box below the form. The submit button is re-enabled.

E9 - Submission Fails with Confirmation
The submission fails but the response includes a deposit risk warning.
The system shows the deposit warning confirmation alert. Tenant can acknowledge the warning and retry, or cancel the submission.

E10 - Delete Fails
The system cannot remove the move-out request.
The system displays an alert with the error message. The delete button is re-enabled and Tenant may attempt to delete again.

**Priority:**
High

**Frequency of Use:**
Occasional (when Tenant decides to end their tenancy)

**Business Rules:**
BR-01: Only one move-out request can exist per contract. If an existing request is found, the create form is not shown.
BR-02: The contract must be in "Active" status to create a move-out request.
BR-03: The expected move-out date must be at least tomorrow (no same-day or past dates).
BR-04: The expected move-out date must be on or before the contract end date. If no end date is set, only the minimum date constraint applies.
BR-05: The reason must be between 10 and 150 characters.
BR-06: Tenants who have stayed less than 6 months are at risk of losing their deposit (isUnderMinStay). This is shown as an amber deposit warning.
BR-07: Gap contracts (isGapContract=true) are always protected — they never show a deposit warning and always receive a green confirmation if the warning dialog is triggered.
BR-08: The 30-day notice penalty (isEarlyNotice) has been removed from the business logic. Only the 6-month minimum stay rule applies.
BR-09: The deposit refund and invoice endpoint may return a "not found" response at early move-out stages; this should be handled silently.
BR-10: The existing request can only be deleted when its status is "Requested". Deletion shows a confirmation dialog and a destructive-style button.
BR-11: The move-out process follows a 4-step workflow: Requested → InvoiceReleased → Paid → Completed.
BR-12: The modal uses an overlay background with a slide-up animation. It includes a back chevron in the header for closing.

**Other Information:**
The modal renders in two modes: create form and existing request view, determined dynamically by the state. The inline calendar expands/collapses within the form rather than using a separate modal. The 4-step timeline uses a horizontal layout with dots and connecting lines. Completed steps show a checkmark icon in the status color. The deposit warning uses an amber/yellow theme; gap contract protection uses a green theme. The submit button uses a red background to signal the seriousness of the move-out action. The interface supports proper display on phone models with a notch design or Dynamic Island.

**Assumptions:**
The server is online and the contract and move-out APIs return accurate data. The contract has a valid contractId. The isGapContract flag is correctly set by the backend.
