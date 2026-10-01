import { Router, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import User from "../models/User";
import { protect, authorize, AuthRequest } from "../middleware/auth";
import { createError } from "../middleware/errorHandler";

const router = Router();
router.use(protect);

// GET /api/users — admin only
router.get("/", authorize("admin"), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/doctors — for patient assignment dropdowns
router.get("/doctors", async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doctors = await User.find({ role: "doctor", status: "Active" }).select("name department");
    res.json({ success: true, data: doctors });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/nurses
router.get("/nurses", async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const nurses = await User.find({ role: "nurse", status: "Active" }).select("name department");
    res.json({ success: true, data: nurses });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id
router.get("/:id", authorize("admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(createError("User not found", 404));
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// POST /api/users — admin creates users
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

// PATCH /api/users/:id
router.patch("/:id", authorize("admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { password, ...updates } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return next(createError("User not found", 404));
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id
router.delete("/:id", authorize("admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return next(createError("User not found", 404));
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
