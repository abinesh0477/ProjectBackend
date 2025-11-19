// routes/auth.routes.js
import { Router } from "express";
import { login, register, getProfile } from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.js";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.get("/profile", authMiddleware, getProfile);

export default router;
