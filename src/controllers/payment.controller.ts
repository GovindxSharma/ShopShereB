// src/controllers/payment.controller.ts
import dotenv from "dotenv"
dotenv.config()
import { Request, Response } from "express"
import Razorpay from "razorpay"
import crypto from "crypto"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body

    const options = {
      amount: amount * 100, // paise
      currency: "INR",
      receipt: `order_rcpt_${Math.floor(Math.random() * 100000)}`,
    }

    const order = await razorpay.orders.create(options)
    res.status(200).json(order)
  } catch (err) {
    res.status(500).json({ error: "Failed to create Razorpay order" })
  }
}

export const verifyPayment = async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex")

  if (expectedSignature === razorpay_signature) {
    return res.status(200).json({ success: true })
  }

  return res.status(400).json({ success: false, message: "Invalid signature" })
}
