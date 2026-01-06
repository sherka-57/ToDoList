import {
  getTodosByUser,
  createTodo as createTodoRepo,
  deleteTodo as deleteTodoRepo,
  updateTodo as updateTodoRepo
} from "../repositories/todosRepository.js";

export async function getTodos(req, res) {
  try {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const todos = await getTodosByUser(req.session.userId);
    res.json(todos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createTodo(req, res) {
  try {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });

    const { title, content, tags, due_date } = req.body;
    await createTodoRepo(req.session.userId, title, content, Array.isArray(tags) ? tags : [], due_date);

    const todos = await getTodosByUser(req.session.userId);
    res.status(201).json(todos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteTodo(req, res) {
  try {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });

    await deleteTodoRepo(parseInt(req.params.id, 10), req.session.userId);

    const todos = await getTodosByUser(req.session.userId);
    res.json(todos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateTodo(req, res) {
  try {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });

    const updates = { ...req.body };
    if (updates.tags && !Array.isArray(updates.tags)) updates.tags = [];

    await updateTodoRepo(parseInt(req.params.id, 10), req.session.userId, updates);

    const todos = await getTodosByUser(req.session.userId);
    res.json(todos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}




