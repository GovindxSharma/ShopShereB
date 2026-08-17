// src/routes/index.routes.ts
import { Router } from "express"
import productRoutes from "./product.routes"
import authRoutes from "./auth.routes"
import paymentRoutes from "./payment.routes"
import cartRoutes from "./cart.routes"
import orderRoutes from "./order.routes"
import reviewRoutes from "./review.routes"
import adminRoutes from "./admin.routes"
import couponRoutes from "./coupon.routes"
import deliveryRoutes from "./delivery.routes"
import { handleChatMessage } from "../controllers/chat.controller"
import { getHealthStatus } from "../controllers/health.controller"

const router = Router()

router.get("/health", getHealthStatus)
router.use("/auth", authRoutes)
router.use("/products", productRoutes)
router.use("/reviews", reviewRoutes)
router.use("/payment", paymentRoutes)
router.use("/cart", cartRoutes)
router.use("/orders", orderRoutes)
router.use("/admin", adminRoutes)
router.use("/delivery", deliveryRoutes)
router.use("/coupons", couponRoutes)
router.post("/chat", handleChatMessage)

export default router
