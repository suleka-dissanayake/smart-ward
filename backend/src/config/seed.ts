// One-command database seeding:
//   npm run seed          -> wipe + insert demo data
//   npm run seed:clear    -> wipe only (no demo data)

import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./db";
import { clearDatabase, seedDatabase } from "./seedData";

async function main() {
  await connectDB();

  if (process.argv.includes("--clear")) {
    await clearDatabase();
    console.log("Database cleared (all users, wards, patients and notifications removed).");
    return;
  }

  console.log("Seeding SmartWard database...\n");
  await seedDatabase((msg) => console.log(msg));

  console.log("\nSeed complete!\n");
  console.log("Login credentials");
  console.log("─────────────────────────────────────────────────────");
  console.log("Role    │ Email                              │ Password");
  console.log("─────────────────────────────────────────────────────");
  console.log("Doctor  │ ahmed.alfarouk@smartward.health    │ doctor123");
  console.log("Doctor  │ sarah.mitchell@smartward.health    │ doctor123");
  console.log("Doctor  │ yusuf.osman@smartward.health       │ doctor123");
  console.log("Nurse   │ aisha.karimi@smartward.health      │ nurse123");
  console.log("Nurse   │ james.okonkwo@smartward.health     │ nurse123");
  console.log("Nurse   │ leila.nour@smartward.health        │ nurse123");
  console.log("Admin   │ ibrahim.hassan@smartward.health    │ admin123");
  console.log("─────────────────────────────────────────────────────\n");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
