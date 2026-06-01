import { useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Plus, Dice6 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import WeaponsList from '@/components/WeaponsList';
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

interface InventoryItem {
  id: string;
  name: string;
  description: string;
}

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

interface InventoryPanelProps {
  isOpen: boolean;
  showToggle: boolean;
  onToggle: () => void;
  inventory: InventoryItem[];
  onAddItem: () => void;
  onUpdateItem: (id: string, field: keyof InventoryItem, value: string) => void;
  onDeleteItem: (id: string) => void;
  weapons: Weapon[];
  onUpdateWeapon: (weaponId: string, field: keyof Weapon, value: any) => void;
  onAddWeapon: () => void;
  onDeleteWeapon: (weaponId: string) => void;
  onToggleWeaponActive: (weaponId: string) => void;
  onRollWeaponTest: (weapon: Weapon) => void;
  onCloseMenu?: () => void;
}

export default function InventoryPanel({
  isOpen,
  showToggle,
  onToggle,
  inventory,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  weapons,
  onUpdateWeapon,
  onAddWeapon,
  onDeleteWeapon,
  onToggleWeaponActive,
  onRollWeaponTest,
  onCloseMenu,
}: InventoryPanelProps) {
  const [pendingDeleteItem, setPendingDeleteItem] = useState<InventoryItem | null>(null);
  const [exitingItemId, setExitingItemId] = useState<string | null>(null);

  const autoResizeTextarea = (target: HTMLTextAreaElement) => {
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  const handleRollAndClose = (onRoll: () => void) => {
    onRoll();
    if (isOpen) onToggle();
  };

  return (
    <>
      {/* Toggle Button - Always visible, positioned outside the panel */}
      {showToggle && (
        <button
          onClick={onToggle}
          className={`group fixed top-16 z-40 h-12 w-12 hover:w-40 overflow-hidden bg-black border-2 border-primary hover:bg-primary hover:bg-opacity-10 flex items-center justify-start text-primary transition-all duration-300 ${
            isOpen ? 'right-[21rem]' : 'right-0'
          }`}
        >
          <span className="flex h-full w-12 flex-shrink-0 items-center justify-center">
            {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </span>
          <span className="pr-4 text-sm font-display uppercase tracking-wide whitespace-nowrap opacity-0 -translate-x-2 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            Equipamentos
          </span>
        </button>
      )}

      {/* Panel Content */}
      <div className={`fixed right-0 top-0 h-screen bg-black transition-all duration-300 flex flex-col ${isOpen ? 'w-[21rem] border-l-2 border-primary' : 'w-0 border-l-0'}`} style={{ paddingTop: '3rem' }}>

      {/* Content */}
      {isOpen && (
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="p-4 space-y-4 pr-4">
            {/* Weapons List Section */}
            <WeaponsList
              weapons={weapons}
              onUpdateWeapon={onUpdateWeapon}
              onAddWeapon={onAddWeapon}
              onDeleteWeapon={onDeleteWeapon}
              onToggleActive={onToggleWeaponActive}
              onRollWeaponTest={onRollWeaponTest}
              onCloseMenu={onCloseMenu}
            />

            {/* Inventory Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base text-primary uppercase">Inventário</h3>
                <button
                  onClick={onAddItem}
                  className="btn-occult text-xs px-1.5 py-0.5 flex items-center gap-0.5 flex-shrink-0"
                >
                  <Plus size={10} />
                  ADD
                </button>
              </div>

              <div className="space-y-2">
                {inventory.map((item) => (
                  <div
                    key={item.id}
                    className={`border border-primary bg-black p-1.5 space-y-1 transition-all duration-300 ease-out ${
                      exitingItemId === item.id ? 'opacity-0 scale-95 -translate-y-1 pointer-events-none' : 'opacity-100 scale-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => onUpdateItem(item.id, 'name', e.target.value)}
                        className="flex-1 min-w-0 bg-transparent border-b border-primary text-primary font-display text-sm focus:outline-none focus:ring-0 uppercase py-0.5"
                        placeholder="Item"
                      />
                      <button
                        onClick={() => setPendingDeleteItem(item)}
                        className="text-primary hover:text-secondary transition-colors p-0 flex-shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <textarea
                      value={item.description}
                      onChange={(e) => onUpdateItem(item.id, 'description', e.target.value)}
                      onInput={(e) => autoResizeTextarea(e.currentTarget)}
                      className="w-full bg-transparent border border-primary text-muted-foreground text-xs p-1 focus:outline-none focus:ring-1 focus:ring-primary resize-none overflow-hidden"
                      placeholder="Descrição"
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      )}

      <AlertDialog
        open={Boolean(pendingDeleteItem)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteItem(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover equipamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove permanentemente o item {pendingDeleteItem?.name || 'selecionado'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingDeleteItem) return;
                const deletingId = pendingDeleteItem.id;
                setExitingItemId(deletingId);
                setPendingDeleteItem(null);
                window.setTimeout(() => {
                  onDeleteItem(deletingId);
                  setExitingItemId(null);
                }, 220);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </>
  );
}
