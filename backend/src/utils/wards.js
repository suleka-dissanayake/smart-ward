import Bed from "../models/Bed.js";

const byBedNumber = (a, b) => a.bedNumber.localeCompare(b.bedNumber, undefined, { numeric: true });

/**
 * Turns Ward document(s) into the API shape the frontend uses:
 * { ...ward, beds: [...], totalBeds, occupiedBeds }.
 * `populatePatients` fills each occupied bed's patientId with { name, status }.
 */
export async function withBeds(wards, { populatePatients = false } = {}) {
  const list = Array.isArray(wards) ? wards : [wards];
  let query = Bed.find({ ward: { $in: list.map((w) => w._id) } });
  if (populatePatients) query = query.populate("patientId", "name status");
  const beds = (await query).map((b) => b.toJSON()).sort(byBedNumber);

  const shaped = list.map((w) => {
    const mine = beds.filter((b) => String(b.ward) === String(w._id));
    return {
      ...w.toJSON(),
      id: String(w._id),
      beds: mine.map(({ ward, ...bed }) => bed),
      totalBeds: mine.length,
      occupiedBeds: mine.filter((b) => b.isOccupied).length,
    };
  });
  return Array.isArray(wards) ? shaped : shaped[0];
}
