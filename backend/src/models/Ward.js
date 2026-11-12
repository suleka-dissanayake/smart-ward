import mongoose, { Schema } from "mongoose";

// ER: Admin 1 —manages— M Ward.  Beds live in their own collection (see Bed.js);
// total beds / occupied beds are derived from it (see utils/wards.js), so they can never drift.
const WardSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    managedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Ward", WardSchema);
