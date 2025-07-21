// src/models/product.model.ts
import mongoose, { Schema, Document, model } from "mongoose"
import { IUser } from "./user.model"

export interface IImage {
  public_id: string
  url: string
}

export interface IReview {
  user: mongoose.Types.ObjectId | IUser
  name: string
  rating: number
  comment: string
}

export interface IProduct extends Document {
  name: string
  description: string
  price: number
  ratings: number
  images: IImage[]
  category: string
  stock: number
  numOfReviews: number
  reviews: IReview[]
  user: mongoose.Types.ObjectId | IUser
  createdAt: Date
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Please enter product name"],
    },
    description: {
      type: String,
      required: [true, "Please enter product description"],
    },
    price: {
      type: Number,
      required: [true, "Please enter product price"],
      max: [999999, "Price cannot exceed 6 digits"],
    },
    ratings: {
      type: Number,
      default: 0,
    },
    images: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    category: {
      type: String,
      required: [true, "Please enter product category"],
    },
    stock: {
      type: Number,
      required: [true, "Please enter product stock"],
      max: [9999, "Stock cannot exceed 4 digits"],
      default: 1,
    },
    numOfReviews: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true },
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
      },
    ],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

export default model<IProduct>("Product", productSchema)
