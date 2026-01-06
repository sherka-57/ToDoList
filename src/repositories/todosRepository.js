// todosRepository.js
import { supabase } from "../supabaseClient.js";

/**
 * Get all todos for a user, ordered by created_at descending
 * @param {number} userId
 * @returns {Promise<Array>}
 */
export async function getTodosByUser(userId) {
  const { data, error } = await supabase
    .from("todos")
    .select("id, title, content, tags, due_date, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  // Supabase stores arrays as JSON strings sometimes, so parse tags if needed
  return data.map(todo => ({
    ...todo,
    tags: todo.tags ? JSON.parse(todo.tags) : [],
  }));
}

/**
 * Create a new todo
 * @param {number} userId
 * @param {string} title
 * @param {string} content
 * @param {Array} tags
 * @param {string | null} dueDate - YYYY-MM-DD or null
 */
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

/**
 * Delete a todo by id and userId
 * @param {number} id
 * @param {number} userId
 */
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


