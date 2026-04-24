# BOOK EXTENSION SERVICE (TENANT)

**Description:**
Allows Tenant users to register (book) an optional extension service for their selected room contract. The Tenant taps "Đăng ký" on a service card in the "Mở rộng" (Extension) tab, enters the quantity via a stepper in the modal dialog, and confirms. For parking services, the quantity is capped by the room's maximum occupancy. For washing machine services, the quantity is automatically set to 1 and the stepper is hidden.

**Trigger:**
Tenant taps the "Đăng ký" button on an extension service card in the "Mở rộng" tab.

**Preconditions:**
PRE-1: User is authenticated as Tenant.
PRE-2: The Tenant has selected a room contract and is on the Service screen.
PRE-3: The extension service has canBook = true (not yet booked and bookable).
PRE-4: The selected contract is in active status.

**Postconditions:**
POST-1: The service is successfully registered for the selected contract.
POST-2: The service card updates to show "Đã đăng ký" (Registered) badge and the booked quantity.
POST-3: A success confirmation is shown to the Tenant.

**Normal Flow: Book Extension Service**

1. Tenant is viewing the "Mở rộng" (Extension) tab on the Service screen.
2. The service card shows "Đăng ký" (Register) button (amber, enabled).
3. Tenant taps "Đăng ký". A modal dialog appears with a fade animation.
4. The modal displays:
   - Header: "Đăng ký dịch vụ" with a plus-circle icon.
   - Service info card: service name and price per unit (e.g., "120.000đ / tháng") on an amber background.
   - Quantity input: a labeled stepper "Số lượng người" with minus and plus buttons and a numeric input field (starting at 1).
   - A parking hint (for parking service only): "Phòng tối đa N người – đăng ký tối đa N xe" in an amber info box.
   - Action buttons: "Hủy" (Cancel) on the left and "Đăng ký" (Confirm) on the right.
5. Tenant adjusts the quantity:
   - Tenant taps the "-" button to decrease (minimum 1).
   - Tenant taps the "+" button to increase.
   - Tenant may type a number directly into the input field (digits only).
   - For parking service, the "+" button stops at the room's maximum occupancy.
6. Tenant taps "Đăng ký" (Confirm) to submit.
7. The modal closes. The service card shows a loading indicator on the button area.
8. The system registers the service with the entered quantity for the selected contract.
9. A success alert appears: "Thành công" — "Đăng ký dịch vụ thành công!".
10. The service list refreshes. The service card now shows:
    - A green "Đã đăng ký" badge with a checkmark icon.
    - A quantity info pill: "Số người đăng ký: N".
    - The "Đăng ký" button is replaced by a "Hủy đăng ký" (Cancel) button.

**Alternative Flows:**

AF-1 Cancel booking before confirming
1. Tenant opens the modal.
2. Tenant taps "Hủy" (Cancel).
3. The modal closes. No registration is made. The service card remains unchanged.

AF-2 Close modal by tapping overlay
1. Tenant opens the modal.
2. Tenant taps outside the modal dialog (on the dark overlay background).
3. The modal closes via onRequestClose. No registration is made. The service card remains unchanged.

AF-3 Quantity less than 1
1. Tenant enters a quantity value less than 1.
2. Tenant taps "Đăng ký".
3. An error alert appears: "Lỗi" — "Số lượng người phải là số nguyên >= 1".
4. The registration does not proceed.

AF-4 Parking quantity exceeds room capacity
1. The service is a parking service (type "Giữ xe" or name contains "giữ xe").
2. The room's maximum occupancy is N persons.
3. Tenant enters a quantity greater than N (or taps "+" until it would exceed N).
4. An error alert appears: "Vượt giới hạn" — "Phòng tối đa N người nên chỉ được đăng ký tối đa N xe."
5. The registration does not proceed.

AF-5 Book washing machine service
1. The service is a washing machine service (type "Giặt ủi" or name contains "máy giặt").
2. Tenant taps "Đăng ký".
3. The modal opens but the quantity stepper is not displayed.
4. Quantity is automatically treated as 1.
5. Tenant taps "Đăng ký". The service is registered with quantity 1.

AF-6 Booking fails
1. The registration request fails on the server side.
2. An error alert appears: "Đăng ký thất bại" with the error message from the server.
3. The modal is closed. The service card returns to its previous state (not registered).

AF-7 Multiple rapid taps on confirm button
1. Tenant taps "Đăng ký" multiple times quickly.
2. The button area shows a loading indicator and becomes disabled (opacity reduced).
3. Only one registration request is processed. Duplicate submissions are prevented.

AF-8 Keyboard avoiding behavior
1. The modal contains a quantity input field.
2. On iOS, the keyboard pushes the modal content up (behavior='padding').
3. On Android, the modal adapts to avoid keyboard overlap (behavior='height').

**Exceptions:**

E1 - Registration fails
1. The server returns an error during service registration.
2. An error alert is displayed with the server's error message.
3. The modal closes. The service card returns to its previous (unregistered) state.

E2 - Service is no longer bookable
1. Between the time Tenant opens the modal and submits, the service's canBook status changes (e.g., another process books the last available slot).
2. The registration fails.
3. The error alert is shown.

**Priority:**
High

**Frequency of Use:**
Regular — Tenant books extension services (parking, laundry, etc.) as needed.

**Business Rules:**
BR-01: The booking modal uses animationType="fade" with transparent overlay background (rgba(0,0,0,0.45)).
BR-02: The service info card displays the service name and price per unit (currentPrice or price, formatted in VND).
BR-03: Quantity stepper: minimum value is 1, maximum is room person capacity for parking services, unlimited for other services.
BR-04: Quantity input only accepts digits (0–9). Non-digit characters are stripped on input.
BR-05: Quantity input max length is 3 characters.
BR-06: For washing machine services, the quantity stepper is hidden. Quantity is always 1.
BR-07: For parking services, a hint box shows the room's maximum occupancy and the parking cap.
BR-08: The confirm button shows a loading indicator while the registration is in progress.
BR-09: The cancel button and overlay tap both close the modal without making any changes.
BR-10: After successful registration, the service card shows: green "Đã đăng ký" badge, quantity info pill, and "Hủy đăng ký" button.
BR-11: Pull-to-refresh on the service list updates the registration status.
BR-12: The modal quantity resets to 1 each time the modal is opened.

**Other Information:**
This use case focuses solely on the booking (registration) flow of an extension service. It does not cover viewing the service list, switching contracts, or canceling a booked service (those are separate use cases). The modal is intentionally simple with a single quantity field — no date selection or advanced options. The washing machine service simplifies the flow by removing the quantity stepper entirely, as the quantity is always 1.

**Assumptions:**
- The service object includes: _id, name, type, currentPrice/price, unit, canBook, canCancel, isBooked, bookedQuantity.
- The selected contract includes: _id, roomId.roomTypeId.personMax (for parking capacity).
- The room's person capacity (personMax) is used as the parking vehicle cap.
- The service is a parking service if: type === "Giữ xe" or name contains "giữ xe".
- The service is a washing machine service if: type === "Giặt ủi" or name contains "máy giặt".
- The backend enforces that a service can only be booked once per contract at a time.
- The tenant must have an active contract to book services.
