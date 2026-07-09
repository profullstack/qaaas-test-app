import express from "express";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3111;
const DB_PATH = join(__dirname, "data", "todos.json");

app.use(express.json());
app.use(express.static(join(__dirname, "public")));

// ---------------------------------------------------------------------------
// In-memory todo store (persisted to JSON file)
// ---------------------------------------------------------------------------
function loadTodos() {
  if (!existsSync(DB_PATH)) return [];
  try {
    return JSON.parse(readFileSync(DB_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function saveTodos(todos) {
  writeFileSync(DB_PATH, JSON.stringify(todos, null, 2));
}

let todos = loadTodos();

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------

// List all todos
app.get("/api/todos", (_req, res) => {
  res.json(todos);
});

// Create a todo
app.post("/api/todos", (req, res) => {
  const { title, priority } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }
  const todo = {
    id: Date.now(),
    title: title.trim(),
    completed: false,
    priority: priority || "medium",
    createdAt: new Date().toISOString()
  };
  todos.push(todo);
  saveTodos(todos);
  res.status(201).json(todo);
});

// Toggle complete
app.patch("/api/todos/:id/toggle", (req, res) => {
  const id = Number(req.params.id);
  const todo = todos.find((t) => t.id === id);
  if (!todo) {
    return res.status(404).json({ error: "Todo not found" });
  }
  todo.completed = !todo.completed;
  saveTodos(todos);
  res.json(todo);
});

// Update a todo's title
app.put("/api/todos/:id", (req, res) => {
  const idx = todos.findIndex((t) => t.id === Number(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: "Todo not found" });
  }
  todos[idx] = { ...todos[idx], ...req.body, id: todos[idx].id };
  saveTodos(todos);
  res.json(todos[idx]);
});

// Delete a todo
app.delete("/api/todos/:id", (req, res) => {
  const before = todos.length;
  todos = todos.filter((t) => t.id !== Number(req.params.id));
  saveTodos(todos);
  if (todos.length === before) {
    return res.status(404).json({ error: "Todo not found" });
  }
  res.status(204).end();
});

// Stats endpoint
app.get("/api/stats", (_req, res) => {
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
  res.json({ total, completed, pending: total - completed, completionRate });
});

// ---------------------------------------------------------------------------
// About page
// ---------------------------------------------------------------------------
app.get("/about", (_req, res) => {
  res.send(`
    <!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>About - Todo App</title>
    <style>body{font-family:system-ui,sans-serif;max-width:600px;margin:40px auto;padding:0 16px;line-height:1.6}a{color:#2563eb}</style>
    </head><body>
    <h1>About Todo App</h1>
    <p>This is a deliberately buggy todo app for testing QAaaS.dev and PRaaS.</p>
    <p><a href="/">Back to Todo App</a></p>
    </body></html>
  `);
});

// ---------------------------------------------------------------------------
// Catch-all: serve index.html for client-side routes
// ---------------------------------------------------------------------------
app.get("/{*path}", (_req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Todo app running at http://localhost:${PORT}`);
});
