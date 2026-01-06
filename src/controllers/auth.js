// auth.js
import bcrypt from "bcrypt";
import { createUser, findUserByEmail, findUserById } from "../repositories/usersRepository.js";
import { supabase } from "../supabaseClient.js"; // make sure path is correct

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
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('Users') // matches your table
      .insert({ email, password_hash: hashed })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(400).json({ error: error.message });
    }

    // set session
    req.session.userId = data.id;

    res.json({ id: data.id, email: data.email });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
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

/**
 * Current user info
 */
export async function me(req, res) {
  if (!req.session.userId) return res.status(401).json({ error: "Not logged in" });

  const user = await findUserById(req.session.userId);
  if (!user) return res.status(401).json({ error: "Not logged in" });

  res.json(user);
}











