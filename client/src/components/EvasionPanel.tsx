import { useState, useEffect, useRef } from 'react';
import { Settings2, Shield, ShieldHalf, Wind, Swords } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import anime from 'animejs';
import type { DefenseType, DefenseEligibility } from '@/utils/activeDefenseLogic';
import { DefensiveReactionOverlay } from '@/components/DefensiveReactionOverlay';

export type EvasionProtection = 'none' | 'light' | 'heavy';

const DEFENSE_META: Record<DefenseType, { label: string; icon: typeof Shield }> = {
  bloqueio: { label: 'Bloqueio', icon: ShieldHalf },
  esquiva: { label: 'Esquiva', icon: Wind },
  aparar: { label: 'Aparar', icon: Swords },
};

interface EvasionPanelProps {
  agility: number;
  protectionBonus: number;
  defensiveCharges: number;
  maxDefensiveCharges: number;
  evasionPenalty?: number;
  isEvasionAffected?: boolean;
  areChargesDisabled?: boolean;
  onDefensiveChargesChange: (value: number) => void;
  onMaxDefensiveChargesChange: (value: number) => void;
  onOpenActiveDefense?: (type: DefenseType) => void;
  defenseEligibility?: Record<DefenseType, DefenseEligibility>;
}

const MAX_POSSIBLE_CHARGES = 4;

export default function EvasionPanel({
  agility,
  protectionBonus,
  defensiveCharges,
  maxDefensiveCharges,
  evasionPenalty = 0,
  isEvasionAffected = false,
  areChargesDisabled = false,
  onDefensiveChargesChange,
  onMaxDefensiveChargesChange,
  onOpenActiveDefense,
  defenseEligibility,
}: EvasionPanelProps) {
  const [configOpen, setConfigOpen] = useState(false);

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [pendingChargeIndex, setPendingChargeIndex] = useState<number | null>(null);

  const baseEvasion = 7 + agility;
  const totalEvasion = baseEvasion + protectionBonus - evasionPenalty;

  const handleChargeClick = (index: number) => {
    const isFilled = (defensiveCharges & (1 << index)) !== 0;
    if (isFilled) {
      setPendingChargeIndex(index);
      setOverlayOpen(true);
    } else {
      const chargeMask = 1 << index;
      onDefensiveChargesChange(defensiveCharges | chargeMask);
    }
  };

  const handleSelectReaction = (type: DefenseType) => {
    if (pendingChargeIndex !== null) {
      const chargeMask = ~(1 << pendingChargeIndex);
      onDefensiveChargesChange(defensiveCharges & chargeMask);
    }
    if (onOpenActiveDefense) {
      onOpenActiveDefense(type);
    }
  };

  // inside EvasionPanel:
  const hexRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((!isEvasionAffected && !areChargesDisabled) || !hexRef.current) return;

    (anime as any).speed = 0.38;

    const createParticle = () => {
      if (!hexRef.current) return;
      const particle = document.createElement('div');
      particle.className = 'absolute w-1 h-1 rounded-full pointer-events-none z-20';

      const border = Math.floor(Math.random() * 4);
      let startX = 0;
      let startY = 0;
      let angle = 0;

      if (border === 0) {
        startX = Math.random() * 100;
        startY = 0;
        angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 3);
      } else if (border === 1) {
        startX = 100;
        startY = Math.random() * 100;
        angle = (Math.random() - 0.5) * (Math.PI / 3);
      } else if (border === 2) {
        startX = Math.random() * 100;
        startY = 100;
        angle = Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 3);
      } else {
        startX = 0;
        startY = Math.random() * 100;
        angle = Math.PI + (Math.random() - 0.5) * (Math.PI / 3);
      }

      particle.style.left = `calc(${startX}% - 2px)`;
      particle.style.top = `calc(${startY}% - 2px)`;

      const colors = ['#c084fc', '#a855f7', '#d946ef', '#e879f9', '#818cf8', '#a78bfa'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.backgroundColor = randomColor;

      hexRef.current.appendChild(particle);

      const distance = 15 + Math.random() * 25;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      anime({
        targets: particle,
        translateX: tx,
        translateY: ty,
        opacity: [0.95, 0],
        scale: [Math.random() * 0.6 + 0.6, Math.random() * 2.0 + 1.0],
        duration: 700 + Math.random() * 800,
        easing: 'easeOutQuad',
        complete: () => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }
      });
    };

    const interval = setInterval(() => {
      createParticle();
    }, 150);

    return () => clearInterval(interval);
  }, [isEvasionAffected, areChargesDisabled]);

  return (
    <div className={`card-occult space-y-2 transition-colors relative group pb-3 px-3 pt-3 ${isEvasionAffected || areChargesDisabled ? 'border-purple-500/60 bg-purple-950/20 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : ''}`}>
      {/* Container de partículas aninhado para permitir vazamento controlado sem gerar barras de rolagem */}
      {(isEvasionAffected || areChargesDisabled) && (
        <div
          className="absolute pointer-events-none overflow-hidden z-20"
          style={{ left: '-40px', top: '-40px', right: '-12px', bottom: '-12px' }}
        >
          <div
            ref={hexRef}
            className="absolute pointer-events-none"
            style={{ left: '40px', top: '40px', right: '12px', bottom: '12px' }}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center pl-1 pr-0.5 relative z-10">
        <h3 className={`font-display text-sm uppercase tracking-widest ${isEvasionAffected ? 'text-purple-300' : 'text-[#ACBFA4]'}`}>
          Evasão
        </h3>
        <Popover open={configOpen} onOpenChange={setConfigOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`flex items-center justify-center w-5 h-5 rounded-sm border transition-all ${isEvasionAffected
                ? 'border-purple-500 bg-purple-500 text-black hover:bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                : 'border-primary bg-primary text-black hover:bg-primary/80 shadow-[0_0_8px_rgba(255,23,68,0.4)]'
                }`}
              aria-label="Configurar proteção da evasão"
              title="Configurar cargas defensivas"
            >
              <Settings2 size={12} className="stroke-[2.5]" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 border-primary bg-black text-white p-3">
            <div className="space-y-3">
              <div className={`font-display text-xs uppercase mb-2 ${areChargesDisabled ? 'text-purple-300' : 'text-primary'}`}>Cargas defensivas</div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: MAX_POSSIBLE_CHARGES }).map((_, index) => {
                  const chargeCount = index + 1;
                  const isActive = chargeCount === maxDefensiveCharges;

                  return (
                    <button
                      key={chargeCount}
                      type="button"
                      disabled={areChargesDisabled}
                      onClick={() => onMaxDefensiveChargesChange(chargeCount)}
                      className={`border px-2 py-2 text-xs uppercase transition-all flex items-center justify-center ${areChargesDisabled
                        ? isActive
                          ? 'border-purple-500 bg-purple-500 text-black'
                          : 'border-purple-500/30 bg-black/70 text-purple-200/60 cursor-not-allowed'
                        : isActive
                          ? 'border-primary bg-primary text-black'
                          : 'border-primary/40 bg-black text-primary hover:border-primary hover:bg-primary/10'
                        }`}
                    >
                      {chargeCount}
                    </button>
                  );
                })}
              </div>
              {areChargesDisabled && <div className="text-[10px] text-purple-200/80 uppercase mt-2">Sem reações ou cargas defensivas</div>}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Main Display HUD */}
      <div className={`relative w-full h-[56px] rounded border ${isEvasionAffected ? 'border-purple-500/30 bg-[#0A050A]' : 'border-[#ACBFA4]/30 bg-[#050805]'} overflow-hidden flex shadow-[inset_0_0_15px_rgba(0,0,0,0.8)] z-10`}>
        {/* Evasion Value */}
        <div className={`w-[35%] flex items-center justify-center border-r ${isEvasionAffected ? 'border-purple-500/30 shadow-[10px_0_15px_-5px_rgba(168,85,247,0.2)]' : 'border-[#ACBFA4]/30 shadow-[10px_0_15px_-5px_rgba(172,191,164,0.2)]'} relative bg-black/60 backdrop-blur-sm`}>
          <div className={`font-display text-4xl leading-none font-bold tracking-tighter ${isEvasionAffected ? 'text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]' : 'text-[#ACBFA4] drop-shadow-[0_0_10px_rgba(172,191,164,0.8)]'}`}>
            {totalEvasion}
          </div>
        </div>

        {/* Defensive Charges HUD */}
        <div className="flex-1 flex flex-col justify-center px-2 py-1.5 gap-1.5 relative bg-black/40">
          <div className="flex gap-1 flex-1 items-stretch">
            {Array.from({ length: maxDefensiveCharges }).map((_, index) => {
              const isFilled = (defensiveCharges & (1 << index)) !== 0;

              return (
                <button
                  key={index}
                  type="button"
                  disabled={areChargesDisabled}
                  onClick={() => handleChargeClick(index)}
                  className={`flex-1 transition-all border relative overflow-hidden group/charge skew-x-[-10deg] ml-1 first:ml-2 ${areChargesDisabled
                    ? isFilled
                      ? 'border-purple-500 bg-purple-500/30 cursor-not-allowed shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                      : 'border-purple-500/30 bg-black cursor-not-allowed'
                    : isFilled
                      ? 'border-[#ACBFA4] bg-[#ACBFA4]/40 hover:bg-[#ACBFA4]/60 shadow-[0_0_10px_rgba(172,191,164,0.5)]'
                      : 'border-[#ACBFA4]/30 bg-black hover:border-[#ACBFA4]/70 hover:bg-[#ACBFA4]/10'
                    }`}
                  title={isFilled ? 'Gastar Carga Defensiva' : 'Recuperar Carga Defensiva'}
                >
                  {isFilled && (
                    <div className={`absolute inset-0 ${isEvasionAffected ? 'bg-purple-400/20' : 'bg-[#ACBFA4]/20'} animate-pulse`} />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center skew-x-[10deg]">
                    {isFilled ? (
                      <Shield size={10} className={isEvasionAffected ? 'text-purple-300 drop-shadow-[0_0_2px_rgba(168,85,247,0.8)]' : 'text-[#ACBFA4] drop-shadow-[0_0_2px_rgba(172,191,164,0.8)]'} />
                    ) : (
                      <div className={`w-1 h-px ${isEvasionAffected ? 'bg-purple-500/40' : 'bg-[#ACBFA4]/40'}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {defenseEligibility && (
        <DefensiveReactionOverlay
          open={overlayOpen}
          onOpenChange={setOverlayOpen}
          onSelectReaction={handleSelectReaction}
          defenseEligibility={defenseEligibility}
        />
      )}
    </div>
  );
}