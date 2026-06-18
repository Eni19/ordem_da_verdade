import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Trash2, Zap } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
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

type RitualType = 'dano' | 'aflicao' | 'utilidade';

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
}

const RITUAL_TYPES: Array<{ value: RitualType; label: string }> = [
  { value: 'dano', label: 'Dano' },
  { value: 'aflicao', label: 'Aflição' },
  { value: 'utilidade', label: 'Utilidade' },
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
}: RitualsPanelProps) {
  const [showRitualForm, setShowRitualForm] = useState(false);
  const [newRitual, setNewRitual] = useState<Omit<RitualVersion, 'id'>>({
    name: '',
    circle: '',
    cost: '',
    duration: '',
    resistance: 0,
    type: 'utilidade',
    description: '',
    retained: false,
  });

  const [pendingRemoveRitual, setPendingRemoveRitual] = useState<Ritual | null>(null);

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

  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});
  const [removingRitualIds, setRemovingRitualIds] = useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const textareas = document.querySelectorAll<HTMLTextAreaElement>('[data-ritual-effect-textarea="true"]');

    textareas.forEach((textarea) => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  }, [collapsedIds, rituals]);

  const addRitual = () => {
    if (!newRitual.name.trim()) return;

    onAddRitual({
      id: Date.now().toString(),
      versions: [
        {
          ...newRitual,
          resistance: Number(newRitual.resistance) || 0,
        },
      ],
      activeVersion: 0,
    });

    setNewRitual({
      name: '',
      circle: '',
      cost: '',
      duration: '',
      resistance: 0,
      type: 'utilidade',
      description: '',
      retained: false,
    });
    setShowRitualForm(false);
  };

  const goToPreviousVersion = (ritual: Ritual) => {
    if (ritual.activeVersion > 0) {
      onSetRitualVersion(ritual.id, ritual.activeVersion - 1);
    }
  };

  const goToNextVersion = (ritual: Ritual) => {
    if (ritual.activeVersion < ritual.versions.length - 1) {
      onSetRitualVersion(ritual.id, ritual.activeVersion + 1);
      return;
    }

    if (ritual.versions.length < 3) {
      const currentVersion = getActiveVersion(ritual);
      const nextVersions = [...ritual.versions, { ...currentVersion }];

      onUpdateRitual(ritual.id, {
        ...ritual,
        versions: nextVersions,
        activeVersion: nextVersions.length - 1,
      });
    }
  };



  return (
    <div className="fixed right-0 top-0 h-screen z-50">
      {showToggle && (
        <button
          onClick={onToggle}
          className={`group fixed top-40 z-[60] h-12 w-12 hover:w-40 overflow-hidden bg-black border-2 border-purple-500 hover:bg-purple-500 hover:bg-opacity-10 flex items-center justify-start text-purple-300 transition-all duration-300 ${
            isOpen ? 'right-[22rem]' : 'right-0'
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

      <div
        className={`h-full bg-black transition-all duration-300 ${
          isOpen ? 'w-[22rem] border-l-2 border-purple-500' : 'w-0 border-l-0'
        }`}
      >
        {isOpen && (
          <ScrollArea className="h-full" style={{ paddingTop: '3rem' }}>
            <div className="p-4 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3 border-b-2 border-purple-500 pb-2">
                  <h3 className="font-display text-lg text-purple-300 uppercase">Rituais</h3>
                  <button
                    onClick={() => setShowRitualForm((prev) => !prev)}
                    className="bg-purple-500 text-black font-bold px-2 py-1 hover:bg-purple-400 transition-colors flex items-center gap-1 text-xs uppercase"
                  >
                    <Plus size={14} />
                    Adicionar
                  </button>
                </div>

                {activeConjuration && (
                  <div className="mb-4 border-2 border-purple-500 bg-purple-900/30 p-3 rounded shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-purple-300 uppercase text-sm">Transe Ativo</h4>
                        <p className="text-xs text-purple-200">
                          {rituals.find(r => r.id === activeConjuration.ritualId)?.versions[0]?.name || 'Ritual'} - Turno {activeConjuration.turn}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={onCancelConjuration} className="p-1 text-red-400 hover:text-red-300 transition-colors" title="Romper Transe (Cancelar)">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-3">
                      <button 
                        onClick={onResumeConjuration}
                        className="w-full py-2 bg-purple-500 text-black font-bold uppercase text-xs hover:bg-purple-400 transition-colors"
                      >
                        {activeConjuration.turn === 3 ? "Concluir Ritual (Showdown)" : "Retomar Transe"}
                      </button>
                      {activeConjuration.turn < 3 && activeConjuration.turn > 1 && (
                        <button 
                          onClick={onForceShowdown}
                          className="w-full py-1.5 border border-purple-500 text-purple-300 font-bold uppercase text-[10px] hover:bg-purple-500/20 transition-colors"
                        >
                          Resolver Imediatamente
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-3 mb-4">
                  {rituals.map((ritual) => {
                    const version = getActiveVersion(ritual);
                    const isCollapsed = Boolean(collapsedIds[ritual.id]);
                    const ritualTypeLabel =
                      version.type === 'dano' ? 'Dano' : version.type === 'aflicao' ? 'Aflição' : 'Utilidade';

                    return (
                      <div
                        key={ritual.id}
                        className={`bg-black border-2 border-purple-500 overflow-hidden max-w-full transition-all duration-300 ease-in-out ${
                          removingRitualIds[ritual.id]
                            ? 'opacity-0 scale-95 max-h-0'
                            : 'opacity-100 scale-100 max-h-[5000px]'
                        }`}
                      >
                        <div
                          className={`flex items-center justify-between gap-3 p-2 max-w-full ${isCollapsed ? 'cursor-pointer' : ''}`}
                          onClick={isCollapsed ? () => toggleCollapse(ritual.id) : undefined}
                        >
                          <div className="min-w-0 flex-1">
                            <div className={`${isCollapsed ? 'text-sm md:text-base' : 'text-[10px]'} text-purple-400 uppercase font-bold`}>Ritual</div>
                            {isCollapsed ? (
                              <div className="text-lg md:text-xl text-purple-200 font-bold uppercase truncate">
                                {version.name || 'Ritual sem nome'}
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={version.name}
                                onChange={(e) =>
                                  onUpdateRitual(
                                    ritual.id,
                                    updateActiveVersion(ritual, { name: e.target.value })
                                  )
                                }
                                className="w-full min-w-0 max-w-full bg-black text-purple-200 text-sm md:text-base font-bold border-b border-purple-500 outline-none uppercase"
                                placeholder="Nome do Ritual"
                              />
                            )}
                            <div className="text-[10px] text-purple-300 uppercase font-bold">
                              {ritualTypeLabel}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCollapse(ritual.id);
                              }}
                              className="h-7 w-7 border border-purple-500 text-purple-300 hover:bg-purple-500 hover:text-black transition-colors flex items-center justify-center"
                              aria-label={isCollapsed ? 'Expandir ritual' : 'Minimizar ritual'}
                            >
                              {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            </button>
                            {isCollapsed && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateRitual(
                                    ritual.id,
                                    updateActiveVersion(ritual, { retained: !version.retained })
                                  );
                                }}
                                className={`h-10 px-3 border-2 font-bold uppercase text-xs transition-colors ${
                                  version.retained
                                    ? 'bg-purple-500 text-black border-purple-500'
                                    : 'bg-black text-purple-200 border-purple-500 hover:bg-purple-500/20'
                                }`}
                              >
                                {version.retained ? 'Retido' : 'Reter Ritual'}
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingRemoveRitual(ritual);
                              }}
                              className="text-purple-400 hover:text-purple-200 transition-colors"
                              aria-label="Remover ritual"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div
                          className={`transition-all duration-500 ease-in-out overflow-hidden ${
                            isCollapsed ? 'max-h-0 opacity-0 -translate-y-1 pointer-events-none' : 'max-h-[1000px] opacity-100'
                          }`}
                        >
                          <div className="p-2 pt-0 space-y-2">
                            <div>
                              <label className="text-[10px] text-purple-400 uppercase font-bold block mb-0.5">Versões</label>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                                  <button
                                    onClick={() => goToPreviousVersion(ritual)}
                                    disabled={ritual.activeVersion === 0}
                                    className="h-6 w-6 border border-purple-500 text-purple-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-500 hover:text-black transition-colors flex items-center justify-center"
                                    aria-label="Versão anterior"
                                  >
                                    <ChevronLeft size={12} />
                                  </button>
                                  <span className="text-[10px] text-purple-300 uppercase font-bold min-w-12 text-center">
                                    {ritual.activeVersion + 1}/3
                                  </span>
                                  <button
                                    onClick={() => goToNextVersion(ritual)}
                                    disabled={ritual.activeVersion === 2 && ritual.versions.length >= 3}
                                    className="h-6 w-6 border border-purple-500 text-purple-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-500 hover:text-black transition-colors flex items-center justify-center"
                                    aria-label="Versão seguinte"
                                  >
                                    <ChevronRight size={12} />
                                  </button>
                                </div>
                                <div className="flex-1 flex justify-center">
                                  <button
                                    onClick={() =>
                                      onUpdateRitual(
                                        ritual.id,
                                        updateActiveVersion(ritual, { retained: !version.retained })
                                      )
                                    }
                                    className={`h-9 px-6 border-2 font-bold uppercase text-xs transition-colors whitespace-nowrap min-w-36 ${
                                      version.retained
                                        ? 'bg-purple-500 text-black border-purple-500'
                                        : 'bg-black text-purple-200 border-purple-500 hover:bg-purple-500/20'
                                    }`}
                                  >
                                    {version.retained ? 'Retido' : 'Reter Ritual'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                              <div>
                                <label className="text-[10px] text-purple-400 uppercase font-bold block mb-0.5">Círculo</label>
                                <input
                                  type="text"
                                  value={version.circle}
                                  onChange={(e) =>
                                    onUpdateRitual(
                                      ritual.id,
                                      updateActiveVersion(ritual, { circle: e.target.value })
                                    )
                                  }
                                  className="w-full bg-black text-purple-200 text-xs border border-purple-500 p-1.5 outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-purple-400 uppercase font-bold block mb-0.5">Custo</label>
                                <input
                                  type="text"
                                  value={version.cost}
                                  onChange={(e) =>
                                    onUpdateRitual(
                                      ritual.id,
                                      updateActiveVersion(ritual, { cost: e.target.value })
                                    )
                                  }
                                  className="w-full bg-black text-purple-200 text-xs border border-purple-500 p-1.5 outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-purple-400 uppercase font-bold block mb-0.5">Resistência</label>
                                <input
                                  type="number"
                                  value={version.resistance}
                                  onChange={(e) =>
                                    onUpdateRitual(
                                      ritual.id,
                                      updateActiveVersion(ritual, {
                                        resistance: parseInt(e.target.value) || 0,
                                      })
                                    )
                                  }
                                  className="w-full bg-black text-purple-200 text-xs border border-purple-500 p-1.5 outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-purple-400 uppercase font-bold block mb-0.5">Duração</label>
                                <input
                                  type="text"
                                  value={version.duration}
                                  onChange={(e) =>
                                    onUpdateRitual(
                                      ritual.id,
                                      updateActiveVersion(ritual, { duration: e.target.value })
                                    )
                                  }
                                  className="w-full bg-black text-purple-200 text-xs border border-purple-500 p-1.5 outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] text-purple-400 uppercase font-bold block mb-0.5">Tipo</label>
                              <div className="grid grid-cols-3 gap-1">
                                {RITUAL_TYPES.map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() =>
                                      onUpdateRitual(ritual.id, updateActiveVersion(ritual, { type: option.value }))
                                    }
                                    className={`h-8 text-xs font-bold uppercase border transition-colors ${
                                      version.type === option.value
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
                              <label className="text-[10px] text-purple-400 uppercase font-bold block mb-0.5">Efeito</label>
                              <textarea
                                value={version.description}
                                onChange={(e) =>
                                  onUpdateRitual(
                                    ritual.id,
                                    updateActiveVersion(ritual, { description: e.target.value })
                                  )
                                }
                                onInput={(e) => autoResizeTextarea(e.currentTarget)}
                                data-ritual-effect-textarea="true"
                                className="w-full bg-black text-purple-200 text-xs border border-purple-500 p-2 outline-none resize-none overflow-hidden"
                                rows={2}
                              />
                            </div>

                            <div>
                              <button
                                onClick={() => onConjureRitual(ritual)}
                                disabled={!!activeConjuration && activeConjuration.ritualId !== ritual.id}
                                className={`w-full py-2 font-bold uppercase border transition-colors text-xs flex items-center justify-center gap-2 ${
                                  activeConjuration && activeConjuration.ritualId !== ritual.id
                                    ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                                    : 'bg-purple-500 text-black border-purple-400 hover:bg-purple-400'
                                }`}
                              >
                                <Zap size={14} />
                                {activeConjuration && activeConjuration.ritualId === ritual.id ? 'Em Transe' : 'Conjurar Ritual'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>



                <div
                  className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    showRitualForm
                      ? 'max-h-[2000px] opacity-100'
                      : 'max-h-0 opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="space-y-2 border border-purple-500 p-2 bg-purple-950/10">
                    <div>
                      <label className="text-[10px] text-purple-400 uppercase font-bold block mb-0.5">Nome</label>
                      <input
                        type="text"
                        value={newRitual.name}
                        onChange={(e) => setNewRitual((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-black text-purple-200 text-sm border border-purple-500 p-2 outline-none"
                        placeholder="Nome do Ritual"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] text-purple-400 uppercase font-bold block mb-0.5">Círculo</label>
                        <input
                          type="text"
                          value={newRitual.circle}
                          onChange={(e) => setNewRitual((prev) => ({ ...prev, circle: e.target.value }))}
                          className="w-full bg-black text-purple-200 text-xs border border-purple-500 p-1.5 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-purple-400 uppercase font-bold block mb-0.5">Custo</label>
                        <input
                          type="text"
                          value={newRitual.cost}
                          onChange={(e) => setNewRitual((prev) => ({ ...prev, cost: e.target.value }))}
                          className="w-full bg-black text-purple-200 text-xs border border-purple-500 p-1.5 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-purple-400 uppercase font-bold block mb-0.5">Resistência</label>
                        <input
                          type="number"
                          value={newRitual.resistance}
                          onChange={(e) =>
                            setNewRitual((prev) => ({
                              ...prev,
                              resistance: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full bg-black text-purple-200 text-xs border border-purple-500 p-1.5 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-purple-400 uppercase font-bold block mb-0.5">Duração</label>
                        <input
                          type="text"
                          value={newRitual.duration}
                          onChange={(e) => setNewRitual((prev) => ({ ...prev, duration: e.target.value }))}
                          className="w-full bg-black text-purple-200 text-xs border border-purple-500 p-1.5 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-purple-400 uppercase font-bold block mb-0.5">Tipo</label>
                      <div className="grid grid-cols-3 gap-1">
                        {RITUAL_TYPES.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setNewRitual((prev) => ({ ...prev, type: option.value }))}
                            className={`h-8 text-xs font-bold uppercase border transition-colors ${
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
                      <label className="text-[10px] text-purple-400 uppercase font-bold block mb-0.5">Efeito</label>
                      <textarea
                        value={newRitual.description}
                        onChange={(e) =>
                          setNewRitual((prev) => ({ ...prev, description: e.target.value }))
                        }
                        onInput={(e) => autoResizeTextarea(e.currentTarget)}
                        data-ritual-effect-textarea="true"
                        className="w-full bg-black text-purple-200 text-sm border border-purple-500 p-2 outline-none resize-none overflow-hidden"
                        rows={2}
                      />
                    </div>

                    <div>
                      <button
                        onClick={() => setNewRitual((prev) => ({ ...prev, retained: !prev.retained }))}
                        className={`h-8 w-full border-2 font-bold uppercase text-xs transition-colors ${
                          newRitual.retained
                            ? 'bg-purple-500 text-black border-purple-500'
                            : 'bg-black text-purple-200 border-purple-500'
                        }`}
                      >
                        Retido {newRitual.retained ? '✓' : ''}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={addRitual}
                        className="flex-1 bg-purple-500 text-black font-bold py-1 hover:bg-purple-400 transition-colors flex items-center justify-center gap-1 text-xs uppercase"
                      >
                        <Plus size={14} />
                        Salvar
                      </button>
                      <button
                        onClick={() => setShowRitualForm(false)}
                        className="flex-1 border border-purple-500 text-purple-300 font-bold py-1 hover:bg-purple-500 hover:text-black transition-colors text-xs uppercase"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
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
                  setRemovingRitualIds((prev) => ({ ...prev, [pendingRemoveRitual.id]: true }));
                  const ritualId = pendingRemoveRitual.id;
                  setPendingRemoveRitual(null);
                  window.setTimeout(() => {
                    onRemoveRitual(ritualId);
                  }, 300);
                }}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
