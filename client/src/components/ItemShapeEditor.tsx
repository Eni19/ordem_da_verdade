import React, { useState, useEffect } from 'react';
import { X, Save, Box, Briefcase, Skull, Sword } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: 'common' | 'dead_weight' | 'backpack' | 'quick_draw' | 'weapon';
  shape: boolean[][];
  rotation: 0 | 90 | 180 | 270;
  containerId: string | 'main' | 'pocket' | 'unassigned';
  position: { x: number, y: number } | null;
  panelPosition?: { x: number, y: number };
  gridSize?: { cols: number, rows: number };
}

interface ItemShapeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Partial<InventoryItem>) => void;
  onDelete?: () => void;
  initialItem?: InventoryItem | null;
  renderExtra?: (type: string, itemId: string) => React.ReactNode;
}

export default function ItemShapeEditor({ isOpen, onClose, onSave, onDelete, initialItem, renderExtra }: ItemShapeEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'common' | 'dead_weight' | 'backpack' | 'quick_draw' | 'weapon'>('common');
  
  // O grid máximo de desenho será 5x5
  const MAX_GRID = 5;
  const [shape, setShape] = useState<boolean[][]>(
    Array(MAX_GRID).fill(null).map(() => Array(MAX_GRID).fill(false))
  );

  const [gridSize, setGridSize] = useState({ cols: 2, rows: 2 });

  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setName(initialItem.name);
        setDescription(initialItem.description);
        setType(initialItem.type);
        setGridSize(initialItem.gridSize || { cols: 2, rows: 2 });

        const newShape = Array(MAX_GRID).fill(null).map(() => Array(MAX_GRID).fill(false));
        if (initialItem.shape) {
          for (let r = 0; r < Math.min(MAX_GRID, initialItem.shape.length); r++) {
            for (let c = 0; c < Math.min(MAX_GRID, initialItem.shape[r].length); c++) {
              newShape[r][c] = initialItem.shape[r][c];
            }
          }
        } else {
          newShape[0][0] = true;
        }
        setShape(newShape);
      } else {
        setName('Novo Item');
        setDescription('');
        setType('common');
        setGridSize({ cols: 2, rows: 2 });
        const newShape = Array(MAX_GRID).fill(null).map(() => Array(MAX_GRID).fill(false));
        newShape[0][0] = true;
        setShape(newShape);
      }
    }
  }, [isOpen, initialItem]);

  const handleToggleCell = (r: number, c: number) => {
    const newShape = [...shape.map(row => [...row])];
    newShape[r][c] = !newShape[r][c];
    
    // Garante que pelo menos 1 bloco exista se for "common"
    const hasAny = newShape.some(row => row.some(cell => cell));
    if (!hasAny && type === 'common') return;
    
    setShape(newShape);
  };

  const cropShape = (rawShape: boolean[][]) => {
    let minR = MAX_GRID, maxR = -1;
    let minC = MAX_GRID, maxC = -1;

    for (let r = 0; r < MAX_GRID; r++) {
      for (let c = 0; c < MAX_GRID; c++) {
        if (rawShape[r][c]) {
          if (r < minR) minR = r;
          if (r > maxR) maxR = r;
          if (c < minC) minC = c;
          if (c > maxC) maxC = c;
        }
      }
    }

    if (maxR === -1) return [[true]]; // Fallback

    const cropped: boolean[][] = [];
    for (let r = minR; r <= maxR; r++) {
      const row = [];
      for (let c = minC; c <= maxC; c++) {
        row.push(rawShape[r][c]);
      }
      cropped.push(row);
    }
    return cropped;
  };

  const handleSave = () => {
    const finalShape = cropShape(shape);
    const finalType = type === 'pocket' as any ? 'common' : type;
    
    const payload: Partial<InventoryItem> = {
      name,
      description,
      type: finalType,
      shape: finalShape,
    };
    
    if (type === 'backpack' || type === 'quick_draw') {
      payload.gridSize = gridSize;
      payload.containerId = 'pocket';
    }
    
    if (type === 'pocket' as any) {
      payload.containerId = 'pocket';
    }
    
    const success = onSave(payload);
    if (success !== false) {
      onClose();
    }
  };

  const isWeapon = type === 'weapon';
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`bg-black border ${isWeapon ? 'border-primary/50' : 'border-green-500/50'} text-green-100 max-w-lg font-mono`}>
        <DialogHeader>
          <DialogTitle className={`${isWeapon ? 'text-primary' : 'text-green-400'} uppercase tracking-widest font-bold`}>
            {initialItem 
              ? (isWeapon ? 'Inspecionar Arma' : 'Editar Item') 
              : (isWeapon ? 'Adicionar Nova Arma' : 'Novo Item Matricial')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className={`text-xs ${isWeapon ? 'text-primary' : 'text-green-500'} uppercase tracking-widest`}>
              {isWeapon ? 'Nome da Arma' : 'Nome do Equipamento'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full bg-green-950/20 border ${isWeapon ? 'border-primary/30 focus:border-primary' : 'border-green-500/30 focus:border-green-400'} p-2 text-green-100 outline-none transition-colors`}
            />
          </div>

          {!isWeapon && (
            <div className="space-y-2">
              <label className="text-xs text-green-500 uppercase tracking-widest">Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-green-950/20 border border-green-500/30 p-2 text-green-100 outline-none focus:border-green-400 transition-colors resize-none"
              />
            </div>
          )}

          {!initialItem?.id && (
            <div className="space-y-2">
              <label className="text-xs text-green-500 uppercase tracking-widest">Classificação</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setType('pocket' as any)}
                  className={`p-2 border flex flex-col items-center justify-center gap-1 transition-colors ${
                    type === 'pocket' as any ? 'bg-green-500/20 border-green-400 text-green-300' : 'border-green-500/30 text-green-700 hover:border-green-500/60'
                  }`}
                >
                  <Box size={16} />
                  <span className="text-[10px] uppercase">Bolsos</span>
                </button>

                <button
                  onClick={() => setType('common')}
                  className={`p-2 border flex flex-col items-center justify-center gap-1 transition-colors ${
                    type === 'common' ? 'bg-green-500/20 border-green-400 text-green-300' : 'border-green-500/30 text-green-700 hover:border-green-500/60'
                  }`}
                >
                  <Box size={16} />
                  <span className="text-[10px] uppercase">Matriz</span>
                </button>

                <button
                  onClick={() => setType('backpack')}
                  className={`p-2 border flex flex-col items-center justify-center gap-1 transition-colors ${
                    type === 'backpack' ? 'bg-green-500/20 border-green-400 text-green-300' : 'border-green-500/30 text-green-700 hover:border-green-500/60'
                  }`}
                >
                  <Briefcase size={16} />
                  <span className="text-[10px] uppercase">Expansão</span>
                </button>
                <button
                  onClick={() => setType('weapon')}
                  className={`p-2 border flex flex-col items-center justify-center gap-1 transition-colors ${
                    type === 'weapon' ? 'bg-primary/20 border-primary text-primary' : 'border-green-500/30 text-green-700 hover:border-primary/60'
                  }`}
                >
                  <Sword size={16} />
                  <span className="text-[10px] uppercase">Arma</span>
                </button>
              </div>
          </div>
          )}

          {renderExtra && renderExtra(type, initialItem?.id || '')}

          {(type === 'common' || type === 'weapon') && (
            <div className="space-y-2 flex flex-col items-center">
              <label className="text-xs text-green-500 uppercase tracking-widest w-full text-left">Geometria (Matriz)</label>
              <p className="text-[10px] text-green-600 w-full text-left mb-2">Clique nos blocos para desenhar o formato do item.</p>
              
              <div className="inline-grid gap-1 bg-green-950/40 p-2 border border-green-500/30" style={{ gridTemplateColumns: `repeat(${MAX_GRID}, minmax(0, 1fr))` }}>
                {shape.map((row, r) =>
                  row.map((isActive, c) => (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleToggleCell(r, c)}
                      className={`w-8 h-8 border transition-all ${
                        isActive 
                          ? 'bg-green-500 border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]' 
                          : 'bg-black/50 border-green-900/50 hover:bg-green-900/30'
                      }`}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {(type === 'backpack' || type === 'quick_draw') && (
            <div className="space-y-2">
              <label className="text-xs text-green-500 uppercase tracking-widest w-full text-left">Dimensões do Recipiente</label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <span className="text-[10px] text-green-600 uppercase block mb-1">Colunas</span>
                  <input
                    type="number"
                    min={1} max={10}
                    value={gridSize.cols}
                    onChange={(e) => setGridSize(prev => ({ ...prev, cols: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-green-950/20 border border-green-500/30 p-2 text-green-100 outline-none text-center"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-green-600 uppercase block mb-1">Linhas</span>
                  <input
                    type="number"
                    min={1} max={10}
                    value={gridSize.rows}
                    onChange={(e) => setGridSize(prev => ({ ...prev, rows: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-green-950/20 border border-green-500/30 p-2 text-green-100 outline-none text-center"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        <DialogFooter className="border-t border-green-500/30 pt-4 flex justify-between w-full">
          {onDelete ? (
            <button
              onClick={onDelete}
              className="px-4 py-2 text-red-500 hover:text-red-400 text-xs uppercase tracking-widest font-bold transition-colors mr-auto flex items-center gap-2"
            >
              <Skull size={14} /> Excluir
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-green-600 hover:text-green-400 text-xs uppercase tracking-widest font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className={`px-6 py-2 text-black text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2 ${
                 isWeapon ? 'bg-primary hover:bg-opacity-80' : 'bg-green-500 hover:bg-green-400'
              }`}
            >
              <Save size={14} /> {initialItem ? 'Salvar' : (isWeapon ? 'Adicionar Arma' : 'Adicionar Item')}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
