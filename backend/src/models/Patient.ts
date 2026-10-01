import mongoose, { Document, Schema } from "mongoose";

export type PatientStatus = "Stable" | "Attention" | "Critical" | "Discharged";

export interface IVitalSigns {
  temperature: string;
  bloodPressure: string;
  pulse: string;
  respiratoryRate: string;
  spo2: string;
  painScore: number;
  recordedAt: Date;
  recordedBy: mongoose.Types.ObjectId;
}

export interface IScheduledDose {
  time: string;
  status: "Pending" | "Administered";
  administeredAt?: Date;
  administeredBy?: mongoose.Types.ObjectId;
}

export interface IMedication {
  name: string;
  dose: string;
  route: string;
  frequency: string;
  startDate: Date;
  endDate: Date;
  scheduledTimes: IScheduledDose[];
  prescribedBy: mongoose.Types.ObjectId;
}

export interface IWardRoundNote {
  date: Date;
  doctor: mongoose.Types.ObjectId;
  assessment: string;
  clinicalNotes: string;
  treatmentPlan: string;
  nextReview: Date;
}

export interface INursingNote {
  date: Date;
  nurse: mongoose.Types.ObjectId;
  note: string;
}

export interface IPatient extends Document {
  name: string;
  age: number;
  gender: "Male" | "Female";
  ward: mongoose.Types.ObjectId;
  bed: string;
  admissionDate: Date;
  status: PatientStatus;
  diagnosis: string;
  allergies: string[];
  assignedDoctor: mongoose.Types.ObjectId;
  assignedNurse: mongoose.Types.ObjectId;
  vitals: IVitalSigns[];
  medications: IMedication[];
  wardRounds: IWardRoundNote[];
  nursingNotes: INursingNote[];
  createdAt: Date;
  updatedAt: Date;
}

const VitalsSchema = new Schema<IVitalSigns>({
  temperature: { type: String, required: true },
  bloodPressure: { type: String, required: true },
  pulse: { type: String, required: true },
  respiratoryRate: { type: String, required: true },
  spo2: { type: String, required: true },
  painScore: { type: Number, required: true, min: 0, max: 10 },
  recordedAt: { type: Date, default: Date.now },
  recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

const ScheduledDoseSchema = new Schema<IScheduledDose>({
  time: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Administered"], default: "Pending" },
  administeredAt: { type: Date },
  administeredBy: { type: Schema.Types.ObjectId, ref: "User" },
});

const MedicationSchema = new Schema<IMedication>({
  name: { type: String, required: true },
  dose: { type: String, required: true },
  route: { type: String, required: true },
  frequency: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  scheduledTimes: { type: [ScheduledDoseSchema], default: [] },
  prescribedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

const WardRoundSchema = new Schema<IWardRoundNote>({
  date: { type: Date, default: Date.now },
  doctor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  assessment: { type: String, required: true },
  clinicalNotes: { type: String, required: true },
  treatmentPlan: { type: String, required: true },
  nextReview: { type: Date, required: true },
});

const NursingNoteSchema = new Schema<INursingNote>({
  date: { type: Date, default: Date.now },
  nurse: { type: Schema.Types.ObjectId, ref: "User", required: true },
  note: { type: String, required: true },
});

const PatientSchema = new Schema<IPatient>(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0 },
    gender: { type: String, enum: ["Male", "Female"], required: true },
    ward: { type: Schema.Types.ObjectId, ref: "Ward", required: true },
    bed: { type: String, required: true },
    admissionDate: { type: Date, required: true },
    status: { type: String, enum: ["Stable", "Attention", "Critical", "Discharged"], default: "Stable" },
    diagnosis: { type: String, required: true },
    allergies: { type: [String], default: [] },
    assignedDoctor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedNurse: { type: Schema.Types.ObjectId, ref: "User", required: true },
    vitals: { type: [VitalsSchema], default: [] },
    medications: { type: [MedicationSchema], default: [] },
    wardRounds: { type: [WardRoundSchema], default: [] },
    nursingNotes: { type: [NursingNoteSchema], default: [] },
  },
  { timestamps: true }
);

PatientSchema.index({ ward: 1, status: 1 });
PatientSchema.index({ assignedDoctor: 1 });
PatientSchema.index({ assignedNurse: 1 });

export default mongoose.model<IPatient>("Patient", PatientSchema);
