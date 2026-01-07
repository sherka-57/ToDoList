import { supabase } from "../supabaseClient.js";

export async function register(req, res) {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase.auth.admin.createUser({
      email,
      password
    });

    if (error) return res.status(400).json({ message: error.message });

    await supabase.from("Users").insert({ id: user.id, email });

    req.session.userId = user.id;
    res.status(201).json({ message: "User registered", userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ message: error.message });

    req.session.userId = data.user.id;

    res.json({ message: "Logged in" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

export function logout(req, res) {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.json({ message: "Logged out" });
  });
}




