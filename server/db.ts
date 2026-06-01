import { createClient, type Client } from "@libsql/client";
import { nanoid } from "nanoid";

export interface CharacterRow {
  id: string;
  name: string;
  data: string;
  created_at: string;
  updated_at: string;
}

export interface CharacterListItem {
  id: string;
  name: string;
  updated_at: string;
}

let client: Client | null = null;
let initialized = false;
let initError: string | null = null;

function getClient(): Client | null {
  if (initialized) return client;

  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;

  if (!url || !token) {
    initError = "TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables are required";
    console.warn("[db]", initError);
    initialized = true;
    return null;
  }

  try {
    client = createClient({ url, authToken: token });
    initialized = true;
    console.log("[db] Turso client initialized");
    return client;
  } catch (err) {
    initError = `Failed to initialize Turso client: ${err instanceof Error ? err.message : String(err)}`;
    console.error("[db]", initError);
    initialized = true;
    return null;
  }
}

async function ensureTable(): Promise<void> {
  const c = getClient();
  if (!c) throw new Error(initError ?? "Database not configured");

  await c.execute(`
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT 'Novo Personagem',
      data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

export async function listCharacters(): Promise<CharacterListItem[]> {
  const c = getClient();
  if (!c) throw new Error(initError ?? "Database not configured");

  await ensureTable();

  const result = await c.execute(
    `SELECT id, name, updated_at FROM characters ORDER BY updated_at DESC`
  );

  return result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    updated_at: String(row.updated_at),
  }));
}

export async function getCharacter(id: string): Promise<CharacterRow | null> {
  const c = getClient();
  if (!c) throw new Error(initError ?? "Database not configured");

  await ensureTable();

  const result = await c.execute({
    sql: `SELECT * FROM characters WHERE id = ?`,
    args: [id],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: String(row.id),
    name: String(row.name),
    data: String(row.data),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function createCharacter(data: object, name?: string): Promise<CharacterRow> {
  const c = getClient();
  if (!c) throw new Error(initError ?? "Database not configured");

  await ensureTable();

  const id = nanoid(12);
  const characterName = name ?? "Novo Personagem";
  const jsonData = JSON.stringify(data);

  await c.execute({
    sql: `INSERT INTO characters (id, name, data) VALUES (?, ?, ?)`,
    args: [id, characterName, jsonData],
  });

  return {
    id,
    name: characterName,
    data: jsonData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function updateCharacter(
  id: string,
  data: object,
  name?: string
): Promise<CharacterRow | null> {
  const c = getClient();
  if (!c) throw new Error(initError ?? "Database not configured");

  await ensureTable();

  const existing = await getCharacter(id);
  if (!existing) return null;

  const jsonData = JSON.stringify(data);
  const characterName = name ?? existing.name;

  await c.execute({
    sql: `UPDATE characters SET name = ?, data = ?, updated_at = datetime('now') WHERE id = ?`,
    args: [characterName, jsonData, id],
  });

  return {
    id,
    name: characterName,
    data: jsonData,
    created_at: existing.created_at,
    updated_at: new Date().toISOString(),
  };
}

export async function deleteCharacter(id: string): Promise<boolean> {
  const c = getClient();
  if (!c) throw new Error(initError ?? "Database not configured");

  await ensureTable();

  const result = await c.execute({
    sql: `DELETE FROM characters WHERE id = ?`,
    args: [id],
  });

  return result.rowsAffected > 0;
}

export function isDatabaseAvailable(): boolean {
  const c = getClient();
  return c !== null;
}
