import { Download, Upload, Cloud, HardDrive, FolderKanban, Loader2 } from "lucide-react";
import { useRef } from "react";

interface SaveLoadProps {
  characterData: any;
  onLoadCharacter: (data: any) => void;
  characterId: string | null;
  onSaveToCloud: () => void;
  onOpenManager: () => void;
  isCloudSaving: boolean;
  lastCloudSave: string | null;
  hideCloud?: boolean;
  hideJson?: boolean;
}

export default function SaveLoad({
  characterData,
  onLoadCharacter,
  characterId,
  onSaveToCloud,
  onOpenManager,
  isCloudSaving,
  lastCloudSave,
  hideCloud,
  hideJson,
}: SaveLoadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const dataToSave = {
      name: characterData.name,
      attributes: characterData.attributes,
      skills: characterData.skills,
      pericias: characterData.pericias,
      hp: characterData.hp,
      sanity: characterData.sanity,
      hope: characterData.hope,
      evasion: characterData.evasion,
      inventory: characterData.inventory,
      weapons: characterData.weapons,
      insanities: characterData.insanities,
      paranormalPowers: characterData.paranormalPowers,
      rituals: characterData.rituals,
      ritualComponents: characterData.ritualComponents,
    };

    const jsonString = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ficha-${characterData.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        onLoadCharacter(data);
        alert("Ficha carregada com sucesso!");
      } catch (error) {
        alert("Erro ao carregar a ficha. Verifique se o arquivo é válido.");
        console.error(error);
      }
    };
    reader.readAsText(file);

    // Reset input para permitir carregar o mesmo arquivo novamente
    event.target.value = "";
  };

  const formatLastCloudSave = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Cloud Buttons - Primary Row */}
      {!hideCloud && (
        <>
          <div className="flex gap-2 w-full">
            <button
              onClick={onSaveToCloud}
              disabled={isCloudSaving}
              className="flex-1 py-2 px-3 bg-primary text-black font-bold uppercase text-xs border-2 border-primary hover:bg-black hover:text-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title={characterId ? "Salvar alterações na nuvem" : "Salvar como nova ficha na nuvem"}
            >
              {isCloudSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : characterId ? (
                <HardDrive size={16} />
              ) : (
                <Cloud size={16} />
              )}
              {characterId ? "ATUALIZAR NUVEM" : "SALVAR NUVEM"}
            </button>

            <button
              onClick={onOpenManager}
              className="flex-1 py-2 px-3 bg-black text-primary font-bold uppercase text-xs border-2 border-primary hover:bg-primary hover:text-black transition-all flex items-center justify-center gap-2"
              title="Gerenciar fichas na nuvem"
            >
              <FolderKanban size={16} />
              FICHAS
            </button>
          </div>

          {/* Cloud Status Info */}
          {characterId && lastCloudSave && (
            <div className="w-full text-[10px] text-primary/50 font-mono text-center">
              Último save: {formatLastCloudSave(lastCloudSave)}
            </div>
          )}

          {/* Divider */}
          {!hideJson && <div className="w-full border-t border-primary/20 my-0.5" />}
        </>
      )}

      {/* Local JSON Buttons - Secondary Row */}
      {!hideJson && (
        <div className="flex gap-2 w-full">
        <button
          onClick={handleSave}
          className="flex-1 py-1.5 px-2 bg-black text-primary/60 font-bold uppercase text-[10px] border border-primary/30 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-1.5"
          title="Baixar ficha como arquivo JSON"
        >
          <Download size={14} />
          JSON
        </button>

        <button
          onClick={handleLoadClick}
          className="flex-1 py-1.5 px-2 bg-black text-primary/60 font-bold uppercase text-[10px] border border-primary/30 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-1.5"
          title="Carregar ficha de arquivo JSON"
        >
          <Upload size={14} />
          CARREGAR
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
      )}
    </div>
  );
}
