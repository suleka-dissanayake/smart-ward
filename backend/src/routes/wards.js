import { Router } from "express";
import { body, validationResult } from "express-validator";
import Ward from "../models/Ward.js";
import Bed from "../models/Bed.js";
import User from "../models/User.js";
import { protect, authorize } from "../middleware/auth.js";
import { createError } from "../middleware/errorHandler.js";
import { nextBedNumber } from "../utils/beds.js";
import { withBeds } from "../utils/wards.js";

const router = Router();
router.use(protect);

router.get("/", async (_req, res, next) => {
  try {
    const wards = await Ward.find().populate("managedBy", "name").sort({ name: 1 });
    res.json({ success: true, count: wards.length, data: await withBeds(wards) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const ward = await Ward.findById(req.params.id).populate("managedBy", "name");
    if (!ward) return next(createError("Ward not found", 404));
    res.json({ success: true, data: await withBeds(ward, { populatePatients: true }) });
  } catch (err) {
    next(err);
  }
});

// POST /api/wards — create a ward and its beds (admin). The creating admin becomes its manager.
router.post(
  "/",
  authorize("admin"),
  [body("name").notEmpty().trim(), body("totalBeds").isInt({ min: 1, max: 200 })],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(createError("Invalid input", 400));

    try {
      const { name, totalBeds, description } = req.body;
      const ward = await Ward.create({ name, description, managedBy: req.user._id });
      await Bed.insertMany(
        Array.from({ length: Number(totalBeds) }, (_, i) => ({ ward: ward._id, bedNumber: `${i + 1}` }))
      );
      res.status(201).json({ success: true, data: await withBeds(ward) });
    } catch (err) {
      next(err);
    }
  }
);

router.patch("/:id", authorize("admin"), async (req, res, next) => {
  try {
    // Only name/description are editable here — beds have their own endpoints.
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    const ward = await Ward.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!ward) return next(createError("Ward not found", 404));
    res.json({ success: true, data: await withBeds(ward) });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authorize("admin"), async (req, res, next) => {
  try {
    const ward = await Ward.findById(req.params.id);
    if (!ward) return next(createError("Ward not found", 404));
    if (await Bed.exists({ ward: ward._id, isOccupied: true })) {
      return next(createError("Cannot delete ward with occupied beds", 400));
    }
    await Bed.deleteMany({ ward: ward._id });
    await User.updateMany({ ward: ward._id }, { $unset: { ward: "" } }); // staff become unassigned
    await ward.deleteOne();
    res.json({ success: true, message: "Ward deleted" });
  } catch (err) {
    next(err);
  }
});

// POST /api/wards/:id/beds — add one bed (optional bedNumber) or `count` auto-numbered beds
router.post("/:id/beds", authorize("admin"), async (req, res, next) => {
  try {
    const ward = await Ward.findById(req.params.id);
    if (!ward) return next(createError("Ward not found", 404));

    const requested = typeof req.body.bedNumber === "string" ? req.body.bedNumber.trim() : "";
    const count = requested ? 1 : Math.min(Math.max(parseInt(req.body.count ?? "1", 10) || 1, 1), 50);

    const existing = (await Bed.find({ ward: ward._id }).select("bedNumber")).map((b) => b.bedNumber);
    const created = [];
    for (let i = 0; i < count; i++) {
      const bedNumber = requested || nextBedNumber(existing);
      if (existing.includes(bedNumber)) return next(createError(`Bed ${bedNumber} already exists in this ward`, 409));
      created.push({ ward: ward._id, bedNumber });
      existing.push(bedNumber);
    }
    await Bed.insertMany(created);
    res.status(201).json({ success: true, data: await withBeds(ward) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/wards/:id/beds/:bedNumber — remove an empty bed
router.delete("/:id/beds/:bedNumber", authorize("admin"), async (req, res, next) => {
  try {
    const ward = await Ward.findById(req.params.id);
    if (!ward) return next(createError("Ward not found", 404));

    const bed = await Bed.findOne({ ward: ward._id, bedNumber: req.params.bedNumber });
    if (!bed) return next(createError("Bed not found", 404));
    if (bed.isOccupied)
      return next(createError("Cannot remove an occupied bed — transfer or discharge the patient first", 400));
    if ((await Bed.countDocuments({ ward: ward._id })) === 1)
      return next(createError("A ward must keep at least one bed — delete the ward instead", 400));

    await bed.deleteOne();
    res.json({ success: true, data: await withBeds(ward) });
  } catch (err) {
    next(err);
  }
});

export default router;
