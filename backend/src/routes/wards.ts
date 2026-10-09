import { Router, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import Ward from "../models/Ward";
import { protect, authorize, AuthRequest } from "../middleware/auth";
import { createError } from "../middleware/errorHandler";

import { nextBedNumber } from "../utils/beds";
const router = Router();
router.use(protect);

router.get("/", async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const wards = await Ward.find().sort({ name: 1 });
    res.json({ success: true, count: wards.length, data: wards });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ward = await Ward.findById(req.params.id).populate("beds.patientId", "name status");
    if (!ward) return next(createError("Ward not found", 404));
    res.json({ success: true, data: ward });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  authorize("admin"),
  [body("name").notEmpty().trim(), body("totalBeds").isInt({ min: 1 })],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(createError("Invalid input", 400));

    try {
      const { name, totalBeds, description } = req.body;
      const beds = Array.from({ length: totalBeds }, (_, i) => ({
        bedNumber: `${i + 1}`,
        isOccupied: false,
      }));
      const ward = await Ward.create({ name, description, totalBeds, beds });
      res.status(201).json({ success: true, data: ward });
    } catch (err) {
      next(err);
    }
  }
);

router.patch("/:id", authorize("admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Only name/description are editable here — beds have their own endpoints so totals stay in sync.
    const updates: Record<string, unknown> = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    const ward = await Ward.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!ward) return next(createError("Ward not found", 404));
    res.json({ success: true, data: ward });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authorize("admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ward = await Ward.findById(req.params.id);
    if (!ward) return next(createError("Ward not found", 404));
    if (ward.beds.some((b) => b.isOccupied)) {
      return next(createError("Cannot delete ward with occupied beds", 400));
    }
    await ward.deleteOne();
    res.json({ success: true, message: "Ward deleted" });
  } catch (err) {
    next(err);
  }
});

// POST /api/wards/:id/beds — add one bed (optional bedNumber) or `count` auto-numbered beds
router.post("/:id/beds", authorize("admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ward = await Ward.findById(req.params.id);
    if (!ward) return next(createError("Ward not found", 404));

    const requested = typeof req.body.bedNumber === "string" ? req.body.bedNumber.trim() : "";
    const count = requested ? 1 : Math.min(Math.max(parseInt(req.body.count ?? "1", 10) || 1, 1), 50);

    for (let i = 0; i < count; i++) {
      const existing = ward.beds.map((b) => b.bedNumber);
      const bedNumber = requested || nextBedNumber(existing);
      if (existing.includes(bedNumber)) return next(createError(`Bed ${bedNumber} already exists in this ward`, 409));
      ward.beds.push({ bedNumber, isOccupied: false });
    }
    ward.totalBeds = ward.beds.length;
    await ward.save();
    res.status(201).json({ success: true, data: ward });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/wards/:id/beds/:bedNumber — remove an empty bed
router.delete("/:id/beds/:bedNumber", authorize("admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ward = await Ward.findById(req.params.id);
    if (!ward) return next(createError("Ward not found", 404));

    const idx = ward.beds.findIndex((b) => b.bedNumber === req.params.bedNumber);
    if (idx === -1) return next(createError("Bed not found", 404));
    if (ward.beds[idx].isOccupied) return next(createError("Cannot remove an occupied bed — transfer or discharge the patient first", 400));
    if (ward.beds.length === 1) return next(createError("A ward must keep at least one bed — delete the ward instead", 400));

    ward.beds.splice(idx, 1);
    ward.totalBeds = ward.beds.length;
    await ward.save();
    res.json({ success: true, data: ward });
  } catch (err) {
    next(err);
  }
});

export default router;
