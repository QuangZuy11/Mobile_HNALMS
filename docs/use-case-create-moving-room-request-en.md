# CREATE MOVING ROOM REQUEST

**Description:**
Allows Tenant to submit a room transfer request by selecting their current room, choosing an available target room, picking a future transfer date via a calendar, and providing a reason. The request is validated before submission and Tenant receives a confirmation upon successful creation.

**Trigger:**
Tenant taps the "Yêu cầu chuyển phòng" card on the Request List screen.

**Preconditions:**
PRE-1: Tenant has successfully logged in.
PRE-2: The mobile device has an active Internet connection.

**Postconditions:**
POST-1: If the request is submitted successfully, it appears in Tenant's request list with status "Chờ xử lý".
POST-2: Tenant is navigated back to the Request List screen after confirmation.

**Normal Flow:**
User Create Moving Room Request Process

1. Tenant opens the Create Moving Room Request screen.
2. The system loads and displays:
   - An info banner summarizing the request steps.
   - A 4-step form:
     Step 1: A horizontal scrollable list of Tenant's current rooms. By default, the first room is auto-selected.
     Step 2: A room picker button to select the target room. Tapping opens a modal listing all available rooms with name, floor, capacity, and monthly price.
     Step 3: A date picker button to select the transfer date. Tapping opens a calendar modal. Only dates from tomorrow onwards are selectable.
     Step 4: A multi-line text area for entering the transfer reason, with a character counter (0/500).
   - A policy note box listing key policies about deposit retention, prorated rent, and room handover.
   - A "Gửi yêu cầu chuyển phòng" submit button at the bottom.
3. Tenant selects their current room from the horizontal scrollable list. The selected room is highlighted with a blue border and background.
4. Tenant taps the room picker button to open the room selection modal.
5. The system loads the list of available rooms. While loading, a spinner is shown.
6. If no rooms are available, the modal displays an empty state with a "Thử lại" button.
7. If rooms are available, the modal lists all available rooms. Tenant taps a room to select it. The modal closes and the selected room appears in the picker button with a yellow border.
8. Tenant taps the date picker button to open the calendar modal.
9. The calendar displays the current month. Tenant navigates months with the arrow buttons. Tenant taps a selectable date (tomorrow or later). Sundays are highlighted in red. The modal closes and the selected date appears in the picker.
10. Tenant enters the transfer reason in the text area. The character counter updates in real-time.
11. Tenant taps "Gửi yêu cầu chuyển phòng".
12. The system validates:
    - A current room must be selected.
    - A target room must be selected.
    - A transfer date must be selected.
    - The reason must not be empty.
    - The reason must be at least 10 characters long.
    If any validation fails, the system displays an alert with the specific error message.
13. On successful validation, the system submits the request. While submitting, the button shows a loading spinner and is disabled.
14. On success, the system displays an alert: "Gửi thành công" with message "Yêu cầu chuyển phòng của bạn đã được gửi. Vui lòng đợi quản lý xác nhận."
15. Tenant taps "OK" and is navigated back to the Request List screen.

**Alternative Flows:**

AF-1 Tenant changes the target room
1. Tenant taps the room picker button again.
2. The room selection modal reopens with the previously selected room highlighted. Tenant selects a different room and the modal closes.

AF-2 Tenant changes the transfer date
1. Tenant taps the date picker button again.
2. The calendar modal reopens. Tenant selects a different date.

AF-3 No available rooms found
1. The API returns an empty available rooms list.
2. The room picker modal shows an empty state with icon, message "Không có phòng trống", and a "Thử lại" button.
3. Tenant taps "Thử lại" to reload the room list.

AF-4 Tenant cancels before submitting
1. Tenant taps the back button in the header.
2. The system navigates Tenant back to the Request List screen without submitting any data.

AF-5 Current room not found
1. The system cannot find any current rooms for Tenant.
2. The current room list displays an empty state with an alert icon.
3. The submit button remains disabled.

**Exceptions:**

E1 - Missing Current Room
Tenant taps "Gửi yêu cầu chuyển phòng" without selecting a current room.
The system displays an alert: "Vui lòng chọn phòng hiện tại của bạn."

E2 - Missing Target Room
Tenant taps "Gửi yêu cầu chuyển phòng" without selecting a target room.
The system displays an alert: "Vui lòng chọn phòng muốn chuyển đến."

E3 - Missing Transfer Date
Tenant taps "Gửi yêu cầu chuyển phòng" without selecting a transfer date.
The system displays an alert: "Vui lòng chọn ngày chuyển phòng."

E4 - Missing Reason
Tenant taps "Gửi yêu cầu chuyển phòng" without entering a reason.
The system displays an alert: "Vui lòng nhập lý do chuyển phòng."

E5 - Reason Too Short
Tenant enters a reason with fewer than 10 characters.
The system displays an alert: "Lý do phải có ít nhất 10 ký tự."

E6 - Submission Fails
The system cannot connect to the server or the server returns an error.
The system displays an alert with the error message. The submit button is re-enabled and Tenant may attempt to submit again.

E7 - Loading Current Rooms Fails
The system cannot retrieve Tenant's current rooms.
The system displays an alert with the error message and the current room list shows an empty state.

**Priority:**
High

**Frequency of Use:**
Occasional (as needed when Tenant wishes to change rooms)

**Business Rules:**
BR-01: The current room is mandatory. If Tenant has only one room, it is auto-selected.
BR-02: The target room must be selected from the list of available rooms returned by the API.
BR-03: The transfer date must be tomorrow or a future date. Past dates and today are not selectable.
BR-04: The transfer reason must be between 10 and 500 characters.
BR-05: The submit button is disabled until all required fields (current room, target room, date, reason) are filled.
BR-06: The system uses a yellow/amber accent theme for this screen to match the room transfer request type.
BR-07: The step badges use numbered circles with the step title for clear visual guidance.
BR-08: The room selection modal uses iOS page sheet style and displays room name, floor, maximum occupancy, and monthly price.
BR-09: The calendar modal uses iOS page sheet style with month navigation, day-of-week headers, and today/selected date highlighting. Sundays are visually distinguished in red.

**Other Information:**
The form uses a 4-step wizard-style layout with numbered badges and step titles. The current room selection uses a horizontal scrollable card list with a blue accent for the selected state. The room picker and date picker both open as page sheet modals. The policy note box has a yellow background with amber text. The submit button turns gray while loading. The interface supports proper display on phone models with a notch design or Dynamic Island.

**Assumptions:**
The server is online and the available rooms API returns accurate vacancy data. Tenant has at least one active room contract.
