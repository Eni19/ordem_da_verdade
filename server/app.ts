import "dotenv/config";
import express from "express";
import {
  listCharacters,
  getCharacter,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  isDatabaseAvailable,
} from "./db.js";

const app = express();

app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// Parse JSON bodies (limit 2MB para fichas grandes)
app.use(express.json({ limit: "2mb" }));

// ---- Health Check ----
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, database: isDatabaseAvailable() });
});

// ---- GET /api/characters — Listar todas as fichas ----
app.get("/api/characters", async (_req, res) => {
  try {
    const characters = await listCharacters();
    res.json(characters);
  } catch (err) {
    console.error("[api] GET /api/characters error:", err);
    res.status(503).json({
      error: "Database unavailable",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

// ---- GET /api/characters/:id — Buscar ficha por ID ----
app.get("/api/characters/:id", async (req, res) => {
  try {
    const character = await getCharacter(req.params.id);
    if (!character) {
      res.status(404).json({ error: "Character not found" });
      return;
    }
    res.json({
      ...character,
      data: JSON.parse(character.data),
    });
  } catch (err) {
    console.error("[api] GET /api/characters/:id error:", err);
    res.status(503).json({
      error: "Database unavailable",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

// ---- POST /api/characters — Criar nova ficha ----
app.post("/api/characters", async (req, res) => {
  try {
    const { name, data } = req.body;
    if (!data) {
      res.status(400).json({ error: "Character data is required" });
      return;
    }
    const character = await createCharacter(data, name);
    res.status(201).json({
      ...character,
      data: JSON.parse(character.data),
    });
  } catch (err) {
    console.error("[api] POST /api/characters error:", err);
    res.status(503).json({
      error: "Database unavailable",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

// ---- PUT /api/characters/:id — Atualizar ficha ----
app.put("/api/characters/:id", async (req, res) => {
  try {
    const { name, data } = req.body;
    if (!data) {
      res.status(400).json({ error: "Character data is required" });
      return;
    }
    const character = await updateCharacter(req.params.id, data, name);
    if (!character) {
      res.status(404).json({ error: "Character not found" });
      return;
    }
    res.json({
      ...character,
      data: JSON.parse(character.data),
    });
  } catch (err) {
    console.error("[api] PUT /api/characters/:id error:", err);
    res.status(503).json({
      error: "Database unavailable",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

// ---- DELETE /api/characters/:id — Deletar ficha ----
app.delete("/api/characters/:id", async (req, res) => {
  try {
    const deleted = await deleteCharacter(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Character not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("[api] DELETE /api/characters/:id error:", err);
    res.status(503).json({
      error: "Database unavailable",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

export default app;
