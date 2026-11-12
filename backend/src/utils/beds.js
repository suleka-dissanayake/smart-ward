import Ward from "../models/Ward.js";
import Bed from "../models/Bed.js";
import { createError } from "../middleware/errorHandler.js";

/** Throws unless the bed exists in the ward and is free (or already held by `patientId`). */
export async function assertBedFree(wardId, bedNumber, patientId) {
  const ward = await Ward.findById(wardId).select("name");
  if (!ward) throw createError("Ward not found", 404);
  const bed = await Bed.findOne({ ward: wardId, bedNumber });
  if (!bed) throw createError(`Bed ${bedNumber} does not exist in ${ward.name}`, 400);
  if (bed.isOccupied && (!patientId || String(bed.patientId) !== String(patientId))) {
    throw createError(`Bed ${bedNumber} in ${ward.name} is already occupied`, 409);
  }
}

/** Atomically claims the bed for the patient (fails if someone else holds it). */
export async function occupyBed(wardId, bedNumber, patientId) {
  const bed = await Bed.findOneAndUpdate(
    { ward: wardId, bedNumber, $or: [{ isOccupied: false }, { patientId }] },
    { isOccupied: true, patientId },
    { new: true }
  );
  if (!bed) await assertBedFree(wardId, bedNumber, patientId); // throws the precise reason
}

/** Frees the bed, but only if it is not now held by a different patient. */
export async function freeBed(wardId, bedNumber, patientId) {
  await Bed.updateOne(
    { ward: wardId, bedNumber, $or: [{ patientId }, { patientId: { $exists: false } }, { patientId: null }] },
    { $set: { isOccupied: false }, $unset: { patientId: "" } }
  );
}

/** Suggests the next bed label: "A-04" -> "A-05", "7" -> "8". */
export function nextBedNumber(existing) {
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
  let candidate;
  do {
    n += 1;
    candidate = `${prefix}${String(n).padStart(width, "0")}`;
  } while (existing.includes(candidate));
  return candidate;
}
