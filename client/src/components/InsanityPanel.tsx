import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, Trash2, Plus } from 'lucide-react';
import anime from 'animejs';
import TextMorph from './TextMorph';

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

type TraumaType = 'motor' | 'estrutural' | 'sensorial' | 'visceral';

interface Trauma {
  id: string;
  type: TraumaType | null;
}

const TRAUMA_TYPES: { key: TraumaType; label: string; image: string; description: string }[] = [
  {
    key: 'motor',
    label: 'Trauma Motor',
    image: '/traumas/Trauma%20Motor.png',
    description: 'Pernas, joelhos e locomoção. A falha resulta em tropeços, lentidão ou em ficar ancorado.',
  },
  {
    key: 'estrutural',
    label: 'Trauma Estrutural',
    image: '/traumas/Trauma%20Estrutural.png',
    description: 'Tronco, costelas, braços. A falha resulta em soltar objetos pesados, asfixia ou perda de postura defensiva.',
  },
  {
    key: 'sensorial',
    label: 'Trauma Sensorial',
    image: '/traumas/Trauma%20Sensorial.png',
    description: 'Cabeça, visão, audição. A falha resulta em vertigem, desorientação e perda de reflexos rápidos.',
  },
  {
    key: 'visceral',
    label: 'Trauma Visceral',
    image: '/traumas/Trauma%20Visceral.png',
    description: 'Órgãos e sangue. A falha resulta em náusea incapacitante, hemorragia visível e exaustão extrema.',
  },
];

const TRAUMA_INFO: Record<TraumaType, typeof TRAUMA_TYPES[number]> = TRAUMA_TYPES.reduce(
  (acc, t) => ({ ...acc, [t.key]: t }),
  {} as Record<TraumaType, typeof TRAUMA_TYPES[number]>
);

const RISK_MARGIN_LABELS = [
  'Ileso — consequência ruim apenas no 1.',
  '1 Trauma — consequência ruim entre 1 e 5.',
  '2 Traumas — consequência ruim entre 1 e 10.',
  '3 Traumas — consequência ruim entre 1 e 15.',
];

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
  traumas: Trauma[];
  onTraumaAdd: (type?: TraumaType) => void;
  onTraumaSetType: (id: string, type: TraumaType) => void;
  onTraumaRemove: (id: string) => void;
}

function DraggableFearTag({ tag, onOpen, index, onDragMove, isOpen }: { tag: ActiveFearTag; onOpen: (id: string) => void; index: number; onDragMove?: (x: number, y: number) => void; isOpen?: boolean }) {
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
          className="relative z-10 w-full h-full flex items-center justify-center"
          title={tag.effectName || (tag as any).label || ''}
          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
        >
            <TextMorph 
              key={isOpen ? 'open' : 'closed'}
              words={((tag.effectName || (tag as any).label || '').replace(/^(\d+º?|dm[12]|[\s-:])+/gi, '').trim())}
              color="#f4f4f5" 
              font={{ fontFamily: "HomeVideo, sans-serif", fontSize: '13px', fontWeight: 'normal', textAlign: 'center', letterSpacing: '0.05em', textTransform: 'uppercase' }}
            />
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
  traumas,
  onTraumaAdd,
  onTraumaSetType,
  onTraumaRemove,
}: InsanityPanelProps) {
  const [showInsanityForm, setShowInsanityForm] = useState(false);
  const [newInsanityName, setNewInsanityName] = useState('');
  const [newInsanityDesc, setNewInsanityDesc] = useState('');
  const [newInsanityType, setNewInsanityType] = useState<Insanity['type']>('fobia');
  const [showTraumaPopup, setShowTraumaPopup] = useState(false);
  const [lastTriggeredTraumaId, setLastTriggeredTraumaId] = useState<string | null>(null);
  const fearListRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nullTrauma = traumas.find(t => t.type === null);
    if (nullTrauma && nullTrauma.id !== lastTriggeredTraumaId) {
      setLastTriggeredTraumaId(nullTrauma.id);
      setShowTraumaPopup(true);
    }
  }, [traumas, lastTriggeredTraumaId]);

  useEffect(() => {
    if (showTraumaPopup && popupRef.current) {
      anime({
        targets: popupRef.current,
        scale: [0.9, 1],
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutBack'
      });
    }
  }, [showTraumaPopup]);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (videoRef.current) {
      // Deixando o novo vídeo mais devagar sem causar travamento extremo
      videoRef.current.playbackRate = 0.7;
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
          className={`group fixed top-32 z-[60] h-16 w-6 hover:w-36 overflow-hidden bg-black border-2 border-orange-500 hover:bg-orange-500 hover:bg-opacity-10 flex items-center justify-start text-orange-300 transition-all duration-300 pointer-events-auto ${isOpen ? 'right-[85vw] sm:right-[34rem]' : 'right-0'
            }`}
        >
          <span className="flex h-full w-5 flex-shrink-0 items-center justify-center">
            <ChevronLeft size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </span>
          <span className="pr-4 text-sm font-display uppercase tracking-wide whitespace-nowrap opacity-0 -translate-x-2 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            Insanidades
          </span>
        </button>
      )}

      {/* Panel */}
      <div
        className={`h-full bg-black overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-black [&::-webkit-scrollbar-thumb]:bg-orange-500 [&::-webkit-scrollbar-thumb]:rounded-full [scrollbar-width:thin] [scrollbar-color:#f97316_black] transition-all duration-300 pointer-events-auto ${isOpen ? 'w-[85vw] sm:w-[34rem] border-l-2 border-orange-500' : 'w-0 border-l-0'
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
                    <DraggableFearTag key={tag.id} tag={tag} onOpen={onOpenFearTagDetails} index={index} isOpen={isOpen} />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Traumas Section */}
          <div>
            <div className="flex items-center justify-between mb-3 border-b-2 border-orange-500 pb-2">
              <h3 className="font-display text-lg text-orange-300 uppercase">Traumas Físicos</h3>
              <button
                onClick={() => setShowTraumaPopup(true)}
                disabled={traumas.length >= 3}
                className="bg-orange-500 text-black font-bold px-2 py-1 hover:bg-orange-400 transition-colors flex items-center gap-1 text-xs uppercase disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-orange-500"
              >
                <Plus size={14} />
                Adicionar
              </button>
            </div>

            {traumas.length === 0 ? (
              <div className="text-xs text-orange-400/60 italic">Nenhum trauma ativo.</div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {traumas.map((trauma) => {
                  const info = trauma.type ? TRAUMA_INFO[trauma.type] : null;
                  return (
                    <div key={trauma.id} className="relative group w-40 h-40 flex-shrink-0 bg-orange-950/10">
                      {info ? (
                        <>
                          <img
                            src={info.image}
                            alt={info.label}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <span className="text-orange-300 font-display font-bold uppercase text-center px-2">{info.label}</span>
                          </div>
                          <button
                            onClick={() => onTraumaRemove(trauma.id)}
                            title="Remover trauma"
                            className="absolute top-1 right-1 bg-black/70 text-orange-300 hover:text-orange-100 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                          <div className="text-orange-300 text-[10px] uppercase font-bold text-center">
                            Escolha o tipo
                          </div>
                          <div className="grid grid-cols-2 gap-1 w-full">
                            {TRAUMA_TYPES.map((t) => (
                              <button
                                key={t.key}
                                onClick={() => onTraumaSetType(trauma.id, t.key)}
                                title={t.label}
                                className="text-[9px] px-1 py-1 border border-orange-500 text-orange-300 hover:bg-orange-500 hover:text-black uppercase leading-tight"
                              >
                                {t.label.replace('Trauma ', '')}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => onTraumaRemove(trauma.id)}
                            className="text-orange-400 hover:text-orange-300 text-[9px] underline"
                          >
                            Remover
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Trauma Popup Overlay */}
      {showTraumaPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto" onClick={() => setShowTraumaPopup(false)}>
          <div 
            ref={popupRef}
            className="bg-black border-2 border-orange-500 p-6 max-w-lg w-full relative shadow-[0_0_20px_rgba(249,115,22,0.3)]"
            onClick={e => e.stopPropagation()}
          >
            <h4 className="text-orange-300 font-display text-xl uppercase mb-6 text-center tracking-widest" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              Escolha o Trauma
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {TRAUMA_TYPES.map(t => (
                <button
                  key={t.key}
                  onClick={() => {
                    const nullTrauma = traumas.find(tr => tr.type === null);
                    if (nullTrauma) {
                      onTraumaSetType(nullTrauma.id, t.key);
                    } else {
                      onTraumaAdd(t.key);
                    }
                    setShowTraumaPopup(false);
                  }}
                  className="group relative h-36 border-2 border-orange-500/30 hover:border-orange-500 overflow-hidden transition-all duration-300"
                >
                  <img src={t.image} alt={t.label} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col items-center justify-end pb-3 opacity-90 group-hover:opacity-100 transition-opacity">
                    <span className="text-orange-300 font-display uppercase font-bold text-sm z-10 text-center px-2">{t.label}</span>
                  </div>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowTraumaPopup(false)} 
              className="absolute top-3 right-3 text-orange-500 hover:text-orange-300 transition-colors"
            >
              <Trash2 size={18} className="rotate-45" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
