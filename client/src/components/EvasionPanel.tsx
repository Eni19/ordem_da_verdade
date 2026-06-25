import { useState, useEffect, useRef } from 'react';
import { Settings2, Shield } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import anime from 'animejs';

export type EvasionProtection = 'none' | 'light' | 'heavy';

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
}: EvasionPanelProps) {
  const [configOpen, setConfigOpen] = useState(false);

  const baseEvasion = 7 + agility;
  const totalEvasion = baseEvasion + protectionBonus - evasionPenalty;

  const handleChargeClick = (index: number) => {
    const chargeMask = 1 << index;
    const newCharges = defensiveCharges ^ chargeMask;

    onDefensiveChargesChange(newCharges);
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
    <div className={`card-occult space-y-2 transition-colors relative ${isEvasionAffected || areChargesDisabled ? 'border-purple-500/60 bg-purple-950/20 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : ''}`}>
      {/* Container de partículas aninhado para permitir vazamento controlado sem gerar barras de rolagem */}
      {(isEvasionAffected || areChargesDisabled) && (
        <div 
          className="absolute pointer-events-none overflow-hidden z-20"
          style={{
            left: '-40px',
            top: '-40px',
            right: '-12px',
            bottom: '-12px'
          }}
        >
          <div 
            ref={hexRef} 
            className="absolute pointer-events-none" 
            style={{
              left: '40px',
              top: '40px',
              right: '12px',
              bottom: '12px'
            }}
          />
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 text-center relative z-10">
          <h3 className={`font-display text-sm uppercase ${isEvasionAffected ? 'text-purple-300' : 'text-sky-300'}`}>Evasão</h3>
          <div className={`font-display text-3xl leading-none ${isEvasionAffected ? 'text-purple-300' : 'text-sky-300'}`}>{totalEvasion}</div>
        </div>

        <div className="flex flex-col items-end gap-2 relative z-10">
          <Popover open={configOpen} onOpenChange={setConfigOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="btn-occult h-7 w-7 p-0 flex items-center justify-center opacity-80 hover:opacity-100"
                aria-label="Configurar proteção da evasão"
              >
                <Settings2 size={14} />
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
                          className={`border px-2 py-2 text-xs uppercase transition-all ${
                            areChargesDisabled
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

          <div className="flex gap-2 relative z-10">
            {Array.from({ length: maxDefensiveCharges }).map((_, index) => {
              const isFilled = (defensiveCharges & (1 << index)) !== 0;

              return (
                <button
                  key={index}
                  type="button"
                  disabled={areChargesDisabled}
                  onClick={() => handleChargeClick(index)}
                  className={`flex h-7 w-7 items-center justify-center border transition-all ${
                    areChargesDisabled
                      ? isFilled
                        ? 'border-purple-500 bg-purple-500 text-black cursor-not-allowed'
                        : 'border-purple-500/30 bg-black text-purple-300/50 cursor-not-allowed'
                      : isFilled
                        ? 'border-sky-400 bg-sky-400 text-black'
                        : 'border-sky-400/40 bg-black text-sky-300 hover:border-sky-400 hover:bg-sky-400/10'
                  }`}
                  aria-label={`Definir cargas defensivas em ${index + 1}`}
                >
                  <Shield size={12} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}