import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, index: true },
  name: { type: String, required: true },
  avatarUrl: String,
}, { timestamps: true });

export const UserModel = mongoose.model("User", userSchema);