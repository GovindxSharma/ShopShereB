import express from "express"
import { register, login, logout, googleLogin, getMe } from "../controllers/auth.controller"
import { isAuthenticated } from "../middlewares/auth.middleware"

const router = express.Router()

router.post("/register", register)
router.post("/google", googleLogin)
router.post("/login", login)
router.post("/logout", logout)
router.get("/me", isAuthenticated, getMe)
  


export default router
