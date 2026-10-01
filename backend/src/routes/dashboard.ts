import { Router, Response, NextFunction } from "express";
import Patient from "../models/Patient";
import Ward from "../models/Ward";
import User from "../models/User";
import Notification from "../models/Notification";
import { protect, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(protect);

// GET /api/dashboard — role-aware summary stats
router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const role = req.user!.role;
    const userId = req.user!._id;

    const [totalPatients, criticalPatients, stablePatients, attentionPatients, totalWards, totalUsers, unreadNotifications] =
      await Promise.all([
        Patient.countDocuments(role === "doctor" ? { assignedDoctor: userId } : role === "nurse" ? { assignedNurse: userId } : {}),
        Patient.countDocuments({ status: "Critical", ...(role === "doctor" ? { assignedDoctor: userId } : role === "nurse" ? { assignedNurse: userId } : {}) }),
        Patient.countDocuments({ status: "Stable", ...(role === "doctor" ? { assignedDoctor: userId } : role === "nurse" ? { assignedNurse: userId } : {}) }),
        Patient.countDocuments({ status: "Attention", ...(role === "doctor" ? { assignedDoctor: userId } : role === "nurse" ? { assignedNurse: userId } : {}) }),
        Ward.countDocuments(),
        User.countDocuments(),
        Notification.countDocuments({
          $or: [{ recipient: userId }, { recipientRole: role }, { recipientRole: "all" }],
          isRead: false,
        }),
      ]);

    const wards = await Ward.find().select("name totalBeds beds");
    const wardSummary = wards.map((w) => ({
      id: w._id,
      name: w.name,
      totalBeds: w.totalBeds,
      occupiedBeds: w.beds.filter((b) => b.isOccupied).length,
    }));

    res.json({
      success: true,
      data: {
        totalPatients,
        criticalPatients,
        stablePatients,
        attentionPatients,
        totalWards,
        totalUsers,
        unreadNotifications,
        wardSummary,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
