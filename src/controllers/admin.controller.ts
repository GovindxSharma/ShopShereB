import { Request, Response } from "express"
import User from "../models/user.model"

// GET /api/admin/users
export const getAllUsers = async (_: Request, res: Response) => {
  try {
    const users = await User.find().select("-password")
    const total = await User.countDocuments()
    res.status(200).json({ users, total })
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" })
  }
}

// GET /api/admin/users/:id
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select("-password")
    if (!user) return res.status(404).json({ message: "User not found" })
    res.status(200).json(user)
  } catch (err) {
    res.status(500).json({ message: "Error fetching user" })
  }
}

// PUT /api/admin/users/:id
export const updateUserById = async (req: Request, res: Response) => {
  try {
    const { name, role } = req.body
    const user = await User.findById(req.params.id)

    if (!user) return res.status(404).json({ message: "User not found" })

    user.name = name ?? user.name
    user.role = role ?? user.role
    await user.save()

    res.status(200).json({ message: "User updated", user })
  } catch (err) {
    res.status(500).json({ message: "Failed to update user" })
  }
}

// DELETE /api/admin/users/:id
export const deleteUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) return res.status(404).json({ message: "User not found" })
    res.status(200).json({ message: "User deleted" })
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user" })
  }
}
