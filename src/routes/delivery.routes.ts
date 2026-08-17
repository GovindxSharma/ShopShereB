import { Router } from "express"
import { getDeliveryOrders, updateDeliveryStatus } from "../controllers/delivery.controller"
import { isAuthenticated, isDeliveryOrAdmin } from "../middlewares/auth.middleware"

const router = Router()

// 🚚 Delivery Routes
router.get("/orders", isAuthenticated, isDeliveryOrAdmin, getDeliveryOrders)
router.put("/orders/:id/status", isAuthenticated, isDeliveryOrAdmin, updateDeliveryStatus)

export default router
