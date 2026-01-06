import express from "express";
import session from "express-session";
import cors from "cors";

import * as todosController from "./controllers/todos.js";
import * as authController from "./controllers/auth.js";

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "keyboard cat",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Auth routes
app.post("/api/register", authController.register);
app.post("/api/login", authController.login);
app.post("/api/logout", authController.logout);

// Todos routes
app.get("/api/todos", todosController.getTodos);
app.post("/api/todos", todosController.createTodo);
app.delete("/api/todos/:id", todosController.deleteTodo);
app.put("/api/todos/:id", todosController.updateTodo);

export default app;








