/**
 * Vercel serverless handler para /api/characters/:id
 * GET    → buscar ficha por ID
 * PUT    → atualizar ficha
 * DELETE → deletar ficha
 */
import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getCharacter,
  updateCharacter,
  deleteCharacter,
} from "../../server/db.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const id = req.query.id as string;
  console.log(`[vercel:characters:id] ${req.method} id=${id} url=${req.url}`);

  if (!id) {
    return res.status(400).json({ error: "Missing character ID" });
  }

  try {
    // ---- GET /api/characters/:id ----
    if (req.method === "GET") {
      const character = await getCharacter(id);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }
      return res.status(200).json({
        ...character,
        data: JSON.parse(character.data),
      });
    }

    // ---- PUT /api/characters/:id ----
    if (req.method === "PUT") {
      const { name, data } = req.body ?? {};
      if (!data) {
        return res.status(400).json({ error: "Character data is required" });
      }
      const character = await updateCharacter(id, data, name);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }
      return res.status(200).json({
        ...character,
        data: JSON.parse(character.data),
      });
    }

    // ---- DELETE /api/characters/:id ----
    if (req.method === "DELETE") {
      const deleted = await deleteCharacter(id);
      if (!deleted) {
        return res.status(404).json({ error: "Character not found" });
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[vercel:characters:id] error:", err);
    return res.status(503).json({
      error: "Database unavailable",
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
