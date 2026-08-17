import mongoose, { Schema, Document } from "mongoose"

export interface ICoupon extends Document {
  code: string
  discountType: "percentage" | "flat"
  discountValue: number
  minPurchase: number
  maxDiscount?: number
  expiryDate: Date
  isActive: boolean
  description: string
  createdAt: Date
  updatedAt: Date
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      default: "percentage",
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 1,
    },
    minPurchase: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      min: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
)

export default mongoose.model<ICoupon>("Coupon", couponSchema)
