import { useState, useEffect, useRef } from 'react';
import anime from 'animejs';
import { ChevronLeft, ChevronRight, Plus, Trash2, Zap, X, Lock } from 'lucide-react';
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
type RitualType = 'dano' | 'aflicao' | 'suporte';
interface RitualVersion {
  name: string;
  circle: string;
  cost: string;
  duration: string;
  resistance: number;
  type: RitualType;
  description: string;
  retained: boolean;
}

interface Ritual {
  id: string;
  versions: RitualVersion[];
  activeVersion: number;
}

interface PokerConjureState {
  ritualId: string;
  turn: number;
}

interface RitualsPanelProps {
  isOpen: boolean;
  showToggle: boolean;
  onToggle: () => void;
  rituals: Ritual[];
  onAddRitual: (ritual: Ritual) => void;
  onUpdateRitual: (id: string, ritual: Ritual) => void;
  onSetRitualVersion: (id: string, activeVersion: number) => void;
  onRemoveRitual: (id: string) => void;
  onConjureRitual: (ritual: Ritual) => void;
  activeConjuration?: PokerConjureState | null;
  onResumeConjuration?: () => void;
  onForceShowdown?: () => void;
  onCancelConjuration?: () => void;
  lastConjuredEffect?: { ritualId: string; effect: string; type: string } | null;
  suspendedConjurations?: Record<string, PokerConjureState>;
  onReleaseRitual?: (ritualId: string) => void;
  onClearLastEffect?: () => void;
}

const RITUAL_TYPES: Array<{ value: RitualType; label: string }> = [
  { value: 'dano', label: 'Dano' },
  { value: 'aflicao', label: 'Aflição' },
  { value: 'suporte', label: 'Suporte' },
];

export default function RitualsPanel({
  isOpen,
  showToggle,
  onToggle,
  rituals,
  onAddRitual,
  onUpdateRitual,
  onSetRitualVersion,
  onRemoveRitual,
  onConjureRitual,
  activeConjuration,
  onResumeConjuration,
  onForceShowdown,
  onCancelConjuration,
  lastConjuredEffect,
  suspendedConjurations = {},
  onReleaseRitual,
  onClearLastEffect,
}: RitualsPanelProps) {
  const [showRitualForm, setShowRitualForm] = useState(false);
  const [selectedRitualId, setSelectedRitualId] = useState<string | null>(null);
  const [newRitual, setNewRitual] = useState<Omit<RitualVersion, 'id'>>({
    name: '',
    circle: '',
    cost: '',
    duration: '',
    resistance: 0,
    type: 'suporte',
    description: '',
    retained: false,
  });

  const [pendingRemoveRitual, setPendingRemoveRitual] = useState<Ritual | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !wrapperRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      // Inclinação muito suave e constante (max 5 graus de inclinação)
      const x = (e.clientX / innerWidth - 0.5) * 10; 
      const y = (e.clientY / innerHeight - 0.5) * -10;

      anime({
        targets: wrapperRef.current,
        rotateX: y,
        rotateY: x,
        duration: 800,
        easing: 'easeOutQuint'
      });
    };

    // Atrasar o início do rastreamento para esperar a animação do menu abrir
    const timeoutId = window.setTimeout(() => {
      window.addEventListener('mousemove', handleMouseMove);
    }, 800);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('mousemove', handleMouseMove);
      if (wrapperRef.current) {
        anime({
          targets: wrapperRef.current,
          rotateX: 0,
          rotateY: 0,
          duration: 1000,
          easing: 'easeOutQuint'
        });
      }
    };
  }, [isOpen]);

  const pendingRemoveRitualName = pendingRemoveRitual
    ? pendingRemoveRitual.versions[pendingRemoveRitual.activeVersion]?.name || 'selecionado'
    : 'selecionado';

  const updateActiveVersion = (ritual: Ritual, updates: Partial<RitualVersion>): Ritual => ({
    ...ritual,
    versions: ritual.versions.map((version, index) =>
      index === ritual.activeVersion ? { ...version, ...updates } : version
    ),
  });

  const getActiveVersion = (ritual: Ritual): RitualVersion => {
    return ritual.versions[ritual.activeVersion] ?? ritual.versions[0];
  };

  const autoResizeTextarea = (target: HTMLTextAreaElement) => {
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  useEffect(() => {
    const textareas = document.querySelectorAll<HTMLTextAreaElement>('[data-ritual-effect-textarea="true"]');
    textareas.forEach((textarea) => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  }, [selectedRitualId, showRitualForm, rituals]);

  const addRitual = () => {
    if (!newRitual.name.trim()) return;

    const newId = Date.now().toString();
    onAddRitual({
      id: newId,
      versions: [
        {
          ...newRitual,
          resistance: Number(newRitual.resistance) || 0,
        },
      ],
      activeVersion: 0,
      slotIndex: selectedSlotIndex !== null ? selectedSlotIndex : undefined,
    });

    setNewRitual({
      name: '',
      circle: '',
      cost: '',
      duration: '',
      resistance: 0,
      type: 'suporte',
      description: '',
      retained: false,
    });
    setShowRitualForm(false);
    setSelectedRitualId(newId);
    setSelectedSlotIndex(null);
  };

  const handleSelectVersion = (ritual: Ritual, targetIndex: number) => {
    if (ritual.activeVersion === targetIndex) return;

    if (targetIndex < ritual.versions.length) {
      onSetRitualVersion(ritual.id, targetIndex);
    } else {
      // Create missing versions up to targetIndex
      const newVersions = [...ritual.versions];
      while (newVersions.length <= targetIndex) {
        newVersions.push({ ...newVersions[newVersions.length - 1] });
      }
      onUpdateRitual(ritual.id, {
        ...ritual,
        versions: newVersions,
        activeVersion: targetIndex,
      });
    }
  };

  const coords = [
    { x: 502, y: 98 },
    { x: 730, y: 166 },
    { x: 881, y: 347 },
    { x: 881, y: 689 },
    { x: 729, y: 870 },
    { x: 501, y: 937 },
    { x: 272, y: 867 },
    { x: 118, y: 689 },
    { x: 116, y: 350 },
    { x: 270, y: 168 }
  ];

  const totalSlots = 10;
  
  // Mapeia os rituais garantindo que rituais antigos assumam as posições vazias disponíveis
  const ritualsWithSlots = rituals.map((r, i) => ({ ...r, slotIndex: r.slotIndex ?? i }));

  const slots = Array.from({ length: totalSlots }).map((_, index) => {
    const coord = coords[index];
    const left = `${(coord.x / 1000) * 100}%`;
    const top = `${(coord.y / 1034) * 100}%`;
    const ritual = ritualsWithSlots.find(r => r.slotIndex === index) || null;
    return { index, left, top, ritual };
  });

  const selectedRitual = rituals.find((r) => r.id === selectedRitualId) || null;

  return (
    <div
      className={`fixed right-0 top-0 h-screen z-50 flex items-center transition-all duration-500 ease-in-out ${
        isOpen ? 'w-[100vw] sm:w-[650px] md:w-[750px] bg-black/60 backdrop-blur-md border-l-2 border-purple-500' : 'w-0 pointer-events-none'
      }`}
    >
      {showToggle && (
        <button
          onClick={onToggle}
          className={`group fixed top-40 z-[60] h-12 w-12 hover:w-40 overflow-hidden bg-black border-2 border-purple-500 hover:bg-purple-500 hover:bg-opacity-10 flex items-center justify-start text-purple-300 transition-all duration-300 pointer-events-auto ${
            isOpen ? 'right-[100vw] sm:right-[650px] md:right-[750px]' : 'right-0'
          }`}
        >
          <span className="flex h-full w-12 flex-shrink-0 items-center justify-center">
            <ChevronLeft size={20} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </span>
          <span className="pr-4 text-sm font-display uppercase tracking-wide whitespace-nowrap opacity-0 -translate-x-2 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            Rituais
          </span>
        </button>
      )}

      {/* Menu do Transe Ativo no topo absoluto da tela/painel */}
      {isOpen && activeConjuration && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/80 border border-purple-500/50 px-6 py-3 rounded-full flex items-center gap-4 shadow-[0_0_20px_rgba(168,85,247,0.4)] backdrop-blur-md z-[70]">
          <span className="text-purple-300 font-display uppercase tracking-wider text-sm flex items-center gap-2">
            <Zap size={14} className="text-purple-400 animate-pulse" /> Transe Ativo
          </span>
          <button
            onClick={onResumeConjuration}
            className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-display uppercase px-3 py-1.5 rounded-sm transition-all shadow-[0_0_10px_rgba(168,85,247,0.4)]"
          >
            Continuar Transe
          </button>
          <button
            onClick={onCancelConjuration}
            className="text-red-400 hover:text-red-300 transition-colors bg-red-950/30 p-1 rounded-full"
            title="Romper Transe (Cancelar)"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Exibição do último efeito conjurado */}
      {isOpen && !activeConjuration && lastConjuredEffect && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/80 border border-purple-500/50 px-6 py-3 rounded flex items-center gap-4 shadow-[0_0_20px_rgba(168,85,247,0.4)] backdrop-blur-md z-[70] max-w-xl text-center">
          <span className="text-purple-300 text-xs">
            Último Transe:{' '}
            {lastConjuredEffect.effect === 'Ruptura' && (
              <strong className="text-red-400">Ruptura - O feitiço falha catastroficamente.</strong>
            )}
            {lastConjuredEffect.effect === 'Padrão' && (
              <strong className="text-white">Padrão - O feitiço funciona na versão básica.</strong>
            )}
            {lastConjuredEffect.effect === 'Discente' && (
              <strong className="text-white">Discente - O feitiço funciona na versão aprimorada.</strong>
            )}
            {lastConjuredEffect.effect === 'Discente Maximizado' && lastConjuredEffect.type === 'dano' && (
              <strong className="text-amber-400">Discente Maximizado (Sobrecarga Bruta) - Aleatoriedade obliterada, valor máximo.</strong>
            )}
            {lastConjuredEffect.effect === 'Discente Maximizado' && lastConjuredEffect.type === 'aflicao' && (
              <strong className="text-amber-400">Discente Maximizado (Decreto Inevitável) - Sem teste de resistência.</strong>
            )}
            {lastConjuredEffect.effect === 'Discente Maximizado' && lastConjuredEffect.type === 'suporte' && (
              <strong className="text-amber-400">Discente Maximizado (Expansão de Domínio) - Escolha: Multiplicação, Projeção ou Propagação.</strong>
            )}
            {lastConjuredEffect.effect === 'Anomalia Narrativa' && (
              <strong className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse">Anomalia Narrativa - O Ritual atinge um patamar além das métricas.</strong>
            )}
          </span>
          {onClearLastEffect && (
            <button
              onClick={onClearLastEffect}
              className="text-purple-400 hover:text-white transition-colors"
              title="Fechar"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {isOpen && (
        <div style={{ perspective: '1000px', aspectRatio: '1000 / 1034' }} className="relative w-[95vw] sm:w-[600px] md:w-[700px] max-h-[90vh] mx-auto flex items-center justify-center">
          
          <div ref={wrapperRef} className="absolute inset-0 w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
            {/* Fundo imagem */}
            <div className="absolute inset-0 pointer-events-none">
              <img
                src="/rituais.png"
                alt="Círculo de Rituais"
                className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
              />
            </div>

            {/* Slots de rituais nas 10 posições */}
          {slots.map((slot) => {
            const isSelected = selectedRitualId === slot.ritual?.id;
            const isRetained = slot.ritual ? getActiveVersion(slot.ritual).retained : false;
            return (
              <div
                key={slot.index}
                className="absolute pointer-events-none"
                style={{ left: slot.left, top: slot.top, transform: 'translate(-50%, -50%)' }}
              >
                <div
                  className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center pointer-events-auto"
                >
                  {slot.ritual ? (
                    <>
                      <button
                        onClick={() => {
                          setSelectedRitualId(slot.ritual.id);
                          setShowRitualForm(false);
                        }}
                        className={`w-full h-full rounded-full border-2 flex flex-col items-center justify-center bg-black/80 hover:bg-purple-900/50 transition-all shadow-[0_0_15px_rgba(0,0,0,0.8)] ${
                          isSelected
                            ? isRetained
                              ? 'border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.8)] scale-110'
                              : 'border-purple-300 shadow-[0_0_25px_rgba(168,85,247,0.8)] scale-110'
                            : isRetained
                              ? 'border-amber-600/80 hover:scale-105 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                              : 'border-purple-500/50 hover:scale-105 hover:border-purple-400'
                        }`}
                      >
                        <span className={`text-[10px] sm:text-xs md:text-sm uppercase font-bold truncate w-full px-2 text-center ${isRetained ? 'text-amber-200' : 'text-purple-200'}`}>
                          {getActiveVersion(slot.ritual).name.substring(0, 10)}
                        </span>
                        <span className={`text-[8px] sm:text-[10px] ${isRetained ? 'text-amber-400' : 'text-purple-400'}`}>
                          {getActiveVersion(slot.ritual).circle ? `${getActiveVersion(slot.ritual).circle.replace('º', '')}º` : '1º'}
                        </span>
                      </button>
                      {isRetained && (
                        <div className="absolute top-0 right-0 bg-amber-500 text-black p-1 rounded-full border border-black shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse pointer-events-none" title="Ritual Retido">
                          <Lock size={10} className="stroke-[3]" />
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedSlotIndex(slot.index);
                        setShowRitualForm(true);
                        setSelectedRitualId(null);
                      }}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-dashed border-purple-500/30 flex items-center justify-center text-purple-500/50 hover:text-purple-300 hover:border-purple-300 hover:bg-purple-900/20 transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </div>

          {/* Cartão Central (Detalhes do Ritual ou Formulário) */}
          {(selectedRitual || showRitualForm) && (
            <div className="absolute w-[280px] sm:w-[340px] max-h-[80%] overflow-y-auto bg-black border-2 border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.5)] p-4 z-10 scrollbar-hide rounded-xl">

              {/* Formulário Novo Ritual */}
              {showRitualForm && (
                <div className="space-y-3 relative">
                  <button onClick={() => setShowRitualForm(false)} className="absolute -top-2 -right-2 text-purple-400 hover:text-white">
                    <X size={16} />
                  </button>
                  <h3 className="text-purple-300 uppercase font-bold text-sm text-center border-b border-purple-500/50 pb-2">Novo Ritual</h3>
                  <div>
                    <label className="text-[9px] text-purple-400 uppercase font-bold block mb-0.5">Nome</label>
                    <input
                      type="text"
                      value={newRitual.name}
                      onChange={(e) => setNewRitual((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-black text-purple-200 text-xs border border-purple-500 p-1.5 outline-none"
                      placeholder="Nome do Ritual"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-purple-400 uppercase font-bold block mb-0.5">Círculo</label>
                      <input
                        type="text"
                        value={newRitual.circle}
                        onChange={(e) => setNewRitual((prev) => ({ ...prev, circle: e.target.value }))}
                        className="w-full bg-black text-purple-200 text-[10px] border border-purple-500 p-1 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-purple-400 uppercase font-bold block mb-0.5">Custo</label>
                      <input
                        type="text"
                        value={newRitual.cost}
                        onChange={(e) => setNewRitual((prev) => ({ ...prev, cost: e.target.value }))}
                        className="w-full bg-black text-purple-200 text-[10px] border border-purple-500 p-1 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-purple-400 uppercase font-bold block mb-0.5">Resistência</label>
                      <input
                        type="number"
                        value={newRitual.resistance}
                        onChange={(e) => setNewRitual((prev) => ({ ...prev, resistance: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-black text-purple-200 text-[10px] border border-purple-500 p-1 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-purple-400 uppercase font-bold block mb-0.5">Duração</label>
                      <input
                        type="text"
                        value={newRitual.duration}
                        onChange={(e) => setNewRitual((prev) => ({ ...prev, duration: e.target.value }))}
                        className="w-full bg-black text-purple-200 text-[10px] border border-purple-500 p-1 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] text-purple-400 uppercase font-bold block mb-0.5">Tipo</label>
                    <div className="flex gap-1">
                      {RITUAL_TYPES.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setNewRitual((prev) => ({ ...prev, type: option.value }))}
                          className={`flex-1 h-6 text-[9px] font-bold uppercase border transition-colors ${
                            newRitual.type === option.value
                              ? 'bg-purple-500 text-black border-purple-500'
                              : 'bg-black text-purple-300 border-purple-500 hover:bg-purple-500/20'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] text-purple-400 uppercase font-bold block mb-0.5">Efeito</label>
                    <textarea
                      value={newRitual.description}
                      onChange={(e) => setNewRitual((prev) => ({ ...prev, description: e.target.value }))}
                      onInput={(e) => autoResizeTextarea(e.currentTarget)}
                      data-ritual-effect-textarea="true"
                      className="w-full bg-black text-purple-200 text-[10px] border border-purple-500 p-1.5 outline-none resize-none overflow-hidden"
                      rows={2}
                    />
                  </div>

                  <button
                    onClick={addRitual}
                    className="w-full bg-purple-500 text-black font-bold py-1.5 hover:bg-purple-400 transition-colors flex items-center justify-center gap-1 text-[10px] uppercase"
                  >
                    <Plus size={12} /> Salvar Ritual
                  </button>
                </div>
              )}

              {/* Detalhes do Ritual Selecionado */}
              {selectedRitual && !showRitualForm && (
                <div className="space-y-3 relative">
                  <button onClick={() => setSelectedRitualId(null)} className="absolute -top-2 -right-2 text-purple-400 hover:text-white">
                    <X size={16} />
                  </button>
                  
                  {/* Cabeçalho do Ritual (Nome) */}
                  <div className="pr-4">
                    <input
                      type="text"
                      value={getActiveVersion(selectedRitual).name}
                      onChange={(e) =>
                        onUpdateRitual(selectedRitual.id, updateActiveVersion(selectedRitual, { name: e.target.value }))
                      }
                      className="w-full bg-transparent text-purple-300 text-sm font-bold uppercase border-b border-transparent focus:border-purple-500 outline-none text-center"
                    />
                  </div>

                  {/* Controle de Versões (Tabs) */}
                  <div className="flex items-center gap-1 my-3">
                    {['Padrão', 'Discente', 'Verdadeiro'].map((label, idx) => (
                      <button
                        key={label}
                        onClick={() => handleSelectVersion(selectedRitual, idx)}
                        className={`flex-1 py-1.5 text-[9px] font-bold uppercase transition-colors border ${
                          selectedRitual.activeVersion === idx
                            ? 'bg-purple-500 text-black border-purple-500'
                            : 'bg-black text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Ações do Ritual */}
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() =>
                        onUpdateRitual(
                          selectedRitual.id,
                          updateActiveVersion(selectedRitual, { retained: !getActiveVersion(selectedRitual).retained })
                        )
                      }
                      className={`h-6 px-3 border border-purple-500 font-bold uppercase text-[9px] transition-colors ${
                        getActiveVersion(selectedRitual).retained
                          ? 'bg-purple-500 text-black shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                          : 'bg-black text-purple-200 hover:bg-purple-500/20'
                      }`}
                    >
                      {getActiveVersion(selectedRitual).retained ? 'Retido' : 'Reter Ritual'}
                    </button>
                    
                    <button
                      onClick={() => setPendingRemoveRitual(selectedRitual)}
                      className="text-purple-400 hover:text-red-400 transition-colors ml-2 flex items-center justify-center h-6 w-6 border border-transparent hover:border-red-500/50 rounded"
                      title="Excluir Ritual"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Grid de Informações */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-purple-400 uppercase font-bold block mb-0.5">Círculo</label>
                        <input
                          type="text"
                          value={getActiveVersion(selectedRitual).circle}
                          onChange={(e) =>
                            onUpdateRitual(selectedRitual.id, updateActiveVersion(selectedRitual, { circle: e.target.value }))
                          }
                          className="w-full bg-black text-purple-200 text-[10px] border border-purple-500/50 p-1.5 outline-none focus:border-purple-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-purple-400 uppercase font-bold block mb-0.5">Custo</label>
                        <input
                          type="text"
                          value={getActiveVersion(selectedRitual).cost}
                          onChange={(e) =>
                            onUpdateRitual(selectedRitual.id, updateActiveVersion(selectedRitual, { cost: e.target.value }))
                          }
                          className="w-full bg-black text-purple-200 text-[10px] border border-purple-500/50 p-1.5 outline-none focus:border-purple-400 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-purple-400 uppercase font-bold block mb-0.5">Duração</label>
                        <input
                          type="text"
                          value={getActiveVersion(selectedRitual).duration}
                          onChange={(e) =>
                            onUpdateRitual(selectedRitual.id, updateActiveVersion(selectedRitual, { duration: e.target.value }))
                          }
                          className="w-full bg-black text-purple-200 text-[10px] border border-purple-500/50 p-1.5 outline-none focus:border-purple-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-purple-400 uppercase font-bold block mb-0.5">Resistência</label>
                        <input
                          type="number"
                          value={getActiveVersion(selectedRitual).resistance}
                          onChange={(e) =>
                            onUpdateRitual(selectedRitual.id, updateActiveVersion(selectedRitual, { resistance: parseInt(e.target.value) || 0 }))
                          }
                          className="w-full bg-black text-purple-200 text-[10px] border border-purple-500/50 p-1.5 outline-none focus:border-purple-400 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] text-purple-400 uppercase font-bold block mb-0.5">Tipo</label>
                      <div className="flex gap-1">
                        {RITUAL_TYPES.map((option) => (
                          <button
                            key={option.value}
                            onClick={() =>
                              onUpdateRitual(selectedRitual.id, updateActiveVersion(selectedRitual, { type: option.value }))
                            }
                            className={`flex-1 h-6 text-[8px] font-bold uppercase border transition-colors ${
                              getActiveVersion(selectedRitual).type === option.value
                                ? 'bg-purple-500 text-black border-purple-500'
                                : 'bg-black text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                  <div>
                    <label className="text-[9px] text-purple-400 uppercase font-bold block mb-0.5">Efeito</label>
                    <textarea
                      value={getActiveVersion(selectedRitual).description}
                      onChange={(e) =>
                        onUpdateRitual(selectedRitual.id, updateActiveVersion(selectedRitual, { description: e.target.value }))
                      }
                      onInput={(e) => autoResizeTextarea(e.currentTarget)}
                      data-ritual-effect-textarea="true"
                      className="w-full bg-black text-purple-200 text-[10px] border border-purple-500/50 p-1.5 outline-none resize-none overflow-hidden"
                      rows={2}
                    />
                  </div>
                </div>

                  {getActiveVersion(selectedRitual).retained && suspendedConjurations[selectedRitual.id] ? (
                    <button
                      onClick={() => {
                        if (onReleaseRitual) onReleaseRitual(selectedRitual.id);
                        setSelectedRitualId(null);
                      }}
                      className="w-full py-1.5 mt-2 font-bold uppercase border transition-colors text-[10px] flex items-center justify-center gap-1 bg-amber-500 text-black border-amber-400 hover:bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    >
                      <Zap size={12} />
                      Liberar Ritual
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onConjureRitual(selectedRitual);
                        setSelectedRitualId(null);
                      }}
                      disabled={!!activeConjuration && activeConjuration.ritualId !== selectedRitual.id}
                      className={`w-full py-1.5 mt-2 font-bold uppercase border transition-colors text-[10px] flex items-center justify-center gap-1 ${
                        activeConjuration && activeConjuration.ritualId !== selectedRitual.id
                          ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                          : 'bg-purple-500 text-black border-purple-400 hover:bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                      }`}
                    >
                      <Zap size={12} />
                      Conjurar Ritual
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <AlertDialog
        open={Boolean(pendingRemoveRitual)}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveRitual(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover ritual?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove permanentemente o ritual {pendingRemoveRitualName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingRemoveRitual) return;
                const ritualId = pendingRemoveRitual.id;
                setPendingRemoveRitual(null);
                if (selectedRitualId === ritualId) {
                  setSelectedRitualId(null);
                }
                onRemoveRitual(ritualId);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
