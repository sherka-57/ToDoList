import db from "../db.js";

export function createUser(email, passwordHash) {
  const stmt = db.prepare(`
    INSERT INTO users (email, password_hash)
    VALUES (?, ?)
  `);

  const result = stmt.run(email, passwordHash);
  return { id: result.lastInsertRowid, email };
}

export function findUserByEmail(email) {
  return db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email);
}

export function findUserById(id) {
  return db
    .prepare("SELECT id, email FROM users WHERE id = ?")
    .get(id);
}
