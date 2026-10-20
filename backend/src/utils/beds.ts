import mongoose from "mongoose";
import Ward from "../models/Ward";
import { createError } from "../middleware/errorHandler";

type Id = mongoose.Types.ObjectId | string;

/** Throws unless the bed exists in the ward and is free (or already held by `patientId`). */
export async function assertBedFree(wardId: Id, bedNumber: string, patientId?: Id): Promise<void> {
  const ward = await Ward.findById(wardId);
  if (!ward) throw createError("Ward not found", 404);
  const bed = ward.beds.find((b) => b.bedNumber === bedNumber);
  if (!bed) throw createError(`Bed ${bedNumber} does not exist in ${ward.name}`, 400);
  if (bed.isOccupied && (!patientId || String(bed.patientId) !== String(patientId))) {
    throw createError(`Bed ${bedNumber} in ${ward.name} is already occupied`, 409);
  }
}

export async function occupyBed(wardId: Id, bedNumber: string, patientId: Id): Promise<void> {
  const ward = await Ward.findById(wardId);
  if (!ward) throw createError("Ward not found", 404);
  const bed = ward.beds.find((b) => b.bedNumber === bedNumber);
  if (!bed) throw createError(`Bed ${bedNumber} does not exist in ${ward.name}`, 400);
  bed.isOccupied = true;
  bed.patientId = patientId as mongoose.Types.ObjectId;
  await ward.save();
}

/** Frees the bed, but only if it is not now held by a different patient. */
export async function freeBed(wardId: Id, bedNumber: string, patientId: Id): Promise<void> {
  const ward = await Ward.findById(wardId);
  if (!ward) return;
  const bed = ward.beds.find((b) => b.bedNumber === bedNumber);
  if (!bed) return;
  if (bed.patientId && String(bed.patientId) !== String(patientId)) return;
  bed.isOccupied = false;
  bed.patientId = undefined;
  await ward.save();
}

/** Suggests the next bed label: "A-04" -> "A-05", "7" -> "8". */
export function nextBedNumber(existing: string[]): string {
  const last = existing[existing.length - 1];
  const m = last ? /^(.*?)(\d+)$/.exec(last) : null;
  if (!m) return String(existing.length + 1);
  const prefix = m[1];
  const width = m[2].length;
  let n = Math.max(
    ...existing.map((b) => {
      const mm = /^(.*?)(\d+)$/.exec(b);
      return mm && mm[1] === prefix ? parseInt(mm[2], 10) : 0;
    })
  );
  let candidate: string;
  do {
    n += 1;
    candidate = `${prefix}${String(n).padStart(width, "0")}`;
  } while (existing.includes(candidate));
  return candidate;
}
