import { supabase } from "../supabaseClient.js";

export async function getTodosByUser(userId) {
  const { data, error } = await supabase
    .from("todos")
    .select("id, title, content, tags, due_date, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map(todo => ({
    ...todo,
    tags: todo.tags ? JSON.parse(todo.tags) : [],
  }));
}

export async function createTodo(userId, title, content, tags = [], dueDate = null) {
  const { error } = await supabase
    .from("todos")
    .insert({
      user_id: userId,
      title,
      content,
      tags: JSON.stringify(tags),
      due_date: dueDate,
    });

  if (error) throw error;
}

export async function deleteTodo(id, userId) {
  const { error } = await supabase
    .from("todos")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function updateTodo(id, userId, updates) {
  const updateData = { ...updates };
  if (updates.tags) updateData.tags = JSON.stringify(updates.tags);

  const { error } = await supabase
    .from("todos")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}



