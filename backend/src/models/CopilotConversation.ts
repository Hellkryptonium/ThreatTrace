import mongoose from "mongoose";

const copilotMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "model"], required: true },
  text: { type: String, required: true },
}, { _id: false });

const copilotConversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  messages: { type: [copilotMessageSchema], default: [] },
}, { timestamps: true });

export const CopilotConversationModel = mongoose.model("CopilotConversation", copilotConversationSchema);
