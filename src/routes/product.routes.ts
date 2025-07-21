import express from "express"
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts
} from "../controllers/product.controller"
import { isAuthenticated } from "../middlewares/auth.middleware"
import { isAdmin } from "../middlewares/auth.middleware"
import { upload } from "../middlewares/upload.middleware"

const router = express.Router()

// 🔐 Admin product list (unpaginated, for Admin Panel)
router.get("/admin", isAuthenticated, isAdmin, getProducts)

// 🌐 Public routes
router.get("/", getAllProducts)
router.get("/:id", getProductById)

// 🔐 Admin routes
router.post("/", isAuthenticated, isAdmin, upload.array("images", 5), createProduct)
router.patch("/:id", isAuthenticated, isAdmin, upload.array("images", 5), updateProduct) // ✅ Updated here
router.delete("/:id", isAuthenticated, isAdmin, deleteProduct)

export default router
