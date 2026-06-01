/**
 * Vercel serverless handler para /api/characters
 * GET  → listar todas as fichas
 * POST → criar nova ficha
 */
import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  listCharacters,
  createCharacter,
} from "../server/db.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log(`[vercel:characters] ${req.method} ${req.url}`);

  try {
    if (req.method === "GET") {
      const characters = await listCharacters();
      return res.status(200).json(characters);
    }

    if (req.method === "POST") {
      const { name, data } = req.body ?? {};
      if (!data) {
        return res.status(400).json({ error: "Character data is required" });
      }
      const character = await createCharacter(data, name);
      return res.status(201).json({
        ...character,
        data: JSON.parse(character.data),
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[vercel:characters] error:", err);
    return res.status(503).json({
      error: "Database unavailable",
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
