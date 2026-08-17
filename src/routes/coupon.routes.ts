import { Router } from "express"
import {
  getAvailableCoupons,
  validateCoupon,
  getAllAdminCoupons,
  createAdminCoupon,
  toggleCouponStatus,
  deleteAdminCoupon,
} from "../controllers/coupon.controller"
import { isAuthenticated, isAdmin } from "../middlewares/auth.middleware"

const router = Router()

// 🌍 Public Routes
router.get("/", getAvailableCoupons)
router.post("/validate", validateCoupon)

// 🛡️ Admin Routes
router.get("/admin", isAuthenticated, isAdmin, getAllAdminCoupons)
router.post("/admin", isAuthenticated, isAdmin, createAdminCoupon)
router.put("/admin/:id/toggle", isAuthenticated, isAdmin, toggleCouponStatus)
router.delete("/admin/:id", isAuthenticated, isAdmin, deleteAdminCoupon)

export default router
