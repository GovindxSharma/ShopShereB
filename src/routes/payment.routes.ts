// src/routes/payment.routes.ts
import { Router } from "express"
import {
  createRazorpayOrder,
  verifyPayment,
  handleRazorpayWebhook,
} from "../controllers/payment.controller"

const router = Router()

router.post("/razorpay", createRazorpayOrder)
router.post("/verify", verifyPayment)
router.post("/webhook", handleRazorpayWebhook)

export default router
