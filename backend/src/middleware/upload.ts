import multer from "multer";
import { env } from "../config/env.js";

export const emailUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_request, file, callback) => {
    const validExtension = file.originalname.toLowerCase().endsWith(".eml");
    const validMime = ["message/rfc822", "application/octet-stream", "text/plain"].includes(file.mimetype);
    callback(null, validExtension && validMime);
  },
});

export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => callback(null, file.mimetype.startsWith("image/")),
});
