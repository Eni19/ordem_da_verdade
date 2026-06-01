import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app.js";
import { isDatabaseAvailable } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Em produção, servir arquivos estáticos do frontend junto com a API
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "..", "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Client-side routing: redireciona todas as rotas não-API para index.html
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.API_PORT || process.env.PORT || 3001;

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`Database: ${isDatabaseAvailable() ? "connected" : "unavailable"}`);
  });
}

startServer().catch(console.error);
