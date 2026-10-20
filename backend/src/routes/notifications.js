import { Router } from "express";
import { body, validationResult } from "express-validator";
import Notification from "../models/Notification.js";
import { protect, authorize } from "../middleware/auth.js";
import { createError } from "../middleware/errorHandler.js";

const router = Router();
router.use(protect);

router.get("/", async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      $or: [{ recipient: req.user._id }, { recipientRole: req.user.role }, { recipientRole: "all" }],
    })
      .populate("patient", "name")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (err) {
    next(err);
  }
});

router.patch("/read-all", async (req, res, next) => {
  try {
    await Notification.updateMany(
      {
        $or: [{ recipient: req.user._id }, { recipientRole: req.user.role }, { recipientRole: "all" }],
        isRead: false,
      },
      { isRead: true }
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/read", async (req, res, next) => {
  try {
    const n = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!n) return next(createError("Notification not found", 404));
    res.json({ success: true, data: n });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  authorize("admin", "doctor"),
  [body("title").notEmpty(), body("message").notEmpty()],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(createError("Invalid input", 400));

    try {
      const n = await Notification.create({ ...req.body, createdBy: req.user._id });
      res.status(201).json({ success: true, data: n });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
