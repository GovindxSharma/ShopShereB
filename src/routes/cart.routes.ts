import { Router } from "express"
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cart.controller"
import { isAuthenticated } from "../middlewares/auth.middleware"

const router = Router()

router.get("/", isAuthenticated, getCart)
router.post("/", isAuthenticated, addToCart)
router.put("/", isAuthenticated, updateCartItem)
router.delete("/", isAuthenticated, removeFromCart)
router.delete("/clear", isAuthenticated, clearCart)

export default router
