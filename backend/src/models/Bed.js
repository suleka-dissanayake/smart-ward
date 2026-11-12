import mongoose, { Schema } from "mongoose";

// ER: Ward 1 —has— M Bed,  Bed 1 —holds— 0..1 Patient
const BedSchema = new Schema(
  {
    ward: { type: Schema.Types.ObjectId, ref: "Ward", required: true, index: true },
    bedNumber: { type: String, required: true, trim: true },
    isOccupied: { type: Boolean, default: false },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient" },
  },
  { timestamps: true }
);

// A bed number is unique within its ward.
BedSchema.index({ ward: 1, bedNumber: 1 }, { unique: true });

export default mongoose.model("Bed", BedSchema);
