import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import cors from "cors"
import cookieParser from "cookie-parser"
import routes from "./routes/index.routes"

dotenv.config()
const app = express()

// TEMP Logger
app.use((req, _, next) => {
  console.log(`📥 [${req.method}] ${req.originalUrl}`)
  next()
})

// ✅ CORS setup — change when deployed on Render
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:513",
    credentials: true,
  })
)

// Middleware
app.use(express.json({ limit: "10mb" }))
app.use(cookieParser())

// Routes
app.use("/api", routes)

// ✅ MongoDB + Server
const PORT = process.env.PORT || 5000
const MONGO_URI = `${process.env.MONGODB_URI}/${process.env.MONGODB_DB_NAME}`

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected")
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`)
    })
  })
  .catch((err) => console.error("❌ MongoDB error:", err))
