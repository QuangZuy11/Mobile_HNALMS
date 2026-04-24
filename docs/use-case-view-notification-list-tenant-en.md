# VIEW NOTIFICATION LIST (TENANT)

**Description:**
Allows Tenant users to view their notification list in the mobile app. Notifications are fetched with pagination (20 per page), sorted newest-first. The screen supports three filter tabs: All, Unread, and Read. Read status is tracked locally using AsyncStorage (not server-side). Pull-to-refresh fetches new notifications and triggers lock-screen notifications for any new items that arrived since the last view. Infinite scroll loads more pages. Tapping a notification opens a detail modal and marks it as read locally.

**Trigger:**
Tenant navigates to the Notification tab/screen in the mobile app.

**Preconditions:**
PRE-1: User is authenticated as Tenant.

**Postconditions:**
POST-1: The notification list is displayed, sorted newest-first.
POST-2: Tapping a notification marks it as read locally and opens the detail modal.

**Normal Flow:**

1. The screen mounts via useFocusEffect, triggering hydrateReadState (load read IDs from AsyncStorage) and initialLoad.
2. The loading spinner appears. getMyNotificationsAPI is called with page=1, limit=20.
3. Notifications are sorted newest-first (by createdAt descending) on the client side, regardless of backend order.
4. The LAST_VIEWED_KEY timestamp is compared against each notification's createdAt. Any notification newer than the last viewed timestamp triggers a lock-screen notification via checkAndShowNotifications.
5. LAST_VIEWED_KEY is updated to the current timestamp after the check.
6. The list renders with 20 items per page. Each item shows:
   - A status badge: "Chưa đọc" (red bell icon) or "Đã đọc" (grey bell icon).
   - Title (max 2 lines).
   - Full date and time in Vietnamese format (dd/mm/yyyy HH:mm).
   - Content preview (max 2 lines).
   - A chevron-right icon on the right.
7. An unread badge count appears on the "Chưa đọc" filter tab: `Chưa đọc (N)`.
8. Tenant taps a notification item.
9. If the notification ID is not in readIds, it is added to readIds and persisted to AsyncStorage.
10. The NotificationDetailModal opens as a centered modal overlay. It displays:
    - Title.
    - Full formatted date: "Thứ X, dd MMMM yyyy lúc HH:mm" (Vietnamese locale via date-fns).
    - Content in plain text.
    - A red "Đóng" button to close.
11. Tenant taps "Đóng" or taps outside the modal overlay to close it.

**Alternative Flows:**

AF-1 Pull-to-refresh
1. Tenant pulls down on the list.
2. RefreshControl activates. onRefresh is called.
3. The list clears. The API is called with page=1. New lock-screen notifications are checked and shown. LAST_VIEWED_KEY is updated.
4. The list re-renders with fresh data.

AF-2 Load more (infinite scroll)
1. Tenant scrolls near the bottom (onEndReachedThreshold=0.3).
2. onLoadMore is triggered. isLoadingMore becomes true.
3. loadPage is called with page = current_page + 1, replace=false.
4. New items are appended to the list (merged, then re-sorted newest-first).
5. isLoadingMore becomes false. A small spinner appears at the bottom during load.

AF-3 Switch filter tab
1. Tenant taps "Tất cả", "Chưa đọc", or "Đã đọc" tab.
2. The filter state updates. filteredItems recomputes via useMemo.
3. The FlatList re-renders with the filtered subset.
4. If "Chưa đọc" is selected, the tab shows the count: "Chưa đọc (N)".

AF-4 Mark all as read
1. Tenant taps the check-all icon in the header (enabled only when items.length > 0).
2. All visible notification IDs are added to readIds.
3. readIds are persisted to AsyncStorage.
4. All items lose their unread styling. The unread count on the tab updates.

AF-5 Empty state — no notifications at all
1. The API returns an empty array.
2. An empty state is shown: bell icon, "Chưa có thông báo", subtitle "Bạn sẽ nhận được thông báo từ quản lí tòa nhà".

AF-6 Empty state — filter returns no results
1. Tenant is on "Chưa đọc" or "Đã đọc" tab, but no items match.
2. An empty state is shown: filter-off icon, specific message per filter ("Không có thông báo chưa đọc" / "Không có thông báo đã đọc" / "Không có kết quả"), subtitle "Hãy thử chọn bộ lọc khác".

AF-7 Error state
1. The API call throws an error.
2. An error state is shown: alert icon (red), error message text, and a "Thử lại" button.
3. Tapping "Thử lại" calls initialLoad again.

AF-8 Navigate away and return
1. Tenant navigates away from the screen (useFocusEffect cleanup sets didLoadOnFocusRef=false).
2. Tenant returns to the screen. useFocusEffect fires again.
3. Since didLoadOnFocusRef is false, hydrateReadState and initialLoad run again.
4. Fresh data is fetched.

AF-9 View notification already marked as read
1. Tenant taps a notification that is already in readIds.
2. No change to readIds. The detail modal opens directly.

**Exceptions:**

E1 - Hydrate Read State Fails
1. AsyncStorage.getItem(READ_KEY) throws an error.
2. setReadIds defaults to an empty Set. No crash occurs.

E2 - Persist Read State Fails
1. AsyncStorage.setItem(READ_KEY, ...) throws an error.
2. The error is caught silently. The UI still updates.

E3 - Load Notifications Fails
1. getMyNotificationsAPI throws an error.
2. setError is called with the error message. An error state is shown with a "Thử lại" button.

E4 - Lock Screen Notification Check Fails
1. checkAndShowNotifications throws an error.
2. The error is caught silently. The initial load continues.

E5 - LAST_VIEWED_KEY Fails
1. AsyncStorage.setItem(LAST_VIEWED_KEY, ...) throws an error.
2. The error is caught silently. No lock-screen notifications are shown.

**Priority:**
Medium

**Frequency of Use:**
Regular — Tenant checks notifications regularly via the mobile app.

**Business Rules:**
BR-01: PAGE_LIMIT = 20 items per page.
BR-02: Notifications are always sorted newest-first on the client side: sort by createdAt descending.
BR-03: Read status is managed client-side via AsyncStorage (READ_KEY = 'notification_read_ids'), not via the backend API.
BR-04: LAST_VIEWED_KEY = 'notification_last_viewed_at' stores the timestamp of the last screen visit.
BR-05: Lock-screen notifications are triggered for any notification where createdAt > lastViewedAt, via checkAndShowNotifications.
BR-06: LAST_VIEWED_KEY is updated AFTER the lock-screen check to avoid re-triggering.
BR-07: The filter state defaults to 'all'. Options: 'all' (Tất cả), 'unread' (Chưa đọc), 'read' (Đã đọc).
BR-08: unreadCount is computed as items where _id is not in readIds.
BR-09: The "Chưa đọc" filter tab label appends the unread count: `Chưa đọc (N)`.
BR-10: Tapping a notification adds its _id to readIds (if not already present) and persists to AsyncStorage before opening the detail modal.
BR-11: Mark-all-read adds all visible items' _ids to readIds and persists in one batch.
BR-12: The detail modal uses date-fns with Vietnamese locale to format: "EEEE, dd MMMM yyyy lúc HH:mm".
BR-13: The detail modal renders content as plain text (no HTML rendering on mobile).
BR-14: onEndReachedThreshold = 0.3 triggers load-more when the user scrolls to 30% from the bottom.
BR-15: didLoadOnFocusRef prevents duplicate loads on the same focus cycle. It resets to false on blur.
BR-16: The "check-all" header button is disabled (grey) when items.length === 0.
BR-17: Pagination state (current_page, total_pages, total_count) is merged from the API response (handles both flat and nested response structures: res.pagination or res.data.pagination).

**Other Information:**
This is a mobile React Native screen using FlatList for virtualized rendering. Read/unread tracking is entirely client-side using AsyncStorage, making it fast and offline-capable for read status. The lock-screen notification feature (checkAndShowNotifications) runs on each fresh load to surface new notifications since the user's last visit. The sort-by-createdAt client-side ensures correct ordering even if the backend returns items out of order. The detail modal is a centered dialog with a semi-transparent overlay, using React Native Modal with animationType="fade".

**Assumptions:**
The getMyNotificationsAPI returns notifications with fields: _id, title, content, createdAt, and optionally data.notifications and data.pagination. The checkAndShowNotifications function is available in notification.service and handles its own error catching. AsyncStorage is properly configured on the device. The date-fns locale (vi) is available for Vietnamese date formatting.
