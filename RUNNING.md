# Running SmartWard

1. Start MongoDB (Windows/macOS service, `docker run -d --name smartward-mongo -p 27017:27017 mongo:7`, or an Atlas URI in `backend/.env`).
2. Backend (terminal 1):  `cd backend && npm install && npm run seed && npm run dev`  -> http://localhost:5000/health
3. Frontend (terminal 2): `npm install && npm run dev`                                -> http://localhost:5173
Use Node 22 and npm. `npm run seed:clear` (in backend) empties the database.

Logins (after seeding)
- Doctor: ahmed.alfarouk@smartward.health / doctor123
- Nurse:  aisha.karimi@smartward.health  / nurse123
- Admin:  ibrahim.hassan@smartward.health / admin123

## What each role can do
**Doctor** – dashboard with today's rounds; guided *Start Ward Round* (priority queue, progress, "next patient");
ward-round notes; create / discontinue medication orders; add, edit, discharge and remove patients; patient history.
**Nurse** – dashboard (vitals due, medications due, recent activity); record vitals; administer doses; nursing notes;
add and remove patients.
**Admin** – dashboard with recent system activity; patients (register, edit, discharge, remove); wards (add, edit, delete);
beds (add, remove, assign a patient); users (add, edit, activate/deactivate, remove doctors/nurses/admins);
reports (occupancy, condition mix, 7-day activity, staff workload, CSV export, print).
**Everyone** – change password (sidebar).

## Safeguards
- A bed can't be double-booked; only free beds are offered when registering or moving a patient.
- Beds that are occupied can't be removed; wards with occupied beds can't be deleted.
- A doctor/nurse who still has patients can't be deleted (reassign first); you can't delete or deactivate yourself;
  the last administrator can't be removed.
- "Discharge" keeps the history and frees the bed; "Remove" permanently deletes the record (with a confirmation).
