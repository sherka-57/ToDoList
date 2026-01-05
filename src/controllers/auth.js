import bcrypt from "bcrypt";
import {
  createUser,
  findUserByEmail,
  findUserById
} from "../repositories/usersRepository.js";

export async function login(req, res) {
  const { email, password } = req.body;

   console.log("LOGIN BODY:", req.body);

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // ✅ THIS WAS MISSING
  req.session.userId = user.id;

  res.json({
    id: user.id,
    email: user.email
  });
}


export function me(req, res) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const user = findUserById(req.session.userId);
  res.json({ email: user.email });

}



export async function register(req, res) {
  console.log("REGISTER BODY:", req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const existing = findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: "User exists" });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = createUser(email, hash);


  req.session.userId = user.id;
  res.status(201).json(user);
}
