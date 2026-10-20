import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db";
import { errorHandler, notFound } from "./middleware/errorHandler";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import wardRoutes from "./routes/wards";
import patientRoutes from "./routes/patients";
import notificationRoutes from "./routes/notifications";
import dashboardRoutes from "./routes/dashboard";
import seedRoutes from "./routes/seed";

const app = express();
const PORT = process.env.PORT ?? 5000;

app.use(helmet());
// CLIENT_ORIGIN may be a comma-separated list, e.g. "http://localhost:5173,http://127.0.0.1:5173"
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use(
  "/api/auth",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: "Too many auth attempts, please try again later" })
);
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wards", wardRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/seed", seedRoutes);

app.use(notFound);
app.use(errorHandler);

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`SmartWard API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });

export default app;
