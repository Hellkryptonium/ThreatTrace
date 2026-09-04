import { v2 as cloudinary } from "cloudinary";
import { env } from "../../config/env.js";

const configured = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

if (configured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export async function archiveEmail(buffer: Buffer, userId: string, emailId: string) {
  if (!configured) return undefined;
  return new Promise<{ publicId: string; secureUrl: string; resourceType: string }>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream({
      folder: `threattrace/emails/${userId}`,
      public_id: emailId,
      resource_type: "raw",
      type: "private",
      overwrite: true,
    }, (error, result) => {
      if (error || !result) return reject(error ?? new Error("Cloudinary did not return an upload result."));
      resolve({ publicId: result.public_id, secureUrl: result.secure_url, resourceType: result.resource_type });
    });
    upload.end(buffer);
  });
}

export function getPrivateEmailUrl(publicId: string) {
  return cloudinary.utils.private_download_url(publicId, "eml", { resource_type: "raw", type: "private", attachment: true });
}

export async function deleteArchivedEmail(publicId: string) {
  if (!configured) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw", type: "private", invalidate: true });
}

export async function uploadAvatar(buffer: Buffer, userId: string) {
  if (!configured) throw new Error("Cloudinary is not configured.");
  return new Promise<{ secureUrl: string; publicId: string }>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream({
      folder: "threattrace/avatars",
      public_id: userId,
      resource_type: "image",
      overwrite: true,
      invalidate: true,
    }, (error, result) => {
      if (error || !result) return reject(error ?? new Error("Cloudinary did not return an upload result."));
      resolve({ secureUrl: result.secure_url, publicId: result.public_id });
    });
    upload.end(buffer);
  });
}
