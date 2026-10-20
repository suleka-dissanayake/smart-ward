import { Router, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import User from "../models/User";
import { protect, authorize, AuthRequest } from "../middleware/auth";
import { createError } from "../middleware/errorHandler";

import Patient from "../models/Patient";
const router = Router();
router.use(protect);

router.get("/", authorize("admin"), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
});

router.get("/doctors", async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doctors = await User.find({ role: "doctor", status: "Active" }).select("name department");
    res.json({ success: true, data: doctors });
  } catch (err) {
    next(err);
  }
});

router.get("/nurses", async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const nurses = await User.find({ role: "nurse", status: "Active" }).select("name department");
    res.json({ success: true, data: nurses });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", authorize("admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(createError("User not found", 404));
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  authorize("admin"),
  [
    body("name").notEmpty().trim(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("role").isIn(["doctor", "nurse", "admin"]),
    body("department").notEmpty().trim(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(createError("Invalid input", 400));

    try {
      const exists = await User.findOne({ email: req.body.email });
      if (exists) return next(createError("Email already in use", 409));

      const user = await User.create(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
);

router.patch("/:id", authorize("admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { password, ...updates } = req.body;
    // Don't let an admin lock themselves out or demote themselves.
    if (String(req.user!._id) === req.params.id && (updates.status === "Inactive" || (updates.role && updates.role !== "admin"))) {
      return next(createError("You cannot deactivate or demote your own account", 400));
    }
    // Changing a doctor/nurse into a different role would orphan the patients assigned to them.
    if (updates.role) {
      const current = await User.findById(req.params.id);
      if (current && current.role !== updates.role && current.role !== "admin") {
        const field = current.role === "doctor" ? "assignedDoctor" : "assignedNurse";
        const n = await Patient.countDocuments({ [field]: current._id });
        if (n > 0) return next(createError(`${current.name} is still assigned to ${n} patient${n === 1 ? "" : "s"}. Reassign them before changing the role.`, 409));
      }
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return next(createError("User not found", 404));
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authorize("admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return next(createError("User not found", 404));

    if (String(req.user!._id) === String(target._id)) {
      return next(createError("You cannot delete your own account", 400));
    }
    if (target.role === "admin" && (await User.countDocuments({ role: "admin" })) <= 1) {
      return next(createError("Cannot delete the last administrator", 400));
    }
    // Patients reference their doctor/nurse, so staff with patients must be reassigned first.
    if (target.role !== "admin") {
      const field = target.role === "doctor" ? "assignedDoctor" : "assignedNurse";
      const n = await Patient.countDocuments({ [field]: target._id, status: { $ne: "Discharged" } });
      const any = n > 0 ? n : await Patient.countDocuments({ [field]: target._id });
      if (any > 0) {
        return next(createError(`${target.name} is still assigned to ${any} patient${any === 1 ? "" : "s"}. Reassign or remove them first.`, 409));
      }
    }

    await target.deleteOne();
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
