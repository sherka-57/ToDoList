// controllers/todos.js
import {
  getTodosByUser,
  createTodo as createTodoRepo,
  deleteTodo as deleteTodoRepo,
  updateTodo as updateTodoRepo
} from "../repositories/todosRepository.js";

/**
 * GET /
 */
export async function getTodos(req, res) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.session.userId;
    const todos = await getTodosByUser(userId);
    res.json(todos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * POST /
 */
export async function createTodo(req, res) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.session.userId;

    const { title, content, tags, due_date } = req.body;
    const todoTags = Array.isArray(tags) ? tags : [];
    await createTodoRepo(userId, title, content, todoTags, due_date);

    const todos = await getTodosByUser(userId);
    res.status(201).json(todos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * DELETE /:id
 */
export async function deleteTodo(req, res) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.session.userId;
    const todoId = parseInt(req.params.id, 10);

    await deleteTodoRepo(todoId, userId);
    const todos = await getTodosByUser(userId);
    res.json(todos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * PUT /:id
 * Update fields like title, content, tags, due_date
 */
export async function updateTodo(req, res) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.session.userId;
    const todoId = parseInt(req.params.id, 10);
    const { title, content, tags, due_date } = req.body;

    const updates = {
      title,
      content,
      due_date,
      tags: Array.isArray(tags) ? tags : []
    };

    await updateTodoRepo(todoId, userId, updates);

    const todos = await getTodosByUser(userId);
    res.json(todos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

