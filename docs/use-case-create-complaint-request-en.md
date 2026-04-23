# CREATE COMPLAINT REQUEST

**Description:**
Allows Tenant to submit a complaint request by selecting a complaint category and entering a detailed description. The complaint is validated before submission and the Tenant receives a confirmation upon successful creation.

**Trigger:**
Tenant taps the "Yêu cầu khiếu nại" card on the Request List screen.

**Preconditions:**
PRE-1: Tenant has successfully logged in.
PRE-2: The mobile device has an active Internet connection.

**Postconditions:**
POST-1: If the complaint is submitted successfully, it appears in Tenant's request list.
POST-2: Tenant is navigated back to the Request List screen after confirmation.

**Normal Flow:**
User Create Complaint Request Process

1. Tenant opens the Create Complaint Request screen.
2. The system displays a form with:
   - A category selection grid with six complaint types: Tiếng ồn, Vệ sinh, An ninh, Cơ sở vật chất, Thái độ phục vụ, Khác.
   - A multi-line text input field for entering the complaint description, with a character counter (0/2000).
   - A warning box reminding Tenant to provide accurate information.
   - An info box stating complaints will be reviewed within 1-2 business days.
   - A "Gửi khiếu nại" submit button at the bottom.
3. Tenant selects one complaint category from the grid.
4. Tenant enters the complaint content in the text area. The character count updates in real-time.
5. Tenant taps "Gửi khiếu nại".
6. The system validates:
   - A category must be selected.
   - The content must not be empty.
   - The content must be at least 10 characters long.
   - The content must not exceed 2000 characters.
   If any validation fails, the system displays an alert with the specific error message.
7. On successful validation, the system submits the complaint to the server. While submitting, the button shows a loading spinner and is disabled.
8. On success, the system displays an alert: "Thành công" with message "Khiếu nại của bạn đã được gửi thành công. Chúng tôi sẽ xem xét và phản hồi sớm nhất."
9. Tenant taps "OK" and is navigated back to the Request List screen.

**Alternative Flows:**

AF-1 Tenant changes category before submitting
1. Tenant taps a different category button to reselect.
2. The system updates the selected category and highlights the new selection with a red border and pink background.

AF-2 Tenant cancels before submitting
1. Tenant taps the back button in the header.
2. The system navigates Tenant back to the Request List screen without submitting any data.

AF-3 Tenant clears the text input
1. Tenant taps the text area and deletes all content.
2. The character count shows "0/2000" and the submit button remains enabled but validation will fail upon submission.

**Exceptions:**

E1 No Category Selected
1. Tenant taps "Gửi khiếu nại" without selecting a category.
2. The system displays an alert: "Vui lòng chọn loại khiếu nại."

E2 Empty Content
1. Tenant taps "Gửi khiếu nại" without entering any content.
2. The system displays an alert: "Vui lòng nhập nội dung khiếu nại."

E3 Content Too Short
1. Tenant enters content with fewer than 10 characters.
2. The system displays an alert: "Nội dung khiếu nại phải có ít nhất 10 ký tự."

E4 Content Too Long
1. Tenant enters content exceeding 2000 characters.
2. The text input blocks further input once the limit is reached. The character counter displays "2000/2000".

E5 Submission Fails
1. The system cannot connect to the server or the server returns an error.
2. The system displays an alert with the error message. The submit button is re-enabled and Tenant may attempt to submit again.

**Priority:**
High

**Frequency of Use:**
Occasional (as needed when a complaint arises)

**Business Rules:**
BR-01: The complaint category is mandatory. The system uses a grid layout with six pre-defined categories.
BR-02: The complaint content must be between 10 and 2000 characters.
BR-03: The character counter updates in real-time and is displayed below the text input.
BR-04: The submit button is disabled and shows a loading spinner during submission.
BR-05: The system uses a red accent theme for this screen to match the complaint request type.
BR-06: The selected category is visually highlighted with a red border and light red background.
BR-07: A warning box reminds Tenant that false complaints will be handled according to regulations.
BR-08: An info box informs Tenant of the expected review timeline of 1-2 business days.

**Other Information:**
The form uses a card-based layout with a sticky submit button at the bottom. Category selection buttons use a pill-style grid with two columns. The warning box has a yellow left border and the info box has a blue left border. The submit button turns gray while loading. The interface supports proper display on phone models with a notch design or Dynamic Island.

**Assumptions:**
The server is online and the complaint category values match those defined in the system.
