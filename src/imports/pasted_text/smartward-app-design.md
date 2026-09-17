Design a modern, professional tablet-first healthcare application called “SmartWard – Hospital Ward Round & In-Patient Record Management System”.

Purpose:
SmartWard is designed to reduce the difficulties caused by handwritten hospital ward records. It helps authorized doctors and nurses manage admitted patient information, ward rounds, vital signs, medications, nursing notes, and patient history digitally.

Design style:
- Clean, professional healthcare UI
- Modern and minimal
- Calm blue/teal healthcare color palette
- White/light gray backgrounds
- Dark readable text
- Green for stable/completed states
- Orange for attention/pending states
- Red only for urgent/critical visual alerts
- Use Inter or a similar modern sans-serif font
- Rounded cards with subtle shadows
- Clear icons
- Large touch-friendly buttons and input fields
- Designed primarily for tablet landscape orientation
- Avoid excessive decoration
- Prioritize usability and fast information access
- The UI should look like a real hospital application, not a generic dashboard

Create the following prototype screens and connect them with realistic interactions:

1. LOGIN
- SmartWard logo/name
- “Hospital Ward Management System”
- User ID/email field
- Password field
- Login button
- Forgot password
- Clean healthcare illustration/icon

2. DOCTOR DASHBOARD
- Greeting: “Good Morning, Dr. Ahmed”
- Total assigned patients
- Today's ward rounds
- Patients requiring attention
- Today's ward-round list
- Patient cards showing bed number, patient name and status
- Quick actions: Patients, Ward Round, Notifications

3. NURSE DASHBOARD
- Assigned patients
- Vital signs due
- Medication due
- Recent nursing activities
- Quick actions for recording vitals and medication administration

4. WARD / BED VIEW
- Ward selector
- Medical Ward
- Total beds, occupied beds and available beds
- Visual grid of beds
- Each bed should show bed number, patient name and status
- Status indicators: Stable, Attention, Available
- Clicking an occupied bed opens the patient profile

5. PATIENT LIST
- Search bar
- Filter by ward/status
- Patient ID
- Patient name
- Bed number
- Ward
- Admission date
- Status
- View patient button

6. PATIENT PROFILE
- Patient name
- Patient ID
- Age
- Gender
- Ward and bed
- Admission date
- Allergies
- Current condition
- Latest vital signs
- Current medications
- Tabs:
  Overview
  Observations
  Medications
  History
- Buttons for Record Vitals and Ward Round

7. PATIENT HISTORY
Create a chronological timeline showing:
- Doctor ward-round records
- Vital-sign records
- Medication administration
- Nursing notes
- Date and time
- Staff member who created the record
Make this screen visually clear because it is one of the main purposes of the system: replacing difficult-to-search handwritten records with an organized digital history.

8. RECORD VITAL SIGNS
- Patient information at the top
- Temperature
- Blood pressure
- Pulse
- Respiratory rate
- SpO2
- Pain score
- Date/time
- Recorded by
- Save Observation button
- Show a confirmation message after saving

9. MEDICATION MANAGEMENT
- Patient information
- Current medications
- Medicine name
- Dose
- Route
- Frequency
- Start/end date
- Scheduled medication times
- Status: Pending / Administered
- Nurse can select “Mark as Administered”
- Show administration time and staff member

10. DOCTOR WARD ROUND
This should be the main feature of the prototype.
Show:
- Patient details
- Bed number
- Admission date
- Latest vital signs
- Current medications
- Previous ward-round notes
- Doctor's assessment field
- Clinical notes field
- Treatment plan field
- Next review date
- Save Ward Round button
After saving, show a success confirmation and add the new record to the patient's history.

11. NURSING NOTES
- Patient information
- Previous nursing notes
- Date/time
- Nurse name
- Add new nursing note
- Save note button

12. NOTIFICATIONS
- Medication due
- Vital signs due
- Pending ward rounds
- Other system notifications
Use simple notification cards.

ADMIN WEB PANEL:
Create a separate desktop-style admin interface.

13. ADMIN DASHBOARD
- Total patients
- Occupied beds
- Available beds
- Doctors
- Nurses
- Ward overview
- Recent system activity

14. PATIENT MANAGEMENT
- Patient table
- Search
- Add patient
- Edit patient
- View patient
- Admission status
- Ward and bed assignment

15. WARD & BED MANAGEMENT
- List of wards
- Number of beds
- Occupied/available beds
- Add/edit wards
- Add/edit beds
- Assign patient to bed

16. USER MANAGEMENT
- Doctors
- Nurses
- Administrators
- User status
- Add/edit/deactivate user
- Role assignment

USER ROLES:
Administrator:
- Manage users
- Manage patients
- Manage wards and beds
- View reports

Doctor:
- View assigned patients
- View patient history
- Conduct ward rounds
- Add clinical notes
- Add treatment plans
- Create medication orders

Nurse:
- View assigned patients
- Record vital signs
- Add nursing notes
- View medication schedules
- Record medication administration

IMPORTANT:
- Do not include billing, pharmacy inventory, laboratory management, insurance, appointments, AI diagnosis, or disease prediction.
- This is specifically a ward-round and in-patient record management system.
- Do not make medical diagnoses or treatment recommendations automatically.
- Use fictional/dummy patient information only.
- Keep the interface realistic but appropriate for a university final-year prototype.
- Make the tablet interface highly usable during ward rounds.
- Use reusable components and maintain consistent spacing, typography, buttons, cards, navigation, and status indicators.
- Create clickable prototype interactions between the main screens.

PRIMARY DEMONSTRATION FLOW:
Login → Doctor Dashboard → Today's Ward Round → Patient Profile → Patient History → Vital Signs → Medication → Ward Round → Save → Updated Patient History.

SECONDARY NURSE FLOW:
Login → Nurse Dashboard → My Patients → Patient Profile → Record Vital Signs → Medication → Mark as Administered → Nursing Note.

ADMIN FLOW:
Admin Login → Admin Dashboard → Patient Management → Register Patient → Assign Ward → Assign Bed.

The final prototype should look polished, realistic, professional, and suitable for presenting as a university IT project.