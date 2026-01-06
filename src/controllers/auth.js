import { supabase } from "../supabaseClient.js";

/**
 * POST /register
 */
export async function register(req, res) {
  try {
    const { email, password } = req.body;

    // Create user in Supabase Auth
    const { data: user, error } = await supabase.auth.admin.createUser({
      email,
      password
    });

    if (error) return res.status(400).json({ message: error.message });

    // Optionally, store user in "Users" table
    const { error: dbError } = await supabase
      .from("Users")
      .insert({ id: user.id, email });

    if (dbError) return res.status(400).json({ message: dbError.message });

    // Set session manually (since using server-side sessions)
    req.session.userId = user.id;

    res.status(201).json({ message: "User registered", userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * POST /login
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Supabase sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return res.status(400).json({ message: error.message });

    // Set session
    req.session.userId = data.user.id;

    // Fetch todos immediately
    const { data: todos, error: todosError } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", data.user.id)
      .order("created_at", { ascending: false });

    if (todosError) throw todosError;

    res.json({ message: "Logged in", todos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * POST /logout
 */
export async function logout(req, res) {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logged out" });
  });
}




