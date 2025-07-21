// src/routes/payment.routes.ts
import { Router } from "express"
import { createRazorpayOrder, verifyPayment } from "../controllers/payment.controller"

const router = Router()

router.post("/razorpay", createRazorpayOrder)
router.post("/verify", verifyPayment)

export default router
