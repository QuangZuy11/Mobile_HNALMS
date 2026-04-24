# VIEW NOTIFICATION DETAIL (TENANT)

**Description:**
Allows Tenant users to view the full details of a single notification in the mobile app. The detail modal is a centered dialog overlay displaying the notification title, formatted date and time (Vietnamese locale via date-fns), and the full notification content in plain text. The modal can be closed via the close button, the X button, or by tapping the overlay background.

**Trigger:**
Tenant taps a notification item in the NotificationListScreen.

**Preconditions:**
PRE-1: User is authenticated as Tenant.
PRE-2: A notification object is selected and passed as the notification prop.

**Postconditions:**
POST-1: The notification detail modal is displayed with the full title, datetime, and content.

**Normal Flow:**

1. Tenant taps a notification item in the NotificationListScreen.
2. The parent screen sets selectedNotification to the tapped item and modalVisible to true.
3. The NotificationDetailModal renders as a React Native Modal with animationType="fade" and transparent background.
4. The modal displays:
   - **Header**: A bell-ring icon in a red circle, title "Chi tiết", and a close (X) button on the right.
   - **Title**: The notification title (or content substring if title is missing).
   - **Datetime**: Formatted as "EEEE, dd MMMM yyyy lúc HH:mm" using date-fns with Vietnamese locale (vi).
   - **Divider**: A thin horizontal line separating metadata from content.
   - **Content**: The full notification content as plain text.
   - **Footer**: A full-width red "Đóng" button.
5. Tenant taps "Đóng" or the X button, or taps outside the modal overlay.
6. The modal closes. selectedNotification and modalVisible reset to null/false in the parent.

**Alternative Flows:**

AF-1 Close via overlay tap
1. Tenant taps the semi-transparent overlay background (outside the dialog).
2. onClose is called. The modal closes.

AF-2 Close via X button
1. Tenant taps the close (X) icon in the header.
2. onClose is called. The modal closes.

AF-3 Notification with missing title
1. The notification object has no title field.
2. The modal falls back to notification.content?.substring(0, 50) or notification.name or 'Thông báo' as the title.

AF-4 Notification with missing content
1. The notification object has no content field.
2. The fallback chain: content || message || body || 'Không có nội dung' is used.

AF-5 Notification with invalid date
1. createdAt is null, undefined, or produces an invalid Date.
2. Number.isNaN check prevents formatting. The time container is not rendered ( guarded by !!timeText).

AF-6 Keyboard avoiding behavior
1. The modal contains a KeyboardAvoidingView.
2. On iOS, behavior='padding' is applied. On Android, behavior='height' is applied.
3. The keyboard does not obscure the dialog content.

AF-7 Null notification prop
1. notification is null or undefined.
2. The component returns null — nothing is rendered.

**Exceptions:**

E1 - Invalid Notification Data
1. The notification object lacks critical fields.
2. The component uses fallback values for title and content to prevent crash.
3. The date field gracefully shows nothing if invalid.

**Priority:**
Medium

**Frequency of Use:**
Regular — triggered each time Tenant inspects a specific notification.

**Business Rules:**
BR-01: The modal uses animationType="fade" for smooth entrance/exit.
BR-02: The modal is transparent (transparent={true}) with a dark overlay background (rgba(0,0,0,0.5)).
BR-03: The dialog width is '95%' of screen width, max height '70%', min height 350.
BR-04: Date formatting: date-fns format() with 'EEEE, dd MMMM yyyy lúc HH:mm' and Vietnamese locale (vi).
BR-05: Title fallback chain: title || content?.substring(0,50) || name || 'Thông báo'.
BR-06: Content fallback chain: content || message || body || 'Không có nội dung'.
BR-07: The time container is only rendered if timeText is non-empty ( guarded by !!timeText).
BR-08: onRequestClose is bound to onClose for Android back button handling.
BR-09: The footer "Đóng" button is full-width with backgroundColor '#EF4444' (red).
BR-10: Content is rendered as plain text (no HTML rendering on mobile).

**Other Information:**
This is a standalone modal component (NotificationDetailModal) rendered by NotificationListScreen. It is not a navigation screen but a centered dialog overlay. The component is intentionally simple — no API calls, no state management, no read/unread tracking. Read status is handled by the parent (NotificationListScreen) before opening this modal. The KeyboardAvoidingView ensures the dialog remains usable when the keyboard appears on iOS.

**Assumptions:**
The notification prop contains at least one of: title, content, message, body, or name fields. The createdAt field (or created_at) is a valid date string parseable by new Date(). The date-fns library and Vietnamese locale (vi) are available. The parent correctly resets selectedNotification and modalVisible on close.
