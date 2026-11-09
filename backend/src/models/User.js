import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["doctor", "nurse", "admin"], required: true },
    // Admins have no department (ER: Admin = id, name, email); doctors and nurses do.
    department: {
      type: String,
      trim: true,
      required: function () {
        return this.role !== "admin";
      },
    },
    // ER: Ward 1 —has— M Doctor / M Nurse
    ward: { type: Schema.Types.ObjectId, ref: "Ward" },
    // ER: Admin 1 —manages— M Doctor / M Nurse
    managedBy: { type: Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

export default mongoose.model("User", UserSchema);
