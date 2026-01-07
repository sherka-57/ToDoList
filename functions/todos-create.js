import { createTodo as createTodoRepo, getTodosByUser } from "./repositories/todosRepository.js";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const userId = event.headers["x-user-id"];
    if (!userId) return { statusCode: 401, body: "Unauthorized" };

    const { title, content, tags, due_date } = JSON.parse(event.body);
    await createTodoRepo(userId, title, content, Array.isArray(tags) ? tags : [], due_date);

    const todos = await getTodosByUser(userId);
    return { statusCode: 201, body: JSON.stringify(todos) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal server error" }) };
  }
}
