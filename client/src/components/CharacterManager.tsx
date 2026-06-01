import { useState, useEffect, useCallback } from "react";
import {
  X,
  Plus,
  Trash2,
  Copy,
  FolderOpen,
  Search,
  CloudOff,
  Loader2,
  RefreshCw,
} from "lucide-react";

export interface CloudCharacter {
  id: string;
  name: string;
  updated_at: string;
}

interface CharacterManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCharacter: (id: string, data: any) => void;
  onCreateNew: () => void;
  currentCharacterId: string | null;
}

export default function CharacterManager({
  isOpen,
  onClose,
  onOpenCharacter,
  onCreateNew,
  currentCharacterId,
}: CharacterManagerProps) {
  const [characters, setCharacters] = useState<CloudCharacter[]>([]);
  const [filteredCharacters, setFilteredCharacters] = useState<CloudCharacter[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchCharacters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/characters");
      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        // Se a resposta for HTML, é provável que o Vercel não esteja roteando para a API
        if (contentType.includes("text/html")) {
          const text = await res.text().catch(() => "");
          console.error("[CharacterManager] Vercel retornou HTML (não JSON):", text.substring(0, 300));
          throw new Error(`Servidor não respondeu como API (status ${res.status}). Verifique o deploy no Vercel.`);
        }
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || body.error || `Erro ${res.status}`);
      }
      const list: CloudCharacter[] = await res.json();
      setCharacters(list);
      setFilteredCharacters(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao conectar com o servidor");
      setCharacters([]);
      setFilteredCharacters([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCharacters();
      setSearchQuery("");
      setDeleteConfirmId(null);
      setError(null);
    }
  }, [isOpen, fetchCharacters]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCharacters(characters);
      return;
    }
    const lower = searchQuery.toLowerCase();
    setFilteredCharacters(
      characters.filter((c) => c.name.toLowerCase().includes(lower))
    );
  }, [searchQuery, characters]);

  const handleOpenCharacter = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/characters/${id}`);
      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("text/html")) {
          const text = await res.text().catch(() => "");
          console.error("[CharacterManager] Vercel retornou HTML ao abrir ficha:", text.substring(0, 300));
          throw new Error(`Servidor não respondeu como API (status ${res.status}). Verifique o deploy no Vercel.`);
        }
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || body.error || `Erro ${res.status}`);
      }
      const character = await res.json();
      // Garantir que data é um objeto válido — nunca passar null/undefined para o handler
      const safeData = character.data && typeof character.data === 'object' ? character.data : {};
      onOpenCharacter(id, safeData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar ficha");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/characters/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Erro ${res.status}`);
      }
      setCharacters((prev) => prev.filter((c) => c.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao deletar ficha");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async (character: CloudCharacter) => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch the original character data
      const res = await fetch(`/api/characters/${character.id}`);
      if (!res.ok) throw new Error("Falha ao carregar ficha original");
      const original = await res.json();

      // Create a duplicate with a new name
      const createRes = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${character.name} (cópia)`,
          data: original.data,
        }),
      });
      if (!createRes.ok) throw new Error("Falha ao duplicar ficha");
      await fetchCharacters();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao duplicar ficha");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl border-2 border-primary bg-black flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-primary">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl text-primary uppercase">Gerenciar Fichas</h2>
            {isLoading && <Loader2 size={18} className="animate-spin text-primary" />}
          </div>
          <button
            onClick={onClose}
            className="text-primary hover:text-red-400 transition-colors p-1"
            title="Fechar"
          >
            <X size={22} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 border-b border-primary/30">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome..."
              className="w-full bg-black border border-primary/40 text-white text-sm py-2 pl-9 pr-3 focus:border-primary focus:outline-none placeholder:text-primary/30 font-mono"
            />
          </div>
          <button
            onClick={fetchCharacters}
            disabled={isLoading}
            className="p-2 border border-primary/40 text-primary/70 hover:text-primary hover:border-primary transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => {
              onCreateNew();
              onClose();
            }}
            className="flex items-center gap-2 px-3 py-2 bg-primary text-black font-bold uppercase text-xs hover:bg-red-400 transition-colors"
          >
            <Plus size={16} />
            Nova
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-3 mt-3 p-3 border border-red-500 bg-red-950/20 flex items-center gap-3">
            <CloudOff size={18} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300 flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Character List */}
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading && characters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-primary/40">
              <Loader2 size={40} className="animate-spin" />
              <p className="text-sm font-mono uppercase">Carregando fichas...</p>
            </div>
          ) : !error && filteredCharacters.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-primary/40">
              {searchQuery ? (
                <>
                  <Search size={40} />
                  <p className="text-sm font-mono uppercase">
                    Nenhuma ficha encontrada para "{searchQuery}"
                  </p>
                </>
              ) : (
                <>
                  <CloudOff size={40} />
                  <p className="text-sm font-mono uppercase">Nenhuma ficha salva na nuvem</p>
                  <p className="text-xs text-primary/30">
                    Crie uma nova ficha ou salve a atual na nuvem
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCharacters.map((character) => {
                const isCurrent = character.id === currentCharacterId;
                const isDeletePending = character.id === deleteConfirmId;
                return (
                  <div
                    key={character.id}
                    className={`border ${isCurrent ? "border-primary bg-primary/5" : "border-primary/20 bg-black"} hover:border-primary/60 transition-colors group`}
                  >
                    <div className="flex items-center gap-3 p-3">
                      {/* Character Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-base text-primary truncate">
                            {character.name}
                          </h3>
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-primary text-black font-bold uppercase flex-shrink-0">
                              Atual
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-primary/40 font-mono mt-0.5">
                          Atualizado: {formatDate(character.updated_at)}
                        </p>
                      </div>

                      {/* Actions */}
                      {isDeletePending ? (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-red-400 font-mono">
                            Confirmar exclusão?
                          </span>
                          <button
                            onClick={() => handleDelete(character.id)}
                            disabled={isLoading}
                            className="px-2 py-1 bg-red-500 text-black text-xs font-bold uppercase hover:bg-red-400"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 border border-primary/40 text-primary/60 text-xs hover:text-primary"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenCharacter(character.id)}
                            disabled={isLoading}
                            className="p-2 text-primary hover:bg-primary/10 transition-colors"
                            title="Abrir ficha"
                          >
                            <FolderOpen size={18} />
                          </button>
                          <button
                            onClick={() => handleDuplicate(character)}
                            disabled={isLoading}
                            className="p-2 text-primary/70 hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Duplicar ficha"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(character.id)}
                            disabled={isLoading}
                            className="p-2 text-primary/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Deletar ficha"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-primary/30 flex items-center justify-between text-xs text-primary/30 font-mono">
          <span>{characters.length} ficha{characters.length !== 1 ? "s" : ""} na nuvem</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-primary/40 text-primary/60 hover:text-primary hover:border-primary transition-colors uppercase"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
