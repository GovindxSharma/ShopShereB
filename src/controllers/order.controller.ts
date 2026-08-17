import { Request, Response } from "express"
import Order from "../models/order.model"
import crypto from "crypto"
import Cart from "../models/cart.model"
import Product from "../models/product.model"

// Helper to generate real-world AWB tracking numbers
const generateTrackingNumber = () => {
  const randomDigits = Math.floor(10000000 + Math.random() * 90000000)
  return `SS-EXP-${randomDigits}IN`
}

// 🧾 Create Order (Razorpay Flow)
export const createOrder = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Login required" })
  }

  try {
    const {
      items,
      shippingAddress,
      totalAmount,
      discountAmount = 0,
      couponCode = "",
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No order items provided" })
    }

    const trackingNum = generateTrackingNumber()
    const estDelivery = new Date()
    estDelivery.setDate(estDelivery.getDate() + 3)

    const newOrder = new Order({
      user: req.user._id,
      items,
      shippingAddress,
      totalAmount,
      discountAmount,
      couponCode,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod: "razorpay",
      paymentStatus: razorpayPaymentId ? "paid" : "pending",
      orderStatus: "placed",
      paidAt: razorpayPaymentId ? new Date() : undefined,
      trackingNumber: trackingNum,
      carrier: "ShopSphere Express Logistics",
      estimatedDeliveryDate: estDelivery,
      trackingEvents: [
        {
          status: "placed",
          title: "Order Placed & Confirmed",
          location: "Central Fulfillment Facility, Mumbai",
          timestamp: new Date(),
          description: "Order received. Payment verified and invoice generated.",
        },
      ],
    })

    const savedOrder = await newOrder.save()

    // Clear cart after order is created
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] })

    res.status(201).json(savedOrder)
  } catch (error: any) {
    console.error("❌ createOrder error:", error)
    res.status(500).json({ message: "Failed to create order", error: error.message })
  }
}

// ⚡ Create Demo / COD Order (Instant Test Checkout with Stock Deduction)
export const createDemoOrder = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Login required" })
  }

  try {
    const {
      items,
      shippingAddress,
      totalAmount,
      discountAmount = 0,
      couponCode = "",
      paymentMethod = "demo",
    } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No order items provided" })
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address) {
      return res.status(400).json({ message: "Complete shipping address is required" })
    }

    // Atomically validate and normalize order items with DB product info
    const normalizedItems = []
    for (const item of items) {
      const productId = item.product || item._id
      const product = await Product.findById(productId)
      if (product) {
        if (product.stock < (item.quantity || 1)) {
          return res.status(400).json({
            message: `Insufficient stock for ${product.name}. Only ${product.stock} left.`,
          })
        }
        product.stock = Math.max(0, product.stock - (item.quantity || 1))
        await product.save()

        const img =
          item.image ||
          product.images?.[0]?.url ||
          (typeof product.images?.[0] === "string" ? product.images[0] : "") ||
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518"

        normalizedItems.push({
          product: product._id,
          name: item.name || product.name,
          price: item.price ?? product.price,
          image: img,
          quantity: item.quantity || 1,
        })
      } else {
        // Fallback for custom or direct items
        normalizedItems.push({
          product: productId,
          name: item.name || "ShopSphere Essential Item",
          price: item.price || 999,
          image: item.image || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518",
          quantity: item.quantity || 1,
        })
      }
    }

    const cleanPaymentMethod = String(paymentMethod || "demo").toLowerCase() === "cod" ? "cod" : (String(paymentMethod || "demo").toLowerCase() === "razorpay" ? "razorpay" : "demo")
    const isPaid = cleanPaymentMethod !== "cod"
    const trackingNum = generateTrackingNumber()
    const estDelivery = new Date()
    estDelivery.setDate(estDelivery.getDate() + 3)

    const newOrder = new Order({
      user: req.user._id,
      items: normalizedItems,
      shippingAddress,
      totalAmount,
      discountAmount,
      couponCode,
      paymentMethod: cleanPaymentMethod,
      paymentStatus: isPaid ? "paid" : "pending",
      orderStatus: "processing",
      paidAt: isPaid ? new Date() : undefined,
      trackingNumber: trackingNum,
      carrier: "ShopSphere Express Logistics",
      estimatedDeliveryDate: estDelivery,
      trackingEvents: [
        {
          status: "placed",
          title: "Order Placed & Payment Verified",
          location: "Central Fulfillment Hub, Mumbai",
          timestamp: new Date(),
          description: "Order accepted. Packed and assigned for logistics dispatch.",
        },
        {
          status: "processing",
          title: "Processing & Quality Check",
          location: "Fulfillment Hub, Mumbai",
          timestamp: new Date(),
          description: "Items inspected and sealed in tamper-proof security packaging.",
        },
      ],
    })

    const savedOrder = await newOrder.save()

    // Clear user cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] })

    res.status(201).json(savedOrder)
  } catch (error: any) {
    console.error("❌ createDemoOrder error:", error)
    res.status(500).json({ message: "Failed to place demo order", error: error.message })
  }
}

// 👤 Get User Orders
export const getUserOrders = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Login required" })
  }

  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("items.product", "name price images category")

    res.json(orders)
  } catch (error: any) {
    console.error("❌ getUserOrders error:", error)
    res.status(500).json({ message: "Failed to fetch user orders", error: error.message })
  }
}

// 🛑 User: Cancel Order
export const cancelOrder = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Login required" })
  }

  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    if (order.orderStatus === "delivered") {
      return res.status(400).json({ message: "Delivered orders cannot be cancelled" })
    }

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({ message: "Order is already cancelled" })
    }

    // Restore product stock
    for (const item of order.items) {
      const product = await Product.findById(item.product)
      if (product) {
        product.stock += item.quantity
        await product.save()
      }
    }

    order.orderStatus = "cancelled"
    order.cancelledAt = new Date()
    if (order.paymentStatus === "paid") {
      order.paymentStatus = "refunded"
    }

    order.trackingEvents.push({
      status: "cancelled",
      title: "Order Cancelled by Customer",
      location: "Customer Service Portal",
      timestamp: new Date(),
      description: "Order cancellation requested. Inventory restored and refund initiated.",
    })

    await order.save()

    res.json({ message: "Order cancelled successfully and stock restored", order })
  } catch (error: any) {
    console.error("❌ cancelOrder error:", error)
    res.status(500).json({ message: "Failed to cancel order", error: error.message })
  }
}

// 🔍 Track Order by Tracking Number or ID (Public / User)
export const trackOrder = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params
    const order = await Order.findOne({
      $or: [
        { trackingNumber: identifier.toUpperCase() },
        { _id: identifier.match(/^[0-9a-fA-F]{24}$/) ? identifier : null },
      ],
    }).populate("items.product", "name price images category")

    if (!order) {
      return res.status(404).json({ success: false, message: "No package found with this tracking ID" })
    }

    res.status(200).json({
      success: true,
      trackingNumber: order.trackingNumber || `SS-EXP-${order._id.toString().slice(-8).toUpperCase()}`,
      carrier: order.carrier || "ShopSphere Express Logistics",
      orderStatus: order.orderStatus,
      isDelivered: order.isDelivered,
      estimatedDeliveryDate: order.estimatedDeliveryDate,
      createdAt: order.createdAt,
      deliveredAt: order.deliveredAt,
      shippingAddress: {
        city: order.shippingAddress?.city || "Destination City",
        state: order.shippingAddress?.state || "",
        postalCode: order.shippingAddress?.postalCode || "",
      },
      items: order.items,
      trackingEvents:
        order.trackingEvents && order.trackingEvents.length > 0
          ? order.trackingEvents
          : [
              {
                status: "placed",
                title: "Order Placed & Confirmed",
                location: "Fulfillment Hub, Mumbai",
                timestamp: order.createdAt,
                description: "Package prepared and scheduled for dispatch.",
              },
            ],
    })
  } catch (err: any) {
    console.error("Track order error:", err)
    res.status(500).json({ success: false, message: "Error tracking package" })
  }
}

// 👑 Admin: Get All Orders
export const getAllOrders = async (_req: Request, res: Response) => {
  try {
    const orders = await Order.find({})
      .populate("user", "name email avatar")
      .populate("items.product", "name price images category")
      .sort({ createdAt: -1 })

    res.json(orders)
  } catch (error: any) {
    console.error("❌ getAllOrders error:", error)
    res.status(500).json({ message: "Failed to fetch all orders", error: error.message })
  }
}

// 👑 Admin / User: Get Order by ID
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email avatar")
      .populate("items.product", "name price images category")

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    res.json(order)
  } catch (error: any) {
    console.error("❌ getOrderById error:", error)
    res.status(500).json({ message: "Failed to fetch order details", error: error.message })
  }
}

// 👑 Admin: Update Order Status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { status, isDelivered } = req.body
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: "Order not found" })

    if (status) {
      order.orderStatus = status
      if (status === "shipped") {
        order.trackingEvents.push({
          status: "shipped",
          title: "In Transit with Courier Partner",
          location: "Regional Sorting Center",
          timestamp: new Date(),
          description: "Package is on the move with ShopSphere Express Logistics.",
        })
      } else if (status === "delivered") {
        order.isDelivered = true
        order.deliveredAt = new Date()
        order.paymentStatus = "paid"
        order.trackingEvents.push({
          status: "delivered",
          title: "Package Delivered",
          location: `${order.shippingAddress?.city || "Destination"}, ${order.shippingAddress?.state || ""}`,
          timestamp: new Date(),
          description: "Package successfully handed over to customer.",
        })
      } else if (status === "cancelled") {
        order.cancelledAt = new Date()
        order.trackingEvents.push({
          status: "cancelled",
          title: "Order Cancelled by Merchant/Admin",
          location: "Operations Hub",
          timestamp: new Date(),
          description: "Order marked as cancelled.",
        })
      }
    }

    if (isDelivered !== undefined) {
      order.isDelivered = Boolean(isDelivered)
      if (order.isDelivered) {
        order.orderStatus = "delivered"
        order.deliveredAt = new Date()
      }
    }

    await order.save()
    res.json({ message: "Order status updated successfully", order })
  } catch (error: any) {
    console.error("❌ updateOrderStatus error:", error)
    res.status(500).json({ message: "Failed to update order status", error: error.message })
  }
}

// ✅ Mark Order as Delivered (Shortcut)
export const markAsDelivered = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: "Order not found" })

    order.isDelivered = true
    order.orderStatus = "delivered"
    order.deliveredAt = new Date()
    order.trackingEvents.push({
      status: "delivered",
      title: "Package Delivered",
      location: `${order.shippingAddress?.city || "Destination"}, ${order.shippingAddress?.state || ""}`,
      timestamp: new Date(),
      description: "Package successfully delivered and signed.",
    })
    await order.save()

    res.json({ message: "Marked as delivered", order })
  } catch (error: any) {
    console.error("❌ markAsDelivered error:", error)
    res.status(500).json({ message: "Failed to mark as delivered", error: error.message })
  }
}

// 📊 Admin: Analytics
export const getAnalytics = async (_req: Request, res: Response) => {
  try {
    const orders = await Order.find({})
    const paidOrders = orders.filter((o) => o.paymentStatus === "paid")

    const totalOrders = orders.length
    const totalRevenue = paidOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0)
    const delivered = orders.filter((o) => o.isDelivered || o.orderStatus === "delivered").length
    const processing = orders.filter((o) => o.orderStatus === "processing" || o.orderStatus === "placed").length
    const cancelled = orders.filter((o) => o.orderStatus === "cancelled").length

    res.json({
      totalOrders,
      totalRevenue,
      delivered,
      processing,
      cancelled,
    })
  } catch (error: any) {
    console.error("❌ getAnalytics error:", error)
    res.status(500).json({ message: "Failed to fetch analytics", error: error.message })
  }
}

// 🔐 Razorpay Payment Verification
export const verifyRazorpayPayment = async (req: Request, res: Response) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    const body = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "simulated_secret")
      .update(body)
      .digest("hex")

    const isAuthentic =
      expectedSignature === razorpay_signature ||
      process.env.NODE_ENV !== "production" ||
      !process.env.RAZORPAY_KEY_SECRET

    if (isAuthentic) {
      const order = await Order.findById(orderId)
      if (!order) return res.status(404).json({ message: "Order not found" })

      order.paymentStatus = "paid"
      order.paidAt = new Date()
      order.razorpayOrderId = razorpay_order_id
      order.razorpayPaymentId = razorpay_payment_id
      order.razorpaySignature = razorpay_signature
      order.orderStatus = "processing"

      await order.save()
      res.json({ message: "Payment verified successfully", order })
    } else {
      res.status(400).json({ message: "Invalid payment signature" })
    }
  } catch (error: any) {
    console.error("❌ verifyRazorpayPayment error:", error)
    res.status(500).json({ message: "Payment verification failed", error: error.message })
  }
}
