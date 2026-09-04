import mongoose from "mongoose";

const outlookAccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  microsoftAccountId: { type: String, required: true },
  email: { type: String, required: true },
  tokenCache: { type: String, required: true },
  scopes: [String],
}, { timestamps: true });

export const OutlookAccountModel = mongoose.model("OutlookAccount", outlookAccountSchema);
