import mongoose from "mongoose";

const gmailAccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  googleAccountId: { type: String, required: true },
  email: { type: String, required: true },
  refreshToken: { type: String, required: true },
  scopes: [String],
}, { timestamps: true });

export const GmailAccountModel = mongoose.model("GmailAccount", gmailAccountSchema);