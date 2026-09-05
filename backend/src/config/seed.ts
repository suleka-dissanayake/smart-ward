import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./db";
import User from "../models/User";
import Ward from "../models/Ward";
import Patient from "../models/Patient";
import Notification from "../models/Notification";

const makeBeds = (prefix: string, count: number) =>
  Array.from({ length: count }, (_, i) => ({
    bedNumber: `${prefix}-${String(i + 1).padStart(2, "0")}`,
    isOccupied: false,
  }));

async function seed() {
  await connectDB();
  console.log("🌱 Seeding SmartWard database...\n");

  await Promise.all([
    User.deleteMany({}),
    Ward.deleteMany({}),
    Patient.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  // ── Users ──────────────────────────────────────────────────────────────────
  const [ahmed, sarah, yusuf, aisha, james, leila, ibrahim] = await User.create([
    { name: "Dr. Ahmed Al-Farouk",  email: "ahmed.alfarouk@smartward.health",  password: "doctor123", role: "doctor", department: "Internal Medicine", status: "Active" },
    { name: "Dr. Sarah Mitchell",   email: "sarah.mitchell@smartward.health",   password: "doctor123", role: "doctor", department: "Surgery",           status: "Active" },
    { name: "Dr. Yusuf Osman",      email: "yusuf.osman@smartward.health",      password: "doctor123", role: "doctor", department: "Cardiology",        status: "Active" },
    { name: "Nurse Aisha Karimi",   email: "aisha.karimi@smartward.health",     password: "nurse123",  role: "nurse",  department: "Medical Ward",      status: "Active" },
    { name: "Nurse James Okonkwo",  email: "james.okonkwo@smartward.health",    password: "nurse123",  role: "nurse",  department: "Surgical Ward",     status: "Active" },
    { name: "Nurse Leila Nour",     email: "leila.nour@smartward.health",       password: "nurse123",  role: "nurse",  department: "Medical Ward",      status: "Active" },
    { name: "Ibrahim Hassan",       email: "ibrahim.hassan@smartward.health",   password: "admin123",  role: "admin",  department: "Administration",    status: "Active" },
  ]);
  console.log("✔ Users created (7)");

  // ── Wards ──────────────────────────────────────────────────────────────────
  const [medWard, surgWard, cardWard, respWard] = await Ward.create([
    { name: "Medical Ward A",     totalBeds: 20, beds: makeBeds("A", 20) },
    { name: "Surgical Ward B",    totalBeds: 16, beds: makeBeds("B", 16) },
    { name: "Cardiac Ward C",     totalBeds: 12, beds: makeBeds("C", 12) },
    { name: "Respiratory Ward D", totalBeds: 10, beds: makeBeds("D", 10) },
  ]);
  console.log("✔ Wards created (4)");

  // ── Patients ───────────────────────────────────────────────────────────────
  const patients = await Patient.create([
    // P-10042 Mohammed Al-Rashidi
    {
      name: "Mohammed Al-Rashidi", age: 67, gender: "Male",
      ward: medWard._id, bed: "A-04", admissionDate: new Date("2026-08-10"),
      status: "Attention", diagnosis: "Hypertension with Diabetic Nephropathy",
      allergies: ["Penicillin", "Sulfonamides"],
      assignedDoctor: ahmed._id, assignedNurse: aisha._id,
      vitals: [{
        temperature: "37.8°C", bloodPressure: "158/96 mmHg", pulse: "88 bpm",
        respiratoryRate: "18/min", spo2: "97%", painScore: 3,
        recordedAt: new Date("2026-08-16T07:30:00"), recordedBy: aisha._id,
      }],
      medications: [
        { name: "Amlodipine", dose: "10 mg", route: "Oral", frequency: "Once daily",
          startDate: new Date("2026-08-10"), endDate: new Date("2026-08-24"),
          prescribedBy: ahmed._id,
          scheduledTimes: [
            { time: "08:00", status: "Administered", administeredAt: new Date("2026-08-16T08:05:00"), administeredBy: aisha._id },
            { time: "20:00", status: "Pending" },
          ] },
        { name: "Metformin", dose: "500 mg", route: "Oral", frequency: "Twice daily",
          startDate: new Date("2026-08-10"), endDate: new Date("2026-08-24"),
          prescribedBy: ahmed._id,
          scheduledTimes: [
            { time: "08:00", status: "Administered", administeredAt: new Date("2026-08-16T08:07:00"), administeredBy: aisha._id },
            { time: "20:00", status: "Pending" },
          ] },
        { name: "Furosemide", dose: "40 mg", route: "IV", frequency: "Once daily",
          startDate: new Date("2026-08-12"), endDate: new Date("2026-08-18"),
          prescribedBy: ahmed._id,
          scheduledTimes: [
            { time: "10:00", status: "Administered", administeredAt: new Date("2026-08-16T10:10:00"), administeredBy: aisha._id },
          ] },
      ],
      wardRounds: [
        { date: new Date("2026-08-15T09:00:00"), doctor: ahmed._id,
          assessment: "Patient remains hypertensive despite current regimen. Renal function slightly impaired. Oedema improving.",
          clinicalNotes: "BP 160/98 on review. Creatinine 142 μmol/L. Urine output adequate at 55 mL/hr. No chest pain or dyspnoea.",
          treatmentPlan: "Continue Amlodipine and Furosemide. Add Ramipril 2.5 mg OD. Repeat U&E tomorrow morning. Low-salt diet reinforced.",
          nextReview: new Date("2026-08-17") },
        { date: new Date("2026-08-12T10:15:00"), doctor: ahmed._id,
          assessment: "Newly admitted with uncontrolled hypertension. Bilateral ankle oedema noted. BGL elevated.",
          clinicalNotes: "Conscious and oriented. BP 168/102 on admission. Mild periorbital puffiness. Random BGL 14.2 mmol/L.",
          treatmentPlan: "Start Amlodipine, Metformin, and Furosemide IV. Restrict fluids to 1.5 L/day. Daily bloods.",
          nextReview: new Date("2026-08-14") },
      ],
      nursingNotes: [
        { date: new Date("2026-08-16T06:00:00"), nurse: aisha._id,
          note: "Patient slept well. Urinated 3 times overnight. Morning BP 158/96. No complaints. Diet taken fully at breakfast." },
        { date: new Date("2026-08-15T22:00:00"), nurse: leila._id,
          note: "Evening medications administered. Patient anxious about kidney results. Reassured and explained monitoring plan. BP 162/100 at 22:00." },
      ],
    },

    // P-10078 Fatima Hassan
    {
      name: "Fatima Hassan", age: 45, gender: "Female",
      ward: surgWard._id, bed: "B-12", admissionDate: new Date("2026-08-14"),
      status: "Stable", diagnosis: "Post-op Laparoscopic Cholecystectomy",
      allergies: ["NSAIDs"],
      assignedDoctor: sarah._id, assignedNurse: james._id,
      vitals: [{
        temperature: "36.9°C", bloodPressure: "118/74 mmHg", pulse: "76 bpm",
        respiratoryRate: "16/min", spo2: "99%", painScore: 2,
        recordedAt: new Date("2026-08-16T07:00:00"), recordedBy: james._id,
      }],
      medications: [
        { name: "Paracetamol", dose: "1 g", route: "IV", frequency: "Every 6 hours",
          startDate: new Date("2026-08-14"), endDate: new Date("2026-08-17"),
          prescribedBy: sarah._id,
          scheduledTimes: [
            { time: "06:00", status: "Administered", administeredAt: new Date("2026-08-16T06:10:00"), administeredBy: james._id },
            { time: "12:00", status: "Pending" },
            { time: "18:00", status: "Pending" },
            { time: "00:00", status: "Administered", administeredAt: new Date("2026-08-16T00:05:00"), administeredBy: leila._id },
          ] },
      ],
      wardRounds: [
        { date: new Date("2026-08-16T08:30:00"), doctor: sarah._id,
          assessment: "Post-op day 2. Good recovery. Wound clean, no signs of infection. Tolerating oral fluids.",
          clinicalNotes: "Afebrile, abdomen soft. Port site wounds clean and dry. Passing flatus. Mobilising well with nursing support.",
          treatmentPlan: "Step down IV paracetamol to oral. Advance diet to soft solids. Plan for discharge on day 3 if progressing well.",
          nextReview: new Date("2026-08-17") },
      ],
      nursingNotes: [
        { date: new Date("2026-08-16T06:30:00"), nurse: james._id,
          note: "Patient comfortable. Slept well. Wound dressing intact and dry. Tolerating clear fluids. Mobilised to bathroom independently." },
      ],
    },

    // P-10091 Omar Yusuf
    {
      name: "Omar Yusuf", age: 52, gender: "Male",
      ward: respWard._id, bed: "D-03", admissionDate: new Date("2026-08-13"),
      status: "Attention", diagnosis: "COPD Exacerbation",
      allergies: [],
      assignedDoctor: ahmed._id, assignedNurse: aisha._id,
      vitals: [{
        temperature: "38.1°C", bloodPressure: "132/84 mmHg", pulse: "102 bpm",
        respiratoryRate: "24/min", spo2: "92%", painScore: 4,
        recordedAt: new Date("2026-08-16T06:45:00"), recordedBy: aisha._id,
      }],
      medications: [
        { name: "Salbutamol Nebulisation", dose: "2.5 mg", route: "Nebulised", frequency: "Every 4 hours",
          startDate: new Date("2026-08-13"), endDate: new Date("2026-08-20"),
          prescribedBy: ahmed._id,
          scheduledTimes: [
            { time: "06:00", status: "Administered", administeredAt: new Date("2026-08-16T06:15:00"), administeredBy: aisha._id },
            { time: "10:00", status: "Pending" },
          ] },
        { name: "Prednisolone", dose: "40 mg", route: "Oral", frequency: "Once daily",
          startDate: new Date("2026-08-13"), endDate: new Date("2026-08-18"),
          prescribedBy: ahmed._id,
          scheduledTimes: [
            { time: "08:00", status: "Administered", administeredAt: new Date("2026-08-16T08:10:00"), administeredBy: aisha._id },
          ] },
      ],
      wardRounds: [
        { date: new Date("2026-08-15T09:30:00"), doctor: ahmed._id,
          assessment: "SpO2 improving on controlled oxygen. Still requiring frequent nebulisations. Work of breathing reduced compared to admission.",
          clinicalNotes: "On 2L/min O2 via nasal prongs. Chest clear to auscultation. CXR shows hyperinflation, no new consolidation.",
          treatmentPlan: "Continue nebulisations and Prednisolone. Add Amoxicillin-Clavulanate 875/125 mg BD empirically. Target SpO2 88-92%. Daily review.",
          nextReview: new Date("2026-08-16") },
      ],
      nursingNotes: [
        { date: new Date("2026-08-16T06:50:00"), nurse: aisha._id,
          note: "SpO2 92% on 2L O2. RR 24. Patient appears more comfortable than yesterday. Morning nebulisation completed. Encouraged deep breathing exercises." },
      ],
    },

    // P-10103 Sarah Al-Zahra
    {
      name: "Sarah Al-Zahra", age: 38, gender: "Female",
      ward: medWard._id, bed: "A-11", admissionDate: new Date("2026-08-15"),
      status: "Stable", diagnosis: "Community-Acquired Pneumonia",
      allergies: ["Erythromycin"],
      assignedDoctor: ahmed._id, assignedNurse: aisha._id,
      vitals: [{
        temperature: "37.4°C", bloodPressure: "122/78 mmHg", pulse: "84 bpm",
        respiratoryRate: "18/min", spo2: "96%", painScore: 2,
        recordedAt: new Date("2026-08-16T07:15:00"), recordedBy: aisha._id,
      }],
      medications: [
        { name: "Amoxicillin-Clavulanate", dose: "875/125 mg", route: "Oral", frequency: "Twice daily",
          startDate: new Date("2026-08-15"), endDate: new Date("2026-08-22"),
          prescribedBy: ahmed._id,
          scheduledTimes: [
            { time: "08:00", status: "Administered", administeredAt: new Date("2026-08-16T08:12:00"), administeredBy: aisha._id },
            { time: "20:00", status: "Pending" },
          ] },
      ],
      wardRounds: [], nursingNotes: [],
    },

    // P-10057 Khalid Mansour
    {
      name: "Khalid Mansour", age: 71, gender: "Male",
      ward: cardWard._id, bed: "C-06", admissionDate: new Date("2026-08-08"),
      status: "Critical", diagnosis: "Decompensated Heart Failure",
      allergies: ["Aspirin"],
      assignedDoctor: yusuf._id, assignedNurse: leila._id,
      vitals: [{
        temperature: "36.6°C", bloodPressure: "142/92 mmHg", pulse: "110 bpm",
        respiratoryRate: "26/min", spo2: "90%", painScore: 5,
        recordedAt: new Date("2026-08-16T06:00:00"), recordedBy: leila._id,
      }],
      medications: [
        { name: "Furosemide", dose: "80 mg", route: "IV", frequency: "Twice daily",
          startDate: new Date("2026-08-08"), endDate: new Date("2026-08-20"),
          prescribedBy: yusuf._id,
          scheduledTimes: [
            { time: "06:00", status: "Administered", administeredAt: new Date("2026-08-16T06:05:00"), administeredBy: leila._id },
            { time: "14:00", status: "Pending" },
          ] },
        { name: "Bisoprolol", dose: "5 mg", route: "Oral", frequency: "Once daily",
          startDate: new Date("2026-08-08"), endDate: new Date("2026-08-30"),
          prescribedBy: yusuf._id,
          scheduledTimes: [
            { time: "08:00", status: "Administered", administeredAt: new Date("2026-08-16T08:08:00"), administeredBy: leila._id },
          ] },
      ],
      wardRounds: [], nursingNotes: [],
    },

    // P-10115 Leila Basha
    {
      name: "Leila Basha", age: 29, gender: "Female",
      ward: surgWard._id, bed: "B-07", admissionDate: new Date("2026-08-16"),
      status: "Stable", diagnosis: "Appendicitis – Post-op Appendicectomy",
      allergies: [],
      assignedDoctor: sarah._id, assignedNurse: james._id,
      vitals: [{
        temperature: "37.0°C", bloodPressure: "114/70 mmHg", pulse: "72 bpm",
        respiratoryRate: "14/min", spo2: "99%", painScore: 3,
        recordedAt: new Date("2026-08-16T08:00:00"), recordedBy: james._id,
      }],
      medications: [
        { name: "Morphine", dose: "5 mg", route: "IV PRN", frequency: "Every 4–6 hours as needed",
          startDate: new Date("2026-08-16"), endDate: new Date("2026-08-18"),
          prescribedBy: sarah._id,
          scheduledTimes: [
            { time: "07:00", status: "Administered", administeredAt: new Date("2026-08-16T07:15:00"), administeredBy: james._id },
          ] },
      ],
      wardRounds: [], nursingNotes: [],
    },
  ]);
  console.log(`✔ Patients created (${patients.length})`);

  // ── Mark occupied beds in wards ────────────────────────────────────────────
  const bedUpdates = [
    { ward: medWard._id,  beds: ["A-04", "A-11"] },
    { ward: surgWard._id, beds: ["B-07", "B-12"] },
    { ward: cardWard._id, beds: ["C-06"] },
    { ward: respWard._id, beds: ["D-03"] },
  ];
  for (const { ward, beds } of bedUpdates) {
    await Ward.updateOne(
      { _id: ward },
      { $set: { "beds.$[el].isOccupied": true } },
      { arrayFilters: [{ "el.bedNumber": { $in: beds } }] }
    );
  }
  console.log("✔ Bed occupancy updated");

  // ── Notifications ──────────────────────────────────────────────────────────
  await Notification.create([
    { title: "Critical Alert",    message: "Khalid Mansour: SpO2 dropped to 90% — immediate review required.", type: "critical", recipientRole: "doctor", createdBy: ibrahim._id },
    { title: "Attention Patient", message: "Mohammed Al-Rashidi BP remains elevated at 158/96 mmHg.", type: "alert",    recipientRole: "doctor", createdBy: ibrahim._id },
    { title: "Medication Due",    message: "Omar Yusuf: Salbutamol nebulisation due at 10:00.",          type: "task",    recipientRole: "nurse",  createdBy: ibrahim._id },
    { title: "Medication Due",    message: "Mohammed Al-Rashidi: Amlodipine & Metformin due at 20:00.",  type: "task",    recipientRole: "nurse",  createdBy: ibrahim._id },
    { title: "New Admission",     message: "Leila Basha admitted to Surgical Ward B, Bed B-07.",         type: "info",    recipientRole: "all",    createdBy: ibrahim._id },
    { title: "Ward Round Due",    message: "Dr. Yusuf Osman: Khalid Mansour ward round overdue.",        type: "alert",   recipientRole: "doctor", createdBy: ibrahim._id },
  ]);
  console.log("✔ Notifications created (6)");

  console.log("\n✅ Seed complete!\n");
  console.log("Login credentials");
  console.log("─────────────────────────────────────────────────────");
  console.log("Role    │ Email                              │ Password");
  console.log("─────────────────────────────────────────────────────");
  console.log("Doctor  │ ahmed.alfarouk@smartward.health    │ doctor123");
  console.log("Doctor  │ sarah.mitchell@smartward.health    │ doctor123");
  console.log("Doctor  │ yusuf.osman@smartward.health       │ doctor123");
  console.log("Nurse   │ aisha.karimi@smartward.health      │ nurse123");
  console.log("Nurse   │ james.okonkwo@smartward.health     │ nurse123");
  console.log("Nurse   │ leila.nour@smartward.health        │ nurse123");
  console.log("Admin   │ ibrahim.hassan@smartward.health    │ admin123");
  console.log("─────────────────────────────────────────────────────\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
