import { Request, Response } from "express"
import Product from "../models/product.model"
import mongoose from "mongoose"

// ✅ Create or Update Review
export const createOrUpdateReview = async (req: Request, res: Response) => {
  try {
    const { rating, comment, productId } = req.body

    const userId = (req.user as any)._id
    const userName = (req.user as any).name

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" })
    }

    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    const existingReviewIndex = product.reviews.findIndex(
      (rev) => rev.user.toString() === userId.toString()
    )

    if (existingReviewIndex !== -1) {
      product.reviews[existingReviewIndex].rating = rating
      product.reviews[existingReviewIndex].comment = comment
    } else {
      product.reviews.push({
        user: userId,
        name: userName,
        rating: Number(rating),
        comment,
      })
      product.numOfReviews = product.reviews.length
    }

    const avg =
      product.reviews.reduce((acc, item) => acc + item.rating, 0) /
      product.reviews.length

    product.ratings = avg

    await product.save({ validateBeforeSave: true })

    res.status(200).json({ success: true, message: "Review submitted" })
  } catch (err) {
    console.error("Review error:", err)
    res.status(500).json({ message: "Error submitting review" })
  }
}

// ✅ Delete Review
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { productId } = req.query
    const userId = (req.user as any)._id

    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    const updatedReviews = product.reviews.filter(
      (rev) => rev.user.toString() !== userId.toString()
    )

    const newAvg =
      updatedReviews.reduce((acc, item) => acc + item.rating, 0) /
      (updatedReviews.length || 1)

    product.reviews = updatedReviews
    product.numOfReviews = updatedReviews.length
    product.ratings = updatedReviews.length === 0 ? 0 : newAvg

    await product.save({ validateBeforeSave: false })

    res.status(200).json({ success: true, message: "Review deleted" })
  } catch (err) {
    console.error("Delete review error:", err)
    res.status(500).json({ message: "Error deleting review" })
  }
}

// ✅ Get all reviews for a product
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params

    const product = await Product.findById(productId).populate(
      "reviews.user",
      "name email"
    )

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.status(200).json({ reviews: product.reviews })
  } catch (err) {
    console.error("Get reviews error:", err)
    res.status(500).json({ message: "Error fetching reviews" })
  }
}
