// src/routes/index.routes.ts
import { Router } from "express"
import productRoutes from "./product.routes"
import authRoutes from "./auth.routes"
import paymentRoutes from "./payment.routes"
import cartRoutes from "./cart.routes"
import orderRoutes from "./order.routes"
import reviewRoutes from "./review.routes"


const router = Router()

router.use("/auth", authRoutes)
router.use("/products", productRoutes)
router.use("/reviews", reviewRoutes)
router.use("/payment", paymentRoutes)
router.use("/cart", cartRoutes)
router.use("/orders", orderRoutes)


export default router
