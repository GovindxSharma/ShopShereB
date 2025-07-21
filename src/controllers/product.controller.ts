import { Request, Response } from "express"
import Product from "../models/product.model"

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 8,
      category,
      ratings,
      price,
      search,
    } = req.query;

    const filter: any = {};

    if (category && category !== "All") filter.category = category;
    if (ratings && Number(ratings) > 0)
      filter.ratings = { $gte: Number(ratings) };
    if (price && Number(price) > 0)
      filter.price = { $lte: Number(price) };

    if (search) {
      filter.name = { $regex: search, $options: "i" }; // case-insensitive name match
    }

    const products = await Product.find(filter)
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    res.status(200).json({ products, total });
  } catch (err) {
    console.error("Get all products error:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};



// 📌 PUBLIC: Get single product by ID
export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id).populate("reviews.user", "name email")
    if (!product) return res.status(404).json({ message: "Product not found" })
    res.status(200).json(product)
  } catch (err) {
    console.error("Get product error:", err)
    res.status(500).json({ message: "Error getting product" })
  }
}

// 🔐 ADMIN: Create product
import cloudinary from "../utils/cloudinary"

// src/controllers/product.controller.ts

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, category, stock } = req.body

    if (!name || !description || !price || !category || !stock) {
      return res.status(400).json({ message: "All fields are required" })
    }

    if (!req.files || !(req.files instanceof Array) || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" })
    }

    const imageUploads = await Promise.all(
      req.files.map((file) => {
        return new Promise<{ public_id: string; url: string }>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "shopshere/products" },
            (error, result) => {
              if (error || !result) return reject(error)
              resolve({ public_id: result.public_id, url: result.secure_url })
            }
          )
          uploadStream.end(file.buffer)
        })
      })
    )

    const product = new Product({
      name,
      description,
      price,
      category,
      stock,
      images: imageUploads,
      user: req.user._id, // comes from isAuthenticated middleware
    })

    await product.save()
    res.status(201).json(product)
  } catch (err) {
    console.error("Create product error:", err)
    res.status(500).json({ message: "Failed to create product" })
  }
}


// 🔐 ADMIN: Update product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Update basic fields (convert string to number where needed)
    product.name = req.body.name || product.name
    product.description = req.body.description || product.description
    product.price = req.body.price ? Number(req.body.price) : product.price
    product.stock = req.body.stock ? Number(req.body.stock) : product.stock
    product.category = req.body.category || product.category

    // Handle new image uploads
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadedImages = await Promise.all(
        req.files.map((file) => {
          return new Promise<{ public_id: string; url: string }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: "shopshere/products" },
              (error, result) => {
                if (error || !result) return reject(error)
                resolve({ public_id: result.public_id, url: result.secure_url })
              }
            )
            uploadStream.end(file.buffer)
          })
        })
      )

      // Replace the existing images with new ones
      product.images = uploadedImages
    }

    await product.save()
    res.status(200).json(product)
  } catch (err) {
    console.error("Update product error:", err)
    res.status(500).json({ message: "Failed to update product", error: err })
  }
}

// 🔐 ADMIN: Delete product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ message: "Product not found" })
    res.status(200).json({ message: "Product deleted successfully" })
  } catch (err) {
    console.error("Delete product error:", err)
    res.status(400).json({ message: "Failed to delete product" })
  }
}


// GET /api/admin/products
export const getProducts = async (req: Request, res: Response) => {
  const products = await Product.find({}) // no limit
  res.json({ products })
}
