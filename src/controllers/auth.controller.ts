import { Request, Response } from "express"
import User from "../models/user.model"
import { generateToken } from "../utils/jwt"
import { OAuth2Client } from "google-auth-library"
// import dotenv from "dotenv"
// dotenv.config()

const googleClient = new OAuth2Client()

// ✅ Secure Cookie Setter for Cross-Origin
export const setAuthCookie = (res: Response, token: string) => {
  const isLocalhost = process.env.CLIENT_URL?.includes("localhost")

  res.cookie("token", token, {
    httpOnly: true,
    secure: !isLocalhost, // secure only if NOT on localhost
    sameSite: isLocalhost ? "lax" : "none", // lax for localhost, none for cross-origin prod
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })
}

console.log("test",process.env.NODE_ENV)

const sanitizeUser = (user: any) => {
  const userObj = user.toObject()
  delete userObj.password
  return userObj
}

// ✅ Register
export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body

  const existing = await User.findOne({ email })
  if (existing) return res.status(400).json({ message: "Email already registered" })

  const user = new User({ name, email, password, provider: "local" })
  await user.save()

  const token = generateToken(user)
  setAuthCookie(res, token)
  res.json({ user: sanitizeUser(user) })
}

// ✅ Login
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body

  const user = await User.findOne({ email })
  if (!user || !user.password || !(await user.comparePassword?.(password))) {
    return res.status(401).json({ message: "Invalid credentials" })
  }

  const token = generateToken(user)
  setAuthCookie(res, token)
  res.json({ user: sanitizeUser(user) })
}

// ✅ Logout
export const logout = (_: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  })
  res.json({ message: "Logged out" })
}

// ✅ Google Login
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body
    if (!credential) return res.status(400).json({ message: "Missing credential" })

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload) return res.status(401).json({ message: "Invalid Google token" })

    const { email, name, picture } = payload
    let user = await User.findOne({ email })

    if (!user) {
      user = await User.create({
        name,
        email,
        avatar: picture,
        provider: "google",
        password: null,
      })
    }

    const token = generateToken(user)
    setAuthCookie(res, token)
    res.json({ user: sanitizeUser(user) })
  } catch (error) {
    console.error("❌ Google login error:", error)
    res.status(500).json({ message: "Google login failed" })
  }
}

// ✅ Get logged-in user
export const getMe = (req: Request, res: Response) => {
  res.json({ user: req.user })
}
