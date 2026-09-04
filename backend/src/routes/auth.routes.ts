import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { completeGoogleLogin, getCurrentUser, logout, startGoogleLogin } from "../controllers/auth.controller.js";

export const authRouter = Router();

authRouter.get("/google", startGoogleLogin);
authRouter.get("/google/callback", asyncHandler(completeGoogleLogin));
authRouter.get("/me", asyncHandler(getCurrentUser));
authRouter.post("/logout", logout);