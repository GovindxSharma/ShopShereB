import { Request, Response } from "express"
import Coupon from "../models/coupon.model"

// Seed default coupons if collection is empty
const ensureDefaultCoupons = async () => {
  try {
    const count = await Coupon.countDocuments()
    if (count === 0) {
      const farFuture = new Date()
      farFuture.setFullYear(farFuture.getFullYear() + 2)

      await Coupon.create([
        {
          code: "SHOPSHERE10",
          discountType: "percentage",
          discountValue: 10,
          minPurchase: 499,
          expiryDate: farFuture,
          isActive: true,
          description: "Get 10% off on all orders above ₹499",
        },
        {
          code: "SUPER20",
          discountType: "percentage",
          discountValue: 20,
          maxDiscount: 1000,
          minPurchase: 1499,
          expiryDate: farFuture,
          isActive: true,
          description: "20% off up to ₹1,000 on orders above ₹1,499",
        },
        {
          code: "FLAT500",
          discountType: "flat",
          discountValue: 500,
          minPurchase: 2499,
          expiryDate: farFuture,
          isActive: true,
          description: "Flat ₹500 discount on cart value above ₹2,499",
        },
        {
          code: "WELCOME50",
          discountType: "percentage",
          discountValue: 15,
          minPurchase: 299,
          expiryDate: farFuture,
          isActive: true,
          description: "Welcome offer: 15% off on your order above ₹299",
        },
      ])
    }
  } catch (err) {
    console.warn("Could not seed default coupons", err)
  }
}

// 📌 GET: All Active Available Coupons (Public for Shoppers)
export const getAvailableCoupons = async (_req: Request, res: Response) => {
  try {
    await ensureDefaultCoupons()
    const now = new Date()
    const coupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gte: now },
    }).sort({ minPurchase: 1 })

    res.status(200).json({
      success: true,
      coupons: coupons.map((c) => ({
        _id: c._id,
        code: c.code,
        discountType: c.discountType,
        discountValue: c.discountValue,
        discountPercent: c.discountType === "percentage" ? c.discountValue : undefined,
        discountFlat: c.discountType === "flat" ? c.discountValue : undefined,
        maxDiscount: c.maxDiscount,
        minPurchase: c.minPurchase,
        description: c.description,
        expiryDate: c.expiryDate,
        isActive: c.isActive,
      })),
    })
  } catch (err) {
    console.error("Get coupons error:", err)
    res.status(500).json({ success: false, message: "Failed to fetch coupons" })
  }
}

// 📌 POST: Validate and Calculate Coupon Discount (Public)
export const validateCoupon = async (req: Request, res: Response) => {
  try {
    const { code, subtotal, cartTotal } = req.body
    const cleanCode = (code || "").trim().toUpperCase()
    const amount = Number(subtotal ?? cartTotal ?? req.body.amount) || 0

    if (!cleanCode) {
      return res.status(400).json({ success: false, message: "Coupon code is required" })
    }

    await ensureDefaultCoupons()
    const coupon = await Coupon.findOne({ code: cleanCode })

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: `Invalid coupon code '${cleanCode}'. Please check active promotions.`,
      })
    }

    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: `Coupon '${cleanCode}' is currently disabled or expired.`,
      })
    }

    const now = new Date()
    if (new Date(coupon.expiryDate) < now) {
      return res.status(400).json({
        success: false,
        message: `Coupon '${cleanCode}' expired on ${new Date(coupon.expiryDate).toLocaleDateString()}.`,
      })
    }

    if (amount < coupon.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `Coupon '${coupon.code}' requires a minimum cart total of ₹${coupon.minPurchase.toLocaleString()}. Add ₹${(coupon.minPurchase - amount).toLocaleString()} more to apply!`,
      })
    }

    let discountAmount = 0
    if (coupon.discountType === "percentage") {
      discountAmount = Math.round((amount * coupon.discountValue) / 100)
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount
      }
    } else if (coupon.discountType === "flat") {
      discountAmount = Math.min(amount, coupon.discountValue)
    }

    const finalAmount = Math.max(0, amount - discountAmount)

    return res.status(200).json({
      success: true,
      valid: true,
      couponCode: coupon.code,
      discountAmount,
      discountPercent: coupon.discountType === "percentage" ? coupon.discountValue : null,
      finalAmount,
      message: `Coupon '${coupon.code}' applied! Saved ₹${discountAmount.toLocaleString()}`,
    })
  } catch (err: any) {
    console.error("Validate coupon error:", err)
    res.status(500).json({ success: false, message: "Error calculating discount" })
  }
}

// 🛡️ ADMIN: Get All Coupons (Including Inactive & Expired)
export const getAllAdminCoupons = async (_req: Request, res: Response) => {
  try {
    await ensureDefaultCoupons()
    const coupons = await Coupon.find().sort({ createdAt: -1 })
    res.status(200).json({ success: true, coupons })
  } catch (err) {
    console.error("Admin coupons error:", err)
    res.status(500).json({ success: false, message: "Failed to fetch admin coupons" })
  }
}

// 🛡️ ADMIN: Create New Coupon
export const createAdminCoupon = async (req: Request, res: Response) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      expiryDate,
      description,
      isActive,
    } = req.body

    const cleanCode = (code || "").trim().toUpperCase()
    if (!cleanCode || !discountValue || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Code, discount value, and validity expiry date are required.",
      })
    }

    const existing = await Coupon.findOne({ code: cleanCode })
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Coupon code '${cleanCode}' already exists.`,
      })
    }

    const newCoupon = await Coupon.create({
      code: cleanCode,
      discountType: discountType === "flat" ? "flat" : "percentage",
      discountValue: Number(discountValue),
      minPurchase: Number(minPurchase) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      expiryDate: new Date(expiryDate),
      description: description || `${discountType === "flat" ? `Flat ₹${discountValue}` : `${discountValue}%`} off discount`,
      isActive: isActive !== false,
    })

    res.status(201).json({
      success: true,
      message: `Coupon '${newCoupon.code}' generated successfully!`,
      coupon: newCoupon,
    })
  } catch (err: any) {
    console.error("Create coupon error:", err)
    res.status(500).json({ success: false, message: err.message || "Failed to create coupon" })
  }
}

// 🛡️ ADMIN: Toggle Coupon Active Status (Turn ON / OFF)
export const toggleCouponStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const coupon = await Coupon.findById(id)

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" })
    }

    coupon.isActive = !coupon.isActive
    await coupon.save()

    res.status(200).json({
      success: true,
      message: `Coupon '${coupon.code}' is now ${coupon.isActive ? "ACTIVE (ON)" : "INACTIVE (OFF)"}`,
      coupon,
    })
  } catch (err: any) {
    console.error("Toggle coupon error:", err)
    res.status(500).json({ success: false, message: "Failed to toggle coupon status" })
  }
}

// 🛡️ ADMIN: Delete Coupon
export const deleteAdminCoupon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const deleted = await Coupon.findByIdAndDelete(id)
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Coupon not found" })
    }
    res.status(200).json({ success: true, message: `Coupon '${deleted.code}' deleted successfully` })
  } catch (err: any) {
    console.error("Delete coupon error:", err)
    res.status(500).json({ success: false, message: "Failed to delete coupon" })
  }
}
