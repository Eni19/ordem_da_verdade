import React, { useState, useEffect } from 'react';
import { X, Save, Box, Briefcase, Skull, Sword, Shield, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const CATEGORIZED_ICONS = [
  {
    category: 'Armas Brancas',
    icons: [
      { id: 'machado', url: '/armas_png/armas_brancas/Machado.png', name: 'Machado' },
      { id: 'espada', url: '/armas_png/armas_brancas/espada.png', name: 'Espada' },
      { id: 'espada_2', url: '/armas_png/armas_brancas/espada_2.png', name: 'Espada 2' },
      { id: 'faca', url: '/armas_png/armas_brancas/faca.png', name: 'Faca' },
    ]
  },
  {
    category: 'Armas de Fogo',
    icons: [
      { id: 'pistola', url: '/armas_png/armas_de_fogo/Pistola.png', name: 'Pistola' },
      { id: 'fuzil', url: '/armas_png/armas_de_fogo/fuzil.png', name: 'Fuzil' },
      { id: 'escopeta', url: '/armas_png/armas_de_fogo/escopeta.png', name: 'Escopeta' },
      { id: 'sniper', url: '/armas_png/armas_de_fogo/sniper.png', name: 'Sniper' },
      { id: 'municao', url: '/armas_png/armas_de_fogo/Municao.png', name: 'Munição' },
      { id: 'explosivo', url: '/armas_png/armas_de_fogo/explosivo.png', name: 'Explosivo' },
    ]
  },
  {
    category: 'Comuns',
    icons: [
      { id: 'celular', url: '/armas_png/comuns/celular.png', name: 'Celular' },
      { id: 'chaves', url: '/armas_png/comuns/chaves.png', name: 'Chaves' },
      { id: 'distintivo', url: '/armas_png/comuns/distintivo.png', name: 'Distintivo' },
      { id: 'ferramentas', url: '/armas_png/comuns/ferramentas.png', name: 'Ferramentas' },
      { id: 'lanterna', url: '/armas_png/comuns/lanterna.png', name: 'Lanterna' },
    ]
  },
  {
    category: 'Medicina',
    icons: [
      { id: 'bandagem', url: '/armas_png/medicina/bandagem.png', name: 'Bandagem' },
      { id: 'medkit', url: '/armas_png/medicina/medkit.png', name: 'Kit Médico' },
    ]
  },
  {
    category: 'Ocultismo',
    icons: [
      { id: 'componentes', url: '/armas_png/ocultismo/componentes.png', name: 'Componentes' },
      { id: 'rosario', url: '/armas_png/ocultismo/rosario.png', name: 'Rosário' },
    ]
  },
  {
    category: 'Proteção',
    icons: [
      { id: 'protecao', url: '/armas_png/protecao/protecao.png', name: 'Proteção' },
    ]
  }
];

export type InventoryItemType = 'common' | 'dead_weight' | 'backpack' | 'quick_draw' | 'weapon' | 'protection' | 'pocket';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: InventoryItemType;
  shape: boolean[][];
  rotation: 0 | 90 | 180 | 270;
  containerId: string | 'main' | 'pocket' | 'unassigned';
  position: { x: number, y: number } | null;
  panelPosition?: { x: number, y: number };
  gridSize?: { cols: number, rows: number };
  defenseBonus?: number;
  protectionType?: 'light' | 'heavy';
  icon?: string;
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
  const [type, setType] = useState<InventoryItemType>('common');
  const [icon, setIcon] = useState<string | undefined>(undefined);
  const [showIconSelector, setShowIconSelector] = useState(false);
  
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
        setIcon(initialItem.icon);
        setShowIconSelector(!initialItem.id);
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
        setIcon(undefined);
        setShowIconSelector(true);
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
    const finalType = type === 'pocket' ? 'common' : type;
    
    const payload: Partial<InventoryItem> = {
      name,
      description,
      type: finalType,
      shape: finalShape,
      icon,
    };
    
    if (type === 'backpack' || type === 'quick_draw') {
      payload.gridSize = {
        cols: Math.max(1, gridSize.cols),
        rows: Math.max(1, gridSize.rows),
      };
      payload.containerId = 'pocket';
    }
    
    if (type === 'pocket') {
      payload.containerId = 'pocket';
    }
    
    const success = onSave(payload);
    if (success !== false) {
      onClose();
    }
  };

  const isWeapon = type === 'weapon' || type === 'protection';
  
  const filteredIcons = CATEGORIZED_ICONS.filter(cat => {
    if (type === 'weapon') {
      return cat.category === 'Armas Brancas' || cat.category === 'Armas de Fogo';
    }
    if (type === 'protection') {
      return cat.category === 'Proteção';
    }
    return cat.category === 'Comuns' || cat.category === 'Medicina' || cat.category === 'Ocultismo';
  });
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={`bg-black border ${isWeapon ? 'border-primary/50' : 'border-green-500/50'} text-green-100 max-w-5xl font-mono`}
      >
        <DialogHeader className={`${!initialItem?.id ? 'border-b border-green-500/30 pb-4 mb-2' : ''} mr-6`}>
          <DialogTitle className="sr-only">
            {initialItem 
              ? (isWeapon ? 'Inspecionar Equipamento' : 'Editar Item') 
              : (isWeapon ? 'Adicionar Equipamento' : 'Novo Item Matricial')}
          </DialogTitle>
          <div className="flex items-center gap-4">
            <span className={`${isWeapon ? 'text-primary' : 'text-green-500'} uppercase tracking-widest text-xs font-bold whitespace-nowrap`}>
               {isWeapon ? 'Nome do Equipamento:' : 'Nome do Item:'}
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome..."
              className={`flex-1 bg-transparent border-b ${isWeapon ? 'border-primary/50 focus:border-primary text-primary' : 'border-green-500/50 focus:border-green-400 text-green-400'} text-xl px-2 py-1 outline-none transition-colors font-bold tracking-wider`}
            />
          </div>
        </DialogHeader>

        <div className="max-h-[80vh] overflow-y-auto px-2 scrollbar-thin">
          
          {!initialItem?.id && (
            <div className="space-y-2 mb-2">
              <label className="text-xs text-green-500 uppercase tracking-widest w-full text-center block">Classificação do Equipamento</label>
              <div className="flex flex-row justify-center gap-4">
                <button
                  onClick={() => setType('pocket')}
                  className={`p-3 border flex flex-col items-center justify-center gap-2 transition-colors flex-1 max-w-[120px] ${
                    type === 'pocket' ? 'bg-green-500/20 border-green-400 text-green-300' : 'border-green-500/30 text-green-700 hover:border-green-500/60'
                  }`}
                >
                  <Box size={20} />
                  <span className="text-xs uppercase font-bold">Bolsos</span>
                </button>

                <button
                  onClick={() => setType('common')}
                  className={`p-3 border flex flex-col items-center justify-center gap-2 transition-colors flex-1 max-w-[120px] ${
                    type === 'common' ? 'bg-green-500/20 border-green-400 text-green-300' : 'border-green-500/30 text-green-700 hover:border-green-500/60'
                  }`}
                >
                  <Box size={20} />
                  <span className="text-xs uppercase font-bold">Item</span>
                </button>

                <button
                  onClick={() => setType('backpack')}
                  className={`p-3 border flex flex-col items-center justify-center gap-2 transition-colors flex-1 max-w-[120px] ${
                    type === 'backpack' ? 'bg-green-500/20 border-green-400 text-green-300' : 'border-green-500/30 text-green-700 hover:border-green-500/60'
                  }`}
                >
                  <Briefcase size={20} />
                  <span className="text-xs uppercase font-bold">Expansão</span>
                </button>
                <button
                  onClick={() => setType('weapon')}
                  className={`p-3 border flex flex-col items-center justify-center gap-2 transition-colors flex-1 max-w-[120px] ${
                    type === 'weapon' ? 'bg-primary/20 border-primary text-primary' : 'border-green-500/30 text-green-700 hover:border-primary/60'
                  }`}
                >
                  <Sword size={20} />
                  <span className="text-xs uppercase font-bold">Arma</span>
                </button>
                <button
                  onClick={() => setType('protection')}
                  className={`p-3 border flex flex-col items-center justify-center gap-2 transition-colors flex-1 max-w-[120px] ${
                    type === 'protection' ? 'bg-primary/20 border-primary text-primary' : 'border-green-500/30 text-green-700 hover:border-primary/60'
                  }`}
                >
                  <Shield size={20} />
                  <span className="text-xs uppercase font-bold">Proteção</span>
                </button>
              </div>
            </div>
          )}

          {type === 'pocket' ? (
            <div className="space-y-3 py-2">
              <label className="text-xs text-green-500 uppercase tracking-widest block">Descrição do Item de Bolso</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Escreva detalhes, notas ou observações sobre este item de bolso..."
                className="w-full bg-green-950/20 border border-green-500/30 p-3 text-green-100 outline-none focus:border-green-400 transition-colors resize-y min-h-[160px]"
              />
            </div>
          ) : (
            <div className="space-y-6 py-2">
              {renderExtra && (type === 'weapon' || type === 'protection') && (
                <div className="w-full">
                  {renderExtra(type, initialItem?.id || '')}
                </div>
              )}

              {!isWeapon && (
                <div className="space-y-2">
                  <label className="text-xs text-green-500 uppercase tracking-widest">Descrição</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-green-950/20 border border-green-500/30 p-2 text-green-100 outline-none focus:border-green-400 transition-colors resize-none"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left Column: Basic Info & Geometry */}
              <div className="space-y-6">

                {(type === 'common' || type === 'weapon' || type === 'protection') && (
                  <div className="space-y-2">
                    <label className="text-xs text-green-500 uppercase tracking-widest w-full text-left mb-2 block">Geometria (Matriz)</label>
                    
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
                          value={gridSize.cols === 0 ? '' : gridSize.cols}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') setGridSize(prev => ({ ...prev, cols: 0 }));
                            else setGridSize(prev => ({ ...prev, cols: Math.min(10, parseInt(val) || 0) }));
                          }}
                          className="w-full bg-green-950/20 border border-green-500/30 p-2 text-green-100 outline-none text-center"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] text-green-600 uppercase block mb-1">Linhas</span>
                        <input
                          type="number"
                          min={1} max={10}
                          value={gridSize.rows === 0 ? '' : gridSize.rows}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') setGridSize(prev => ({ ...prev, rows: 0 }));
                            else setGridSize(prev => ({ ...prev, rows: Math.min(10, parseInt(val) || 0) }));
                          }}
                          className="w-full bg-green-950/20 border border-green-500/30 p-2 text-green-100 outline-none text-center"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Right Column: Icon Selection & Extra Stats */}
              <div className="space-y-6 h-full flex flex-col">

                {(type === 'common' || type === 'weapon' || type === 'protection') && (
                  <div className="space-y-4">
                    <label className="text-xs text-green-500 uppercase tracking-widest w-full text-center border-b border-green-500/30 pb-1 block">Arte do Item</label>
                    
                    {!showIconSelector ? (
                      <div className="flex flex-col items-center justify-center min-h-[160px] pt-4">
                        <div className="flex flex-col items-center">
                          {icon ? (
                            <div className="w-32 h-32 flex items-center justify-center p-2 bg-black border border-green-500/30 rounded shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                              <img src={icon} alt="Arte selecionada" className="max-w-full max-h-full object-contain drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]" />
                            </div>
                          ) : (
                            <div className="w-32 h-32 flex items-center justify-center p-2 bg-black/50 border border-dashed border-green-500/30 rounded text-green-700 text-xs font-bold uppercase tracking-widest text-center">
                              Sem Arte
                            </div>
                          )}
                          <button
                            onClick={() => setShowIconSelector(true)}
                            className="mt-2 p-2 text-green-600/60 hover:text-green-400 transition-colors"
                            title="Alterar Arte"
                          >
                            <RefreshCw size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <button
                          onClick={() => { setIcon(undefined); setShowIconSelector(false); }}
                          className={`w-full h-8 border rounded flex items-center justify-center transition-all ${
                            !icon ? 'bg-green-500/20 border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-black border-green-900/50 hover:border-green-500/50'
                          }`}
                        >
                          <span className={`text-[10px] uppercase font-bold tracking-widest ${!icon ? 'text-green-300' : 'text-green-600'}`}>Sem Arte</span>
                        </button>

                        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 scrollbar-thin">
                          {filteredIcons.map(cat => (
                            <div key={cat.category} className="space-y-2">
                              <h4 className="text-[10px] text-green-500/70 font-bold uppercase tracking-widest">{cat.category}</h4>
                              <div className="grid grid-cols-4 gap-2 w-full">
                                {cat.icons.map(i => (
                                  <button
                                    key={i.id}
                                    onClick={() => { setIcon(i.url); setShowIconSelector(false); }}
                                    className={`aspect-square border rounded bg-black flex items-center justify-center p-1 transition-all ${
                                      icon === i.url ? 'border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'border-green-900/50 hover:border-green-500/50'
                                    }`}
                                    title={i.name}
                                  >
                                    <img src={i.url} alt={i.name} className="w-full h-full object-contain pointer-events-none" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {(type === 'backpack' || type === 'quick_draw') && (
                  <div className="flex-1 flex flex-col space-y-4">
                    <label className="text-xs text-green-500 uppercase tracking-widest w-full text-left border-b border-green-500/30 pb-1">Pré-Visualização</label>
                    <div className="flex-1 flex justify-center items-center py-6 bg-black/40 border border-green-500/20 rounded-sm overflow-x-auto min-h-[120px]">
                      <div 
                        className="inline-grid gap-1 p-2 bg-green-950/40 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.05)]"
                        style={{ gridTemplateColumns: `repeat(${gridSize.cols || 1}, minmax(0, 1fr))` }}
                      >
                        {Array.from({ length: gridSize.rows * gridSize.cols }).map((_, i) => (
                          <div 
                            key={i} 
                            className="w-8 h-8 bg-black/50 border border-green-900/50"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
              </div>
            </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-green-500/30 pt-4 flex justify-between w-full mt-4">
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
              <Save size={14} /> {initialItem ? 'Salvar' : (isWeapon ? 'Adicionar Equipamento' : 'Adicionar Item')}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

