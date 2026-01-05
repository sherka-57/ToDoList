import db from "../db.js";

export function getTodos(req, res) {
  const userId = req.session.userId;

  const todos = db.prepare(`
    SELECT id, title, content, tags, due_date
    FROM todos
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId);

  res.json(
    todos.map(t => ({
      id: t.id,
      title: t.title,
      content: t.content,
      tags: JSON.parse(t.tags),
      due_date: t.due_date
    }))
  );
}

export function createTodo(req, res) {
  const userId = req.session.userId;
  const { title, content, tags, due_date } = req.body;

  if (!title || !Array.isArray(tags)) {
    return res.status(400).json({ error: "Invalid todo format" });
  }

  const result = db.prepare(`
    INSERT INTO todos (user_id, title, content, tags, due_date)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    userId,
    title,
    content ?? "",
    JSON.stringify(tags),
    due_date || null
  );

  res.status(201).json({
    id: result.lastInsertRowid,
    title,
    content,
    tags,
    due_date
  });
}


export function deleteTodo(req, res) {
  const userId = req.session.userId;
  const { id } = req.params;

  const result = db.prepare(`
    DELETE FROM todos
    WHERE id = ? AND user_id = ?
  `).run(id, userId);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Not found" });
  }

  res.status(204).end();
}

export function updateTodo(req, res) {
  const userId = req.session.userId;
  const { id } = req.params;
  const { title, content, tags, due_date } = req.body;

  if (!title || !Array.isArray(tags)) {
    return res.status(400).json({ error: "Invalid todo format" });
  }

  const result = db.prepare(`
    UPDATE todos
    SET title = ?, content = ?, tags = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(
    title,
    content ?? "",
    JSON.stringify(tags),
    due_date || null,
    id,
    userId
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json({ success: true });
}

