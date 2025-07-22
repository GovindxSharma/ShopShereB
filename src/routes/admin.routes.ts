import express from "express"
import {
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById
} from "../controllers/admin.controller"
import { isAuthenticated, isAdmin } from "../middlewares/auth.middleware"

const router = express.Router()



router.get("/users",isAuthenticated,isAdmin, getAllUsers)
router.get("/users/:id",isAuthenticated,isAdmin, getUserById)
router.put("/users/:id",isAuthenticated,isAdmin, updateUserById)
router.delete("/users/:id",isAuthenticated,isAdmin, deleteUserById)

export default router
