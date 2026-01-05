import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcrypt";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//const dbPath = path.join(__dirname, "todos.db");
const dbPath= process.env.DB_PATH || "./db/todos.db";


const db = new Database(dbPath);

// REQUIRED for Phase 4
db.pragma("foreign_keys = ON");

// Schema bootstrap

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    tags TEXT,
    due_date TEXT, -- YYYY-MM-DD,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

const existing = db
  .prepare("SELECT * FROM users WHERE email = ?")
  .get("test@example.com");

if (!existing) {
  const hash = bcrypt.hashSync("password12345", 10);

  db.prepare(`
  INSERT INTO users (email, password_hash)
  VALUES (?, ?)
`).run("test@example.com", hash);


  console.log("✅ Test user seeded");
}

export default db;
