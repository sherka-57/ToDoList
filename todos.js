import express from "express";
import {
  getTodos,
  createTodo,
  deleteTodo,
  updateTodo
} from "../controllers/todos.js";


import { requireAuth } from "../auth/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", requireAuth, getTodos);
router.post("/", requireAuth, createTodo);
router.put("/:id", requireAuth, updateTodo);
router.delete("/:id", requireAuth, deleteTodo);


export default router;

