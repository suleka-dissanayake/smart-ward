import { Router, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import Patient from "../models/Patient";
import Ward from "../models/Ward";
import { protect, authorize, AuthRequest } from "../middleware/auth";
import { createError } from "../middleware/errorHandler";
import { assertBedFree, occupyBed, freeBed } from "../utils/beds";

const router = Router();
router.use(protect);

router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.ward) filter.ward = req.query.ward;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.doctor) filter.assignedDoctor = req.query.doctor;
    if (req.query.nurse) filter.assignedNurse = req.query.nurse;

    const patients = await Patient.find(filter)
      .populate("ward", "name")
      .populate("assignedDoctor", "name")
      .populate("assignedNurse", "name")
      .sort({ admissionDate: -1 });

    res.json({ success: true, count: patients.length, data: patients });
  } catch (err) {
    next(err);
  }
});

// GET /api/patients/:id
router.get("/:id", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate("ward", "name")
      .populate("assignedDoctor", "name department")
      .populate("assignedNurse", "name department")
      .populate("vitals.recordedBy", "name")
      .populate("medications.prescribedBy", "name")
      .populate("wardRounds.doctor", "name")
      .populate("nursingNotes.nurse", "name");
    if (!patient) return next(createError("Patient not found", 404));
    res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
});

// POST /api/patients — admit a patient (admin, doctor or nurse)
router.post(
  "/",
  authorize("admin", "doctor", "nurse"),
  [
    body("name").notEmpty().trim(),
    body("age").isInt({ min: 0 }),
    body("gender").isIn(["Male", "Female"]),
    body("ward").notEmpty(),
    body("bed").notEmpty(),
    body("admissionDate").isISO8601(),
    body("diagnosis").notEmpty(),
    body("assignedDoctor").notEmpty(),
    body("assignedNurse").notEmpty(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(createError("Invalid input", 400));

    try {
      const { name, age, gender, ward, bed, admissionDate, diagnosis, allergies, status, assignedDoctor, assignedNurse } = req.body;

      // Refuse to double-book a bed (or use a bed that doesn't exist).
      await assertBedFree(ward, bed);

      const patient = await Patient.create({
        name, age, gender, ward, bed, admissionDate, diagnosis,
        allergies, status: status === "Discharged" ? "Stable" : status,
        assignedDoctor, assignedNurse,
      });

      try {
        await occupyBed(ward, bed, patient._id);
      } catch (err) {
        await patient.deleteOne(); // don't leave a patient without a bed
        throw err;
      }

      res.status(201).json({ success: true, data: patient });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/patients/:id — edit details, transfer bed, or discharge (admin, doctor)
router.patch("/:id", authorize("admin", "doctor"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await Patient.findById(req.params.id);
    if (!existing) return next(createError("Patient not found", 404));

    // Whitelist: vitals, medications, rounds and notes have their own endpoints.
    const allowed = ["name", "age", "gender", "ward", "bed", "admissionDate", "diagnosis", "allergies", "status", "assignedDoctor", "assignedNurse"];
    const updates: Record<string, unknown> = {};
    for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];

    const wasDischarged = existing.status === "Discharged";
    const discharging = updates.status === "Discharged" && !wasDischarged;
    const reactivating = wasDischarged && updates.status !== undefined && updates.status !== "Discharged";

    const newWard = String(updates.ward ?? existing.ward);
    const newBed = String(updates.bed ?? existing.bed);
    const moving = newWard !== String(existing.ward) || newBed !== existing.bed;

    if (discharging) {
      // A discharged patient releases their bed; keep the old location as history.
      delete updates.ward;
      delete updates.bed;
    } else if (wasDischarged && !reactivating) {
      delete updates.ward; // can't move a discharged patient without readmitting them
      delete updates.bed;
    } else if (moving || reactivating) {
      await assertBedFree(newWard, newBed, existing._id);
    }

    const patient = await Patient.findByIdAndUpdate(existing._id, updates, { new: true, runValidators: true });
    if (!patient) return next(createError("Patient not found", 404));

    if (discharging) {
      await freeBed(existing.ward, existing.bed, existing._id);
    } else if (reactivating) {
      await occupyBed(newWard, newBed, existing._id);
    } else if (moving && !wasDischarged) {
      await occupyBed(newWard, newBed, existing._id);
      await freeBed(existing.ward, existing.bed, existing._id);
    }

    res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/patients/:id — permanently remove a patient record (admin, doctor, nurse)
router.delete("/:id", authorize("admin", "doctor", "nurse"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return next(createError("Patient not found", 404));

    await freeBed(patient.ward, patient.bed, patient._id); // free the bed if they still held it

    res.json({ success: true, message: "Patient record deleted" });
  } catch (err) {
    next(err);
  }
});

// --- Vitals ---

// POST /api/patients/:id/vitals
router.post(
  "/:id/vitals",
  authorize("doctor", "nurse"),
  [
    body("temperature").notEmpty(),
    body("bloodPressure").notEmpty(),
    body("pulse").notEmpty(),
    body("respiratoryRate").notEmpty(),
    body("spo2").notEmpty(),
    body("painScore").isInt({ min: 0, max: 10 }),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(createError("Invalid input", 400));

    try {
      const vitals = { ...req.body, recordedBy: req.user!._id, recordedAt: new Date() };
      const patient = await Patient.findByIdAndUpdate(
        req.params.id,
        { $push: { vitals: { $each: [vitals], $position: 0 } } },
        { new: true }
      );
      if (!patient) return next(createError("Patient not found", 404));
      res.status(201).json({ success: true, data: patient.vitals[0] });
    } catch (err) {
      next(err);
    }
  }
);

// --- Medications ---

// POST /api/patients/:id/medications
router.post(
  "/:id/medications",
  authorize("doctor"),
  [
    body("name").notEmpty(),
    body("dose").notEmpty(),
    body("route").notEmpty(),
    body("frequency").notEmpty(),
    body("startDate").isISO8601(),
    body("endDate").isISO8601(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(createError("Invalid input", 400));

    try {
      const { name, dose, route, frequency, startDate, endDate } = req.body;

      // `scheduledTimes` arrives as ["08:00", "20:00"]; every dose starts as Pending.
      const times: unknown[] = Array.isArray(req.body.scheduledTimes) ? req.body.scheduledTimes : [];
      if (!times.every((t) => typeof t === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(t))) {
        return next(createError("Scheduled times must be in HH:mm format", 400));
      }
      const scheduledTimes = (times as string[]).map((time) => ({ time, status: "Pending" }));

      const patient = await Patient.findById(req.params.id);
      if (!patient) return next(createError("Patient not found", 404));

      patient.medications.push({ name, dose, route, frequency, startDate, endDate, scheduledTimes, prescribedBy: req.user!._id } as never);
      await patient.save();
      res.status(201).json({ success: true, data: patient.medications[patient.medications.length - 1] });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/patients/:id/medications/:medId — discontinue / remove a medication order
router.delete(
  "/:id/medications/:medId",
  authorize("doctor"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const patient = await Patient.findById(req.params.id);
      if (!patient) return next(createError("Patient not found", 404));
      const idx = patient.medications.findIndex((m) => String(m._id) === req.params.medId);
      if (idx === -1) return next(createError("Medication not found", 404));
      patient.medications.splice(idx, 1);
      await patient.save();
      res.json({ success: true, message: "Medication order removed" });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/patients/:id/medications/:medId/doses/:doseIdx — administer a dose
router.patch(
  "/:id/medications/:medId/doses/:doseIdx",
  authorize("doctor", "nurse"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id, medId, doseIdx } = req.params;
      const idx = Number(doseIdx);

      const patient = await Patient.findById(id);
      if (!patient) return next(createError("Patient not found", 404));

      const med = patient.medications.find((m) => String(m._id) === medId);
      if (!med) return next(createError("Medication not found", 404));

      // Validate the index so a bad URL can never create empty array slots.
      if (!Number.isInteger(idx) || idx < 0 || idx >= med.scheduledTimes.length) {
        return next(createError("Dose not found", 404));
      }

      const dose = med.scheduledTimes[idx];
      if (dose.status === "Administered") {
        return next(createError("Dose has already been administered", 409));
      }

      dose.status = "Administered";
      dose.administeredAt = new Date();
      dose.administeredBy = req.user!._id as typeof dose.administeredBy;
      await patient.save();

      res.json({ success: true, message: "Dose administered" });
    } catch (err) {
      next(err);
    }
  }
);

// --- Ward Rounds ---

// POST /api/patients/:id/ward-rounds
router.post(
  "/:id/ward-rounds",
  authorize("doctor"),
  [
    body("assessment").notEmpty(),
    body("clinicalNotes").notEmpty(),
    body("treatmentPlan").notEmpty(),
    body("nextReview").isISO8601(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(createError("Invalid input", 400));

    try {
      const note = { ...req.body, doctor: req.user!._id, date: new Date() };
      const patient = await Patient.findByIdAndUpdate(
        req.params.id,
        { $push: { wardRounds: { $each: [note], $position: 0 } } },
        { new: true }
      );
      if (!patient) return next(createError("Patient not found", 404));
      res.status(201).json({ success: true, data: patient.wardRounds[0] });
    } catch (err) {
      next(err);
    }
  }
);

// --- Nursing Notes ---

// POST /api/patients/:id/nursing-notes
router.post(
  "/:id/nursing-notes",
  authorize("nurse", "doctor"),
  [body("note").notEmpty()],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(createError("Invalid input", 400));

    try {
      const entry = { note: req.body.note, nurse: req.user!._id, date: new Date() };
      const patient = await Patient.findByIdAndUpdate(
        req.params.id,
        { $push: { nursingNotes: { $each: [entry], $position: 0 } } },
        { new: true }
      );
      if (!patient) return next(createError("Patient not found", 404));
      res.status(201).json({ success: true, data: patient.nursingNotes[0] });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
