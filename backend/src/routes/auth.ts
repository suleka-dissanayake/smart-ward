import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import User from "../models/User";
import { protect, AuthRequest } from "../middleware/auth";
import { createError } from "../middleware/errorHandler";

const router = Router();

const signToken = (id: string, role: string): string =>
  jwt.sign({ id, role }, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRES_IN ?? "7d" });

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError("Invalid input", 400));
    }

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select("+password");
      if (!user || !(await user.comparePassword(password))) {
        return next(createError("Invalid email or password", 401));
      }
      if (user.status === "Inactive") {
        return next(createError("Account is inactive", 403));
      }

      const token = signToken(String(user._id), user.role);
      res.json({ success: true, token, user });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me
router.get("/me", protect, async (req: AuthRequest, res: Response) => {
  res.json({ success: true, user: req.user });
});

// PATCH /api/auth/change-password
router.patch(
  "/change-password",
  protect,
  [body("currentPassword").notEmpty(), body("newPassword").isLength({ min: 6 })],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(createError("Invalid input", 400));

    try {
      const user = await User.findById(req.user!._id).select("+password");
      if (!user || !(await user.comparePassword(req.body.currentPassword))) {
        return next(createError("Current password is incorrect", 400));
      }
      user.password = req.body.newPassword;
      await user.save();
      res.json({ success: true, message: "Password updated" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
