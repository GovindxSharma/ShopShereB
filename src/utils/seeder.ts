import mongoose from "mongoose"
import dotenv from "dotenv"
import bcrypt from "bcryptjs"
import Product from "../models/product.model"
import User from "../models/user.model"

dotenv.config()

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/shopshere"

const sampleProducts = [
  {
    name: "Apple iPhone 15 Pro Max (256 GB) - Titanium Blue",
    description: "Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever with 5x optical zoom.",
    price: 134900,
    ratings: 4.8,
    category: "Electronics",
    stock: 15,
    numOfReviews: 12,
    images: [
      {
        public_id: "iphone_15_pro_1",
        url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1000&auto=format&fit=crop",
      },
      {
        public_id: "iphone_15_pro_2",
        url: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?q=80&w=1000&auto=format&fit=crop",
      },
    ],
    reviews: [
      {
        name: "Rahul Verma",
        rating: 5,
        comment: "Unbelievable build quality and camera clarity! The titanium feel is super lightweight.",
      },
      {
        name: "Ananya Patel",
        rating: 4.5,
        comment: "Battery lasts easily over a full day. Best phone I have ever owned.",
      },
    ],
  },
  {
    name: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    description: "Industry-leading noise canceling with two processors and 8 microphones. Magnificent audio quality with Auto NC Optimizer and crystal clear hands-free calling.",
    price: 29990,
    ratings: 4.9,
    category: "Audio",
    stock: 25,
    numOfReviews: 18,
    images: [
      {
        public_id: "sony_xm5_1",
        url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop",
      },
      {
        public_id: "sony_xm5_2",
        url: "https://images.unsplash.com/photo-1484704849700-f032a568e944?q=80&w=1000&auto=format&fit=crop",
      },
    ],
    reviews: [
      {
        name: "Vikram Mehta",
        rating: 5,
        comment: "The noise cancellation is pure magic. Working from cafes has never been easier.",
      },
    ],
  },
  {
    name: "MacBook Pro 16-inch M3 Max (36GB Unified Memory, 1TB SSD)",
    description: "Mind-blowing performance with the M3 Max chip. Up to 22 hours of battery life. Liquid Retina XDR display with 1600 nits peak brightness for pro workflows.",
    price: 249900,
    ratings: 4.9,
    category: "Laptops",
    stock: 8,
    numOfReviews: 9,
    images: [
      {
        public_id: "macbook_pro_1",
        url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1000&auto=format&fit=crop",
      },
      {
        public_id: "macbook_pro_2",
        url: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=1000&auto=format&fit=crop",
      },
    ],
    reviews: [
      {
        name: "Devendra S.",
        rating: 5,
        comment: "Compiles massive codebases in seconds. Silent fans and infinite battery life.",
      },
    ],
  },
  {
    name: "Apple Watch Ultra 2 (GPS + Cellular, 49mm Titanium Case)",
    description: "The most rugged and capable Apple Watch. Built for endurance athletes, outdoor adventurers, and water sports enthusiasts with a precision dual-frequency GPS.",
    price: 89900,
    ratings: 4.7,
    category: "Watches",
    stock: 12,
    numOfReviews: 7,
    images: [
      {
        public_id: "apple_watch_ultra_1",
        url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop",
      },
    ],
    reviews: [
      {
        name: "Karan Johar",
        rating: 5,
        comment: "Rugged, gorgeous screen, and extremely accurate GPS for running.",
      },
    ],
  },
  {
    name: "Nike Air Jordan 1 Retro High OG 'Chicago'",
    description: "The legend returns. Iconic styling with premium full-grain leather, encapsulated Air-Sole unit, and timeless court-to-street silhouette.",
    price: 16995,
    ratings: 4.8,
    category: "Fashion",
    stock: 20,
    numOfReviews: 15,
    images: [
      {
        public_id: "nike_jordan_1",
        url: "https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=1000&auto=format&fit=crop",
      },
      {
        public_id: "nike_jordan_2",
        url: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1000&auto=format&fit=crop",
      },
    ],
    reviews: [
      {
        name: "Sameer Khan",
        rating: 5,
        comment: "Classic kicks. The leather quality is top notch and fits true to size.",
      },
    ],
  },
  {
    name: "Sony Alpha a7 IV Full-frame Mirrorless Camera (Body Only)",
    description: "33MP full-frame Exmor R back-illuminated CMOS sensor with real-time Eye AF for humans, animals, and birds. 4K 60p 10-bit 4:2:2 video recording.",
    price: 214990,
    ratings: 4.9,
    category: "Electronics",
    stock: 6,
    numOfReviews: 11,
    images: [
      {
        public_id: "sony_a7iv_1",
        url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop",
      },
    ],
    reviews: [
      {
        name: "Pooja Hegde",
        rating: 5,
        comment: "Low light autofocus is unmatched. Perfect hybrid camera for both video and stills.",
      },
    ],
  },
  {
    name: "Marshall Stanmore III Bluetooth Wireless Speaker",
    description: "Re-engineered for a wider soundstage with room-filling Marshall signature sound. Dynamic Loudness adjusts tonal balance for rich audio at any volume.",
    price: 31999,
    ratings: 4.7,
    category: "Audio",
    stock: 18,
    numOfReviews: 8,
    images: [
      {
        public_id: "marshall_stanmore_1",
        url: "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=1000&auto=format&fit=crop",
      },
    ],
    reviews: [
      {
        name: "Aman Gupta",
        rating: 5,
        comment: "The vintage look complements my living room perfectly and the bass is punchy.",
      },
    ],
  },
  {
    name: "Dell XPS 15 9530 (13th Gen Intel i9, 32GB RAM, RTX 4070)",
    description: "Immersive 15.6-inch 3.5K OLED touch display with 100% DCI-P3 color gamut. Powered by Intel Core i9-13900H and NVIDIA RTX 4070 for creative professionals.",
    price: 219900,
    ratings: 4.6,
    category: "Laptops",
    stock: 10,
    numOfReviews: 6,
    images: [
      {
        public_id: "dell_xps_1",
        url: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=1000&auto=format&fit=crop",
      },
    ],
    reviews: [
      {
        name: "Rohan Das",
        rating: 4.5,
        comment: "The OLED screen is breathtaking for 3D modeling and video editing.",
      },
    ],
  },
  {
    name: "Fossil Gen 6 Smartwatch with Stainless Steel Mesh Band",
    description: "Powered by Wear OS by Google. Fast charging up to 80% in 30 minutes. Advanced heart rate tracking, SpO2 sensor, and customizable watch faces.",
    price: 22995,
    ratings: 4.4,
    category: "Watches",
    stock: 14,
    numOfReviews: 14,
    images: [
      {
        public_id: "fossil_gen6_1",
        url: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=1000&auto=format&fit=crop",
      },
    ],
    reviews: [
      {
        name: "Neha Sharma",
        rating: 4,
        comment: "Classy look and seamless notification sync with Android.",
      },
    ],
  },
  {
    name: "Ray-Ban Aviator Classic Polarized Sunglasses",
    description: "Currently one of the most iconic sunglass models in the world. Timeless teardrop frame originally designed for U.S. aviators in 1937 with 100% UV protection.",
    price: 10890,
    ratings: 4.8,
    category: "Fashion",
    stock: 30,
    numOfReviews: 22,
    images: [
      {
        public_id: "rayban_aviator_1",
        url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1000&auto=format&fit=crop",
      },
    ],
    reviews: [
      {
        name: "Tanmay Roy",
        rating: 5,
        comment: "Classic gold frame with green polarized lenses. Pure style!",
      },
    ],
  },
]

export const seedDatabase = async () => {
  try {
    console.log("🌱 Connecting to MongoDB:", MONGO_URI)
    await mongoose.connect(MONGO_URI)
    console.log("✅ MongoDB Connected")

    // Create Admin and Customer Demo Users
    await User.deleteMany({})
    console.log("🧹 Cleared existing users")

    const adminPassword = await bcrypt.hash("Admin@12345", 10)
    const userPassword = await bcrypt.hash("User@12345", 10)

    const adminUser = await User.create({
      name: "Admin Manager",
      email: "admin@shopshere.com",
      password: adminPassword,
      role: "admin",
      provider: "local",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
    })

    const customerUser = await User.create({
      name: "Alex Customer",
      email: "user@shopshere.com",
      password: userPassword,
      role: "user",
      provider: "local",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
    })

    console.log(`👤 Created Admin: ${adminUser.email} (Password: Admin@12345)`)
    console.log(`👤 Created Demo User: ${customerUser.email} (Password: User@12345)`)

    // Seed Products
    await Product.deleteMany({})
    console.log("🧹 Cleared existing products")

    const seededProducts = sampleProducts.map((p) => ({
      ...p,
      user: adminUser._id,
      reviews: p.reviews.map((r) => ({
        ...r,
        user: customerUser._id,
      })),
    }))

    await Product.insertMany(seededProducts)
    console.log(`📦 Successfully seeded ${seededProducts.length} premium products!`)

    console.log("✨ Seeding completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Seeding failed:", error)
    process.exit(1)
  }
}

if (require.main === module) {
  seedDatabase()
}
