// auth.js
import bcrypt from "bcrypt";
import { createUser, findUserByEmail, findUserById } from "../repositories/usersRepository.js";
import supabase from "../supabaseClient.js"; // make sure path is correct

export async function testSupabase(req, res) {
  try {
    const { data, error } = await supabase.from("Users").select("*").limit(1);
    if (error) {
      console.error("Supabase test error:", error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  } catch (err) {
    console.error("Unexpected Supabase error:", err);
    res.status(500).json({ error: "Unexpected error" });
  }
}

/**
 * Register new user
 */
export async function register(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const existing = await findUserByEmail(email);
    if (existing) return res.status(400).json({ error: "User already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser(email, passwordHash);

    req.session.userId = user.id; // auto-login after registration
    res.json({ id: user.id, email: user.email });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Login
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    req.session.userId = user.id;
    res.json({ id: user.id, email: user.email });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function testSupabase(req, res) {
  try {
    const { data, error } = await supabase.from("Users").select("*").limit(1);
    if (error) {
      console.error("Supabase test error:", error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  } catch (err) {
    console.error("Unexpected Supabase error:", err);
    res.status(500).json({ error: "Unexpected error" });
  }
}


/**
 * Current user info
 */
export async function me(req, res) {
  if (!req.session.userId) return res.status(401).json({ error: "Not logged in" });

  const user = await findUserById(req.session.userId);
  if (!user) return res.status(401).json({ error: "Not logged in" });

  res.json(user);
}







