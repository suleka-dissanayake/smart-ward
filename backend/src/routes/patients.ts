import { Router, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import Patient from "../models/Patient";
import Ward from "../models/Ward";
import { protect, authorize, AuthRequest } from "../middleware/auth";
import { createError } from "../middleware/errorHandler";

const router = Router();
router.use(protect);

// GET /api/patients
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

// POST /api/patients
router.post(
  "/",
  authorize("admin", "doctor"),
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
      const patient = await Patient.create(req.body);

      // Mark bed as occupied in ward
      await Ward.findByIdAndUpdate(
        req.body.ward,
        { $set: { "beds.$[el].isOccupied": true, "beds.$[el].patientId": patient._id } },
        { arrayFilters: [{ "el.bedNumber": req.body.bed }] }
      );

      res.status(201).json({ success: true, data: patient });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/patients/:id
router.patch("/:id", authorize("admin", "doctor"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!patient) return next(createError("Patient not found", 404));
    res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/patients/:id — discharge / admin only
router.delete("/:id", authorize("admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return next(createError("Patient not found", 404));

    // Free the bed
    await Ward.findByIdAndUpdate(
      patient.ward,
      { $set: { "beds.$[el].isOccupied": false, "beds.$[el].patientId": null } },
      { arrayFilters: [{ "el.bedNumber": patient.bed }] }
    );

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
      const med = { ...req.body, prescribedBy: req.user!._id };
      const patient = await Patient.findByIdAndUpdate(
        req.params.id,
        { $push: { medications: med } },
        { new: true }
      );
      if (!patient) return next(createError("Patient not found", 404));
      res.status(201).json({ success: true, data: patient.medications.at(-1) });
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
      const patient = await Patient.findOneAndUpdate(
        { _id: id, "medications._id": medId },
        {
          $set: {
            [`medications.$.scheduledTimes.${doseIdx}.status`]: "Administered",
            [`medications.$.scheduledTimes.${doseIdx}.administeredAt`]: new Date(),
            [`medications.$.scheduledTimes.${doseIdx}.administeredBy`]: req.user!._id,
          },
        },
        { new: true }
      );
      if (!patient) return next(createError("Patient or medication not found", 404));
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
