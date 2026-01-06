import express from "express";
import { login, register, me, logout } from "../controllers/auth.js";

const router = express.Router();

// Login route
router.post("/login", login);

// Register route
router.post("/register", register);

// Logout route
router.post("/logout", logout);

// "Me" route – returns logged-in user info
router.get("/me", me);

export default router;
