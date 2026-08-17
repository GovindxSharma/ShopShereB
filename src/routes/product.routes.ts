import express from "express"
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getAllProductNames,
  getCategories,
  getRelatedProducts,
} from "../controllers/product.controller"
import { isAuthenticated, isAdmin } from "../middlewares/auth.middleware"
import { upload } from "../middlewares/upload.middleware"

const router = express.Router()

// 🔐 Admin product list (unpaginated, for Admin Panel)
router.get("/admin", isAuthenticated, isAdmin, getProducts)

// 🌐 Public routes
router.get("/all", getAllProductNames) // For fast Fuse.js live client search
router.get("/categories", getCategories) // All distinct categories
router.get("/:id/related", getRelatedProducts) // Related products in same category
router.get("/", getAllProducts)
router.get("/:id", getProductById)

// 🔐 Admin routes
router.post("/", isAuthenticated, isAdmin, upload.array("images", 5), createProduct)
router.put("/:id", isAuthenticated, isAdmin, upload.array("images", 5), updateProduct)
router.patch("/:id", isAuthenticated, isAdmin, upload.array("images", 5), updateProduct)
router.delete("/:id", isAuthenticated, isAdmin, deleteProduct)

export default router
