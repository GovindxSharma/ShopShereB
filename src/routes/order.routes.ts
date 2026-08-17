import { Router } from "express"
import {
  createOrder,
  createDemoOrder,
  getUserOrders,
  getAllOrders,
  markAsDelivered,
  updateOrderStatus,
  cancelOrder,
  getAnalytics,
  verifyRazorpayPayment,
  getOrderById,
  trackOrder,
} from "../controllers/order.controller"
import { isAuthenticated, isAdmin } from "../middlewares/auth.middleware"

const router = Router()

// 🧾 Create new order (Razorpay)
router.post("/", isAuthenticated, createOrder)

// ⚡ Create Demo / COD order (Instant Checkout)
router.post("/demo", isAuthenticated, createDemoOrder)

// 👤 User: Get their own orders
router.get("/mine", isAuthenticated, getUserOrders)

// 🔍 Track package (Public / User)
router.get("/track/:identifier", trackOrder)

// 🛑 User: Cancel order
router.put("/:id/cancel", isAuthenticated, cancelOrder)

// 📊 Admin: Analytics dashboard
router.get("/admin/analytics", isAuthenticated, isAdmin, getAnalytics)

// 👑 Admin: Get all orders
router.get("/", isAuthenticated, isAdmin, getAllOrders)

// 👑 Admin / User: Get specific order details
router.get("/admin/:id", isAuthenticated, getOrderById)
router.get("/:id", isAuthenticated, getOrderById)

// ✏️ Admin: Update order status
router.put("/:id/status", isAuthenticated, isAdmin, updateOrderStatus)

// ✅ Admin: Mark order as delivered
router.put("/:id/deliver", isAuthenticated, isAdmin, markAsDelivered)

// 💳 Razorpay: Verify payment and update order
router.post("/verify", isAuthenticated, verifyRazorpayPayment)

export default router
