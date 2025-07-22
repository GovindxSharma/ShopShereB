import mongoose, { Schema, Document } from "mongoose"
import bcrypt from "bcryptjs"

export interface IUser extends Document {
  name: string
  email: string
  password?: string
  avatar?: string
  role: "user" | "admin"
  provider: "local" | "google"
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  comparePassword?(password: string): Promise<boolean>
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    avatar: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    provider: { type: String, enum: ["local", "google"], default: "local" },

    // 🔐 Added for password reset support
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
)

// 🔐 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  if (this.password) this.password = await bcrypt.hash(this.password, 10)
  next()
})

// 🔑 Method to compare passwords
userSchema.methods.comparePassword = async function (password: string) {
  return await bcrypt.compare(password, this.password)
}

export default mongoose.model<IUser>("User", userSchema)
