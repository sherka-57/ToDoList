import express from "express";
import session from "express-session";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import todosRoutes from "./routes/todos.js";

const app = express();

// Replace with your frontend domain
const FRONTEND_ORIGIN = "https://YOUR_FRONTEND_DOMAIN.onrender.com";

app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true
}));

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "keyboard cat",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: FRONTEND_ORIGIN.startsWith("https://") } // secure cookie if HTTPS
}));

// Routers
app.use("/api/auth", authRoutes);
app.use("/api/todos", todosRoutes);

export default app;








