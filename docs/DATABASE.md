# SmartWard — database design (ER diagram → MongoDB)

This file maps the hand-drawn ER diagram (blue = original, red = corrections) to the MongoDB collections in `backend/src/models`.

## Collections

| ER entity | Collection / structure | Attributes from the ER | Notes |
|---|---|---|---|
| **Ward** | `wards` | id, name | *total beds* and *occupied beds* are **derived** from the `beds` collection (`utils/wards.js`), so they can never drift. Also `description`, `managedBy`. |
| **Beds** (red) | `beds` | id, bed number | `ward` (→ Ward), `isOccupied`, `patientId` (→ Patient). Unique per (ward, bedNumber). |
| **Admin** | `users` where `role = "admin"` | id, name, email | No department, ward or manager. |
| **Doctor** | `users` where `role = "doctor"` | id, name, email, dept | + `ward`, `managedBy`. |
| **Nurse** | `users` where `role = "nurse"` | id, name, email, dept, status | + `ward`, `managedBy`. |
| **Patient** | `patients` | id, name, age, gender, admit date, allergy *(multi-valued → array)* | `ward`, `bed`, `assignedDoctor`, `assignedNurse`, `status`, `diagnosis`. |
| **Vital signs** | embedded in `patients.vitals[]` | id, temperature, blood pressure, pulse, respiratory rate | + `spo2`, `painScore`, `recordedBy`, `recordedAt`, and the red-pen **diagnosis** fields (`diagnosis`, `diagnosedBy`, `diagnosedAt`). |
| **Nursing notes** | embedded in `patients.nursingNotes[]` | id, date, note | `nurse` (author). |
| **Medication** | embedded in `patients.medications[]` | id, name, route, dose, frequency, start date, end date | `prescribedBy`. |
| **Schedule dose** | embedded in `medications.scheduledTimes[]` | id, time, status, administered date | `administeredAt`, `administeredBy`. |

Embedded = stored inside the parent document (read together, one query, no joins).

## Relationships and who is allowed to do what

| ER relationship | Cardinality | Implemented as | Role rule (enforced by the API) |
|---|---|---|---|
| Admin **manages** Ward | 1 : M | `ward.managedBy` | Only admins create / edit / delete wards. |
| Admin **manages** Doctor / Nurse | 1 : M | `user.managedBy` (the admin who added them) | Only admins add / edit / deactivate / remove staff. |
| Ward **has** Beds *(red)* | 1 : M | `bed.ward` | Only admins add / remove beds; occupied beds can't be removed. |
| Ward **has** Patient | 1 : M | `patient.ward` | Admin, doctor and nurse can admit; only a free bed is accepted. |
| Bed **holds** Patient *(red)* | 1 : 0..1 | `bed.patientId` + `patient.bed` | Kept in sync on admit, transfer, discharge and delete. |
| Ward **has** Doctor *(red)* | 1 : M | `user.ward` | Admin assigns staff to a ward. |
| Ward **has** Nurse *(red)* | 1 : M | `user.ward` | Admin assigns staff to a ward. |
| Doctor **treats** Patient | 1 : M | `patient.assignedDoctor` | Must be a user with role *doctor*. |
| Patient **has** Medication | 1 : M | `patient.medications[]` | Doctor orders / discontinues; nurse (or doctor) records doses. |
| Medication **scheduled as** Schedule dose | 1 : M | `medication.scheduledTimes[]` | Dose can only be given once; index validated. |
| Patient **has** Vital signs | 1 : M | `patient.vitals[]` | — |
| Nurse **records** Vital signs | 1 : M | `vitals.recordedBy` | **Nurse only** (doctors get 403). |
| Patient **noted in** Nursing notes | 1 : M | `patient.nursingNotes[]` | — |
| Nurse **writes** Nursing notes | 1 : M | `nursingNote.nurse` | **Nurse only** (doctors get 403). |
| Doctor **diagnoses** Vital signs *(red)* | 1 : M | `vitals.diagnosis / diagnosedBy / diagnosedAt` | **Doctor only** (`PATCH /api/patients/:id/vitals/:vitalId/diagnosis`). |

## Interpretations of the hand-written diagram
- The red box "diagnose" between Doctor and Vital signs is treated as a **relationship** (a doctor reviews a vital-signs record and writes a diagnosis).
- "round" on Medication is read as **route** (oral, IV, …); "admite date" on Schedule dose as **administered date**.
- The red "has" between Ward and Nurse / Doctor is read as one ward → many staff.

## Things in the app that are not in the ER diagram
Kept because existing screens use them — add them to the ER, or tell us to remove them:
`patients.status`, `patients.diagnosis`, `patients.assignedNurse`, `vitals.spo2`, `vitals.painScore`,
the embedded **ward rounds** (`patients.wardRounds[]`, written by doctors), the **notifications** collection,
`users.password` / `users.role` (needed to log in), `users.status` (also on doctors and admins), `wards.description`.
