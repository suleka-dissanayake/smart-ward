import mongoose, { Document, Schema } from "mongoose";

export interface IBed {
  bedNumber: string;
  isOccupied: boolean;
  patientId?: mongoose.Types.ObjectId;
}

export interface IWard extends Document {
  name: string;
  description?: string;
  totalBeds: number;
  beds: IBed[];
  createdAt: Date;
  updatedAt: Date;
}

const BedSchema = new Schema<IBed>({
  bedNumber: { type: String, required: true },
  isOccupied: { type: Boolean, default: false },
  patientId: { type: Schema.Types.ObjectId, ref: "Patient" },
});

const WardSchema = new Schema<IWard>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    totalBeds: { type: Number, required: true, min: 1 },
    beds: { type: [BedSchema], default: [] },
  },
  { timestamps: true }
);

WardSchema.virtual("occupiedBeds").get(function () {
  return this.beds.filter((b) => b.isOccupied).length;
});

WardSchema.set("toJSON", { virtuals: true });

export default mongoose.model<IWard>("Ward", WardSchema);
