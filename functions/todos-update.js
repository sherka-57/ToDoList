import { updateTodo as updateTodoRepo, getTodosByUser } from "../repositories/todosRepository.js";
import { updateTodo } from "./repositories/repositories/todosRepository.js";

export async function handler(event) {
  if (event.httpMethod !== "PUT") return { statusCode: 405, body: "Method Not Allowed" };

  const userId = event.headers["x-user-id"];
  if (!userId) return { statusCode: 401, body: "Unauthorized" };

  try {
    const { id } = event.queryStringParameters;
    const updates = JSON.parse(event.body);

    if (updates.tags && !Array.isArray(updates.tags)) updates.tags = [];

    await updateTodoRepo(parseInt(id, 10), userId, updates);

    const todos = await getTodosByUser(userId);
    return { statusCode: 200, body: JSON.stringify(todos) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal server error" }) };
  }
}
