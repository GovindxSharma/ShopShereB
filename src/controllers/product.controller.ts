import { Request, Response } from "express"
import Product from "../models/product.model"
import cloudinary from "../utils/cloudinary"

// 📦 GET: All Products (for client-side fast search with Fuse.js)
export const getAllProductNames = async (_req: Request, res: Response) => {
  try {
    const products = await Product.find({}, "name category description price images ratings stock")
    res.status(200).json({ products })
  } catch (err) {
    console.error("Fetch all product names failed:", err)
    res.status(500).json({ message: "Failed to get product names" })
  }
}

// 📦 GET: All Unique Categories
export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await Product.distinct("category")
    res.status(200).json({ categories })
  } catch (err) {
    console.error("Fetch categories failed:", err)
    res.status(500).json({ message: "Failed to get categories" })
  }
}

// 📦 GET: Related Products
export const getRelatedProducts = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const currentProduct = await Product.findById(id)
    if (!currentProduct) {
      return res.status(404).json({ message: "Product not found" })
    }

    const related = await Product.find({
      category: currentProduct.category,
      _id: { $ne: currentProduct._id },
    })
      .limit(4)
      .sort({ ratings: -1 })

    res.status(200).json({ products: related })
  } catch (err) {
    console.error("Get related products error:", err)
    res.status(500).json({ message: "Failed to fetch related products" })
  }
}

// 📦 GET: All Products (Public, with Advanced Filters & Sorting)
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 8,
      category,
      ratings,
      price,
      search,
      sort,
    } = req.query as {
      page?: string
      limit?: string
      category?: string
      ratings?: string
      price?: string
      search?: string
      sort?: string
    }

    const filter: any = {}

    if (category && category !== "All" && category.trim() !== "") {
      const catClean = category.trim().replace(/s$/, "")
      filter.category = { $regex: new RegExp(`^${catClean}s?$`, "i") }
    }

    if (ratings && Number(ratings) > 0) {
      filter.ratings = { $gte: Number(ratings) }
    }

    if (price && Number(price) > 0) {
      filter.price = { $lte: Number(price) }
    }

    if (search && search.trim() !== "") {
      const searchRegex = { $regex: search.trim(), $options: "i" }
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ]
    }

    // Sort order
    let sortOptions: any = { createdAt: -1, _id: -1 }
    if (sort === "price-asc" || sort === "price_asc") {
      sortOptions = { price: 1, _id: -1 }
    } else if (sort === "price-desc" || sort === "price_desc") {
      sortOptions = { price: -1, _id: -1 }
    } else if (sort === "rating" || sort === "ratings") {
      sortOptions = { ratings: -1, numOfReviews: -1, _id: -1 }
    } else if (sort === "popular") {
      sortOptions = { numOfReviews: -1, ratings: -1, _id: -1 }
    } else {
      sortOptions = { createdAt: -1, _id: -1 }
    }

    const currentPage = Math.max(1, Number(page))
    const perPage = Math.max(1, Number(limit))

    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip((currentPage - 1) * perPage)
      .limit(perPage)

    const total = await Product.countDocuments(filter)

    res.status(200).json({ products, total, page: currentPage, totalPages: Math.ceil(total / perPage) })
  } catch (err) {
    console.error("Get all products error:", err)
    res.status(500).json({ message: "Failed to fetch products" })
  }
}

// 📦 GET: Single Product by ID (Public)
export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id).populate("reviews.user", "name email avatar")
    if (!product) return res.status(404).json({ message: "Product not found" })
    res.status(200).json(product)
  } catch (err) {
    console.error("Get product error:", err)
    res.status(500).json({ message: "Error getting product" })
  }
}

// 📦 POST: Create Product (Admin)
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, category, stock } = req.body

    if (!name || !description || !price || !category || !stock) {
      return res.status(400).json({ message: "All fields are required" })
    }

    let imageUploads: { public_id: string; url: string }[] = []

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      imageUploads = await Promise.all(
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
    } else if (req.body.imageUrl) {
      imageUploads = [{ public_id: "custom_url", url: req.body.imageUrl }]
    } else {
      imageUploads = [
        {
          public_id: "default_product",
          url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop",
        },
      ]
    }

    const product = new Product({
      name,
      description,
      price: Number(price),
      category,
      stock: Number(stock),
      images: imageUploads,
      user: req.user?._id,
    })

    await product.save()
    res.status(201).json(product)
  } catch (err) {
    console.error("Create product error:", err)
    res.status(500).json({ message: "Failed to create product" })
  }
}

// 📦 PUT/PATCH: Update Product (Admin)
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    product.name = req.body.name || product.name
    product.description = req.body.description || product.description
    product.price = req.body.price !== undefined ? Number(req.body.price) : product.price
    product.stock = req.body.stock !== undefined ? Number(req.body.stock) : product.stock
    product.category = req.body.category || product.category

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
      product.images = uploadedImages
    }

    await product.save()
    res.status(200).json(product)
  } catch (err) {
    console.error("Update product error:", err)
    res.status(500).json({ message: "Failed to update product", error: err })
  }
}

// 📦 DELETE: Delete Product (Admin)
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

// 📦 GET: All Products (Admin - no filter/limit)
export const getProducts = async (_req: Request, res: Response) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 })
    res.json({ products })
  } catch (err) {
    console.error("Admin getProducts error:", err)
    res.status(500).json({ message: "Failed to fetch all products" })
  }
}
