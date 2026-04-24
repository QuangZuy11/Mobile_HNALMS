# CANCEL BOOKED SERVICE (TENANT)

**Description:**
Allows Tenant users to cancel a previously registered (booked) extension service for their selected room contract. The Tenant taps "Hủy đăng ký" on a booked service card, confirms the cancellation in a confirmation dialog, and the service registration is removed.

**Trigger:**
Tenant taps the "Hủy đăng ký" button on a booked extension service card in the "Mở rộng" (Extension) tab.

**Preconditions:**
PRE-1: User is authenticated as Tenant.
PRE-2: The Tenant has selected a room contract and is on the Service screen.
PRE-3: The extension service has canCancel = true (currently booked and cancellable).
PRE-4: The selected contract is in active status.

**Postconditions:**
POST-1: The service registration for the selected contract is successfully cancelled.
POST-2: The service card updates to remove the "Đã đăng ký" badge and quantity info.
POST-3: The "Hủy đăng ký" button is replaced by the "Đăng ký" button.
POST-4: A success confirmation is shown to the Tenant.

**Normal Flow: Cancel Booked Service**

1. Tenant is viewing the "Mở rộng" (Extension) tab on the Service screen.
2. The extension service card shows a green "Đã đăng ký" badge with a checkmark icon and a quantity info pill (e.g., "Số người đăng ký: 2").
3. The card shows a red "Hủy đăng ký" (Cancel Registration) button.
4. Tenant taps "Hủy đăng ký". A confirmation alert dialog appears with:
   - Title: "Hủy dịch vụ" (Cancel Service).
   - Message: "Bạn có chắc muốn hủy dịch vụ '[service name]'?" (Are you sure you want to cancel service "[service name]"?).
   - Two buttons: "Không" (No) on the left (cancel style) and "Hủy dịch vụ" (Confirm Cancel) on the right (destructive red style).
5. Tenant taps "Hủy dịch vụ" (Confirm Cancel).
6. The alert dismisses. The "Hủy đăng ký" button area shows a loading indicator.
7. The system cancels the service registration for the selected contract.
8. A success alert appears: "Thành công" — "Đã hủy dịch vụ.".
9. The service list refreshes. The service card now shows:
   - The green "Đã đăng ký" badge is removed.
   - The quantity info pill is removed.
   - The red "Hủy đăng ký" button is replaced by the amber "Đăng ký" (Register) button.

**Alternative Flows:**

AF-1 Cancel confirmation — choose No
1. Tenant taps "Hủy đăng ký".
2. The confirmation alert appears.
3. Tenant taps "Không" (No).
4. The alert dismisses. No cancellation is made. The service card remains unchanged.

AF-2 Cancel fails
1. Tenant taps "Hủy đăng ký".
2. The confirmation alert appears and Tenant confirms.
3. The cancellation request fails on the server side.
4. An error alert appears: "Hủy thất bại" with the error message from the server.
5. The service card returns to its previous (registered) state.

AF-3 Multiple rapid taps on cancel button
1. Tenant taps "Hủy đăng ký" multiple times quickly.
2. The button area shows a loading indicator and becomes disabled (opacity reduced).
3. Only one cancellation request is processed. Duplicate submissions are prevented.

AF-4 Service becomes non-cancellable during the flow
1. Between the time Tenant taps "Hủy đăng ký" and confirms, the service's canCancel status changes.
2. The cancellation fails.
3. The error alert is shown.

**Exceptions:**

E1 - Cancellation fails
1. The server returns an error during service cancellation.
2. An error alert is displayed: "Hủy thất bại" with the server's error message.
3. The service card returns to its previous (registered) state.

E2 - Contract is no longer active
1. The selected contract's status changes (e.g., expired or terminated) before cancellation.
2. The cancellation request may be rejected by the backend.
3. The error alert is shown.

**Priority:**
High

**Frequency of Use:**
Occasional — Tenant cancels extension services when no longer needed.

**Business Rules:**
BR-01: The cancellation requires explicit confirmation via a two-button alert dialog.
BR-02: The "Không" button uses cancel style (neutral), the "Hủy dịch vụ" button uses destructive style (red).
BR-03: The confirmation message includes the service name: "Bạn có chắc muốn hủy dịch vụ '[service name]'?".
BR-04: The cancel button shows a loading indicator while the cancellation is in progress.
BR-05: Duplicate cancel taps are prevented via the actioningId state — the button is disabled during the request.
BR-06: After successful cancellation, the service card shows: no "Đã đăng ký" badge, no quantity info, and the "Đăng ký" button.
BR-07: Pull-to-refresh on the service list updates the cancellation status.
BR-08: A success alert "Đã hủy dịch vụ." is displayed upon successful cancellation.

**Other Information:**
This use case focuses solely on the cancellation flow of a booked extension service. It does not cover viewing the service list, switching contracts, or booking a service (those are separate use cases). The cancellation is destructive and therefore requires an explicit confirmation step to prevent accidental cancellations.

**Assumptions:**
- The service object includes: _id, name, type, canBook, canCancel, isBooked, bookedQuantity.
- The selected contract includes: _id.
- The cancellation is scoped to a specific service and a specific contract.
- The backend enforces that only a booked service with canCancel = true can be cancelled.
- The tenant must have an active contract to cancel services.
- The backend provides a meaningful error message when cancellation fails.
