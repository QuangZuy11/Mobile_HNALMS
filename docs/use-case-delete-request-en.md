# DELETE REQUEST

**Description:**
Allows Tenant to permanently delete a pending service request (complaint, repair, or transfer) from the system. Deletion requires explicit confirmation via an alert dialog. On successful deletion, the system closes the detail view, displays a success message, and refreshes the request list.

**Trigger:**
Tenant taps "Xóa yêu cầu" (or "Xóa khiếu nại") on the Request Detail bottom sheet while the request is in "Pending" status.

**Preconditions:**
PRE-1: Tenant has successfully logged in.
PRE-2: The target request exists and its status is "Pending" (Chờ xử lý).
PRE-3: The mobile device has an active Internet connection.

**Postconditions:**
POST-1: If deletion is successful, the request is permanently removed from Tenant's request list.
POST-2: The Request Detail bottom sheet closes automatically.
POST-3: The system refreshes the request list to reflect the deletion.

**Normal Flow:**
User Delete Request Process

1. Tenant opens the Request Detail bottom sheet for a pending request.
2. The system displays the request details along with "Chỉnh sửa yêu cầu" and "Xóa yêu cầu" action buttons at the bottom.
3. Tenant taps "Xóa yêu cầu" (or "Xóa khiếu nại").
4. The system displays a confirmation alert dialog with:
   - Title: "Xác nhận xóa"
   - Message varies by request type:
     - Repair/Transfer: "Bạn có chắc muốn xóa yêu cầu [này/chuyển phòng này] không?"
     - Complaint: "Bạn có chắc muốn xóa khiếu nại này không? Hành động này không thể hoàn tác."
   - "Hủy" button (cancel, default style)
   - "Xóa" button (destructive, red style)
5. Tenant taps "Hủy" to cancel the deletion. The alert closes and no action is taken.
6. Tenant taps "Xóa" to confirm.
7. The system calls the appropriate delete API based on request type. While deleting, the delete button shows a spinner and the label changes to "Đang xóa...". The button is disabled.
8. On success, the system automatically closes the Request Detail bottom sheet.
9. The system displays a success alert with message varies by type:
   - Repair/Transfer: "Đã xóa yêu cầu thành công"
   - Complaint: "Đã xóa khiếu nại thành công"
10. The system refreshes the request list to remove the deleted item.

**Alternative Flows:**

AF-1 Tenant changes mind during confirmation
1. Tenant taps "Xóa yêu cầu" but then decides not to proceed.
2. The confirmation alert appears. Tenant taps "Hủy".
3. The alert closes. The request remains intact and Tenant can continue browsing.

AF-2 Tenant deletes one request and immediately views another
1. Tenant deletes a repair request successfully.
2. The detail closes and the success alert appears.
3. Tenant taps "OK" to dismiss the success alert.
4. Tenant taps on a different pending request to view its details.
5. The system opens the detail for the newly selected request.

AF-3 Tenant deletes a transfer request
1. Tenant taps "Xóa yêu cầu" on a pending transfer request.
2. The confirmation alert appears with message: "Bạn có chắc muốn xóa yêu cầu chuyển phòng này không?"
3. Tenant confirms and the system calls deleteTransferRequestAPI.

AF-4 Tenant deletes a complaint request
1. Tenant taps "Xóa khiếu nại" on a pending complaint request.
2. The confirmation alert appears with message: "Bạn có chắc muốn xóa khiếu nại này không? Hành động này không thể hoàn tác."
3. Tenant confirms and the system calls deleteComplaintRequestAPI.

**Exceptions:**

E1 - Request Not in Pending Status
The request status is not "Pending" and the delete button is not visible.
The system does not display a delete option. No exception handling is required as the action is hidden.

E2 - Delete Repair Request Fails
The API call to deleteRepairRequestAPI fails due to network error or server error.
The system displays an alert: "Không thể xóa yêu cầu" with the specific error message. The button is re-enabled and Tenant may attempt to delete again.

E3 - Delete Transfer Request Fails
The API call to deleteTransferRequestAPI fails due to network error or server error.
The system displays an alert: "Không thể xóa yêu cầu" with the specific error message. The button is re-enabled and Tenant may attempt to delete again.

E4 - Delete Complaint Request Fails
The API call to deleteComplaintRequestAPI fails due to network error or server error.
The system displays an alert: "Không thể xóa khiếu nại" with the specific error message. The button is re-enabled and Tenant may attempt to delete again.

**Priority:**
High

**Frequency of Use:**
Occasional (as needed when Tenant wishes to discard a pending request)

**Business Rules:**
BR-01: Only requests with status "Pending" are eligible for deletion. The delete button is only rendered for pending requests.
BR-02: Deletion requires explicit user confirmation via a two-button alert ("Hủy" and "Xóa").
BR-03: The delete button is disabled and shows a spinner with "Đang xóa..." label while the deletion is in progress.
BR-04: On successful deletion, the Request Detail bottom sheet closes automatically before showing the success alert.
BR-05: After deletion, the system automatically refreshes the request list to reflect the change.
BR-06: The API call made depends on the request type: deleteRepairRequestAPI, deleteTransferRequestAPI, or deleteComplaintRequestAPI.
BR-07: The confirmation and success messages vary slightly by request type to maintain consistency with the request's domain language.
BR-08: The delete button uses a red/destructive style to clearly communicate the irreversible nature of the action.

**Other Information:**
The delete action is accessible only through the Request Detail bottom sheet, not from the request list view. The button uses a red destructive styling to indicate irreversible action. The confirmation dialog uses the native Alert.alert component with "destructive" style for the confirm button. The system prevents double-deletion by disabling the button while processing. The interface supports proper display on phone models with a notch design or Dynamic Island.

**Assumptions:**
The server is online and the delete API correctly removes the request from the database. The requestId passed to the delete API is valid and belongs to the currently authenticated Tenant.
