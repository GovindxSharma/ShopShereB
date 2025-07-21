import { Router } from "express"
import {
  createOrder,
  getUserOrders,
  getAllOrders,
  markAsDelivered,
  getAnalytics,
  verifyPayment,
  getOrderById,
} from "../controllers/order.controller"
import { isAuthenticated, isAdmin } from "../middlewares/auth.middleware"

const router = Router()

// 🧾 Create new order (with Razorpay info if available)
router.post("/", isAuthenticated, createOrder)

// 👤 User: Get their own orders
router.get("/mine", isAuthenticated, getUserOrders)

// 📊 Admin: Analytics dashboard
router.get("/admin/analytics", isAuthenticated, isAdmin, getAnalytics)

// 👑 Admin: Get all orders (with ?delivered=true|false filter)
router.get("/", isAuthenticated, isAdmin, getAllOrders)
// 👑 Admin: Get specific order details
router.get("/admin/:id", isAuthenticated, isAdmin, getOrderById)


// ✅ Admin: Mark order as delivered
router.put("/:id/deliver", isAuthenticated, isAdmin, markAsDelivered)

// 💳 Razorpay: Verify payment and update order
router.post("/verify", isAuthenticated, verifyPayment)

export default router
