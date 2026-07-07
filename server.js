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
// BUG 1: Does not validate that `title` is present or non-empty.
// BUG 2: Uses Date.now() as the id but converts to string inconsistently —
//         the id field is a number here but compared as string in DELETE.
app.post("/api/todos", (req, res) => {
  const { title, priority } = req.body;
  const todo = {
    id: Date.now(),
    title: title,                       // BUG 1: no validation — can be empty/undefined
    completed: false,
    priority: priority || "medium",
    createdAt: new Date().toISOString()
  };
  todos.push(todo);
  saveTodos(todos);
  res.status(201).json(todo);
});

// Toggle complete
// BUG 3: Uses strict equality (===) comparing string param to number id.
//         This means toggling completion never finds the todo.
app.patch("/api/todos/:id/toggle", (req, res) => {
  const todo = todos.find((t) => t.id === req.params.id); // BUG 3: should be == or Number()
  if (!todo) {
    return res.status(404).json({ error: "Todo not found" });
  }
  todo.completed = !todo.completed;
  saveTodos(todos);
  res.json(todo);
});

// Update a todo's title
// BUG 4: Overwrites the entire todo object instead of merging, losing fields
//         like `completed`, `priority`, and `createdAt`.
app.put("/api/todos/:id", (req, res) => {
  const idx = todos.findIndex((t) => t.id === Number(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: "Todo not found" });
  }
  todos[idx] = { id: todos[idx].id, ...req.body }; // BUG 4: replaces instead of merging; drops completed/priority/createdAt if not sent
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
// BUG 5: Division by zero when there are no todos — completionRate is "NaN".
app.get("/api/stats", (_req, res) => {
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const raw = Math.round((completed / total) * 100); // BUG 5: NaN when total is 0
  // Send as string so "NaN" survives JSON serialization
  const completionRate = isNaN(raw) ? "NaN" : raw;
  res.json({ total, completed, pending: total - completed, completionRate });
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
