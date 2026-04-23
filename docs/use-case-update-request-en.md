# UPDATE REQUEST

**Description:**
Allows Tenant to update an existing service request (complaint, repair, or transfer) that is still in "Pending" status. The screen pre-fills existing data from the navigation parameters and supports editing of all relevant fields. Upon successful update, the system navigates Tenant back to the Request List.

**Trigger:**
Tenant taps "Chỉnh sửa yêu cầu" in the Request Detail screen.

**Preconditions:**
PRE-1: Tenant has successfully logged in.
PRE-2: The target request exists and its status is "Pending" (Chờ xử lý).
PRE-3: The mobile device has an active Internet connection.

**Postconditions:**
POST-1: If the update is successful, the modified request reflects the new data in the Request List.
POST-2: Tenant is navigated back to the Request List screen after confirmation.

**Normal Flow:**
User Update Request Process

1. Tenant taps "Chỉnh sửa yêu cầu" on the Request Detail screen.
2. The system navigates to the appropriate Update screen based on request type:
   - UpdateRequestScreen (complaint)
   - UpdateRepairRequestScreen (repair/maintenance)
   - UpdateTransferRequestScreen (transfer)
3. The system checks if initial data was passed via navigation params.
   - If yes: the system validates the status and pre-fills all fields immediately without an API call.
   - If no: the system makes an API call to fetch the request details, validates the status, and pre-fills all fields.
4. If the request status is not "Pending", the system displays an alert: "Không thể chỉnh sửa. Chỉ có thể chỉnh sửa yêu cầu đang ở trạng thái 'Chờ xử lý'." with a "Quay lại" button. Tapping "Quay lại" navigates back to the Request Detail screen.
5. The system loads any additional data needed for the form (e.g., rooms, devices, available rooms) via parallel API calls.
6. While loading, the screen displays a centered spinner with the header visible.
7. On successful data load, the system renders the pre-filled form.
8. Tenant modifies one or more fields as needed.
9. Tenant taps "Cập nhật" (Update) to submit the changes.
10. The system validates all required fields. If any validation fails, an alert displays the specific error.
11. On successful validation, the system submits the update to the server. While submitting, the button shows a loading spinner and both "Hủy" and "Cập nhật" buttons are disabled.
12. On success, the system displays an alert: "Thành công" with the success message, followed by "OK" which navigates Tenant back to the Request List screen.

**Alternative Flows:**

AF-1 Tenant cancels the update
1. Tenant taps the "Hủy" button or the back button in the header.
2. The system navigates Tenant back to the Request Detail screen without saving any changes.

AF-2 Tenant changes request type (repair screen only)
1. Tenant taps a different request type button (Sửa chữa or Bảo trì).
2. The device placeholder label updates to reflect the new type.

AF-3 Tenant adds new images (repair screen only)
1. Tenant taps the image picker button.
2. An alert presents "Chụp ảnh" (camera) or "Chọn từ thư viện" (gallery).
3. Selected images are marked with a blue "Mới" (New) badge and queued for upload on submit.
4. Existing images can be removed by tapping the remove button.

AF-4 Tenant removes an existing image (repair screen only)
1. Tenant taps the remove (X) button on an existing Cloudinary image.
2. The image is immediately removed from the list. It will not be included in the final image array on submit.

AF-5 Partial image upload failure (repair screen only)
1. Some new images fail to upload during the upload step.
2. The system displays an alert: "Chỉ tải lên được X/Y ảnh. Bạn có muốn tiếp tục?"
3. Tenant taps "Tiếp tục" to proceed with the successfully uploaded images, or "Hủy" to cancel and retry.

AF-6 Image upload fails completely (repair screen only)
1. All new images fail to upload.
2. The system displays an alert with the error message: "Lỗi tải ảnh" and asks "Bạn có muốn tiếp tục không có ảnh mới?"
3. Tenant taps "Tiếp tục" to submit without new images (existing images are retained), or "Hủy" to cancel and retry.

AF-7 Tenant changes the target room (transfer screen only)
1. Tenant taps the room picker button.
2. The room selection modal opens. Tenant selects a different room and the modal closes.

AF-8 Tenant changes the transfer date (transfer screen only)
1. Tenant taps the date picker button.
2. The calendar modal opens. Tenant selects a different date. The modal closes.

AF-9 No rooms or devices available
1. The API returns an empty list for rooms or devices.
2. The corresponding selection area displays an empty state with an alert icon.
3. The submit button remains disabled until a valid selection is made.

AF-10 No available rooms (transfer screen only)
1. The available rooms API returns an empty list.
2. The room picker shows "Không có phòng trống" as the placeholder.
3. The submit button remains disabled.

AF-11 Loading fails — no initial data
1. The API call to fetch request details fails.
2. The system displays an alert with the appropriate error message and a "Quay lại" button.
3. Tapping "Quay lại" navigates back to the Request Detail screen.

AF-12 Loading rooms or devices fails
1. The API call to load rooms or devices fails.
2. The system displays an alert with the error message and offers "Thử lại" or "Hủy" options.

**Exceptions:**

E1 - Request Not in Pending Status
The request status is not "Pending".
The system displays an alert: "Không thể chỉnh sửa. Chỉ có thể chỉnh sửa yêu cầu đang ở trạng thái 'Chờ xử lý'."

E2 - Missing Category (complaint only)
Tenant taps "Cập nhật" without selecting a complaint category.
The system displays an alert: "Vui lòng chọn loại khiếu nại."

E3 - Empty Content (complaint only)
Tenant taps "Cập nhật" without entering a description.
The system displays an alert: "Vui lòng nhập nội dung khiếu nại."

E4 - Content Too Short (complaint only)
Tenant enters content with fewer than 10 characters.
The system displays an alert: "Nội dung khiếu nại phải có ít nhất 10 ký tự."

E5 - Content Too Long (complaint only)
Tenant enters content exceeding 2000 characters.
The text input blocks further input once the limit is reached. The character counter displays "2000/2000".

E6 - Missing Room (repair only)
Tenant taps "Cập nhật" without selecting a room.
The system displays an alert: "Vui lòng chọn phòng gửi yêu cầu."

E7 - Missing Device (repair only)
Tenant taps "Cập nhật" without selecting a device.
The system displays an alert: "Vui lòng chọn thiết bị cần [sửa chữa/bảo trì]."

E8 - Empty Description (repair only)
Tenant taps "Cập nhật" without entering a description.
The system displays an alert: "Vui lòng mô tả vấn đề."

E9 - Description Too Short (repair only)
Tenant enters a description with fewer than 10 characters.
The system displays an alert: "Mô tả phải có ít nhất 10 ký tự."

E10 - Missing Current Room (transfer only)
Tenant taps "Cập nhật" without selecting a current room.
The system displays an alert: "Vui lòng chọn phòng hiện tại của bạn."

E11 - Missing Target Room (transfer only)
Tenant taps "Cập nhật" without selecting a target room.
The system displays an alert: "Vui lòng chọn phòng muốn chuyển đến."

E12 - Missing Transfer Date (transfer only)
Tenant taps "Cập nhật" without selecting a transfer date.
The system displays an alert: "Vui lòng chọn ngày chuyển phòng."

E13 - Missing Reason (transfer only)
Tenant taps "Cập nhật" without entering a reason.
The system displays an alert: "Vui lòng nhập lý do chuyển phòng."

E14 - Reason Too Short (transfer only)
Tenant enters a reason with fewer than 10 characters.
The system displays an alert: "Lý do phải có ít nhất 10 ký tự."

E15 - Update Fails
The system cannot connect to the server or the server returns an error.
The system displays an alert with the error message. Both buttons are re-enabled and Tenant may attempt to update again.

E16 - Request Not Found
The API returns 404 when fetching request details.
The system displays an alert: "Không tìm thấy yêu cầu này." with a "Quay lại" button.

E17 - Permission Denied
The API returns 403 when fetching or updating request details.
The system displays an alert: "Bạn không có quyền chỉnh sửa yêu cầu này." with a "Quay lại" button.

**Priority:**
High

**Frequency of Use:**
Occasional (as needed when Tenant needs to correct a pending request)

**Business Rules:**
BR-01: Only requests with status "Pending" can be edited. Requests in any other status display an error and block access.
BR-02: All required fields for the respective request type must be validated before submission.
BR-03: For complaint requests, category and content are required. Content must be between 10 and 2000 characters.
BR-04: For repair requests, room, device, and description are required. Description must be between 10 and 1000 characters. Images are optional but new images are uploaded to Cloudinary on submit.
BR-05: For transfer requests, current room, target room, transfer date, and reason are required. The date must be tomorrow or later. Reason must be between 10 and 500 characters.
BR-06: The footer always displays both "Hủy" and "Cập nhật" buttons. "Hủy" navigates back without changes; "Cập nhật" submits the update.
BR-07: The submit button is disabled and shows a loading spinner during submission. Both buttons are disabled during loading.
BR-08: The screen uses the same form layout and theme as the corresponding Create screen but with blue accent for the update action.
BR-09: In the repair update screen, existing images from Cloudinary are displayed separately from newly selected local images. New images are marked with a "Mới" badge until uploaded.
BR-10: Pre-filled data is sourced from navigation params when available, avoiding an unnecessary API call to fetch details.

**Other Information:**
The form uses a card-based layout with a sticky dual-button footer (Hủy and Cập nhật). Room, device, and type selections use horizontal scrollable lists. The repair update screen distinguishes existing images from new ones with a badge. All Update screens share the same visual language as their Create counterparts with a blue accent for the update action. The interface supports proper display on phone models with a notch design or Dynamic Island.

**Assumptions:**
The server is online and returns accurate request data. Navigation params always include either initialData or a valid requestId. Tenant has the necessary permissions to edit the request.
