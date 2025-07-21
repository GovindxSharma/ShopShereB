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
  name: { type: String, required: true },              // ✅ useful for display
  price: { type: Number, required: true },             // ✅ needed to freeze value at order time
  image: { type: String, required: true },             // ✅ so frontend doesn't need extra fetch
  quantity: { type: Number, required: true },
})

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    paymentStatus: { type: String, default: "pending" }, // 'pending', 'paid', 'failed'
    isDelivered: { type: Boolean, default: false },
    totalAmount: { type: Number, required: true },
    paidAt: { type: Date },                              // ✅ added for clarity
    deliveredAt: { type: Date },                         // ✅ useful for admin/dashboard
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
  },
  { timestamps: true }
)

export default mongoose.model("Order", orderSchema)
