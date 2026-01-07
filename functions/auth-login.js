import { supabase } from "../supabaseClient.js";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { email, password } = JSON.parse(event.body);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { statusCode: 400, body: JSON.stringify({ message: error.message }) };

    return { statusCode: 200, body: JSON.stringify({ message: "Logged in" }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal server error" }) };
  }
}
