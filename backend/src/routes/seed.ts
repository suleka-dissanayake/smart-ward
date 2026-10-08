import { Router, Request, Response } from "express";
import { seedDatabase } from "../config/seedData";

const router = Router();

// POST /api/seed — wipes the DB and inserts demo data.
// This endpoint is unauthenticated and destructive, so it is disabled in production.
router.post("/", async (_req: Request, res: Response) => {
  if (process.env.NODE_ENV === "production") {
    res.status(403).json({ success: false, message: "Seeding is disabled in production" });
    return;
  }

  try {
    const s = await seedDatabase();
    res.json({
      success: true,
      message: `Database seeded successfully! ${s.users} users, ${s.wards} wards, ${s.patients} patients, ${s.notifications} notifications created.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Seed failed";
    res.status(500).json({ success: false, message });
  }
});

export default router;
