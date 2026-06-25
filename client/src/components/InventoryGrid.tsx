import React, { useState, useRef, useEffect } from 'react';
import anime from 'animejs';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: 'common' | 'dead_weight' | 'backpack' | 'quick_draw' | 'weapon' | 'protection';
  shape: boolean[][];
  rotation: 0 | 90 | 180 | 270;
  containerId: string | 'main' | 'pocket' | 'unassigned';
  position: { x: number, y: number } | null;
  panelPosition?: { x: number, y: number };
  gridSize?: { cols: number, rows: number };
  defenseBonus?: number;
  protectionType?: 'light' | 'heavy';
  tags?: { id: string; name: string; description: string }[];
  hasExtraEffect?: boolean;
  extraEffect?: string;
  icon?: string;
}

interface InventoryGridProps {
  containerId: string;
  title: string;
  cols: number;
  rows: number; // Safe rows
  hasOverload: boolean; // Se true, tem + `rows` de sobrecarga vermelha em baixo
  items: InventoryItem[];
  cellSize?: number;
  onItemMove: (itemId: string, targetContainerId: string, position: { x: number, y: number }, rotation: number) => void;
  onItemClick: (item: InventoryItem) => void;
  onItemRightClick: (e: React.MouseEvent, item: InventoryItem) => void;
  onHeaderContextMenu?: (e: React.MouseEvent) => void;
  activeWeaponIds?: string[];
  onEquipDrop?: (itemId: string) => void;
  isCharacterOverloaded?: boolean;
}

// Helper to get actual shape matrix after rotation
export const getRotatedShape = (shape: boolean[][], rotation: number): boolean[][] => {
  let result = shape;
  const turns = (rotation / 90) % 4;
  for (let t = 0; t < turns; t++) {
    const newShape: boolean[][] = [];
    const rows = result.length;
    const cols = result[0].length;
    for (let c = 0; c < cols; c++) {
      const newRow: boolean[] = [];
      for (let r = rows - 1; r >= 0; r--) {
        newRow.push(result[r][c]);
      }
      newShape.push(newRow);
    }
    result = newShape;
  }
  return result;
};

export default function InventoryGrid({
  containerId,
  title,
  cols,
  rows,
  hasOverload,
  items,
  cellSize = 40,
  onItemMove,
  onItemClick,
  onItemRightClick,
  onHeaderContextMenu,
  activeWeaponIds = [],
  onEquipDrop,
  isCharacterOverloaded = false,
}: InventoryGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const totalRows = rows;
  const totalCols = hasOverload ? cols + Math.ceil(cols / 2) : cols;

  useEffect(() => {
    if (isCharacterOverloaded && gridRef.current) {
      anime({
        targets: gridRef.current,
        translateX: [
          { value: -1, duration: 50 },
          { value: 1, duration: 50 },
          { value: -1, duration: 50 },
          { value: 1, duration: 50 },
          { value: 0, duration: 50 },
        ],
        delay: anime.random(0, 1000),
        loop: true,
        endDelay: 2500,
        easing: 'linear'
      });
    } else if (gridRef.current) {
      anime.remove(gridRef.current);
      gridRef.current.style.transform = 'none';
    }
  }, [isCharacterOverloaded]);

  // State para dragging
  const [draggedItem, setDraggedItem] = useState<InventoryItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentDragPos, setCurrentDragPos] = useState({ x: 0, y: 0 }); // Em pixels
  const [dragRotation, setDragRotation] = useState<number>(0);
  const dragRef = useRef<HTMLDivElement>(null);

  const [clickStartPos, setClickStartPos] = useState({ x: 0, y: 0 });

  const shakeRef = useRef({
    lastX: 0,
    direction: 0,
    count: 0,
    lastTime: 0,
    lastRotateTime: 0
  });

  // Track pointer up/move globally
  useEffect(() => {
    if (!draggedItem) return;

    const handlePointerMove = (e: PointerEvent) => {
      setCurrentDragPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });

      // --- VISUAL FEEDBACK PARA EQUIP SLOTS ---
      if (draggedItem && draggedItem.type === 'weapon') {
        const equipSlots = Array.from(document.querySelectorAll('.equip-slot'));
        const dragRect = dragRef.current?.getBoundingClientRect();

        equipSlots.forEach(slot => {
          const innerDiv = slot.querySelector('.equip-slot-inner');
          if (!innerDiv) return;

          let isHovered = false;
          if (dragRect) {
            const slotRect = slot.getBoundingClientRect();
            const intersectLeft = Math.max(dragRect.left, slotRect.left);
            const intersectRight = Math.min(dragRect.right, slotRect.right);
            const intersectTop = Math.max(dragRect.top, slotRect.top);
            const intersectBottom = Math.min(dragRect.bottom, slotRect.bottom);

            if (intersectRight > intersectLeft && intersectBottom > intersectTop) {
              isHovered = true;
            }
          }

          if (isHovered) {
            innerDiv.classList.add('bg-primary/20', 'border-primary', 'border-solid', 'scale-105', 'text-primary');
            innerDiv.classList.remove('border-dashed', 'border-primary/30', 'text-primary/40');
          } else {
            innerDiv.classList.remove('bg-primary/20', 'border-primary', 'border-solid', 'scale-105', 'text-primary');
            innerDiv.classList.add('border-dashed', 'border-primary/30', 'text-primary/40');
          }
        });
      }

      if (dragRef.current) {
        anime.set(dragRef.current, {
          left: e.clientX - dragOffset.x,
          top: e.clientY - dragOffset.y,
        });
      }
      if (Math.abs(e.clientX - clickStartPos.x) > 3 || Math.abs(e.clientY - clickStartPos.y) > 3) {
        setIsDragging(true);
      }

      // Shake detection logic
      const now = Date.now();
      if (shakeRef.current.lastX === 0) shakeRef.current.lastX = e.clientX;
      const deltaX = e.clientX - shakeRef.current.lastX;

      // Reset if too much time passed between shakes
      if (now - shakeRef.current.lastTime > 350) {
        shakeRef.current.count = 0;
      }

      // Ignore micro tremors
      if (Math.abs(deltaX) > 30) {
        const newDirection = deltaX > 0 ? 1 : -1;
        if (shakeRef.current.direction !== 0 && shakeRef.current.direction !== newDirection) {
          shakeRef.current.count++;

          if (shakeRef.current.count >= 4 && now - shakeRef.current.lastRotateTime > 500) {
            setDragRotation(prev => (prev + 90) % 360);
            shakeRef.current.count = 0;
            shakeRef.current.lastRotateTime = now;
          }
        }
        shakeRef.current.direction = newDirection;
        shakeRef.current.lastTime = now;
        shakeRef.current.lastX = e.clientX;
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      handleDrop(e);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') {
        setDragRotation(prev => (prev + 90) % 360);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [draggedItem, dragOffset, dragRotation, clickStartPos]);

  const handlePointerDown = (e: React.PointerEvent, item: InventoryItem) => {
    e.stopPropagation();
    if (e.button !== 0) return; // Only left click

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setCurrentDragPos({
      x: rect.left,
      y: rect.top
    });
    setClickStartPos({ x: e.clientX, y: e.clientY });
    setDragRotation(item.rotation);
    setIsDragging(false);
    setDraggedItem(item);

    shakeRef.current = {
      lastX: e.clientX,
      direction: 0,
      count: 0,
      lastTime: Date.now(),
      lastRotateTime: 0
    };
  };

  const handleDrop = (e: PointerEvent) => {
    if (!draggedItem) return;

    // Manual intersection check for equip-slots using AABB (Bounding Box) to be 100% reliable
    // This allows dropping large items where the mouse might not be over the slot
    const equipSlots = Array.from(document.querySelectorAll('.equip-slot'));
    let targetEquipSlot: HTMLElement | null = null;

    const dragRect = dragRef.current?.getBoundingClientRect();
    if (dragRect) {
      let maxArea = 0;
      for (const slot of equipSlots) {
        const slotRect = slot.getBoundingClientRect();

        const intersectLeft = Math.max(dragRect.left, slotRect.left);
        const intersectRight = Math.min(dragRect.right, slotRect.right);
        const intersectTop = Math.max(dragRect.top, slotRect.top);
        const intersectBottom = Math.min(dragRect.bottom, slotRect.bottom);

        if (intersectRight > intersectLeft && intersectBottom > intersectTop) {
          const area = (intersectRight - intersectLeft) * (intersectBottom - intersectTop);
          if (area > maxArea) {
            maxArea = area;
            targetEquipSlot = slot as HTMLElement;
          }
        }
      }
    }

    // Always fallback to pointer coordinates if AABB failed
    if (!targetEquipSlot) {
      for (const slot of equipSlots) {
        const rect = slot.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom) {
          targetEquipSlot = slot as HTMLElement;
          break;
        }
      }
    }

    if (targetEquipSlot && draggedItem.type === 'weapon') {
      try {
        if (onEquipDrop) onEquipDrop(draggedItem.id);

        // Animate the drop
        if (dragRef.current) {
          const clone = dragRef.current.cloneNode(true) as HTMLElement;
          document.body.appendChild(clone);
          const rect = targetEquipSlot.getBoundingClientRect();
          anime({
            targets: clone,
            left: rect.left + rect.width / 2 - clone.offsetWidth / 2,
            top: rect.top + rect.height / 2 - clone.offsetHeight / 2,
            scale: 0.1,
            opacity: 0,
            duration: 400,
            easing: 'easeInBack',
            complete: () => clone.remove()
          });
        }
      } catch (e) {
        console.error("Error during equip drop:", e);
      } finally {
        // Clean up hover states just in case
        equipSlots.forEach(slot => {
          const innerDiv = slot.querySelector('.equip-slot-inner');
          if (innerDiv) {
            innerDiv.classList.remove('bg-primary/20', 'border-primary', 'border-solid', 'scale-105', 'text-primary');
            innerDiv.classList.add('border-dashed', 'border-primary/30', 'text-primary/40');
          }
        });

        setDraggedItem(null);
        setIsDragging(false);
      }
      return;
    }

    // Clean up hover states when dropped outside or not a weapon
    equipSlots.forEach(slot => {
      const innerDiv = slot.querySelector('.equip-slot-inner');
      if (innerDiv) {
        innerDiv.classList.remove('bg-primary/20', 'border-primary', 'border-solid', 'scale-105', 'text-primary');
        innerDiv.classList.add('border-dashed', 'border-primary/30', 'text-primary/40');
      }
    });

    // Hide the drag wrapper temporarily to ensure elementsFromPoint gets the underlying elements
    const dragWrapper = dragRef.current;
    if (dragWrapper) dragWrapper.style.display = 'none';

    const elements = Array.from(document.elementsFromPoint(e.clientX, e.clientY));

    if (dragWrapper) dragWrapper.style.display = '';

    const gridEl = elements.find(el => el instanceof HTMLElement && el.classList.contains('inventory-grid')) as HTMLElement;

    if (gridEl) {
      const targetContainerId = gridEl.dataset.containerId!;
      const gridRect = gridEl.getBoundingClientRect();

      const relX = e.clientX - dragOffset.x - gridRect.left;
      const relY = e.clientY - dragOffset.y - gridRect.top;

      let col = Math.round(relX / cellSize);
      let row = Math.round(relY / cellSize);

      // Clamp bounds so it doesn't drop outside
      const movedShape = getRotatedShape(draggedItem.shape, dragRotation);
      const mRows = movedShape.length;
      const mCols = movedShape[0].length;

      const targetCols = parseInt(gridEl.dataset.cols || '10');
      const targetRows = parseInt(gridEl.dataset.rows || '10');

      if (col < 0) col = 0;
      if (row < 0) row = 0;
      if (col + mCols > targetCols) col = targetCols - mCols;
      if (row + mRows > targetRows) row = targetRows - mRows;

      if (col >= 0 && row >= 0) {
        onItemMove(draggedItem.id, targetContainerId, { x: col, y: row }, dragRotation);
      }
    } else {
      // Se soltou fora de qualquer grid, "snap back"
      if (draggedItem.position) {
        onItemMove(draggedItem.id, draggedItem.containerId, draggedItem.position, draggedItem.rotation);
      }
    }

    setDraggedItem(null);
  };

  const getItemColor = (item: InventoryItem) => {
    let hash = 0;
    for (let i = 0; i < item.id.length; i++) {
      hash = item.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    if (item.type === 'weapon') {
      return `var(--primary)`;
    } else if (item.type === 'backpack' || item.type === 'quick_draw') {
      const hue = 30 + (hash % 20);
      return `hsl(${hue}, 80%, 40%)`;
    } else {
      const hue = 130 + (hash % 30);
      return `hsl(${hue}, 70%, 35%)`;
    }
  };

  // Render Item
  const renderItemBlocks = (item: InventoryItem, isDragging: boolean = false) => {
    const rotationToUse = isDragging ? dragRotation : item.rotation;
    const rotatedShape = getRotatedShape(item.shape, rotationToUse);
    const blocks = [];

    const bgColor = getItemColor(item);

    for (let r = 0; r < rotatedShape.length; r++) {
      for (let c = 0; c < rotatedShape[r].length; c++) {
        if (rotatedShape[r][c]) {
          const hasTop = r > 0 && rotatedShape[r - 1][c];
          const hasBottom = r < rotatedShape.length - 1 && rotatedShape[r + 1][c];
          const hasLeft = c > 0 && rotatedShape[r][c - 1];
          const hasRight = c < rotatedShape[r].length - 1 && rotatedShape[r][c + 1];

          blocks.push(
            <div
              key={`${r}-${c}`}
              className="absolute pointer-events-auto cursor-grab active:cursor-grabbing"
              style={{
                width: cellSize,
                height: cellSize,
                left: c * cellSize,
                top: r * cellSize,
                backgroundColor: activeWeaponIds.includes(item.id) 
                  ? 'rgba(234, 179, 8, 0.2)' 
                  : (item.icon ? `color-mix(in srgb, ${bgColor} 30%, transparent)` : bgColor),
                borderWidth: item.icon ? '0px' : '2px',
                boxSizing: 'border-box',
                borderTop: hasTop ? 'none' : '2px solid rgba(0,0,0,0.8)',
                borderBottom: hasBottom ? 'none' : '2px solid rgba(0,0,0,0.8)',
                borderLeft: hasLeft ? 'none' : '2px solid rgba(0,0,0,0.8)',
                borderRight: hasRight ? 'none' : '2px solid rgba(0,0,0,0.8)',
                borderTopLeftRadius: !hasTop && !hasLeft ? '8px' : '0',
                borderTopRightRadius: !hasTop && !hasRight ? '8px' : '0',
                borderBottomLeftRadius: !hasBottom && !hasLeft ? '8px' : '0',
                borderBottomRightRadius: !hasBottom && !hasRight ? '8px' : '0',
              }}
            />
          );
        }
      }
    }
    return blocks;
  };

  return (
    <div className="mb-8 flex flex-col items-center">
      <div
        className="flex items-center justify-between mb-2 w-full"
        style={{ maxWidth: totalCols * cellSize + 4 }}
      >
        <h3
          className="text-green-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2 drag-handle select-none cursor-move"
          onContextMenu={onHeaderContextMenu}
        >
          {title}
        </h3>
      </div>

      <div
        ref={gridRef}
        className={`inventory-grid relative border-2 drag-handle transition-colors duration-500 ${isCharacterOverloaded ? 'bg-red-950/20 border-red-800 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-green-950/20 border-green-800'}`}
        data-container-id={containerId}
        data-cols={totalCols}
        data-rows={totalRows}
        style={{
          width: totalCols * cellSize + 4, // +4 for borders
          height: totalRows * cellSize + 4,
          backgroundImage: `
            linear-gradient(to right, ${isCharacterOverloaded ? 'rgba(220, 38, 38, 0.15)' : 'rgba(34, 197, 94, 0.1)'} 1px, transparent 1px),
            linear-gradient(to bottom, ${isCharacterOverloaded ? 'rgba(220, 38, 38, 0.15)' : 'rgba(34, 197, 94, 0.1)'} 1px, transparent 1px)
          `,
          backgroundSize: `${cellSize}px ${cellSize}px`,
        }}
      >
        {/* Overload Zone Background */}
        {hasOverload && (
          <div
            className="absolute right-0 top-0 bottom-0 bg-red-900/30 pointer-events-none flex items-center justify-center overflow-hidden"
            style={{ width: Math.ceil(cols / 2) * cellSize }}
          >
            <span className="text-red-500/20 font-display font-black text-xl md:text-2xl uppercase tracking-[0.2em] select-none pointer-events-none whitespace-normal text-center leading-tight">
              SOBRE<br />CARGA
            </span>
          </div>
        )}
        {hasOverload && (
          <div
            className="absolute top-0 bottom-0 border-l-2 border-red-500 pointer-events-none shadow-[0_0_10px_rgba(239,68,68,0.5)]"
            style={{ left: cols * cellSize }}
          />
        )}

        {/* Itens */}
        {items.map(item => {
          if (!item.position) return null;
          const isDraggingThis = item.id === draggedItem?.id && isDragging;

          const rotatedShape = getRotatedShape(item.shape, item.rotation);
          const mRows = rotatedShape.length;
          const mCols = rotatedShape[0].length;

          // Verificar se é um retângulo perfeito (ou quadrado)
          let isPerfectRectangle = true;
          for (let r = 0; r < mRows; r++) {
            for (let c = 0; c < mCols; c++) {
              if (!rotatedShape[r][c]) {
                isPerfectRectangle = false;
                break;
              }
            }
            if (!isPerfectRectangle) break;
          }

          let cx = 0, cy = 0, isVerticalText = false, maxPixels = 0;

          if (isPerfectRectangle) {
            cx = (mCols - 1) / 2;
            cy = (mRows - 1) / 2;
            isVerticalText = mRows > mCols;
            maxPixels = isVerticalText ? (mRows * cellSize) - 6 : (mCols * cellSize) - 6;
          } else {
            // Lógica do maior eixo para formatos irregulares (L, T, etc)
            let maxRun = 0;
            let bestIsVertical = false;
            let bestIdx = 0;

            for (let c = 0; c < mCols; c++) {
              let run = 0;
              for (let r = 0; r < mRows; r++) { if (rotatedShape[r][c]) run++; }
              if (run > maxRun) { maxRun = run; bestIsVertical = true; bestIdx = c; }
            }
            for (let r = 0; r < mRows; r++) {
              let run = 0;
              for (let c = 0; c < mCols; c++) { if (rotatedShape[r][c]) run++; }
              if (run >= maxRun) { maxRun = run; bestIsVertical = false; bestIdx = r; }
            }

            let startPos = -1, endPos = -1;
            if (bestIsVertical) {
              for (let r = 0; r < mRows; r++) {
                if (rotatedShape[r][bestIdx]) { if (startPos === -1) startPos = r; endPos = r; }
              }
            } else {
              for (let c = 0; c < mCols; c++) {
                if (rotatedShape[bestIdx][c]) { if (startPos === -1) startPos = c; endPos = c; }
              }
            }

            const centerCoord = (startPos + endPos) / 2;
            cx = bestIsVertical ? bestIdx : centerCoord;
            cy = bestIsVertical ? centerCoord : bestIdx;
            isVerticalText = bestIsVertical;
            maxPixels = (maxRun * cellSize) - 6;
          }

          return (
            <div
              key={item.id}
              draggable={false}
              className={`absolute hover:brightness-125 transition-all select-none pointer-events-none ${isDraggingThis ? 'opacity-30' : ''}`}
              style={{
                left: item.position.x * cellSize,
                top: item.position.y * cellSize,
                width: mCols * cellSize,
                height: mRows * cellSize,
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
              onDragStart={(e) => e.preventDefault()}
              onPointerDown={(e) => handlePointerDown(e, item)}
              onClick={(e) => {
                if (Math.abs(e.clientX - clickStartPos.x) < 5 && Math.abs(e.clientY - clickStartPos.y) < 5) {
                  onItemClick(item);
                }
              }}
              onContextMenu={(e) => onItemRightClick(e, item)}
            >
              {item.icon && (
                <svg width="0" height="0" className="absolute pointer-events-none">
                  <defs>
                    <clipPath id={`clip-${item.id}`}>
                      {rotatedShape.map((row, r) =>
                        row.map((isActive, c) =>
                          isActive ? <rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} /> : null
                        )
                      )}
                    </clipPath>
                  </defs>
                </svg>
              )}

              {renderItemBlocks(item)}
              {/* Icon Overlay */}
              {item.icon && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: 0,
                    top: 0,
                    width: mCols * cellSize,
                    height: mRows * cellSize,
                    clipPath: `url(#clip-${item.id})`
                  }}
                >
                  <div
                    className="absolute pointer-events-none flex items-center justify-center"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: (item.rotation === 90 || item.rotation === 270) ? mRows * cellSize : mCols * cellSize,
                      height: (item.rotation === 90 || item.rotation === 270) ? mCols * cellSize : mRows * cellSize,
                      transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                    }}
                  >
                    <img
                      src={item.icon}
                      alt={item.name}
                      className="w-full h-full object-contain opacity-100 drop-shadow-[0_0_8px_rgba(0,0,0,1)]"
                    />
                  </div>
                </div>
              )}

              {/* Item Name Overlay along longest axis */}
              {!item.icon && (
                <div
                  className="absolute pointer-events-none flex items-center justify-center"
                  style={{
                    left: cx * cellSize + cellSize / 2,
                    top: cy * cellSize + cellSize / 2,
                    transform: `translate(-50%, -50%) ${isVerticalText ? 'rotate(-90deg)' : ''}`,
                  }}
                >
                  <span
                    className="text-[10px] font-bold text-white drop-shadow-md text-center block overflow-hidden text-ellipsis whitespace-nowrap"
                    style={{
                      textShadow: '0 0 4px black, 0 0 4px black, 0 0 4px black',
                      maxWidth: maxPixels,
                    }}
                    title={item.name}
                  >
                    {item.name}
                  </span>
                </div>
              )}

              {/* Status de Equipada para Armas */}
              {activeWeaponIds.includes(item.id) && (
                <div className="absolute top-1 right-1 bg-yellow-500 text-black text-[8px] font-bold px-1 rounded shadow z-10 pointer-events-none">
                  EQP
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Item sendo arrastado */}
      {draggedItem && isDragging && (
        <div
          ref={dragRef}
          className="fixed pointer-events-none z-[100] opacity-80 scale-105"
          style={{
            left: currentDragPos.x,
            top: currentDragPos.y,
            width: getRotatedShape(draggedItem.shape, dragRotation)[0].length * cellSize,
            height: getRotatedShape(draggedItem.shape, dragRotation).length * cellSize,
          }}
        >
          {draggedItem.icon && (
            <svg width="0" height="0" className="absolute pointer-events-none">
              <defs>
                <clipPath id={`clip-drag-${draggedItem.id}`}>
                  {getRotatedShape(draggedItem.shape, dragRotation).map((row, r) =>
                    row.map((isActive, c) =>
                      isActive ? <rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} /> : null
                    )
                  )}
                </clipPath>
              </defs>
            </svg>
          )}
          {renderItemBlocks(draggedItem, true)}
          {draggedItem.icon && (() => {
            const mRows = getRotatedShape(draggedItem.shape, dragRotation).length;
            const mCols = getRotatedShape(draggedItem.shape, dragRotation)[0].length;
            return (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: 0,
                  top: 0,
                  width: mCols * cellSize,
                  height: mRows * cellSize,
                  clipPath: `url(#clip-drag-${draggedItem.id})`
                }}
              >
                <div
                  className="absolute pointer-events-none flex items-center justify-center"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: (dragRotation === 90 || dragRotation === 270) ? mRows * cellSize : mCols * cellSize,
                    height: (dragRotation === 90 || dragRotation === 270) ? mCols * cellSize : mRows * cellSize,
                    transform: `translate(-50%, -50%) rotate(${dragRotation}deg)`,
                  }}
                >
                  <img
                    src={draggedItem.icon}
                    alt={draggedItem.name}
                    className="w-full h-full object-contain opacity-100 drop-shadow-[0_0_8px_rgba(0,0,0,1)]"
                  />
                </div>
              </div>
            );
          })()}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/90 px-3 py-1.5 rounded-md text-[10px] text-green-400 whitespace-nowrap font-bold tracking-widest border border-green-500/50 shadow-[0_0_15px_rgba(0,0,0,0.8)]">
            APERTE <span className="text-white">R</span> PARA GIRAR
          </div>
        </div>
      )}
    </div>
  );
}
