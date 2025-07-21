import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import User, { IUser } from "../models/user.model"

interface JwtPayload {
  id: string // make sure this matches your JWT payload (`{ id, role }`)
}

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: IUser
    }
  }
}

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token =
    req.cookies.token || req.header("Authorization")?.replace("Bearer ", "")

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload

    const user = await User.findById(decoded.id).select("-password")
    if (!user) return res.status(401).json({ message: "User not found" })

    req.user = user // attach user to request
    next()
  } catch {
    res.status(401).json({ message: "Invalid token" })
  }
}

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role === "admin") {
    next()
  } else {
    res.status(403).json({ message: "Admin access only" })
  }
}
