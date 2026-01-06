// controllers/auth.js
import bcrypt from "bcrypt";
import supabase from "../supabaseClient.js";

// POST /login
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from("Users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) return res.status(401).json({ message: "Invalid credentials" });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ message: "Invalid credentials" });

    req.session.userId = user.id;
    res.json({ id: user.id, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// POST /register
export async function register(req, res) {
  try {
    const { email, password } = req.body;

    // check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("Users")
      .select("*")
      .eq("email", email)
      .single();

    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);

    const { data: user, error: insertError } = await supabase
      .from("Users")
      .insert({ email, password_hash: passwordHash })
      .select()
      .single();

    if (insertError) throw insertError;

    req.session.userId = user.id;
    res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// GET /me
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
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}



