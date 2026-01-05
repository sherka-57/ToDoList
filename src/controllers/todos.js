import db from "../db.js";
import supabase from "../supabaseClient.js";


export async function getTodos(req, res) {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { data, error } = await supabase
    .from("todos")
    .select("id, title, content, tags, due_date")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error:", error);
    return res.status(500).json({ error: "Failed to fetch todos" });
  }

  res.json(
    data.map(t => ({
      id: t.id,
      title: t.title,
      content: t.content,
      tags: Array.isArray(t.tags) ? t.tags : JSON.parse(t.tags),
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

