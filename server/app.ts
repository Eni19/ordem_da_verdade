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

// ---- Vercel: confiar no proxy para cabeçalhos corretos (HTTPS, IP, etc.) ----
app.set("trust proxy", 1);

// ---- Normalizar URL: remover prefixo /api se presente ----
// No Vercel, req.url pode incluir /api ou não, dependendo da versão do runtime.
// Definimos as rotas SEM /api e normalizamos aqui para ambos os casos funcionarem.
app.use((req, _res, next) => {
  console.log(`[api] ${req.method} ${req.url} (original)`);
  if (req.url.startsWith("/api")) {
    req.url = req.url.slice(4) || "/";
    console.log(`[api] URL normalizada -> "${req.url}"`);
  }
  next();
});

// Cache-Control: no-store para todas as respostas de API
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// Parse JSON bodies (limit 2MB para fichas grandes)
app.use(express.json({ limit: "2mb" }));

// ---- Health Check ----
app.get("/health", (_req, res) => {
  res.json({ ok: true, database: isDatabaseAvailable() });
});

// ---- GET /characters — Listar todas as fichas ----
app.get("/characters", async (_req, res) => {
  try {
    const characters = await listCharacters();
    res.json(characters);
  } catch (err) {
    console.error("[api] GET /characters error:", err);
    res.status(503).json({
      error: "Database unavailable",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

// ---- GET /characters/:id — Buscar ficha por ID ----
app.get("/characters/:id", async (req, res) => {
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
    console.error("[api] GET /characters/:id error:", err);
    res.status(503).json({
      error: "Database unavailable",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

// ---- POST /characters — Criar nova ficha ----
app.post("/characters", async (req, res) => {
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
    console.error("[api] POST /characters error:", err);
    res.status(503).json({
      error: "Database unavailable",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

// ---- PUT /characters/:id — Atualizar ficha ----
app.put("/characters/:id", async (req, res) => {
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
    console.error("[api] PUT /characters/:id error:", err);
    res.status(503).json({
      error: "Database unavailable",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

// ---- DELETE /characters/:id — Deletar ficha ----
app.delete("/characters/:id", async (req, res) => {
  try {
    const deleted = await deleteCharacter(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Character not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("[api] DELETE /characters/:id error:", err);
    res.status(503).json({
      error: "Database unavailable",
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

export default app;
