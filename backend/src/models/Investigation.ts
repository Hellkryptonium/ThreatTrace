import mongoose from "mongoose";

const investigationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  emailId: { type: mongoose.Schema.Types.ObjectId, ref: "Email", required: true },
  analysisId: { type: mongoose.Schema.Types.ObjectId, ref: "Analysis", required: true },
  status: { type: String, enum: ["COMPLETED", "FAILED"], required: true },
  summary: String,
}, { timestamps: true });

export const InvestigationModel = mongoose.model("Investigation", investigationSchema);