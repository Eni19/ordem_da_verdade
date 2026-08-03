import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { Shield, ShieldHalf, Wind, Swords } from 'lucide-react';
import type { DefenseType, DefenseEligibility } from '@/utils/activeDefenseLogic';

interface DefensiveReactionOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectReaction: (type: DefenseType) => void;
  defenseEligibility: Record<DefenseType, DefenseEligibility>;
}

const DEFENSE_META: Record<DefenseType, { label: string; description: string; icon: typeof Shield }> = {
  bloqueio: { 
    label: 'Bloqueio', 
    description: 'Apara danos reduzindo os dados do atacante usando Fortitude.',
    icon: ShieldHalf 
  },
  esquiva: { 
    label: 'Esquiva', 
    description: 'Tenta anular o ataque completamente evadindo o golpe.',
    icon: Wind 
  },
  aparar: { 
    label: 'Aparar', 
    description: 'Choque de armas corpo a corpo usando sua Luta para bloquear e contra-atacar.',
    icon: Swords 
  },
};

export function DefensiveReactionOverlay({
  open,
  onOpenChange,
  onSelectReaction,
  defenseEligibility,
}: DefensiveReactionOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const [hoveredType, setHoveredType] = useState<DefenseType | null>(null);
  const [lastHoveredType, setLastHoveredType] = useState<DefenseType | null>(null);

  useEffect(() => {
    if (!open) return;
    setClosing(false);

    if (panelRef.current) {
      anime({
        targets: panelRef.current,
        opacity: [0, 1],
        scale: [0.94, 1],
        duration: 150,
        easing: 'easeOutExpo',
      });
      anime({
        targets: '.reaction-title',
        opacity: [0, 1],
        translateX: [-40, 0],
        duration: 250,
        delay: 50,
        easing: 'easeOutExpo',
      });
      anime({
        targets: '.def-reaction-btn',
        opacity: [0, 1],
        translateX: [20, 0],
        duration: 200,
        delay: anime.stagger(30, { start: 50 }),
        easing: 'easeOutExpo',
      });
    }
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    if (!panelRef.current) {
      onOpenChange(false);
      return;
    }
    anime({
      targets: panelRef.current,
      opacity: [1, 0],
      scale: [1, 0.96],
      duration: 150,
      easing: 'easeInExpo',
      complete: () => onOpenChange(false),
    });
  };

  const handleSelect = (type: DefenseType, target: HTMLElement) => {
    if (closing || !defenseEligibility[type].eligible) return;
    setClosing(true);

    anime({
      targets: target,
      scale: [1, 1.1],
      backgroundColor: ['rgba(0,0,0,0)', 'rgba(56, 189, 248, 0.2)'],
      duration: 200,
      easing: 'easeOutExpo',
    });

    anime({
      targets: panelRef.current,
      opacity: [1, 0],
      scale: [1, 1.05],
      duration: 400,
      delay: 150,
      easing: 'easeInExpo',
      complete: () => {
        onSelectReaction(type);
        onOpenChange(false);
        setClosing(false);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center gap-12 lg:gap-24 p-4 overflow-hidden">
      
      <div className="hidden lg:flex flex-col justify-center items-end reaction-title opacity-0 pointer-events-none select-none max-w-xl shrink-0">
        <h1 className="text-7xl xl:text-[7.5rem] font-display text-sky-400 uppercase tracking-tighter font-black leading-none drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">
          REAÇÃO
        </h1>
        <div className="h-1 w-32 bg-sky-400/80 mt-4 mb-4 rounded-full transition-all duration-300 mr-2" />
        <div 
          key={lastHoveredType ?? 'default'}
          className="min-h-[8rem] animate-in fade-in duration-300 flex flex-col items-end gap-2 mr-2 text-right"
        >
          {lastHoveredType ? (
            <>
              <h3 className="text-sky-300 font-display text-2xl uppercase tracking-widest">{DEFENSE_META[lastHoveredType].label}</h3>
              <p className="text-sky-200/90 font-mono text-sm max-w-sm uppercase tracking-widest leading-relaxed">
                {DEFENSE_META[lastHoveredType].description}
              </p>
            </>
          ) : (
            <h2 className="text-3xl font-mono text-sky-300 uppercase tracking-widest opacity-80">
              DEFENSIVA
            </h2>
          )}
        </div>
      </div>

      <div
        ref={panelRef}
        className="relative w-full max-w-md flex flex-col items-center opacity-0 shrink-0"
      >
        <div className="flex items-center justify-between w-full mb-6">
          <h3 className="font-display text-lg text-sky-400 uppercase tracking-widest lg:hidden">
            Reação Defensiva
          </h3>
          <button
            onClick={handleClose}
            className="text-xs px-2 py-1 border border-sky-400/50 text-sky-400 hover:bg-sky-400 hover:text-black transition-colors uppercase font-bold z-10 ml-auto"
          >
            Cancelar
          </button>
        </div>

        <div className="flex flex-col gap-4 w-full justify-center">
          {(Object.keys(DEFENSE_META) as DefenseType[]).map((type) => {
            const { label, description, icon: Icon } = DEFENSE_META[type];
            const { eligible, reason } = defenseEligibility[type];
            const isHovered = hoveredType === type;

            return (
              <button
                key={type}
                type="button"
                disabled={!eligible || closing}
                onClick={(e) => handleSelect(type, e.currentTarget)}
                onMouseEnter={() => {
                  setHoveredType(type);
                  setLastHoveredType(type);
                }}
                onMouseLeave={() => setHoveredType(null)}
                onFocus={() => {
                  setHoveredType(type);
                  setLastHoveredType(type);
                }}
                onBlur={() => setHoveredType(null)}
                className={`def-reaction-btn relative flex items-center p-4 sm:p-6 border-2 transition-all w-full overflow-hidden text-left ${
                  eligible
                    ? 'border-sky-500/50 hover:border-sky-400 bg-black/60 hover:bg-sky-950/40 cursor-pointer'
                    : 'border-slate-800/50 bg-black/30 cursor-not-allowed opacity-50'
                }`}
              >
                {/* Efeito de brilho de fundo quando elegível */}
                {eligible && isHovered && (
                  <div className="absolute inset-0 bg-sky-400/10 animate-pulse pointer-events-none" />
                )}

                <div className="flex-shrink-0 mr-6">
                  <Icon 
                    size={42} 
                    className={`transition-transform duration-300 ${eligible && isHovered ? 'scale-110 text-sky-300' : 'text-slate-500'}`} 
                  />
                </div>
                
                <div className="flex flex-col flex-1 justify-center">
                  <h3 className={`font-display text-2xl uppercase tracking-wider ${eligible ? 'text-sky-400' : 'text-slate-500'}`}>
                    {label}
                  </h3>
                </div>

                {!eligible && reason && (
                  <div className="absolute top-2 right-2 text-right text-[9px] text-red-400/80 uppercase tracking-widest font-bold px-2 max-w-[120px]">
                    {reason}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
