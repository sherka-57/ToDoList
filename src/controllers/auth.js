// controllers/auth.js
import bcrypt from "bcrypt";
import supabase from "../supabaseClient.js";

// LOGIN
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from("Users") // capital U
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      if (error.code === "PGRST116") return res.status(401).json({ message: "Invalid credentials" });
      throw error;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    req.session.userId = user.id;
    return res.json({ id: user.id, email: user.email });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// REGISTER
export async function register(req, res) {
  try {
    const { email, password } = req.body;

    // Check existing
    const { data: existing } = await supabase
      .from("Users")
      .select("*")
      .eq("email", email)
      .single();

    if (existing) return res.status(400).json({ message: "Email already registered" });

    const password_hash = await bcrypt.hash(password, 10);

    const { data: user, error: insertError } = await supabase
      .from("Users")
      .insert({ email, password_hash })
      .select()
      .single();

    if (insertError) throw insertError;

    req.session.userId = user.id;
    res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// ME
export async function me(req, res) {
  try {
    if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });

    const { data: user, error } = await supabase
      .from("Users")
      .select("id, email")
      .eq("id", req.session.userId)
      .single();

    if (error) throw error;

    res.json(user);
  } catch (err) {
    console.error("ME ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}



