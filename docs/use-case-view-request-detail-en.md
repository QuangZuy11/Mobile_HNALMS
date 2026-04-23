# VIEW REQUEST DETAIL

**Description:**
Allows Tenant to view the full details of a specific service request, including its current status, description, manager responses, attached images, and — for pending requests — edit or delete options.

**Trigger:**
Tenant taps on a request item in the Request List screen.

**Preconditions:**
PRE-1: Tenant has successfully logged in.
PRE-2: Tenant has opened the Request List screen and at least one request exists.

**Postconditions:**
POST-1: The system displays the complete details of the selected request.
POST-2: For pending requests, Tenant may edit or delete the request.

**Normal Flow:**
User View Request Detail Process

1. Tenant taps a request item in the Request List.
2. The system opens a detail modal with a loading spinner showing "Đang tải chi tiết...".
3. The system retrieves the request detail data. For complaint requests, a separate detail API is called. For maintenance and transfer requests, data from the list response is used as the detail.
4. On success, the system renders the detail modal with the following sections:
   a. **Status banner**: a full-width banner displaying the current status with an icon and colored label (centered, rounded corners).
   b. **Request information section**: displays the request type badge, and type-specific fields:
      - For Complaint: complaint category.
      - For Maintenance: device type, device name, and device category.
      - For Transfer: target room name, floor, room type, and requested transfer date.
      - Common fields: creation date.
   c. **Description section**: displays the request content, description, or transfer reason in a blue-left-bordered text box.
   d. **Manager response section** (if available): displays the manager's reply in a blue-left-bordered box, including the responder's name and response date.
   e. **Rejection reason section** (if status is Rejected or Cancelled): displays the manager's rejection note in a red-left-bordered box.
   f. **Images section** (for maintenance requests with attachments): displays thumbnail images (110×110px) in a horizontally scrollable strip. Each thumbnail is tappable.
   g. **Action buttons section** (only for requests with status Pending): displays "Chỉnh sửa yêu cầu" (blue) and "Xóa yêu cầu" (red) buttons.
5. Tenant taps the close button to dismiss the modal and return to the Request List.

**Alternative Flows:**

AF-1 View full-screen image
1. Tenant taps an image thumbnail in the detail modal.
2. The system opens a full-screen image viewer over a near-black overlay.
3. Tenant taps the close button to return to the detail modal.

AF-2 Edit a pending request
1. Tenant taps "Chỉnh sửa yêu cầu" in the detail modal.
2. The system closes the modal and navigates to the corresponding edit screen with pre-filled data.

AF-3 Delete a pending request
1. Tenant taps "Xóa yêu cầu" in the detail modal.
2. The system displays a confirmation dialog: "Bạn có chắc muốn xóa yêu cầu này không? Hành động này không thể hoàn tác."
3. If Tenant confirms, the system deletes the request, closes the modal, and refreshes the Request List.

AF-4 No detail data available
1. The detail API call fails or returns no data.
2. The system falls back to displaying the data available from the list response.
3. If no data is available at all, the system shows an error message with an alert icon.

**Exceptions:**

E1 Request Not Found
1. The selected request no longer exists in the system.
2. The system displays an error message with an alert icon and a "Quay lại" button.

E2 Network Error
1. The system cannot connect to the server while fetching the request detail.
2. The system displays an error message and falls back to list data if available.

**Priority:**
High

**Frequency of Use:**
Frequent (multiple times/month)

**Business Rules:**
BR-01: The detail modal is presented in iOS page sheet style (`presentationStyle="pageSheet"`).
BR-02: The status banner uses the same color mapping as the Request List:
   - Pending → yellow background (#FEF3C7), amber text (#F59E0B), clock icon
   - Processing → blue background (#DBEAFE), blue text (#3B82F6), cog icon
   - Done / Approved / Paid / Completed → green background (#D1FAE5), green text (#10B981), check icon
   - Unpaid → yellow background (#FEF9C3), amber text (#CA8A04), cash-clock icon
   - Rejected / Cancelled → red background (#FEE2E2), red text (#EF4444), close icon
BR-03: Only requests with status "Pending" display edit and delete action buttons.
BR-04: Maintenance request thumbnails are displayed at 110×110px in a horizontally scrollable strip.
BR-05: Images are displayed in full-screen mode over a near-black overlay (rgba(0,0,0,0.92)) with a white close button in the top-right corner.
BR-06: For transfer requests, if status is Rejected or Cancelled, the system displays a general note box (yellow-left-bordered) instead of a rejection-specific box.
BR-07: Date and time fields are formatted as "dd/mm/yyyy HH:MM" using the Vietnamese locale.

**Other Information:**
- The detail modal uses a white (#FFFFFF) card-based layout on a light gray background (#F9FAFB).
- Manager responses and descriptions are visually distinguished by left border colors: blue (#3B82F6) for responses and descriptions, red (#EF4444) for rejection reasons, yellow (#F59E0B) for general notes.
- The edit button uses blue (#3B82F6) and the delete button uses red (#EF4444) for clear action differentiation.
- The interface supports proper display on phone models with a notch design or Dynamic Island.

**Assumptions:**
The server is online and returns accurate request data. Maintenance and transfer request details are sourced from the list response when the detail API is unavailable.
