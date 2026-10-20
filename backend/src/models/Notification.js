import mongoose, { Schema } from "mongoose";

const NotificationSchema = new Schema(
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

export default mongoose.model("Notification", NotificationSchema);
