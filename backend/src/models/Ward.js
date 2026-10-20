import mongoose, { Schema } from "mongoose";

const BedSchema = new Schema({
  bedNumber: { type: String, required: true },
  isOccupied: { type: Boolean, default: false },
  patientId: { type: Schema.Types.ObjectId, ref: "Patient" },
});

const WardSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    totalBeds: { type: Number, required: true, min: 1 },
    beds: { type: [BedSchema], default: [] },
  },
  { timestamps: true }
);

WardSchema.virtual("occupiedBeds").get(function () {
  // `beds` is undefined when a query only selected some fields,
  // e.g. Patient.populate("ward", "name") — don't crash JSON serialisation.
  if (!this.beds) return undefined;
  return this.beds.filter((b) => b.isOccupied).length;
});

WardSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Ward", WardSchema);
