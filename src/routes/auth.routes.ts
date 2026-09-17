import express from "express"
import {
  register,
  login,
  logout,
  googleLogin,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
} from "../controllers/auth.controller"
import { isAuthenticated, optionalAuth } from "../middlewares/auth.middleware"

const router = express.Router()

// 🔐 Auth Routes
router.post("/register", register)
router.post("/google", googleLogin)
router.post("/login", login)
router.post("/logout", logout)
router.get("/me", optionalAuth, getMe)

// 🔁 Password Routes
router.post("/forgot-password", forgotPassword)
router.post("/reset-password/:token", resetPassword)
router.put("/update-password", isAuthenticated, updatePassword)

export default router
