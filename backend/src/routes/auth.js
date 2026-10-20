import { Router } from "express";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { createError } from "../middleware/errorHandler.js";

const router = Router();

const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN ?? "7d" });

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  async (req, res, next) => {
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

router.get("/me", protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

router.patch(
  "/change-password",
  protect,
  [body("currentPassword").notEmpty(), body("newPassword").isLength({ min: 6 })],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(createError("Invalid input", 400));

    try {
      const user = await User.findById(req.user._id).select("+password");
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
