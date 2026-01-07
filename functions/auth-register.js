import { supabase } from "../supabaseClient.js";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { email, password } = JSON.parse(event.body);

    const { data: user, error } = await supabase.auth.admin.createUser({ email, password });
    if (error) return { statusCode: 400, body: JSON.stringify({ message: error.message }) };

    await supabase.from("Users").insert({ id: user.id, email });

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "User registered", userId: user.id })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal server error" }) };
  }
}
