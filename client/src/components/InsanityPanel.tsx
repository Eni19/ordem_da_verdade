import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Trash2, Plus } from 'lucide-react';
import anime from 'animejs';

interface Insanity {
  id: string;
  name: string;
  description: string;
  type: 'fobia' | 'mania' | 'surto';
}

interface ActiveFearTag {
  id: string;
  effectResult: string;
  effectName: string;
  effectDescription: string;
  effectNarrative: string;
  rollTotal: number;
  bonusApplied: number;
  sourceInsanityId: string;
  sourceInsanityName: string;
}

interface InsanityPanelProps {
  isOpen: boolean;
  showToggle: boolean;
  onToggle: () => void;
  insanities: Insanity[];
  activeFearTags: ActiveFearTag[];
  onInsanityAdd: (insanity: Insanity) => void;
  onInsanityRemove: (id: string) => void;
  onInsanityUpdate: (id: string, insanity: Insanity) => void;
  onInsanityInvoke?: (insanity: Insanity) => void;
  onRollNewFear: () => void;
  onRemoveFearTag: (id: string) => void;
  onOpenFearTagDetails: (id: string) => void;
}

function DraggableFearTag({ tag, onOpen, index }: { tag: ActiveFearTag; onOpen: (id: string) => void; index: number }) {
  const elRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const mouseStart = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  useEffect(() => {
    // Initial staggered position so they don't all overlap
    if (elRef.current) {
      const col = index % 2;
      const row = Math.floor(index / 2);
      pos.current = { x: col * 105 + 10, y: row * 60 + 10 };
      elRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
    }
  }, [index]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    isDragging.current = true;
    hasMoved.current = false;
    mouseStart.current = { x: e.clientX, y: e.clientY };
    startPos.current = { ...pos.current };

    if (elRef.current) {
      elRef.current.setPointerCapture(e.pointerId);
      elRef.current.style.zIndex = '60';
      elRef.current.style.cursor = 'grabbing';
    }

    if (innerRef.current) {
      innerRef.current.style.transform = 'scale(1.05)';
      innerRef.current.style.boxShadow = '0 0 20px rgba(249, 115, 22, 0.4)';
      innerRef.current.style.borderColor = 'rgba(249, 115, 22, 1)';
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - mouseStart.current.x;
    const dy = e.clientY - mouseStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;

    let newX = startPos.current.x + dx;
    let newY = startPos.current.y + dy;

    // Constrain to parent boundaries
    if (elRef.current && elRef.current.parentElement) {
      const parent = elRef.current.parentElement;
      const maxX = parent.clientWidth - elRef.current.clientWidth;
      const maxY = parent.clientHeight - elRef.current.clientHeight;
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
    }

    pos.current = { x: newX, y: newY };

    if (elRef.current) {
      elRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    if (elRef.current) {
      elRef.current.releasePointerCapture(e.pointerId);
      elRef.current.style.zIndex = '10';
      elRef.current.style.cursor = 'grab';
    }

    if (innerRef.current) {
      innerRef.current.style.transform = 'scale(1)';
      innerRef.current.style.boxShadow = '0 0 10px rgba(249, 115, 22, 0.05)';
      innerRef.current.style.borderColor = 'rgba(249, 115, 22, 0.3)';
    }

    if (!hasMoved.current) {
      onOpen(tag.id);
    }
  };

  return (
    <div
      ref={elRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ cursor: 'grab', touchAction: 'none' }}
      className="fear-tag-item absolute z-10 w-28 h-14"
    >
      <div
        ref={innerRef}
        className="fear-tag-content w-full h-full bg-gradient-to-br from-orange-950/80 to-black border border-orange-500/30 rounded p-1.5 flex flex-col items-center justify-center select-none shadow-[0_0_10px_rgba(249,115,22,0.05)] backdrop-blur-sm transition-all duration-200 opacity-0"
      >
        <div className="text-orange-100 text-xs font-display font-bold uppercase text-center line-clamp-2 w-full leading-tight drop-shadow-[0_0_3px_rgba(249,115,22,0.5)]" title={tag.effectName}>
          {tag.effectName}
        </div>
      </div>
    </div>
  );
}

export default function InsanityPanel({
  isOpen,
  showToggle,
  onToggle,
  insanities,
  activeFearTags,
  onInsanityAdd,
  onInsanityRemove,
  onInsanityUpdate,
  onInsanityInvoke,
  onRollNewFear,
  onRemoveFearTag,
  onOpenFearTagDetails,
}: InsanityPanelProps) {
  const [showInsanityForm, setShowInsanityForm] = useState(false);
  const [newInsanityName, setNewInsanityName] = useState('');
  const [newInsanityDesc, setNewInsanityDesc] = useState('');
  const [newInsanityType, setNewInsanityType] = useState<Insanity['type']>('fobia');
  const fearListRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && fearListRef.current) {
      const items = fearListRef.current.querySelectorAll('.fear-tag-content');
      if (items.length > 0) {
        anime({
          targets: items,
          opacity: [0, 1],
          scale: [0.85, 1],
          duration: 800,
          delay: anime.stagger(100),
          easing: 'easeOutElastic(1, .8)',
        });
      }
    }
  }, [isOpen, activeFearTags.length]);

  useEffect(() => {
    if (!isOpen || !canvasRef.current || !fearListRef.current || activeFearTags.length === 0) return;

    let animationId: number;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Nodos em background flutuando pela rede
    const bgNodes = Array.from({ length: 20 }).map(() => ({
      x: Math.random() * (fearListRef.current?.clientWidth || 300),
      y: Math.random() * (fearListRef.current?.clientHeight || 300),
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    }));

    const draw = (time: number) => {
      const parent = fearListRef.current;
      if (!parent) return;
      if (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      bgNodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
      });

      const items = Array.from(parent.querySelectorAll('.fear-tag-item')) as HTMLElement[];
      const tagNodes = items.map(el => {
        const transform = el.style.transform;
        const match = transform.match(/translate\(([^p]+)px,\s*([^p]+)px\)/);
        let x = 0; let y = 0;
        if (match) {
          x = parseFloat(match[1]) + el.clientWidth / 2;
          y = parseFloat(match[2]) + el.clientHeight / 2;
        }
        return { x, y, isTag: true };
      });

      const allNodes = [...tagNodes, ...bgNodes.map(n => ({ ...n, isTag: false }))];

      ctx.lineWidth = 1;

      for (let i = 0; i < allNodes.length; i++) {
        for (let j = i + 1; j < allNodes.length; j++) {
          const dx = allNodes[i].x - allNodes[j].x;
          const dy = allNodes[i].y - allNodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const maxDist = allNodes[i].isTag || allNodes[j].isTag ? 220 : 120;

          if (dist < maxDist) {
            ctx.beginPath();
            ctx.moveTo(allNodes[i].x, allNodes[i].y);
            ctx.lineTo(allNodes[j].x, allNodes[j].y);

            // Firing energy dash
            ctx.setLineDash([4, 8]);
            ctx.lineDashOffset = -time / 30;

            const opacity = Math.max(0, 1 - dist / maxDist);
            const isTagConnection = allNodes[i].isTag && allNodes[j].isTag;
            const isHalfTag = allNodes[i].isTag || allNodes[j].isTag;

            ctx.strokeStyle = isTagConnection
              ? `rgba(249, 115, 22, ${opacity * 0.9})`
              : isHalfTag
                ? `rgba(249, 115, 22, ${opacity * 0.4})`
                : `rgba(249, 115, 22, ${opacity * 0.15})`;
            ctx.stroke();
          }
        }
      }

      tagNodes.forEach(node => {
        const dists = [
          { x: node.x, y: 0, d: node.y },
          { x: node.x, y: canvas.height, d: canvas.height - node.y },
          { x: 0, y: node.y, d: node.x },
          { x: canvas.width, y: node.y, d: canvas.width - node.x }
        ];

        dists.sort((a, b) => a.d - b.d);
        for (let k = 0; k < 2; k++) {
          const wall = dists[k];
          if (wall.d < 200) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(wall.x, wall.y);

            ctx.setLineDash([2, 6]);
            ctx.lineDashOffset = time / 20;

            ctx.strokeStyle = `rgba(249, 115, 22, ${Math.max(0, 1 - wall.d / 200) * 0.6})`;
            ctx.stroke();
          }
        }
      });

      ctx.setLineDash([]);

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animationId);
  }, [isOpen, activeFearTags.length]);

  const autoResizeTextarea = (target: HTMLTextAreaElement) => {
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  const addInsanity = () => {
    if (newInsanityName.trim()) {
      const newInsanity: Insanity = {
        id: Date.now().toString(),
        name: newInsanityName,
        description: newInsanityDesc,
        type: newInsanityType,
      };
      onInsanityAdd(newInsanity);
      setNewInsanityName('');
      setNewInsanityDesc('');
      setNewInsanityType('fobia');
      setShowInsanityForm(false);
    }
  };

  return (
    <div className="fixed right-0 top-0 h-screen z-50 pointer-events-none">
      {/* Toggle Button */}
      {showToggle && (
        <button
          onClick={onToggle}
          className={`group fixed top-28 z-[60] h-12 w-12 hover:w-40 overflow-hidden bg-black border-2 border-orange-500 hover:bg-orange-500 hover:bg-opacity-10 flex items-center justify-start text-orange-300 transition-all duration-300 pointer-events-auto ${isOpen ? 'right-80' : 'right-0'
            }`}
        >
          <span className="flex h-full w-12 flex-shrink-0 items-center justify-center">
            <ChevronLeft size={20} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </span>
          <span className="pr-4 text-sm font-display uppercase tracking-wide whitespace-nowrap opacity-0 -translate-x-2 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            Insanidades
          </span>
        </button>
      )}

      {/* Panel */}
      <div
        className={`h-full bg-black overflow-y-auto transition-all duration-300 pointer-events-auto ${isOpen ? 'w-80 border-l-2 border-orange-500' : 'w-0 border-l-0'
          }`}
      >
        <div className="p-4 space-y-6">
          {/* Insanities Section */}
          <div>
            <div className="flex items-center justify-between mb-3 border-b-2 border-orange-500 pb-2">
              <h3 className="font-display text-lg text-orange-300 uppercase">Insanidades</h3>
              <button
                onClick={() => setShowInsanityForm((prev) => !prev)}
                className="bg-orange-500 text-black font-bold px-2 py-1 hover:bg-orange-400 transition-colors flex items-center gap-1 text-xs uppercase"
              >
                <Plus size={14} />
                Adicionar
              </button>
            </div>

            <div className="space-y-3 mb-4">
              {insanities.map((insanity) => (
                <div key={insanity.id} className="bg-black border-2 border-orange-500 p-2 space-y-1">
                  <div className="flex justify-between items-start">
                    <input
                      type="text"
                      value={insanity.name}
                      onChange={(e) =>
                        onInsanityUpdate(insanity.id, { ...insanity, name: e.target.value })
                      }
                      className="bg-black text-orange-200 text-sm font-bold border-b border-orange-500 outline-none flex-1"
                      placeholder="Nome"
                    />
                    <div className="ml-2 text-[10px] px-2 py-0.5 uppercase font-bold text-orange-300 border border-orange-500 rounded">
                      {insanity.type}
                    </div>
                    <button
                      onClick={() => onInsanityRemove(insanity.id)}
                      className="text-orange-400 hover:text-orange-300 ml-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <textarea
                    value={insanity.description}
                    onChange={(e) =>
                      onInsanityUpdate(insanity.id, { ...insanity, description: e.target.value })
                    }
                    onInput={(e) => autoResizeTextarea(e.currentTarget)}
                    className="w-full bg-black text-orange-200 text-xs border border-orange-500 p-1 outline-none resize-none overflow-hidden"
                    rows={2}
                    placeholder="Descrição"
                  />
                  <div className="mt-2">
                    <button
                      onClick={() => onInsanityInvoke ? onInsanityInvoke(insanity) : window.alert(`Invocando ${insanity.name} (${insanity.type})`)}
                      className="w-full bg-orange-500 text-black font-bold py-1 uppercase text-xs"
                    >
                      Invocar Insanidade
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Insanity */}
            {showInsanityForm && (
              <div className="space-y-2 border border-orange-500 p-2 bg-orange-950/10">
                <input
                  type="text"
                  value={newInsanityName}
                  onChange={(e) => setNewInsanityName(e.target.value)}
                  className="w-full bg-black text-orange-200 text-sm border border-orange-500 p-2 outline-none"
                  placeholder="Nova Insanidade"
                />
                <textarea
                  value={newInsanityDesc}
                  onChange={(e) => setNewInsanityDesc(e.target.value)}
                  onInput={(e) => autoResizeTextarea(e.currentTarget)}
                  className="w-full bg-black text-orange-200 text-sm border border-orange-500 p-2 outline-none resize-none overflow-hidden"
                  rows={2}
                  placeholder="Descrição"
                />
                <div className="flex items-center gap-2 text-xs uppercase font-bold">
                  <div className="text-[10px] text-orange-400">Tipo:</div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setNewInsanityType('fobia')}
                      className={`px-2 py-1 text-xs rounded cursor-pointer ${newInsanityType === 'fobia' ? 'bg-orange-500 text-black border border-orange-500' : 'bg-black text-orange-300 border border-orange-500 hover:bg-orange-500/20'}`}
                    >
                      Fobia
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewInsanityType('mania')}
                      className={`px-2 py-1 text-xs rounded cursor-pointer ${newInsanityType === 'mania' ? 'bg-orange-500 text-black border border-orange-500' : 'bg-black text-orange-300 border border-orange-500 hover:bg-orange-500/20'}`}
                    >
                      Mania
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewInsanityType('surto')}
                      className={`px-2 py-1 text-xs rounded cursor-pointer ${newInsanityType === 'surto' ? 'bg-orange-500 text-black border border-orange-500' : 'bg-black text-orange-300 border border-orange-500 hover:bg-orange-500/20'}`}
                    >
                      Surto
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addInsanity}
                    className="flex-1 bg-orange-500 text-black font-bold py-1 hover:bg-orange-400 transition-colors flex items-center justify-center gap-1 text-xs uppercase"
                  >
                    <Plus size={14} />
                    Salvar
                  </button>
                  <button
                    onClick={() => setShowInsanityForm(false)}
                    className="flex-1 border border-orange-500 text-orange-300 font-bold py-1 hover:bg-orange-500 hover:text-black transition-colors text-xs uppercase"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sanity Section */}
          <div>
            <div className="flex items-center justify-between mb-3 border-b-2 border-orange-500 pb-2">
              <h3 className="font-display text-lg text-orange-300 uppercase">Sanidade</h3>
              <button
                onClick={onRollNewFear}
                className="bg-orange-500 text-black font-bold px-2 py-1 hover:bg-orange-400 transition-colors flex items-center gap-1 text-xs uppercase animate-pulse"
                title="Acionar um novo efeito de medo na roleta"
              >
                <Plus size={14} />
                Acionar Medo
              </button>
            </div>

            <div
              className="relative w-full min-h-[300px] bg-orange-950/5 border border-dashed border-orange-500/30 overflow-hidden"
              ref={fearListRef}
            >
              <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f97316 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

              {activeFearTags.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-orange-400/60 pointer-events-none z-10">
                  Nenhum efeito de medo ativo.
                </div>
              ) : (
                <>
                  {activeFearTags.map((tag, index) => (
                    <DraggableFearTag key={tag.id} tag={tag} onOpen={onOpenFearTagDetails} index={index} />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
