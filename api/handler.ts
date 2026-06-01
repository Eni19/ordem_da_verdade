import type { VercelRequest, VercelResponse } from "@vercel/node";
import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import app from "../server/app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir arquivos estáticos do frontend gerados pelo Vite
const publicPath = path.resolve(__dirname, "..", "dist", "public");
app.use(express.static(publicPath));

// Client-side routing: redireciona todas as rotas não-API para index.html
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

export default app;
