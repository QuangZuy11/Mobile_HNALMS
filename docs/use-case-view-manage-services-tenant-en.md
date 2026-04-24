# VIEW AND MANAGE SERVICES (TENANT)

**Description:**
Allows Tenant users to view the list of services available for their room contract(s) in the mobile app. Services are displayed in two tabs: **Cố định** (Fixed — bundled in contract, read-only display) and **Mở rộng** (Extension — optional services). Tenants with multiple contracts can switch between them via a horizontal contract selector at the top of the screen. Each service card shows its name, type, description, and price.

**Trigger:**
Tenant navigates to the Service screen from the mobile app.

**Preconditions:**
PRE-1: User is authenticated as Tenant.
PRE-2: Tenant has at least one room contract.

**Postconditions:**
POST-1: Fixed services and extension services are displayed in their respective tabs, filtered by the selected contract.
POST-2: The contract selector reflects all available contracts for the tenant.

**Normal Flow: View Service List**

1. Tenant opens the Service screen.
2. The system displays the header "Dịch vụ" and a horizontal contract selector (if no specific contract is pre-selected).
3. The contract selector shows all contracts the tenant holds. Each contract pill displays the room name and floor name (e.g., "Phòng 101 • Tầng 2").
4. The system pre-selects the active contract, or the first contract if no active contract is found.
5. Tenant may tap a different contract pill to switch context. The list updates to show services for the selected contract.
6. The screen displays two tabs:
   - **Cố định** (Fixed) — blue tab indicator — shows services bundled in the contract.
   - **Mở rộng** (Extension) — amber tab indicator — shows optional services.
7. Each tab shows a count badge (e.g., "Cố định (4)").
8. Each service card displays:
   - A colored icon representing the service type.
   - Service name.
   - Service type label.
   - Description (up to 2 lines).
   - Price per unit (e.g., "120.000đ / tháng").
9. Fixed service cards display a "Có trong hợp đồng" (Included in Contract) note in blue.
10. Extension service cards display a "Đã đăng ký" (Registered) green badge if the service is currently booked, along with the booked quantity.
11. Tenant taps the "Mở rộng" tab to view optional services. The tab indicator switches to amber.
12. Tenant taps the "Cố định" tab to return to fixed services. The tab indicator switches to blue.
13. Tenant pulls down to refresh the list. A spinner appears and the list reloads.

**Alternative Flows:**

AF-1 Switch contract
1. Tenant taps a different contract pill.
2. The contract is highlighted as selected. The list reloads with services matching the new contract.
3. Floor and room metadata are updated accordingly.

AF-2 View service list with specific contract pre-selected
1. The screen is opened with a pre-selected contract (e.g., from another screen).
2. The contract selector is hidden.
3. The header shows the room name as a subtitle.
4. The list displays services for that contract only.

AF-3 Empty fixed services tab
1. The contract has no fixed services, or the only fixed service is an elevator service in a floor 1 room.
2. An empty state is shown: shield-check icon, "Không có dịch vụ cố định", subtitle "Các dịch vụ cố định trong hợp đồng sẽ hiển thị ở đây".

AF-4 Empty extension services tab
1. The contract has no extension services.
2. An empty state is shown: room-service icon, "Không có dịch vụ mở rộng", subtitle "Các dịch vụ mở rộng có thể đăng ký sẽ hiển thị ở đây".

AF-5 Elevator service hidden for floor 1 rooms
1. A fixed service is an elevator service (name contains "thang máy").
2. The selected room is on floor 1.
3. The elevator service is excluded from the fixed tab. It does not appear.

AF-6 No active contract found
1. None of the tenant's contracts have status "active".
2. The first contract in the list is selected as default.
3. The screen functions normally with services from that contract.

**Exceptions:**

E1 - Loading fails
1. The system cannot retrieve the contracts or service list.
2. An error alert is displayed: "Lỗi" — "Không thể tải danh sách dịch vụ".
3. Tenant may retry by pulling down to refresh.

**Priority:**
High

**Frequency of Use:**
Regular — Tenant views available services as part of understanding their room offering.

**Business Rules:**
BR-01: Two tabs are displayed: "Cố định" (Fixed) and "Mở rộng" (Extension).
BR-02: Fixed services: services of type "Fixed" that are bundled in the contract, displayed as read-only cards.
BR-03: Extension services: services that are not of type "Fixed", displayed as cards with optional action capability.
BR-04: The elevator service is excluded from the fixed tab if the room is on floor 1 (floor name matches "tầng 1", "floor 1", "01", or ends with "1").
BR-05: Service type icons: Điện→lightning-bolt, Nước→water, Internet→wifi, Giữ xe→motorbike, Vệ sinh→broom, Giặt ủi→washing-machine, Ăn uống→food, Khác→room-service-outline.
BR-06: Price is displayed in Vietnamese Dong (VND) using locale formatting: "120.000đ / tháng".
BR-07: Each tab shows a count badge with the number of services in that category.
BR-08: The contract selector displays room name and floor name for each contract.
BR-09: The contract selector is hidden when the screen is opened with a pre-selected contract.
BR-10: The header shows the room name as a subtitle when a contract is pre-selected.
BR-11: Fixed service cards display a "Có trong hợp đồng" note in a blue pill badge.
BR-12: Extension service cards display a "Đã đăng ký" green pill badge with a checkmark when the service is booked, along with the booked quantity.
BR-13: The default selected contract follows this priority: provided contractId > active contract (status="active") > first contract in the list.
BR-14: Pull-to-refresh reloads both the contracts and the service list.

**Other Information:**
This use case covers only the viewing and navigation aspects of the service management screen. The extension service booking and cancellation are out of scope and covered in a separate use case. The contract selector allows tenants with multiple rooms to easily switch between contracts. The service list is grouped into two clear categories to help tenants understand which services are included and which are optional.

**Assumptions:**
- Each contract includes room metadata: room name, floor name.
- Each room has a type with a person capacity (personMax) used for parking service limits.
- Services include: name, type, description, price, and registration status (isBooked, canBook, canCancel, bookedQuantity).
- The tenant can have one or more contracts across different rooms.
