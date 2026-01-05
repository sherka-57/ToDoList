// controllers/todos.js
import {
  getTodosByUser,
  createTodo as createTodoRepo,
  deleteTodo as deleteTodoRepo
} from "../repositories/todosRepository.js";

/**
 * GET /
 */
export async function getTodos(req, res) {
  try {
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
    const userId = req.session.userId;
    const { title, content, tags, due_date } = req.body;

    await createTodoRepo(userId, title, content, tags, due_date);
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
 * Optional: Update fields like title, content, tags, due_date
 */
export async function updateTodo(req, res) {
  try {
    const userId = req.session.userId;
    const todoId = parseInt(req.params.id, 10);
    const updates = req.body; // expects { title?, content?, tags?, due_date? }

    // You need to implement updateTodo in repository if needed
    const { updateTodo } = await import("../repositories/todosRepository.js");
    await updateTodo(todoId, userId, updates);

    const todos = await getTodosByUser(userId);
    res.json(todos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}
