import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  title: string;
  message: string;
  type: "alert" | "info" | "task" | "critical";
  recipientRole: "doctor" | "nurse" | "admin" | "all";
  recipient?: mongoose.Types.ObjectId;
  patient?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["alert", "info", "task", "critical"], default: "info" },
    recipientRole: { type: String, enum: ["doctor", "nurse", "admin", "all"], default: "all" },
    recipient: { type: Schema.Types.ObjectId, ref: "User" },
    patient: { type: Schema.Types.ObjectId, ref: "Patient" },
    isRead: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ recipientRole: 1, isRead: 1 });

export default mongoose.model<INotification>("Notification", NotificationSchema);
