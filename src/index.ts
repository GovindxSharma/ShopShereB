import express, { Request, Response, NextFunction } from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import cors from "cors"
import cookieParser from "cookie-parser"
import routes from "./routes/index.routes"

import { getHealthStatus } from "./controllers/health.controller"

dotenv.config()
const app = express()

// 📥 Request Logger
app.use((req: Request, _, next: NextFunction) => {
  console.log(`📥 [${req.method}] ${req.originalUrl}`)
  next()
})

// 🌐 CORS Setup
const clientUrl = (process.env.CLIENT_URL || "").replace(/\/$/, "")
const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
]

if (clientUrl && !defaultAllowedOrigins.includes(clientUrl)) {
  defaultAllowedOrigins.push(clientUrl)
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      const normalizedOrigin = origin.replace(/\/$/, "")
      if (
        defaultAllowedOrigins.includes(normalizedOrigin) ||
        normalizedOrigin.startsWith("http://localhost:") ||
        normalizedOrigin.startsWith("http://127.0.0.1:") ||
        (clientUrl && normalizedOrigin === clientUrl)
      ) {
        callback(null, true)
      } else {
        // Fallback allow for deployed cross-origin preview domains
        callback(null, true)
      }
    },
    credentials: true,
  })
)

// 🛡️ Middlewares
app.use(express.json({ limit: "10mb" }))
app.use(cookieParser())

// 🩺 Root & API Health Check Routes
app.get("/health", getHealthStatus)
app.get("/api/health", getHealthStatus)

// 🚀 API Routes
app.use("/api", routes)

// ⚠️ Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("❌ Unhandled server error:", err)
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err : undefined,
  })
})

// 🗄️ MongoDB Connection & Server Launch
const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/shopshere"

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully")
    app.listen(PORT, () => {
      console.log(`🚀 ShopSphere Server running at http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err)
    // Still listen for API calls / health check if DB is connecting asynchronously
    app.listen(PORT, () => {
      console.log(`⚠️ Server running with DB reconnecting at http://localhost:${PORT}`)
    })
  })

export default app
