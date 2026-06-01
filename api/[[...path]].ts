/**
 * Catch-all de API no Vercel: responde 404 para qualquer rota /api/*
 * que não seja coberta por um handler explícito (ex: characters.ts, characters/[id].ts).
 *
 * Handlers explícitos do Vercel (roteamento por arquivo):
 *   /api/characters       → api/characters.ts
 *   /api/characters/:id   → api/characters/[id].ts
 *   /api/*                → este arquivo (fallback 404)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log(`[vercel:catch-all] ${req.method} ${req.url} → 404 (no handler)`);
  return res.status(404).json({
    error: "Not found",
    path: req.url,
    hint: "This API route is not implemented. Available: /api/characters, /api/characters/:id, /api/health",
  });
}
