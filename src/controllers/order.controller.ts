import { Request, Response } from "express"
import Order from "../models/order.model"
import crypto from "crypto"
import Cart from '../models/cart.model'
import Product from '../models/product.model'

// 🧾 Create Order
// 🧾 Create Order and Clear Cart
export const createOrder = async (req: Request, res: Response) => {
  try {
    const {
      items,
      shippingAddress,
      totalAmount,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body

    const newOrder = new Order({
      user: req.user._id,
      items,
      shippingAddress,
      totalAmount,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentStatus: razorpayPaymentId ? "paid" : "pending",
      paidAt: razorpayPaymentId ? new Date() : undefined,
    })

    const savedOrder = await newOrder.save()

    // ✅ Clear the cart after order is created
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] })

    res.status(201).json(savedOrder)
  } catch (error: any) {
    console.error("❌ createOrder error:", error)
    res.status(500).json({ message: "Failed to create order", error: error.message })
  }
}

// 👤 Get User Orders
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.json(orders)
  } catch (error: any) {
    console.error("❌ getUserOrders error:", error)
    res.status(500).json({ message: "Failed to fetch user orders", error: error.message })
  }
}

// 👑 Admin: Get All Orders (optional delivery filter)
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { delivered } = req.query

    const filter =
      delivered !== undefined ? { isDelivered: delivered === "true" } : {}

    const orders = await Order.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })

    res.json(orders)
  } catch (error: any) {
    console.error("❌ getAllOrders error:", error)
    res.status(500).json({ message: "Failed to fetch all orders", error: error.message })
  }
}
// 👑 Admin: Get Order by ID
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.product", "name price")

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    res.json(order)
  } catch (error: any) {
    console.error("❌ getOrderById error:", error)
    res.status(500).json({ message: "Failed to fetch order details", error: error.message })
  }
}


// ✅ Mark Order as Delivered
export const markAsDelivered = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: "Order not found" })

    order.isDelivered = true
    order.deliveredAt = new Date()
    await order.save()

    res.json({ message: "Marked as delivered" })
  } catch (error: any) {
    console.error("❌ markAsDelivered error:", error)
    res.status(500).json({ message: "Failed to mark as delivered", error: error.message })
  }
}

// 📊 Admin: Analytics
export const getAnalytics = async (_req: Request, res: Response) => {
  try {
    const orders = await Order.find({ paymentStatus: "paid" })

    const totalOrders = orders.length
    const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0)
    const delivered = orders.filter((o) => o.isDelivered).length
    const pending = totalOrders - delivered

    res.json({ totalOrders, totalRevenue, delivered, pending })
  } catch (error: any) {
    console.error("❌ getAnalytics error:", error)
    res.status(500).json({ message: "Failed to get analytics", error: error.message })
  }
}


// 💳 Razorpay: Verify Payment Signature & Update Order
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" })
    }

    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // ✅ Decrease stock for each product in the order
    for (const item of order.items) {
      const product = await Product.findById(item.product)
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity) // Prevent going below 0
        await product.save()
      }
    }

    // ✅ Update payment details in order
    order.razorpayOrderId = razorpay_order_id
    order.razorpayPaymentId = razorpay_payment_id
    order.razorpaySignature = razorpay_signature
    order.paymentStatus = "paid"
    order.paidAt = new Date()

    await order.save()

    res.json({ success: true, message: "Payment verified, order updated, and stock adjusted" })
  } catch (error: any) {
    console.error("❌ verifyPayment error:", error)
    res.status(500).json({ success: false, message: "Payment verification failed", error: error.message })
  }
}

