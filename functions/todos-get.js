import { getTodosByUser } from "../repositories/todosRepository.js";

export async function handler(event, context) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const userId = event.headers["x-user-id"]; // pass userId via header for simplicity
    if (!userId) return { statusCode: 401, body: "Unauthorized" };

    const todos = await getTodosByUser(userId);
    return { statusCode: 200, body: JSON.stringify(todos) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal server error" }) };
  }
}
