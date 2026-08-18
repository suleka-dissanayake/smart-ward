# SmartWard

**Hospital Ward Round & In-Patient Record Management System**

SmartWard is a tablet-first web application that helps doctors, nurses, and ward administrators manage admitted patients from a single, organised system — replacing scattered handwritten ward charts with structured, searchable digital records.

---

## Table of Contents

- [About the Project](#about-the-project)
- [Project Scope](#project-scope)
- [Features](#features)
- [User Roles](#user-roles)
- [Tech Stack](#tech-stack)
- [Screens](#screens)
- [Data Model](#data-model)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [Contributors](#contributors)
- [Supervisor](#supervisor)
- [License](#license)

---

## About the Project

Most hospital wards still rely on handwritten charts and fragmented digital tools. This creates real risks to patient care — illegible handwriting, lost or misfiled records, no real-time visibility of bed/ward status, and difficulty tracing who recorded or administered what, and when.

SmartWard focuses on digitising the **ward-round workflow**: vital signs, medications, clinical/nursing notes, and patient history, in a fast, tablet-friendly interface designed for bedside use.

## Project Scope

**In scope**
- Ward round documentation
- Vital signs recording
- Medication tracking
- Nursing notes
- Patient history timeline
- Ward & bed management

## Features

- 🛏️ **Real-time ward & bed visibility** — live grid of beds with occupancy and patient status
- 📋 **Digital ward rounds** — structured assessment, clinical notes, treatment plan, and next-review date
- ❤️ **Vital signs capture** — temperature, blood pressure, pulse, respiratory rate, SpO₂, and pain score
- 💊 **Medication tracking** — dose, route, frequency, and scheduled-dose administration logging
- 🕓 **Unified patient history** — chronological timeline combining ward rounds, vitals, medications, and nursing notes
- 📝 **Nursing notes** — time-stamped notes logged by nursing staff
- 🔔 **Notifications** — medications due, vitals due, and pending ward rounds
- 🔐 **Role-based access** — separate, purpose-built workflows for Doctors, Nurses, and Administrators
- 🖥️ **Admin panel** — manage patients, wards/beds, and user accounts

## User Roles

| Role | Capabilities |
|---|---|
| **Doctor** | View assigned patients & full history · Conduct ward rounds (assessment, clinical notes, treatment plan) · Add clinical notes · Create medication orders |
| **Nurse** | View assigned patients · Record vital signs · Add nursing notes · Administer & log scheduled medications |
| **Administrator** | Manage doctor/nurse/admin accounts · Register and manage patient records · Manage wards, beds & assignments · View system-wide reports |

## Tech Stack

| Layer | Technology |
|---|---|
| UI Library | [React 19](https://react.dev) |
| Language | [TypeScript](https://www.typescriptlang.org) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Build Tool | [Vite](https://vitejs.dev) |
| Package Manager | [pnpm](https://pnpm.io) |

The app was prototyped screen-by-screen for all three roles, then built as reusable React components (e.g. `Sidebar`, `StatusBadge`) sharing a consistent design system — cards, typography, spacing, and colour-coded status indicators — across every screen.

## Screens

| Screen | Description |
|---|---|
| Login | Role-based sign-in |
| Doctor Dashboard | Overview for assigned patients & pending ward rounds |
| Nurse Dashboard | Overview for assigned patients & pending tasks |
| Ward & Bed View | Live grid of beds with occupancy & patient status |
| Patient List | Searchable list of patients |
| Patient Profile | Demographics, allergies, condition & tabbed overview |
| Ward Round | Assessment, clinical notes, treatment plan & review date |
| Record Vitals | Vitals entry form |
| Medication Management | Orders, schedules & administration tracking |
| Patient History | Chronological timeline of all clinical records |
| Nursing Notes | Time-stamped nursing notes |
| Notifications | Medication/vitals due & pending ward rounds |
| Admin Dashboard | System-wide overview |
| Admin – Patients | Manage patient records |
| Admin – Wards | Manage wards & beds |
| Admin – Users | Manage doctor/nurse/admin accounts |
| ER Diagram | Entity-relationship view of the data model |

## Data Model

Core TypeScript types link every screen to a shared patient record — an entry a doctor makes during a ward round appears instantly in **Patient History**.

- `Patient` — demographics, status (`Stable` / `Attention` / `Critical` / `Discharged`), assigned staff
- `VitalSigns` — temperature, blood pressure, pulse, respiratory rate, SpO₂, pain score
- `Medication` / `ScheduledDose` — dose, route, frequency, and per-dose administration status
- `WardRoundNote` — assessment, clinical notes, treatment plan, next review
- `NursingNote` — time-stamped notes by nursing staff
- `HistoryEntry` — unified, chronological timeline entry (ward round, vitals, medication, nursing note, admission)

See [`src/types.ts`](./src/types.ts) for the full definitions.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (LTS recommended)
- [pnpm](https://pnpm.io/installation)

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/smartward.git
cd smartward

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The app will be available at `http://localhost:5173` (default Vite port).

### Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Build the app for production |
| `pnpm preview` | Preview the production build locally |
| `pnpm format` | Format the codebase |

## Project Structure

```
smartward/
├── src/
│   ├── components/     # Reusable UI components (Sidebar, StatusBadge, ...)
│   ├── data/           # Mock data used during development
│   ├── screens/        # One file per app screen (Login, WardRound, ...)
│   ├── App.tsx          # Root component & navigation
│   ├── types.ts        # Shared TypeScript types & data model
│   ├── index.css       # Global styles / Tailwind entry
│   └── main.tsx        # App entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Roadmap

- [ ] Backend API & persistent database
- [ ] Authentication & authorization (JWT / sessions)
- [ ] Automated testing (unit & integration)
- [ ] Deployment pipeline
- [ ] Accessibility audit

## Contributors

| Name | Registration No. |
|---|---|
| K. K. D M. Sulakshana | 2022/ICT/30 |
| P. Bimsara | 2022/ICT/31 |
| N. S. Chandrasekara | 2022/ICT/65 |
| S. S. Ahmed | 2022/ICT/66 |
| S. A. Dissanayake | 2022/ICT/81 |
| N. Ranathunga | 2022/ICT/93 |

## Supervisor

Miss. A. Ann Sinthusa — Faculty of Applied Science — University of Vavuniya

## License

This project was developed for academic purposes as part of IT 3162 at University of Vavuniya.
