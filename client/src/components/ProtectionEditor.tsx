import { useState } from 'react';
import { Trash2, Plus, Shield } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ProtectionTag {
  id: string;
  name: string;
  description: string;
}

interface ProtectionItem {
  id: string;
  name: string;
  defenseBonus?: number;
  protectionType?: 'light' | 'heavy';
  hasExtraEffect?: boolean;
  extraEffect?: string;
  tags?: ProtectionTag[];
}

interface ProtectionEditorProps {
  protection: ProtectionItem;
  onUpdate: (field: keyof ProtectionItem, value: any) => void;
  hideName?: boolean;
}

export default function ProtectionEditor({
  protection,
  onUpdate,
  hideName = false,
}: ProtectionEditorProps) {
  const [newTagName, setNewTagName] = useState('');
  const [newTagDescription, setNewTagDescription] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const tags = protection.tags || [];

  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    const newTag: ProtectionTag = {
      id: Date.now().toString(),
      name: newTagName,
      description: newTagDescription,
    };
    onUpdate('tags', [...tags, newTag]);
    setNewTagName('');
    setNewTagDescription('');
  };

  const handleRemoveTag = (tagId: string) => {
    onUpdate(
      'tags',
      tags.filter((tag) => tag.id !== tagId)
    );
  };

  return (
    <div className="space-y-4">
      {!hideName && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={protection.name}
            onChange={(e) => onUpdate('name', e.target.value)}
            className="flex-1 font-display text-sm text-primary uppercase bg-transparent border-b border-primary focus:outline-none focus:ring-0 py-0.5"
            placeholder="Nome da Proteção"
          />
        </div>
      )}

      <div className="flex items-center border border-primary bg-input h-8 px-2 gap-2">
        <span className="text-primary text-xs font-bold uppercase whitespace-nowrap">Defesa:</span>
        <input
          type="number"
          value={protection.defenseBonus || 0}
          onChange={(e) => onUpdate('defenseBonus', parseInt(e.target.value) || 0)}
          className="w-full bg-transparent text-primary text-xs focus:outline-none text-right"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-primary">
          <Checkbox
            checked={protection.hasExtraEffect || false}
            onCheckedChange={(v) => onUpdate('hasExtraEffect', !!v)}
            className="border-primary"
          />
          <span className="text-xs uppercase font-bold">Efeito Extra</span>
        </label>
      </div>

      {protection.hasExtraEffect && (
        <div>
          <textarea
            value={protection.extraEffect || ''}
            onChange={(e) => onUpdate('extraEffect', e.target.value)}
            className="w-full bg-transparent border border-primary text-primary text-xs p-1 focus:outline-none focus:ring-1 focus:ring-primary resize-y min-h-[40px] max-h-64 overflow-y-auto break-words"
            placeholder="Descreva o efeito..."
            rows={3}
          />
        </div>
      )}

      <div className="pt-2 border-t border-primary/30">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-primary font-bold uppercase">Modificações</label>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-[10px] bg-primary text-black px-2 py-1 font-bold uppercase hover:bg-opacity-80 transition-all flex items-center gap-1">
                <Plus size={10} /> Adicionar
              </button>
            </DialogTrigger>
            <DialogContent className="border-2 border-primary bg-black text-primary max-w-md">
              <DialogHeader>
                <DialogTitle className="text-primary uppercase tracking-widest font-display">
                  Nova Modificação
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-primary">Nome</label>
                  <input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="w-full bg-input border border-primary text-primary p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Ex: Tática, Discreta"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-primary">Descrição</label>
                  <textarea
                    value={newTagDescription}
                    onChange={(e) => setNewTagDescription(e.target.value)}
                    className="w-full bg-input border border-primary text-primary p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none h-24"
                    placeholder="Descreva a modificação..."
                  />
                </div>
                <button
                  onClick={handleAddTag}
                  disabled={!newTagName.trim()}
                  className="w-full py-2 bg-primary text-black font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-80 transition-all"
                >
                  Adicionar Modificação
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Dialog
                key={tag.id}
                open={selectedTagId === tag.id}
                onOpenChange={(open) => !open && setSelectedTagId(null)}
              >
                <DialogTrigger asChild>
                  <button
                    onClick={() => setSelectedTagId(tag.id)}
                    className="px-2 py-1 text-xs bg-primary bg-opacity-40 border border-primary text-black font-bold hover:bg-opacity-60 transition-all rounded"
                  >
                    {tag.name}
                  </button>
                </DialogTrigger>
                <DialogContent className="border-2 border-primary bg-black text-primary max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="text-primary">{tag.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <p className="text-sm whitespace-pre-wrap text-gray-300">{tag.description}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRemoveTag(tag.id)}
                        className="flex-1 px-3 py-2 bg-red-600 text-white font-bold uppercase text-xs border border-red-500 hover:bg-red-700"
                      >
                        <Trash2 size={12} className="inline mr-1" />
                        Remover
                      </button>
                      <button
                        onClick={() => setSelectedTagId(null)}
                        className="flex-1 px-3 py-2 border border-primary text-primary font-bold uppercase text-xs hover:bg-primary hover:bg-opacity-10"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 mb-2">Nenhuma modificação adicionada</p>
        )}
      </div>
    </div>
  );
}
