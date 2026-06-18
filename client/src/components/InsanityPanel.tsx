import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, Trash2, Plus } from 'lucide-react';
import anime from 'animejs';

interface Insanity {
  id: string;
  name: string;
  description: string;
  type: 'fobia' | 'mania' | 'surto';
  compulsoes?: number;
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
  onInsanityInvoke?: (insanity: Insanity, action?: 'fobia-mestre' | 'fobia-jogador' | 'mania-complicacao' | 'mania-influencia') => void;
  onRollNewFear: () => void;
  onRemoveFearTag: (id: string) => void;
  onOpenFearTagDetails: (id: string) => void;
}

function DraggableFearTag({ tag, onOpen, index, onDragMove }: { tag: ActiveFearTag; onOpen: (id: string) => void; index: number; onDragMove?: (x: number, y: number) => void }) {
  const elRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const mouseStart = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  useEffect(() => {
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
      innerRef.current.style.transform = 'scale(1.1) skewX(-5deg)';
      innerRef.current.style.filter = 'hue-rotate(90deg)';
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - mouseStart.current.x;
    const dy = e.clientY - mouseStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;

    let newX = startPos.current.x + dx;
    let newY = startPos.current.y + dy;

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

    if (onDragMove) onDragMove(pos.current.x, pos.current.y);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    if (elRef.current) {
      elRef.current.releasePointerCapture(e.pointerId);
      elRef.current.style.zIndex = '10';
      elRef.current.style.cursor = 'grab';
    }

    if (innerRef.current) {
      innerRef.current.style.transform = 'scale(1) skewX(0deg)';
      innerRef.current.style.filter = 'none';
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
      className="fear-tag-item absolute z-10 w-[140px] h-[45px]"
    >
      <div
        ref={innerRef}
        className="relative w-full h-full flex flex-col items-center justify-center select-none transition-transform duration-75"
      >
        <div 
          className="fear-text-container relative z-10 text-zinc-100 text-[18px] font-display font-bold uppercase text-center w-full leading-tight" 
          title={tag.effectName}
          style={{ textShadow: '1.5px 0 0 rgba(255, 0, 0, 0.8), -1.5px 0 0 rgba(0, 255, 255, 0.8)' }}
        >
          {tag.effectName.split(' ').map((word, wIdx) => (
            <span key={wIdx} className="inline-block mx-[2px]">
              {word.split('').map((char, cIdx) => (
                <span key={cIdx} className="fear-letter inline-block opacity-0" data-char={char}>{char}</span>
              ))}
            </span>
          ))}
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

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (videoRef.current) {
      // Deixando o novo vídeo mais devagar sem causar travamento extremo
      videoRef.current.playbackRate = 0.7;
    }

    if (fearListRef.current) {
      const texts = fearListRef.current.querySelectorAll('.fear-text-container');
      const letters = fearListRef.current.querySelectorAll('.fear-letter');
      
      anime.remove(texts);
      anime.remove(letters);
      
      if (letters.length > 0) {
        const characters = '!@#$%^&*()_+{}|:<>?~';
        
        anime({
          targets: letters,
          opacity: [0, 1],
          translateY: [10, 0],
          duration: 800,
          delay: anime.stagger(30, {start: 100}),
          easing: 'easeOutExpo',
          update: function(anim) {
            // Efeito Scramble
            letters.forEach((el) => {
              if (anim.progress < 95 && Math.random() > 0.5) {
                el.textContent = characters.charAt(Math.floor(Math.random() * characters.length));
              } else if (anim.progress >= 95) {
                el.textContent = el.getAttribute('data-char') || '';
              }
            });
          },
          complete: function() {
            letters.forEach((el) => {
              el.textContent = el.getAttribute('data-char') || '';
            });
          }
        });
      }

      if (texts.length > 0) {
        // Efeito Glitch constante sutil tipo VHS
        anime({
          targets: texts,
          translateX: () => anime.random(-2, 2),
          translateY: () => anime.random(-1, 1),
          skewX: () => anime.random(-3, 3),
          duration: 100,
          delay: () => anime.random(2000, 5000),
          direction: 'alternate',
          loop: true,
          easing: 'easeInOutQuad'
        });
      }
    }
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
        compulsoes: newInsanityType === 'mania' ? 0 : undefined,
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
                  <div className="mt-2 space-y-1">
                    {insanity.type === 'fobia' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => onInsanityInvoke && onInsanityInvoke(insanity, 'fobia-mestre')}
                          className="flex-1 bg-orange-500 text-black font-bold py-1 uppercase text-[10px] leading-tight hover:bg-orange-400"
                          title="Invocar pelo Mestre: Ganha 1 Esperança e sofre Efeito de Medo"
                        >
                          Invocar (Mestre)
                        </button>
                        <button
                          onClick={() => onInsanityInvoke && onInsanityInvoke(insanity, 'fobia-jogador')}
                          className="flex-1 bg-orange-500 text-black font-bold py-1 uppercase text-[10px] leading-tight hover:bg-orange-400"
                          title="Invocar pelo Jogador: Ganha 2 Esperança e sofre Efeito de Medo"
                        >
                          Invocar (Jogador)
                        </button>
                      </div>
                    )}
                    {insanity.type === 'mania' && (
                      <>
                        <div className="flex justify-between items-center bg-orange-950/30 px-2 py-1 border border-orange-500/50 mb-1">
                          <span className="text-[10px] text-orange-300 uppercase font-bold">Compulsões</span>
                          <div className="flex gap-1">
                            {[0, 1, 2].map((idx) => (
                              <div
                                key={idx}
                                className={`w-3 h-3 border border-orange-500 rounded-full transition-colors ${
                                  (insanity.compulsoes || 0) > idx ? 'bg-orange-500' : 'bg-transparent'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              if (onInsanityInvoke) onInsanityInvoke(insanity, 'mania-complicacao');
                              onToggle();
                            }}
                            className="flex-1 bg-orange-500 text-black font-bold py-1 uppercase text-[10px] leading-tight hover:bg-orange-400"
                            title="Gerou Complicação (Invocar): Ganha 1 Esperança e fecha painel"
                          >
                            Invocar
                          </button>
                          <button
                            onClick={() => onInsanityInvoke && onInsanityInvoke(insanity, 'mania-influencia')}
                            className="w-8 flex-shrink-0 bg-orange-500 text-black font-bold py-1 flex items-center justify-center hover:bg-orange-400"
                            title="Influenciou Ações: Ganha 1 Ponto de Compulsão"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </>
                    )}
                    {insanity.type === 'surto' && (
                      <button
                        onClick={() => onInsanityInvoke && onInsanityInvoke(insanity)}
                        className="w-full bg-orange-500 text-black font-bold py-1 uppercase text-xs hover:bg-orange-400"
                      >
                        Invocar Surto
                      </button>
                    )}
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
                className="bg-zinc-400 text-black font-bold px-2 py-1 hover:bg-zinc-300 transition-colors flex items-center gap-1 text-xs uppercase animate-pulse shadow-[0_0_8px_rgba(161,161,170,0.2)]"
                title="Acionar um novo efeito de medo na roleta"
              >
                <Plus size={14} />
                Acionar Medo
              </button>
            </div>

            <div
              className="relative w-full min-h-[400px] bg-orange-950/5 border border-dashed border-orange-500/30 overflow-hidden"
              ref={fearListRef}
            >
              {/* Rorschach Video Background */}
              <div className="absolute inset-0 z-0 pointer-events-none opacity-50 overflow-hidden flex items-center justify-center">
                <video
                  ref={videoRef}
                  src="/rorschach_2.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="min-w-full min-h-full object-cover mix-blend-screen"
                />
              </div>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.8)_100%)] pointer-events-none z-0"></div>

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
