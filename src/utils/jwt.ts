// src/utils/jwt.ts
import jwt from "jsonwebtoken"
import { IUser } from "../models/user.model"

// utils/jwt.ts
export const generateToken = (user: IUser) => {
  return jwt.sign({ id: user._id ,role: user.role}, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  })
}

