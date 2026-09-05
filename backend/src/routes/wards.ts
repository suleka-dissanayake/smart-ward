import { Router, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import Ward from "../models/Ward";
import { protect, authorize, AuthRequest } from "../middleware/auth";
import { createError } from "../middleware/errorHandler";

const router = Router();
router.use(protect);

// GET /api/wards
router.get("/", async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const wards = await Ward.find().sort({ name: 1 });
    res.json({ success: true, count: wards.length, data: wards });
  } catch (err) {
    next(err);
  }
});

// GET /api/wards/:id
router.get("/:id", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ward = await Ward.findById(req.params.id).populate("beds.patientId", "name status");
    if (!ward) return next(createError("Ward not found", 404));
    res.json({ success: true, data: ward });
  } catch (err) {
    next(err);
  }
});

// POST /api/wards — admin only
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

// PATCH /api/wards/:id
router.patch("/:id", authorize("admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ward = await Ward.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!ward) return next(createError("Ward not found", 404));
    res.json({ success: true, data: ward });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/wards/:id
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

export default router;
