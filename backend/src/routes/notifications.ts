import { Router, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import Notification from "../models/Notification";
import { protect, authorize, AuthRequest } from "../middleware/auth";
import { createError } from "../middleware/errorHandler";

const router = Router();
router.use(protect);

// GET /api/notifications — returns notifications for the current user's role
router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { recipient: req.user!._id },
        { recipientRole: req.user!.role },
        { recipientRole: "all" },
      ],
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

// PATCH /api/notifications/:id/read
router.patch("/:id/read", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const n = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!n) return next(createError("Notification not found", 404));
    res.json({ success: true, data: n });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/read-all
router.patch("/read-all", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await Notification.updateMany(
      {
        $or: [{ recipient: req.user!._id }, { recipientRole: req.user!.role }, { recipientRole: "all" }],
        isRead: false,
      },
      { isRead: true }
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
});

// POST /api/notifications — admin/doctor can broadcast
router.post(
  "/",
  authorize("admin", "doctor"),
  [body("title").notEmpty(), body("message").notEmpty()],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(createError("Invalid input", 400));

    try {
      const n = await Notification.create({ ...req.body, createdBy: req.user!._id });
      res.status(201).json({ success: true, data: n });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
