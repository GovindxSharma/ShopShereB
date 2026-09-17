import { Request, Response } from "express"
import Product from "../models/product.model"
import cloudinary from "../utils/cloudinary"
import { appCache } from "../utils/cache"

// 📦 GET: All Products (for client-side fast search with Fuse.js)
export const getAllProductNames = async (_req: Request, res: Response) => {
  try {
    const cacheKey = "products:names"
    const cached = appCache.get(cacheKey)
    if (cached) {
      res.setHeader("X-Cache", "HIT")
      res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=300")
      return res.status(200).json(cached)
    }

    const products = await Product.find({}, "name category description price images ratings stock")
    const responseData = { products }
    appCache.set(cacheKey, responseData, 120)

    res.setHeader("X-Cache", "MISS")
    res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=300")
    res.status(200).json(responseData)
  } catch (err) {
    console.error("Fetch all product names failed:", err)
    res.status(500).json({ message: "Failed to get product names" })
  }
}

// 📦 GET: All Unique Categories
export const getCategories = async (_req: Request, res: Response) => {
  try {
    const cacheKey = "categories:all"
    const cached = appCache.get(cacheKey)
    if (cached) {
      res.setHeader("X-Cache", "HIT")
      res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600")
      return res.status(200).json(cached)
    }

    const categories = await Product.distinct("category")
    const responseData = { categories }
    appCache.set(cacheKey, responseData, 300)

    res.setHeader("X-Cache", "MISS")
    res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600")
    res.status(200).json(responseData)
  } catch (err) {
    console.error("Fetch categories failed:", err)
    res.status(500).json({ message: "Failed to get categories" })
  }
}

// 📦 GET: Related Products
export const getRelatedProducts = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const cacheKey = `products:related:${id}`
    const cached = appCache.get(cacheKey)
    if (cached) {
      res.setHeader("X-Cache", "HIT")
      res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=300")
      return res.status(200).json(cached)
    }

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

    const responseData = { products: related }
    appCache.set(cacheKey, responseData, 120)

    res.setHeader("X-Cache", "MISS")
    res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=300")
    res.status(200).json(responseData)
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

    // In-memory cache lookup
    const cacheKey = `products:list:${JSON.stringify(req.query)}`
    const cached = appCache.get(cacheKey)
    if (cached) {
      res.setHeader("X-Cache", "HIT")
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120")
      return res.status(200).json(cached)
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

    const responseData = {
      products,
      total,
      page: currentPage,
      totalPages: Math.ceil(total / perPage),
    }

    // Cache list result for 60 seconds
    appCache.set(cacheKey, responseData, 60)

    res.setHeader("X-Cache", "MISS")
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120")
    res.status(200).json(responseData)
  } catch (err) {
    console.error("Get all products error:", err)
    res.status(500).json({ message: "Failed to fetch products" })
  }
}

// 📦 GET: Single Product by ID (Public)
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const cacheKey = `product:${id}`
    const cached = appCache.get(cacheKey)
    if (cached) {
      res.setHeader("X-Cache", "HIT")
      res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=300")
      return res.status(200).json(cached)
    }

    const product = await Product.findById(id).populate("reviews.user", "name email avatar")
    if (!product) return res.status(404).json({ message: "Product not found" })

    appCache.set(cacheKey, product, 120)
    res.setHeader("X-Cache", "MISS")
    res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=300")
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

    // Asynchronous Cloudinary pipeline: auto-format (WebP/AVIF), auto-quality compression, max 1200px
    const CLOUDINARY_UPLOAD_OPTIONS = {
      folder: "shopshere/products",
      resource_type: "image" as const,
      transformation: [
        { width: 1200, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    }

    let imageUploads: { public_id: string; url: string }[] = []

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      imageUploads = await Promise.all(
        req.files.map((file) => {
          return new Promise<{ public_id: string; url: string }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              CLOUDINARY_UPLOAD_OPTIONS,
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

    // ⚡ Purge cache
    appCache.clearPrefix("products:")
    appCache.clearPrefix("categories:")

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
      const oldImages = product.images || []
      const uploadedImages = await Promise.all(
        req.files.map((file) => {
          return new Promise<{ public_id: string; url: string }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "shopshere/products",
                resource_type: "image" as const,
                transformation: [
                  { width: 1200, crop: "limit" },
                  { quality: "auto" },
                  { fetch_format: "auto" },
                ],
              },
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

      // Asynchronously clean up old media from Cloudinary
      for (const img of oldImages) {
        if (img.public_id && !img.public_id.startsWith("http") && img.public_id !== "custom_url" && img.public_id !== "default_product") {
          cloudinary.uploader.destroy(img.public_id).catch((err) => {
            console.warn(`[Cloudinary] Failed to clean up replaced image ${img.public_id}:`, err)
          })
        }
      }
    }

    await product.save()

    // ⚡ Purge cache
    appCache.clearPrefix("products:")
    appCache.clearPrefix(`product:${req.params.id}`)
    appCache.clearPrefix("categories:")

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

    // Asynchronously clean up deleted product images from Cloudinary pipeline
    if (deleted.images && Array.isArray(deleted.images)) {
      for (const img of deleted.images) {
        if (img.public_id && !img.public_id.startsWith("http") && img.public_id !== "custom_url" && img.public_id !== "default_product") {
          cloudinary.uploader.destroy(img.public_id).catch((err) => {
            console.warn(`[Cloudinary] Failed to destroy image ${img.public_id}:`, err)
          })
        }
      }
    }

    // ⚡ Purge cache
    appCache.clearPrefix("products:")
    appCache.clearPrefix(`product:${req.params.id}`)
    appCache.clearPrefix("categories:")

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
