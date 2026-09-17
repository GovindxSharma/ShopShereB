import mongoose from "mongoose"

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String, required: true },
})

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
})

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "demo", "cod"],
      default: "demo",
    },
    orderStatus: {
      type: String,
      enum: ["placed", "processing", "shipped", "delivered", "cancelled"],
      default: "placed",
    },
    isDelivered: { type: Boolean, default: false },
    totalAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: "" },
    paidAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    trackingNumber: { type: String },
    carrier: { type: String, default: "ShopSphere Express Logistics" },
    estimatedDeliveryDate: { type: Date },
    trackingEvents: [
      {
        status: { type: String, required: true },
        title: { type: String, required: true },
        location: { type: String, default: "Fulfillment Hub" },
        timestamp: { type: Date, default: Date.now },
        description: { type: String, default: "" },
      },
    ],
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String, index: true },
    razorpaySignature: String,
  },
  { timestamps: true }
)

export default mongoose.model("Order", orderSchema)
