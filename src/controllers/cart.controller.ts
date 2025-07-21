import { Request, Response } from "express"
import Cart from "../models/cart.model"
import Product from "../models/product.model"

// 🔍 Get Cart with product sync
export const getCart = async (req: Request, res: Response) => {
  const userId = req.user._id
  let cart = await Cart.findOne({ user: userId }).populate("items.product")

  if (!cart) return res.json({ items: [] })

  let modified = false

  // Filter and adjust cart items
  const updatedItems = cart.items.filter((item) => {
    const product: any = item.product

    // Product deleted
    if (!product || product === null) {
      modified = true
      return false
    }

    // Out of stock
    if (product.stock === 0) {
      modified = true
      return false
    }

    // Quantity more than available stock
    if (item.quantity > product.stock) {
      item.quantity = product.stock
      modified = true
    }

    return true
  })

  if (modified) {
    cart.items = updatedItems
    await cart.save()
    cart = await Cart.findOne({ user: userId }).populate("items.product")
  }

  res.json(cart)
}

// ➕ Add to Cart
export const addToCart = async (req: Request, res: Response) => {
  const userId = req.user._id
  const { product, quantity } = req.body

  const productExists = await Product.findById(product)
  if (!productExists) {
    return res.status(400).json({ message: "Invalid product ID" })
  }

  if (productExists.stock === 0) {
    return res.status(400).json({ message: "Product is out of stock" })
  }

  if (quantity > productExists.stock) {
    return res.status(400).json({ message: `Only ${productExists.stock} in stock` })
  }

  let cart = await Cart.findOne({ user: userId })

  if (!cart) {
    cart = new Cart({ user: userId, items: [{ product, quantity }] })
  } else {
    const item = cart.items.find((i) => i.product.toString() === product)
    if (item) {
      const newQty = item.quantity + quantity
      if (newQty > productExists.stock) {
        return res.status(400).json({ message: `Only ${productExists.stock} in stock` })
      }
      item.quantity = newQty
    } else {
      cart.items.push({ product, quantity })
    }
  }

  await cart.save()
  const populatedCart = await Cart.findOne({ user: userId }).populate("items.product")
  res.json(populatedCart)
}

// ✏️ Update Cart Item
export const updateCartItem = async (req: Request, res: Response) => {
  const userId = req.user._id
  const { product, quantity } = req.body

  const productExists = await Product.findById(product)
  if (!productExists) {
    return res.status(400).json({ message: "Product no longer exists" })
  }

  if (productExists.stock === 0) {
    return res.status(400).json({ message: "Product is out of stock" })
  }

  if (quantity > productExists.stock) {
    return res.status(400).json({ message: `Only ${productExists.stock} in stock` })
  }

  const cart = await Cart.findOne({ user: userId })
  if (!cart) return res.status(404).json({ message: "Cart not found" })

  const item = cart.items.find((i) => i.product.toString() === product)
  if (item) {
    item.quantity = quantity
  }

  await cart.save()
  const populatedCart = await Cart.findOne({ user: userId }).populate("items.product")
  res.json(populatedCart)
}

// ❌ Remove from Cart
export const removeFromCart = async (req: Request, res: Response) => {
  const userId = req.user._id
  const { product } = req.body

  const cart = await Cart.findOne({ user: userId })
  if (!cart) return res.status(404).json({ message: "Cart not found" })

  cart.items = cart.items.filter((i) => i.product.toString() !== product)
  await cart.save()

  const populatedCart = await Cart.findOne({ user: userId }).populate("items.product")
  res.json(populatedCart)
}

// 🗑️ Clear Cart
export const clearCart = async (req: Request, res: Response) => {
  const userId = req.user._id
  await Cart.findOneAndUpdate({ user: userId }, { items: [] })
  res.json({ message: "Cart cleared" })
}
