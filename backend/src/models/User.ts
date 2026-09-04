import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  microsoftId: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  passwordHash: String,
  emailVerified: { type: Boolean, default: false },
  avatarUrl: String,
}, { timestamps: true });

export const UserModel = mongoose.model("User", userSchema);