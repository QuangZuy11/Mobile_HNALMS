# CREATE REPAIR REQUEST

**Description:**
Allows Tenant to submit a repair or maintenance request by selecting a room, choosing a request type (Repair or Maintenance), picking a device, entering a detailed description, and optionally attaching up to 10 images. The request is validated before submission and Tenant receives a confirmation upon successful creation.

**Trigger:**
Tenant taps the "Yêu cầu sửa chữa/Bảo trì" card on the Request List screen.

**Preconditions:**
PRE-1: Tenant has successfully logged in.
PRE-2: The mobile device has an active Internet connection.

**Postconditions:**
POST-1: If the request is submitted successfully, it appears in Tenant's request list with status "Chờ xử lý".
POST-2: Tenant is navigated back to the Request List screen after confirmation.

**Normal Flow:**
User Create Repair Request Process

1. Tenant opens the Create Repair Request screen.
2. The system simultaneously loads Tenant's rooms and available devices in the background. While loading, spinner placeholders are shown in both fields.
3. The system displays the form with:
   - Room selection: a horizontal scrollable list of Tenant's rooms with door icon, room name, and price. The first room is auto-selected by default.
   - Request type selection: a two-button grid to choose between "Sửa chữa" (Repair) and "Bảo trì" (Maintenance), each with an icon.
   - Device selection: a horizontal scrollable list of devices in the selected room, each with a contextual icon. The placeholder text dynamically reflects the chosen request type.
   - Description: a multi-line text input with a character counter (0/1000) and a structured placeholder guide.
   - Images: a dashed picker button to add up to 10 images from camera or gallery. Selected images appear as thumbnails with a remove button.
   - An info box stating requests will be handled within 24-48 hours and costs will be communicated after inspection.
   - A "Gửi yêu cầu" submit button at the bottom.
4. Tenant selects a room from the horizontal list. The selected room is highlighted with a blue border and background.
5. Tenant selects the request type (Sửa chữa or Bảo trì). The device placeholder label updates accordingly.
6. Tenant selects a device from the horizontal list. The selected device is highlighted with a blue border and background.
7. Tenant enters a detailed description of the issue. The character counter updates in real-time.
8. Tenant taps the image picker to add images. An alert presents two options: "Chụp ảnh" (camera) or "Chọn từ thư viện" (gallery). After selecting images, they appear as thumbnails with remove buttons.
9. Tenant taps "Gửi yêu cầu".
10. The system validates:
    - A room must be selected.
    - A device must be selected.
    - The description must not be empty.
    - The description must be at least 10 characters long.
    If any validation fails, the system displays an alert with the specific error message.
11. On successful validation, if images are attached, the system uploads them to the server. The button shows a progress indicator with "Đang tải ảnh X/Y...". If only some images succeed, a warning alert asks Tenant whether to continue without the failed images.
12. On successful submission, the system displays an alert: "Thành công" with message "Yêu cầu [sửa chữa/bảo trì] đã được gửi thành công."
13. Tenant taps "OK" and is navigated back to the Request List screen.

**Alternative Flows:**

AF-1 Tenant changes the request type
1. Tenant taps a different request type button (e.g., switches from "Sửa chữa" to "Bảo trì").
2. The device placeholder label updates to reflect the new type. Tenant can then select a device.

AF-2 Tenant removes an image
1. Tenant taps the remove (X) button on an image thumbnail.
2. The image is removed from the list immediately.

AF-3 Partial image upload failure
1. Some images fail to upload during the upload step.
2. The system displays an alert: "Chỉ tải lên được X/Y ảnh. Bạn có muốn tiếp tục?"
3. Tenant taps "Tiếp tục" to submit the request without the failed images, or taps "Hủy" to cancel and retry.

AF-4 Image upload fails completely
1. All images fail to upload.
2. The system displays an alert with the error message: "Lỗi tải ảnh" and asks "Bạn có muốn tiếp tục không có ảnh?"
3. Tenant taps "Tiếp tục" to submit without images, or taps "Hủy" to cancel.

AF-5 Tenant cancels before submitting
1. Tenant taps the back button in the header.
2. The system navigates Tenant back to the Request List screen without submitting any data.

AF-6 No rooms found
1. The system cannot find any rooms for Tenant.
2. The room selection area shows an empty state with an alert icon.
3. The submit button remains disabled.

AF-7 No devices found
1. The system successfully loads rooms but finds no devices in the selected room.
2. The device selection area shows an empty state with an alert icon.
3. The submit button remains disabled.

**Exceptions:**

E1 - Missing Room
Tenant taps "Gửi yêu cầu" without selecting a room.
The system displays an alert: "Vui lòng chọn phòng gửi yêu cầu."

E2 - Missing Device
Tenant taps "Gửi yêu cầu" without selecting a device.
The system displays an alert: "Vui lòng chọn thiết bị cần [sửa chữa/bảo trì]."

E3 - Empty Description
Tenant taps "Gửi yêu cầu" without entering a description.
The system displays an alert: "Vui lòng mô tả vấn đề."

E4 - Description Too Short
Tenant enters a description with fewer than 10 characters.
The system displays an alert: "Mô tả phải có ít nhất 10 ký tự."

E5 - Submission Fails
The system cannot connect to the server or the server returns an error.
The system displays an alert with the error message. The submit button is re-enabled and Tenant may attempt to submit again.

E6 - Loading Rooms Fails
The system cannot retrieve Tenant's rooms.
The system displays an alert with "Không thể tải danh sách phòng" and offers "Thử lại" or "Hủy" options.

E7 - Loading Devices Fails
The system cannot retrieve the device list.
The system displays an alert with "Không thể tải danh sách thiết bị" and offers "Thử lại" or "Hủy" options.

**Priority:**
High

**Frequency of Use:**
Occasional (as needed when a device issue arises)

**Business Rules:**
BR-01: The room, device, and description are mandatory fields. Images are optional.
BR-02: The description must be between 10 and 1000 characters.
BR-03: Up to 10 images can be attached per request. Images are uploaded to Cloudinary.
BR-04: The submit button is disabled and shows a loading spinner during submission.
BR-05: The system uses a green accent theme for this screen to match the repair/maintenance request type.
BR-06: Device icons are contextually assigned based on device name (e.g., fridge icon for tủ lạnh, washing machine for máy giặt).
BR-07: If the image upload partially fails, Tenant is given the choice to proceed with the successful uploads or cancel the submission.
BR-08: If image upload fails completely, Tenant is given the choice to submit without images or cancel.

**Other Information:**
The form uses a card-based layout with a sticky submit button at the bottom. Room, device, and type selections use horizontal scrollable lists with blue accent for selected states. The image picker uses a dashed border style. Selected images display as 100x100 thumbnails with a red remove button overlay. The info box has a blue left border. The submit button turns gray while loading and shows upload progress when images are being uploaded. The interface supports proper display on phone models with a notch design or Dynamic Island.

**Assumptions:**
The server is online and the device and room APIs return accurate data. Tenant has at least one active room with registered devices.
