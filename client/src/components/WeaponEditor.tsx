import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface WeaponTag {
  id: string;
  name: string;
  description: string;
}

interface Weapon {
  id: string;
  name: string;
  category: string;
  damageDiceCount: number;
  damageDiceSides: number;
  criticalThreshold: number;
  criticalMultiplier: number;
  skill: string;
  attribute: string;
  hasExtraEffect: boolean;
  extraEffect?: string;
  isActive?: boolean;
  tags: WeaponTag[];
}

const ATTRIBUTE_OPTIONS = ['força', 'agilidade', 'inteligência', 'presença', 'vigor', 'vontade'];

interface WeaponEditorProps {
  weapon: Weapon;
  onUpdate: (field: keyof Weapon, value: any) => void;
  onDelete?: () => void;
  onRollTest?: () => void;
  onCloseMenu?: () => void;
  hideName?: boolean;
  isInspectMode?: boolean;
}

export default function WeaponEditor({
  weapon,
  onUpdate,
  onDelete,
  onRollTest,
  onCloseMenu,
  hideName,
  isInspectMode = false,
}: WeaponEditorProps) {
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagDescription, setNewTagDescription] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [pendingDeleteWeapon, setPendingDeleteWeapon] = useState(false);
  
  // Collapse by default if equipped in the sidebar list
  const [isCollapsed, setIsCollapsed] = useState(weapon.isActive && !isInspectMode);

  const handleAddTag = () => {
    if (!newTagName.trim()) return;

    const newTag: WeaponTag = {
      id: Date.now().toString(),
      name: newTagName,
      description: newTagDescription,
    };

    onUpdate('tags', [...weapon.tags, newTag]);
    setNewTagName('');
    setNewTagDescription('');
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagId: string) => {
    onUpdate(
      'tags',
      weapon.tags.filter((tag) => tag.id !== tagId)
    );
  };


  return (
    <div
      className={`border border-primary p-3 space-y-2 transition-all duration-300 ${
        isRemoving
          ? 'opacity-0 scale-95 max-h-0 overflow-hidden'
          : 'opacity-100 scale-100 max-h-[5000px]'
      } ${weapon.isActive ? 'bg-black/40 ring-1 ring-primary/20' : 'bg-black'}`}
    >
      {isCollapsed ? (
        // --- SUMMARY / COLLAPSED VIEW ---
        <div className="flex flex-col gap-2 w-full overflow-hidden">
          <div className="flex items-center justify-between w-full">
            <span className="font-display text-sm text-primary uppercase font-bold truncate">
              {weapon.name || 'Arma sem nome'}
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setIsCollapsed(false)}
                className="px-2 py-1 text-[10px] font-bold uppercase border border-primary text-primary hover:bg-primary/10 transition-colors"
                title="Editar Arma"
              >
                EDITAR
              </button>
              <button
                onClick={() => onUpdate('isActive', false)}
                className="px-2 py-1 text-[10px] font-bold uppercase border border-primary bg-primary text-black hover:bg-primary/80 transition-colors"
                title="Desequipar"
              >
                DESEQUIPAR
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-primary/70 uppercase font-bold w-full flex-wrap">
            <span>Dano: {weapon.damageDiceCount}d{weapon.damageDiceSides}</span>
            <span>|</span>
            <span>Crítico: {weapon.criticalThreshold}/x{weapon.criticalMultiplier}</span>
            {weapon.category && (
              <>
                <span>|</span>
                <span>{weapon.category}</span>
              </>
            )}
          </div>

          {weapon.hasExtraEffect && weapon.extraEffect && (
            <div className="w-full text-[10px] text-primary/80 italic mt-1 leading-tight whitespace-pre-wrap break-words break-all max-h-32 overflow-y-auto pr-1">
              {weapon.extraEffect}
            </div>
          )}

          {weapon.tags && weapon.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {weapon.tags.map(tag => (
                <span key={tag.id} className="px-1 bg-primary/20 text-primary text-[9px] border border-primary/30 uppercase font-bold">
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          {onRollTest && (
            <button
              onClick={onRollTest}
              className="w-full mt-1 btn-occult py-2 text-xs flex items-center justify-center"
            >
              ATACAR
            </button>
          )}
        </div>
      ) : (
        // --- EXPANDED / EDIT VIEW ---
        <>
          <div className="flex items-center gap-2 justify-between">
            {!hideName && (
              <input
                type="text"
                value={weapon.name}
                onChange={(e) => onUpdate('name', e.target.value)}
                className="flex-1 font-display text-sm text-primary uppercase bg-transparent border-b border-primary focus:outline-none focus:ring-0 py-0.5"
                placeholder="Nome da Arma"
              />
            )}
            {weapon.isActive && !isInspectMode && (
              <span
                className={`px-2 py-1 text-xs font-bold uppercase border-2 bg-primary border-primary text-black ${hideName ? 'w-full text-center' : ''}`}
              >
                ✓ Equipado
              </span>
            )}
            {weapon.isActive && !isInspectMode && (
              <button
                onClick={() => setIsCollapsed(true)}
                className="px-2 py-1 text-[10px] font-bold uppercase border border-primary text-primary hover:bg-primary/10 transition-colors ml-1"
                title="Minimizar"
              >
                MINIMIZAR
              </button>
            )}
          </div>

      <div className="grid grid-cols-3 gap-2">
        <input
          type="text"
          value={weapon.category}
          onChange={(e) => onUpdate('category', e.target.value)}
          className="bg-transparent border border-primary text-primary text-xs p-1 focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Categoria"
        />
        <select
          value={weapon.skill}
          onChange={(e) => onUpdate('skill', e.target.value)}
          className="bg-input border border-primary text-primary text-xs p-1 h-8 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Perícia</option>
          <option value="Luta">Luta</option>
          <option value="Pontaria">Pontaria</option>
          <option value="Ocultismo">Ocultismo</option>
        </select>
        <select
          value={weapon.attribute}
          onChange={(e) => onUpdate('attribute', e.target.value)}
          className="bg-input border border-primary text-primary text-xs p-1 h-8 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Atributo</option>
          {ATTRIBUTE_OPTIONS.map((attribute) => (
            <option key={attribute} value={attribute}>
              {attribute.charAt(0).toUpperCase() + attribute.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="border border-primary bg-black p-2 flex items-center gap-1">
        <input
          type="number"
          aria-label="Quantidade de dados"
          value={weapon.damageDiceCount}
          onChange={(e) => onUpdate('damageDiceCount', Math.max(1, parseInt(e.target.value) || 1))}
          className="w-12 flex-shrink-0 bg-input border border-primary text-primary text-xs p-1 h-8 focus:outline-none focus:ring-1 focus:ring-primary text-center"
          min="1"
          max="10"
        />
        <select
          value={weapon.damageDiceSides}
          onChange={(e) => onUpdate('damageDiceSides', parseInt(e.target.value) || 6)}
          className="flex-1 bg-input border border-primary text-primary text-[10px] p-1 h-8 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="4">d4</option>
          <option value="6">d6</option>
          <option value="8">d8</option>
          <option value="10">d10</option>
          <option value="12">d12</option>
          <option value="20">d20</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <label className="text-[10px] text-primary font-bold flex-shrink-0">Crítico:</label>
          <input
            type="number"
            value={weapon.criticalThreshold}
            onChange={(e) => onUpdate('criticalThreshold', parseInt(e.target.value) || 18)}
            className="w-8 bg-input border border-primary text-primary text-[10px] p-0.5 focus:outline-none focus:ring-1 focus:ring-primary text-center"
            min="1"
            max="20"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <label className="text-[10px] text-primary font-bold">x</label>
          <input
            type="number"
            value={weapon.criticalMultiplier}
            onChange={(e) => onUpdate('criticalMultiplier', parseInt(e.target.value) || 2)}
            className="w-12 bg-input border border-primary text-primary text-[10px] p-0.5 focus:outline-none focus:ring-1 focus:ring-primary text-center"
            min="1"
          />

          <label className="flex items-center gap-2 text-xs text-primary ml-2">
            <Checkbox
              checked={weapon.hasExtraEffect}
              onCheckedChange={(v) => onUpdate('hasExtraEffect', !!v)}
              className="border-primary"
            />
            <span className="text-xs">Efeito Extra</span>
          </label>
        </div>
      </div>

      {weapon.hasExtraEffect && (
        <div>
          <label className="text-xs text-primary font-bold uppercase block mb-1">Descrição</label>
          <textarea
            value={weapon.extraEffect || ''}
            onChange={(e) => onUpdate('extraEffect', e.target.value)}
            className="w-full bg-transparent border border-primary text-primary text-xs p-1 focus:outline-none focus:ring-1 focus:ring-primary resize-y min-h-[40px] max-h-64 overflow-y-auto break-words"
            placeholder="Descreva o efeito..."
            rows={3}
          />
        </div>
      )}

      <div className="border-t border-primary pt-2 mt-2">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-primary font-bold uppercase">Modificações</label>
          <Dialog open={isAddingTag} onOpenChange={setIsAddingTag}>
            <DialogTrigger asChild>
              <button className="p-1 text-primary hover:bg-primary hover:bg-opacity-10 border border-primary text-xs flex items-center gap-1">
                <Plus size={12} />
              </button>
            </DialogTrigger>
            <DialogContent className="border-2 border-primary bg-black text-primary">
              <DialogHeader>
                <DialogTitle className="text-primary">Adicionar Modificação</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase block mb-1">Nome</label>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="w-full bg-input border border-primary text-primary text-sm p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Nome da modificação"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase block mb-1">Descrição</label>
                  <textarea
                    value={newTagDescription}
                    onChange={(e) => setNewTagDescription(e.target.value)}
                    onInput={(e) => autoResizeTextarea(e.currentTarget)}
                    className="w-full bg-input border border-primary text-primary text-sm p-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-hidden"
                    placeholder="Descreva a modificação..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddTag}
                    className="flex-1 px-3 py-2 bg-primary text-black font-bold uppercase text-xs border border-primary hover:bg-primary hover:bg-opacity-80"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => setIsAddingTag(false)}
                    className="flex-1 px-3 py-2 border border-primary text-primary font-bold uppercase text-xs hover:bg-primary hover:bg-opacity-10"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {weapon.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1 mb-2">
            {weapon.tags.map((tag) => (
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

      {!isInspectMode && onRollTest && (
        <div className="w-full pt-2 border-t border-primary">
          <button
            onClick={() => {
              onRollTest();
              onCloseMenu?.();
            }}
            className="w-full py-2 bg-primary hover:bg-opacity-80 text-black font-bold uppercase border border-primary transition-all text-xs"
          >
            Atacar
          </button>
        </div>
      )}

      {!isInspectMode && onDelete && (
        <>
          <button
            onClick={() => setPendingDeleteWeapon(true)}
            className="w-full py-2 bg-black border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold uppercase transition-all text-xs"
          >
            <Trash2 className="inline mr-1" size={12} />
            Remover Arma
          </button>

          <AlertDialog
            open={pendingDeleteWeapon}
            onOpenChange={(open) => {
              if (!open) setPendingDeleteWeapon(false);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover equipamento?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação remove permanentemente a arma {weapon.name || 'selecionada'}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setPendingDeleteWeapon(false);
                    setIsRemoving(true);
                    window.setTimeout(() => {
                      onDelete?.();
                    }, 300);
                  }}
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

        </>
      )}
    </div>
  );
}