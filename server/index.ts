import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app.js";
import { isDatabaseAvailable } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Em produção, servir os arquivos gerados pelo Vite em dist/public.
  const staticPath = path.resolve(__dirname, "public");

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(staticPath));

    // Client-side routing: redireciona todas as rotas não-API para index.html
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  }

  const port = process.env.API_PORT || process.env.PORT || 3005;

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`Database: ${isDatabaseAvailable() ? "connected" : "unavailable"}`);
  });
}

startServer().catch(console.error);
