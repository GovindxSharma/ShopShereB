import express from "express"
import {
  createOrUpdateReview,
  deleteReview,
  getProductReviews
} from "../controllers/review.controller"

import { isAuthenticated } from "../middlewares/auth.middleware"

const router = express.Router()

// 🔐 Create or update review (user only)
router.put("/", isAuthenticated, createOrUpdateReview)

// 🔐 Delete your own review (user only)
router.delete("/", isAuthenticated, deleteReview)

// 📌 Public: Get all reviews for a product
router.get("/:productId", getProductReviews)

export default router
