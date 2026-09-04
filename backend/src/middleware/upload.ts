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
