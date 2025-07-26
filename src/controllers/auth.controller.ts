import { Request, Response } from "express"
import User from "../models/user.model"
import { generateToken } from "../utils/jwt"
import { OAuth2Client } from "google-auth-library"
import crypto from "crypto"
import { sendEmail } from "../utils/sendEmail"
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



export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ message: "Email is required" })
  }

  const user = await User.findOne({ email })

  if (!user) {
    return res.status(404).json({ message: "User not found" })
  }

  const token = crypto.randomBytes(32).toString("hex")
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

  user.resetPasswordToken = hashedToken
  user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000)
  await user.save()

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`

  const message = `
  <div style="font-family: Arial, sans-serif; font-size: 15px; color: #333;">
    <p>Hi ${user.name},</p>

    <p>We received a request to reset the password for your Shopshere account. If you initiated this request, you can reset your password by clicking the button below:</p>

    <p style="text-align: center; margin: 24px 0;">
      <a href="${resetUrl}" style="background-color: #4f46e5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-weight: bold;">
        Reset Password
      </a>
    </p>

    <p>If the button above doesn’t work, you can also reset your password by copying and pasting the following link into your browser:</p>

    <p style="word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>

    <p><strong>Note:</strong> This password reset link will expire in 10 minutes.</p>

    <p>If you didn’t request a password reset, please ignore this email. Your account remains secure.</p>

    <p>Thanks,<br />The Shopshere Team</p>
  </div>
`


  try {
    await sendEmail(user.email, "Reset Your Shopshere Password", message)
    return res.status(200).json({ message: "Reset link sent to your email" })
  } catch (error: any) {
    console.error("Email sending failed:", error.message || error)
    return res.status(500).json({ message: "Failed to send reset email" })
  }
}


// ✅ Reset Password
export const resetPassword = async (req: Request, res: Response) => {
  const { token } = req.params
  const { password } = req.body

  if (!password) {
    return res.status(400).json({ message: "Password is required" })
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  })

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" })
  }

  user.password = password
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined
  await user.save()

  return res.status(200).json({ message: "Password has been reset successfully" })
}

// ✅ Update Password (Logged-in users)
export const updatePassword = async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body
  
  if (!req.user) {
    return res.status(401).json({ message: "Login/Register" });
  }

  const userId = req.user._id;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "Both old and new passwords are required" })
  }
 
  const user = await User.findById(userId).select("+password")

  if (!user || !(await user.comparePassword?.(oldPassword))) {
    return res.status(400).json({ message: "Incorrect old password" })
  }

  user.password = newPassword
  await user.save()

  return res.status(200).json({ message: "Password updated successfully" })
}
