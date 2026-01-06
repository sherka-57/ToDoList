// controllers/auth.js
import bcrypt from "bcrypt";
import { supabase } from "../supabaseClient.js";

// ----------------------
// Helper to get user by email
async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from("Users")
    .select("*")
    .eq("email", email)
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error; // ignore "no rows" code
  return data || null;
}

// ----------------------
// REGISTER
export async function register(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // check if email already exists
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data: newUser, error } = await supabase
      .from("Users")
      .insert({ email, password_hash })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "Failed to register user" });
    }

    // Set session
    req.session.userId = newUser.id;

    return res.status(200).json({ id: newUser.id, email: newUser.email });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ----------------------
// LOGIN
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    // Set session
    req.session.userId = user.id;

    return res.status(200).json({ id: user.id, email: user.email });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ----------------------
// GET CURRENT USER
export async function me(req, res) {
  try {
    if (!req.session?.userId) return res.status(401).json({ error: "Not logged in" });

    const { data: user, error } = await supabase
      .from("Users")
      .select("*")
      .eq("id", req.session.userId)
      .limit(1)
      .single();

    if (error) return res.status(500).json({ error: "Failed to fetch user" });
    return res.status(200).json({ id: user.id, email: user.email });
  } catch (err) {
    console.error("/me error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}


