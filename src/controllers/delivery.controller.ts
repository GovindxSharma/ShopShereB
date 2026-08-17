import { Request, Response } from "express"
import Order from "../models/order.model"
import "../models/user.model"
import "../models/product.model"

// 🚚 GET: All Orders for Delivery Partners (Active & History)
export const getDeliveryOrders = async (_req: Request, res: Response) => {
  try {
    const orders = await Order.find({})
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .lean()

    res.status(200).json({ success: true, orders })
  } catch (err: any) {
    console.error("Delivery orders error:", err)
    res.status(500).json({ success: false, message: "Failed to fetch delivery orders" })
  }
}

// 📍 PUT: Update Live Delivery Checkpoint & Status
export const updateDeliveryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status, note, location } = req.body

    const order = await Order.findById(id)
    if (!order) return res.status(404).json({ success: false, message: "Order not found" })

    const agentName = req.user?.name || "Rahul Logistics (Express Agent)"
    const currentCity = order.shippingAddress?.city || "Hub"
    const currentState = order.shippingAddress?.state || ""
    const currentLocation = location || `${currentCity}, ${currentState}`

    if (!order.trackingEvents) {
      order.set("trackingEvents", [])
    }

    if (status === "shipped" || status === "in_transit") {
      order.orderStatus = "shipped"
      order.trackingEvents.push({
        status: "shipped",
        title: "In Transit with Courier Partner",
        location: currentLocation,
        timestamp: new Date(),
        description: note || `Dispatched from sorting facility by ${agentName}. In transit to destination.`,
      })
    } else if (status === "out_for_delivery") {
      order.orderStatus = "shipped"
      order.trackingEvents.push({
        status: "out_for_delivery",
        title: "Out for Delivery Today",
        location: currentLocation,
        timestamp: new Date(),
        description: note || `Delivery executive ${agentName} is out for doorstep delivery.`,
      })
    } else if (status === "delivered") {
      order.orderStatus = "delivered"
      order.isDelivered = true
      order.deliveredAt = new Date()
      order.paymentStatus = "paid"
      order.trackingEvents.push({
        status: "delivered",
        title: "Package Delivered & Signed",
        location: currentLocation,
        timestamp: new Date(),
        description: note || `Package handed over to recipient and verified by ${agentName}.`,
      })
    } else if (status === "failed") {
      order.trackingEvents.push({
        status: "attempted",
        title: "Delivery Attempted - Customer Unavailable",
        location: currentLocation,
        timestamp: new Date(),
        description: note || "Customer premise was closed. Re-attempt scheduled for next business day.",
      })
    }

    await order.save()

    res.status(200).json({
      success: true,
      message: `Shipment status updated to '${status}' successfully!`,
      order,
    })
  } catch (err: any) {
    console.error("Update delivery status error:", err)
    res.status(500).json({ success: false, message: "Failed to update delivery status" })
  }
}
