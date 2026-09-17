// src/models/paymentWebhookLog.model.ts
import mongoose, { Document, Schema } from "mongoose"

export interface IPaymentWebhookLog extends Document {
  eventId: string
  eventType: string
  orderId?: string
  paymentId?: string
  status: "processed" | "ignored" | "failed"
  signatureValid: boolean
  message?: string
  payload?: any
  processedAt: Date
}

const paymentWebhookLogSchema = new Schema<IPaymentWebhookLog>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    orderId: {
      type: String,
      index: true,
    },
    paymentId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ["processed", "ignored", "failed"],
      default: "processed",
    },
    signatureValid: {
      type: Boolean,
      default: true,
    },
    message: {
      type: String,
    },
    payload: {
      type: Schema.Types.Mixed,
    },
    processedAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 60, // 60 days auto TTL
    },
  },
  { timestamps: true }
)

export default mongoose.model<IPaymentWebhookLog>(
  "PaymentWebhookLog",
  paymentWebhookLogSchema
)
