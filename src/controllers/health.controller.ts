import { Request, Response } from "express"
import mongoose from "mongoose"

export const getHealthStatus = (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState
  const dbStatusMap: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  }

  const isDbHealthy = dbState === 1
  const memoryUsage = process.memoryUsage()

  const healthData = {
    status: isDbHealthy ? "healthy" : "degraded",
    service: "ShopSphere E-Commerce API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || "development",
    database: {
      status: dbStatusMap[dbState] || "unknown",
      name: mongoose.connection.name || "shopshere",
      host: mongoose.connection.host || "mongodb",
      isHealthy: isDbHealthy,
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
        heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMb: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
      },
    },
  }

  res.status(isDbHealthy ? 200 : 503).json(healthData)
}
