// src/middlewares/upload.middleware.ts
import multer from "multer"

export const upload = multer({ storage: multer.memoryStorage() })
