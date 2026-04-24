# VIEW CONTRACT LIST FOR BOOKING SERVICES (TENANT)

**Description:**
Allows Tenant users to view their list of room contracts and select a room to view and manage services. Each contract card displays room details (name, floor, type, capacity), contract status (Đang hiệu lực / Chưa hiệu lực / Đã hết hạn / Đã thanh lý), and the contract date range. Tenants cannot proceed to book services for rooms with inactive (not yet started) contracts. Pull-to-refresh reloads the contract list.

**Trigger:**
Tenant navigates to the "Chọn phòng" (Select Room) screen from the mobile app to book or view services.

**Preconditions:**
PRE-1: User is authenticated as Tenant.

**Postconditions:**
POST-1: A list of the tenant's contracts is displayed.
POST-2: Tapping a valid (active) contract navigates to the service list for that room.
POST-3: Tapping an inactive contract shows a notice explaining when service booking becomes available.

**Normal Flow: View Contract List and Select Room**

1. Tenant opens the "Chọn phòng" (Select Room) screen.
2. The system displays the header "Chọn phòng" and a loading spinner.
3. The system loads the tenant's contracts.
4. The loading spinner disappears. A list of contract cards is displayed.
5. Each contract card shows:
   - A status dot (colored) and room name with floor name.
   - A status badge: "Đang hiệu lực" (green), "Chưa hiệu lực" (amber), "Đã hết hạn" (red), or "Đã thanh lý" (red).
   - Room type and maximum occupancy (e.g., "Loại phòng • 4 người").
   - Contract date range (e.g., "01/01/2025 – 31/12/2025").
6. Tenant reviews the contract list and taps on a contract card.
7. **If the contract status is "active" or "expired" or "terminated":**
   - The system navigates to the Service screen for that room.
8. **If the contract status is "inactive":**
   - An alert appears: "Chưa thể đặt dịch vụ" with message "Phòng này thuộc hợp đồng chưa hiệu lực. Bạn chỉ có thể đặt dịch vụ kể từ ngày [startDate]."
   - The card is visually dimmed and non-interactive (disabled).
9. Tenant pulls down to refresh the list. A spinner appears and the list reloads.

**Alternative Flows:**

AF-1 Tenant has no contracts
1. The contract list is empty after loading.
2. An empty state is shown: home-alert icon, "Không có hợp đồng", subtitle "Bạn hiện chưa có hợp đồng nào. Vui lòng liên hệ quản lý."

AF-2 View inactive contract card
1. A contract has status "inactive".
2. The card is rendered with reduced opacity (dimmed).
3. The card displays an additional notice below the status badge: "Đặt dịch vụ từ ngày [startDate]" in an amber pill.
4. Tapping the card triggers the alert described in Normal Flow step 8.

AF-3 Pull-to-refresh
1. Tenant pulls down on the FlatList.
2. RefreshControl activates. The contract list is reloaded.
3. The list updates with the latest contract data.

AF-4 Loading fails
1. The system cannot retrieve the contract list.
2. An error state is shown with the error message.
3. Tenant may retry by pulling down to refresh.

**Exceptions:**

E1 - Loading fails
1. The system cannot retrieve the tenant's contracts.
2. An error alert is displayed: "Lỗi" — "Không thể tải danh sách phòng".
3. The loading spinner is replaced with the error message.
4. Tenant may retry by pulling down to refresh.

E2 - Contract without room data
1. A contract exists but has no roomId or roomId._id.
2. The contract is filtered out and not displayed in the list.

**Priority:**
High

**Frequency of Use:**
Regular — Tenant selects a room to view or book services.

**Business Rules:**
BR-01: Contracts without a valid roomId (or roomId._id) are excluded from the list.
BR-02: Status badges and dot colors:
  - active → green (#047857) with "Đang hiệu lực" and check-circle icon.
  - expired → red (#991B1B) with "Đã hết hạn" and clock-alert icon.
  - terminated → red (#991B1B) with "Đã thanh lý" and close-circle icon.
  - inactive → amber (#92400E) with "Chưa hiệu lực" and timer-sand icon.
  - pending → amber (#92400E) with "Chờ xử lý" and timer-sand icon.
  - unknown → grey (#374151) with the raw status text and help-circle icon.
BR-03: Inactive contracts are non-navigable. Tapping shows an alert with the contract start date.
BR-04: Inactive contract cards display an amber "Đặt dịch vụ từ ngày [startDate]" notice and are visually dimmed.
BR-05: Room details shown: room name, floor name, room type (typeName), and maximum occupancy (personMax).
BR-06: Contract date range is formatted as dd/mm/yyyy: "01/01/2025 – 31/12/2025".
BR-07: The header title is "Chọn phòng".
BR-08: Pull-to-refresh reloads the full contract list.

**Other Information:**
This screen serves as a contract/room selector before the tenant proceeds to view or book services. Only contracts with valid room associations are shown. Contracts that have not yet started (inactive) are displayed with clear visual and behavioral cues to prevent confusion. The screen is accessed before the Service List screen, and passes the selected contract ID as a navigation parameter.

**Assumptions:**
- Each contract includes: status, roomId (with name, floorId.name, roomTypeId.typeName, roomTypeId.personMax), startDate, endDate.
- Only contracts with a valid roomId are relevant for service booking.
- The contract status is one of: active, expired, terminated, inactive, pending, or an unknown value.
- The navigation passes the contract ID to the Service screen upon successful selection.
