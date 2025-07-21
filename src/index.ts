import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import cors from "cors"
import cookieParser from "cookie-parser"
import routes from "./routes/index.routes"

dotenv.config()
const app = express()

// ✅ TEMP Logger
app.use((req, _, next) => {
  console.log(`📥 [${req.method}] ${req.originalUrl}`)
  next()
})

// ✅ CORS Setup (Updated)


const clientUrl = (process.env.CLIENT_URL || "").replace(/\/$/, "") // remove trailing slash
const allowedOrigins = [clientUrl]

app.use(
  cors({
    origin: (origin, callback) => {
      const normalizedOrigin = (origin || "").replace(/\/$/, "") // ✅ ensure string
      if (!origin || allowedOrigins.includes(normalizedOrigin)) {
        callback(null, origin)
      } else {
        callback(new Error("❌ Not allowed by CORS: " + origin))
      }
    },
    credentials: true,
  })
)



// ✅ Middleware
app.use(express.json({ limit: "10mb" }))
app.use(cookieParser())

// ✅ Routes
app.use("/api", routes)

// ✅ MongoDB + Server
const PORT = process.env.PORT || 5000
const MONGO_URI = `${process.env.MONGODB_URI}`

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected")
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`)
    })
  })
  .catch((err) => console.error("❌ MongoDB error:", err))
