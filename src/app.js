import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

import todoRoutes from "./routes/todos.js";
import authRoutes from "./routes/auth.js";
import { findUserById } from "./repositories/usersRepository.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(express.json());

// serve frontend
app.use(express.static(path.join(__dirname, "../public")));

app.use(session({
  name: "sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
  }
}));

app.use(async (req, res, next) => {
  req.user = null;
  if (req.session?.userId) {
    req.user = await findUserById(req.session.userId);
  }
  next();
});


// routes
app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


