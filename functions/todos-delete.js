import { deleteTodo as deleteTodoRepo, getTodosByUser } from "../repositories/todosRepository.js";

export async function handler(event) {
  if (event.httpMethod !== "DELETE") return { statusCode: 405, body: "Method Not Allowed" };

  const userId = event.headers["x-user-id"];
  if (!userId) return { statusCode: 401, body: "Unauthorized" };

  try {
    const { id } = event.queryStringParameters;

    await deleteTodoRepo(parseInt(id, 10), userId);

    const todos = await getTodosByUser(userId);
    return { statusCode: 200, body: JSON.stringify(todos) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal server error" }) };
  }
}
