import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Plus, Box, Briefcase, Skull, Zap, X, Shield } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import anime from 'animejs';
import WeaponsList from '@/components/WeaponsList';
import InventoryGrid, { InventoryItem, getRotatedShape } from './InventoryGrid';
import ItemShapeEditor from './ItemShapeEditor';
import WeaponEditor from './WeaponEditor';
import ProtectionEditor from './ProtectionEditor';
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

interface InventoryPanelProps {
  isOpen: boolean;
  showToggle: boolean;
  onToggle: () => void;
  inventory: InventoryItem[];
  mainContainer?: 'bolsos' | 'mochila_simples' | 'mochila_tatica' | 'mala' | 'mochila_militar';
  forca: number;
  onAddItem: (data?: Partial<InventoryItem>, weaponData?: Partial<Weapon>) => void;
  onUpdateItem: (id: string, field: keyof InventoryItem, value: any) => void;
  onUpdateMainContainer?: (container: 'bolsos' | 'mochila_simples' | 'mochila_tatica' | 'mala' | 'mochila_militar') => void;
  onDeleteItem: (id: string) => void;
  weapons: Weapon[];
  onUpdateWeapon: (weaponId: string, field: keyof Weapon, value: any) => void;
  onAddWeapon: () => void;
  onDeleteWeapon: (weaponId: string) => void;
  onToggleWeaponActive: (weaponId: string) => void;
  onRollWeaponTest: (weapon: Weapon) => void;
  onCloseMenu?: () => void;
  isOverloaded?: boolean;
}

function DraggableContainer({ item, onPositionChange, children }: { item: InventoryItem, onPositionChange: (id: string, x: number, y: number) => void, children: React.ReactNode }) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!(e.target as HTMLElement).closest('.drag-handle')) return;
    const el = containerRef.current;
    if (!el) return;

    e.stopPropagation();
    e.preventDefault();

    el.setPointerCapture(e.pointerId);

    const startX = e.clientX - (item.panelPosition?.x || 20);
    const startY = e.clientY - (item.panelPosition?.y || 400);

    let currentX = item.panelPosition?.x || 20;
    let currentY = item.panelPosition?.y || 400;

    el.style.zIndex = '50';

    const onMove = (moveEv: PointerEvent) => {
      currentX = moveEv.clientX - startX;
      currentY = moveEv.clientY - startY;

      const panelElement = el.parentElement;
      if (panelElement) {
        // Garante que pelo menos um pedaço continue visível
        const maxLeft = Math.max(50, panelElement.clientWidth - 50);
        currentX = Math.max(0, Math.min(currentX, maxLeft));
        currentY = Math.max(0, currentY);
      }

      anime.set(el, { left: currentX, top: currentY });
    };

    const onUp = (upEv: PointerEvent) => {
      el.releasePointerCapture(upEv.pointerId);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.style.zIndex = '10';
      onPositionChange(item.id, currentX, currentY);
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
  };

  return (
    <div
      ref={containerRef}
      className="absolute z-10 pb-8"
      style={{ left: item.panelPosition?.x || 20, top: item.panelPosition?.y || 400 }}
      onPointerDown={handlePointerDown}
    >
      {children}
    </div>
  );
}

export default function InventoryPanel({
  isOpen,
  showToggle,
  onToggle,
  inventory,
  mainContainer = 'mochila_simples',
  forca,
  onAddItem,
  onUpdateItem,
  onUpdateMainContainer,
  onDeleteItem,
  weapons,
  onUpdateWeapon,
  onAddWeapon,
  onDeleteWeapon,
  onToggleWeaponActive,
  onRollWeaponTest,
  onCloseMenu,
  isOverloaded
}: InventoryPanelProps) {
  const [pendingDeleteItem, setPendingDeleteItem] = useState<InventoryItem | null>(null);
  const [pendingWeaponData, setPendingWeaponData] = useState<Partial<Weapon>>({});
  const [pendingProtectionData, setPendingProtectionData] = useState<Partial<InventoryItem>>({});

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [activeTab, setActiveTab] = useState<'mochila' | 'bolsos'>('mochila');

  const getContainerRows = (type: string) => {
    switch (type) {
      case 'bolsos': return 2;
      case 'mochila_simples': return 4;
      case 'mochila_tatica': return 6;
      case 'mala': return 8;
      case 'mochila_militar': return 10;
      default: return 4;
    }
  };

  const getContainerCols = (f: number) => {
    switch (f) {
      case 0: return 4;
      case 1: return 5;
      case 2: return 6;
      case 3: return 7;
      case 4: return 8;
      default: return 8; // Max limit se forca > 4
    }
  };

  const baseGrid = {
    cols: getContainerCols(forca),
    rows: getContainerRows(mainContainer)
  };
  const cellSize = 40; // Aumentado para 40px para melhorar visualização

  const handleOpenNewItem = () => {
    setPendingWeaponData({});
    setPendingProtectionData({});
    setEditingItem({
      id: '',
      name: 'Novo Item',
      description: '',
      type: activeTab === 'bolsos' ? 'pocket' : 'common',
      shape: [[true]],
      rotation: 0,
      containerId: activeTab === 'bolsos' ? 'pocket' : 'main',
      position: { x: 0, y: 0 }
    } as any);
    setIsEditorOpen(true);
  };

  const handleTryDelete = (item: InventoryItem) => {
    if (item.type === 'backpack' || item.type === 'quick_draw') {
      const itemsInside = inventory.filter(i => i.containerId === item.id);
      if (itemsInside.length > 0) {
        alert(`Você não pode excluir '${item.name}' pois ainda há itens dentro dela! Esvazie a expansão primeiro.`);
        return;
      }
    }
    setPendingDeleteItem(item);
  };

  const handleSaveItem = (itemData: Partial<InventoryItem>) => {
    if (itemData.type === 'protection') {
      const existingProtection = inventory.find(i => i.type === 'protection' && i.id !== editingItem?.id);
      if (existingProtection) {
        alert("Você já possui uma proteção no inventário! Remova a proteção atual antes de criar uma nova.");
        return false;
      }
    }

    if (itemData.type === 'weapon' && (!editingItem || !editingItem.id)) {
      if (!pendingWeaponData.category || !pendingWeaponData.skill || !pendingWeaponData.attribute) {
        alert("Por favor, preencha os campos de Categoria, Perícia e Atributo antes de salvar a arma.");
        return false;
      }
    }

    if (editingItem && editingItem.id) {
      // Edit
      Object.entries(itemData).forEach(([key, val]) => {
        onUpdateItem(editingItem.id, key as keyof InventoryItem, val);
      });
      // Se for protection, aplica o pendingProtectionData junto
      if (itemData.type === 'protection') {
        Object.entries(pendingProtectionData).forEach(([key, val]) => {
          onUpdateItem(editingItem.id, key as keyof InventoryItem, val);
        });
      }
    } else {
      // Add novo
      onAddItem({ ...itemData, ...pendingProtectionData }, pendingWeaponData);
    }
    setIsEditorOpen(false);
    setPendingWeaponData({});
    setPendingProtectionData({});
    return true;
  };

  // Funçao para checar colisao ao mover
  const handleItemMove = (itemId: string, targetContainerId: string, position: { x: number, y: number }, rotation: number) => {
    const itemToMove = inventory.find(i => i.id === itemId);
    if (!itemToMove) return;

    // Check collision in target container
    const targetItems = inventory.filter(i => i.containerId === targetContainerId && i.id !== itemId && i.position);

    let hasCollision = false;
    const movedShape = getRotatedShape(itemToMove.shape, rotation);
    const mRows = movedShape.length;
    const mCols = movedShape[0].length;

    for (const tItem of targetItems) {
      if (!tItem.position) continue;
      const tShape = getRotatedShape(tItem.shape, tItem.rotation || 0);
      const tRows = tShape.length;
      const tCols = tShape[0].length;

      // Simple bounding box check first
      if (
        position.x < tItem.position.x + tCols &&
        position.x + mCols > tItem.position.x &&
        position.y < tItem.position.y + tRows &&
        position.y + mRows > tItem.position.y
      ) {
        // Detailed pixel-perfect overlap check
        for (let mr = 0; mr < mRows; mr++) {
          for (let mc = 0; mc < mCols; mc++) {
            if (movedShape[mr][mc]) {
              const absX = position.x + mc;
              const absY = position.y + mr;

              const tr = absY - tItem.position.y;
              const tc = absX - tItem.position.x;

              if (tr >= 0 && tr < tRows && tc >= 0 && tc < tCols) {
                if (tShape[tr][tc]) {
                  hasCollision = true;
                  break;
                }
              }
            }
          }
          if (hasCollision) break;
        }
      }
      if (hasCollision) break;
    }

    if (hasCollision) {
      // Revert position visually se necessário (no futuro podemos adicionar animação de volta)
      return;
    }

    onUpdateItem(itemId, 'containerId', targetContainerId);
    onUpdateItem(itemId, 'position', position);
    onUpdateItem(itemId, 'rotation', rotation);
  };

  return (
    <>
      {showToggle && (
        <button
          onClick={onToggle}
          className={`group fixed top-16 z-[60] h-12 w-12 hover:w-40 overflow-hidden bg-black border-2 border-primary hover:bg-primary hover:bg-opacity-10 flex items-center justify-start text-primary transition-all duration-300 ${
            isOpen ? 'right-[34rem]' : 'right-0'
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
      <div className={`fixed right-0 top-0 h-screen z-50 bg-black transition-all duration-300 flex flex-col ${isOpen ? 'w-[34rem] border-l-2 border-primary' : 'w-0 border-l-0'}`} style={{ paddingTop: '3rem' }}>
        {isOpen && (
          <ScrollArea className="flex-1 overflow-hidden" hideScrollbar={true}>
            <div className="p-4 space-y-6 pr-4">
              
              {/* Armas */}
              <WeaponsList
                      weapons={weapons}
                      onUpdateWeapon={onUpdateWeapon}
                      onAddWeapon={() => {
                        setPendingWeaponData({});
                        setEditingItem({
                          id: '',
                          name: 'Nova Arma',
                          description: '',
                          type: 'weapon',
                          shape: [[true, true]],
                          rotation: 0,
                          containerId: 'main',
                          position: { x: 0, y: 0 }
                        } as any);
                        setIsEditorOpen(true);
                      }}
                      onDeleteWeapon={onDeleteWeapon}
                      onToggleActive={onToggleWeaponActive}
                      onRollWeaponTest={onRollWeaponTest}
                      onCloseMenu={onCloseMenu}
              />
              
              {/* Inventario Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-display text-base text-primary uppercase">Inventário</h3>
                    {onUpdateMainContainer && (
                      <select 
                        value={mainContainer}
                        onChange={(e) => onUpdateMainContainer(e.target.value as any)}
                        className="bg-black border border-green-500/30 text-green-500 text-[10px] uppercase p-1 outline-none focus:border-green-400"
                      >
                        <option value="bolsos">Bolsos Comuns</option>
                        <option value="mochila_simples">Mochila Simples</option>
                        <option value="mochila_tatica">Mochila Tática</option>
                        <option value="mala">Mala Cargueira</option>
                        <option value="mochila_militar">Mochila Militar</option>
                      </select>
                    )}
                  </div>
                  <button
                    onClick={handleOpenNewItem}
                    className="btn-occult text-xs px-2 py-1 flex items-center gap-1 self-start"
                  >
                    <Plus size={12} /> ADD ITEM
                  </button>
                </div>

                {/* Aba de Seleção: Mochila vs Bolsos */}
                <div className="flex border-b border-primary/30">
                  <button 
                    onClick={() => setActiveTab('mochila')}
                    className={`flex-1 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors ${activeTab === 'mochila' ? 'bg-primary/20 text-primary border-b-2 border-primary' : 'text-primary/50 hover:bg-primary/10'}`}
                  >
                    Mochila
                  </button>
                  <button 
                    onClick={() => setActiveTab('bolsos')}
                    className={`flex-1 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors ${activeTab === 'bolsos' ? 'bg-green-500/20 text-green-400 border-b-2 border-green-500' : 'text-green-500/50 hover:bg-green-500/10'}`}
                  >
                    Bolsos
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'mochila' ? (
                  <div className="relative flex flex-col items-center mt-4 min-h-[600px]">
                        <InventoryGrid
                          containerId="main"
                          title={
                            mainContainer === 'mochila_simples' ? 'Mochila Simples' :
                            mainContainer === 'mochila_tatica' ? 'Mochila Tática' :
                            mainContainer === 'mala' ? 'Mochila Cargueira' :
                            mainContainer === 'mochila_militar' ? 'Mochila Militar' :
                            'Mochila'
                          }
                          cols={baseGrid.cols}
                          rows={baseGrid.rows}
                          hasOverload={true}
                          isCharacterOverloaded={isOverloaded}
                          cellSize={cellSize}
                          items={inventory.filter(i => i.containerId === 'main')}
                          onItemMove={handleItemMove}
                          onItemClick={(item) => { setEditingItem(item); setIsEditorOpen(true); }}
                          onItemRightClick={(e, item) => { e.preventDefault(); setPendingDeleteItem(item); }}
                          activeWeaponIds={weapons.filter(w => w.isActive).map(w => w.id)}
                          onEquipDrop={(id) => {
                            const w = weapons.find(x => x.id === id);
                            if (w && !w.isActive) onToggleWeaponActive(id);
                          }}
                        />

                        {/* Grids satelites: mochilas / expansoes */}
                        {inventory.filter(i => i.type === 'backpack' || i.type === 'quick_draw').map(container => (
                          <DraggableContainer
                            key={container.id}
                            item={container}
                            onPositionChange={(id, x, y) => onUpdateItem(id, 'panelPosition', { x, y })}
                          >
                            <InventoryGrid
                              containerId={container.id}
                              title={container.name}
                              cols={container.gridSize?.cols || 2}
                              rows={container.gridSize?.rows || 2}
                              hasOverload={false}
                              isCharacterOverloaded={isOverloaded}
                              cellSize={cellSize}
                              items={inventory.filter(i => i.containerId === container.id)}
                              onItemMove={handleItemMove}
                              onItemClick={(item) => { setEditingItem(item); setIsEditorOpen(true); }}
                              onItemRightClick={(e, item) => { e.preventDefault(); setPendingDeleteItem(item); }}
                              onHeaderContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); handleTryDelete(container); }}
                              activeWeaponIds={weapons.filter(w => w.isActive).map(w => w.id)}
                              onEquipDrop={(id) => {
                                const w = weapons.find(x => x.id === id);
                                if (w && !w.isActive) onToggleWeaponActive(id);
                              }}
                            />
                          </DraggableContainer>
                        ))}
                      </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {inventory.filter(i => i.containerId === 'pocket').map(item => (
                      <div 
                        key={item.id}
                        className="bg-black/50 border border-green-500/20 p-3 flex items-center justify-between group hover:border-green-500/50 cursor-pointer transition-colors"
                        onClick={() => { setEditingItem(item); setIsEditorOpen(true); }}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <Box size={16} className="text-green-600 flex-shrink-0" />
                          <span className="text-sm text-green-300 font-bold truncate" title={item.name}>{item.name}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleTryDelete(item); }}
                          className="text-red-500/50 hover:text-red-500 transition-colors flex-shrink-0 p-1"
                        >
                          <Skull size={16} />
                        </button>
                      </div>
                    ))}
                    {inventory.filter(i => i.containerId === 'pocket').length === 0 && (
                      <div className="text-green-700 text-xs text-center italic py-4 border border-green-900/30 bg-green-950/10">
                        Nenhum item guardado nos bolsos.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        )}

        <ItemShapeEditor
          isOpen={isEditorOpen}
          initialItem={editingItem}
          onSave={handleSaveItem}
          onDelete={editingItem ? () => { onDeleteItem(editingItem.id); setIsEditorOpen(false); setEditingItem(null); } : undefined}
          onClose={() => { setIsEditorOpen(false); setEditingItem(null); }}
          renderExtra={(type, itemId) => {
            if (type === 'weapon') {
              const existingWeapon = weapons.find(w => w.id === itemId);
              const weaponToEdit = existingWeapon || {
                id: itemId || Date.now().toString(),
                name: editingItem?.name || '',
                category: '',
                damageDiceCount: 1,
                damageDiceSides: 6,
                criticalThreshold: 18,
                criticalMultiplier: 2,
                skill: '',
                attribute: '',
                hasExtraEffect: false,
                tags: [],
                ...pendingWeaponData
              } as Weapon;

              return (
                <div className="border-t border-primary/30 pt-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-primary uppercase tracking-widest text-xs font-bold flex items-center gap-2">
                      <Zap size={12} />
                      Estatísticas da Arma
                    </h4>
                  </div>
                  <WeaponEditor
                    weapon={weaponToEdit}
                    hideName={true}
                    isInspectMode={true}
                    onUpdate={(field, val) => {
                      if (existingWeapon) {
                        onUpdateWeapon(weaponToEdit.id, field, val);
                      } else {
                        setPendingWeaponData(prev => ({ ...prev, [field]: val }));
                      }
                    }}
                    onDelete={existingWeapon ? () => { /* noop */ } : undefined}
                    onRollTest={existingWeapon ? () => onRollWeaponTest(weaponToEdit) : undefined}
                  />
                </div>
              );
            }

            if (type === 'protection') {
              const existingProtection = inventory.find(i => i.id === itemId && i.type === 'protection');
              const protectionToEdit = (existingProtection || {
                id: itemId || Date.now().toString(),
                name: editingItem?.name || '',
                defenseBonus: 0,
                protectionType: 'light',
                hasExtraEffect: false,
                extraEffect: '',
                tags: [],
                ...pendingProtectionData
              }) as any;

              return (
                <div className="border-t border-primary/30 pt-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-primary uppercase tracking-widest text-xs font-bold flex items-center gap-2">
                      <Shield size={12} />
                      Estatísticas de Proteção
                    </h4>
                  </div>
                  <ProtectionEditor
                    protection={protectionToEdit}
                    hideName={true}
                    onUpdate={(field, val) => {
                      if (existingProtection) {
                        onUpdateItem(protectionToEdit.id, field as keyof InventoryItem, val);
                      } else {
                        setPendingProtectionData(prev => ({ ...prev, [field]: val }));
                      }
                    }}
                  />
                </div>
              );
            }

            return null;
          }}
        />

        <AlertDialog open={Boolean(pendingDeleteItem)} onOpenChange={(open) => !open && setPendingDeleteItem(null)}>
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
                  if (pendingDeleteItem) {
                    onDeleteItem(pendingDeleteItem.id);
                  }
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
