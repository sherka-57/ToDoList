import express from 'express';
import cors from 'cors';
import todoRoutes from './routes/todos.js';
import dotenv from 'dotenv';
import session from 'express-session';
import { findUserById } from './repositories/usersRepository.js';
import authRoutes from './routes/auth.js';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// serve frontend
app.use(express.static(path.join(__dirname, "../../FrontEnd")));


/* -------- MIDDLEWARE -------- */
/*app.use(cors({
  origin: true,
  credentials: true
}));
*/

app.use(session({
  name: "sid",
  secret: "dev-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,   // REQUIRED for localhost
  }
}));


app.use(express.json());


app.use((req, res, next) => {
  console.log(req.method, req.url);

  req.user = null;

  if (req.session?.userId) {
    req.user = findUserById(req.session.userId);
  }

  next();
});


app.use('/api/auth', authRoutes);
/* -------- ROUTES -------- */
app.get('/favicon.ico', (req, res) => res.status(204));
app.use('/api/todos', todoRoutes);

/* -------- START SERVER -------- */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
