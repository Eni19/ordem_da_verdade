import { Minus, Plus } from 'lucide-react';
import { useEffect, useRef } from 'react';
import anime from 'animejs';

interface FearTagChip {
  id: string;
  label: string;
}

interface VitalStatsProps {
  hp: { current: number; max: number };
  sanity: { current: number; max: number; degradationLevel?: number };
  onHpChange: (field: 'current' | 'max', value: number) => void;
  onSanityChange: (field: 'current' | 'max' | 'degradationLevel', value: number) => void;
  vitalityCuts?: number;
  onVitalityCutsChange?: (cuts: number) => void;
  fearTags?: FearTagChip[];
  onFearTagClick?: (id: string) => void;
}

export default function VitalStats({
  hp,
  sanity,
  onHpChange,
  onSanityChange,
  vitalityCuts = 0,
  onVitalityCutsChange,
  fearTags = [],
  onFearTagClick,
}: VitalStatsProps) {
  const hpPercent = hp.max > 0 ? (hp.current / hp.max) * 100 : 0;
  const sanityPercent = sanity.max > 0 ? (sanity.current / sanity.max) * 100 : 0;

  const sanityBarRef = useRef<HTMLDivElement>(null);
  const prevSanityRef = useRef(sanity.current);

  useEffect(() => {
    if (sanity.current < prevSanityRef.current && sanityBarRef.current) {
      anime({
        targets: sanityBarRef.current,
        backgroundColor: ['#93c5fd', '#1E3A8A'], // flash light blue when taking mental damage
        duration: 800,
        easing: 'easeOutElastic(1, .8)'
      });
    } else if (sanity.current > prevSanityRef.current && sanityBarRef.current) {
      anime({
        targets: sanityBarRef.current,
        backgroundColor: ['#3b82f6', '#1E3A8A'], // flash stronger blue when healing
        duration: 800,
        easing: 'easeOutExpo'
      });
    }
    prevSanityRef.current = sanity.current;
  }, [sanity.current]);

  return (
    <div className="card-occult space-y-3">
      {/* HP */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="font-display text-sm text-primary uppercase">HP</label>
        </div>
        <div className="flex justify-between items-end w-full">
          <div className="flex gap-1 items-center">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => onHpChange('current', hp.current + 1)}
                className="btn-occult p-0.5 h-6 w-6 flex items-center justify-center"
                aria-label="Aumentar HP atual"
              >
                <Plus size={10} />
              </button>
              <button
                onClick={() => onHpChange('current', Math.max(0, hp.current - 1))}
                className="btn-occult p-0.5 h-6 w-6 flex items-center justify-center"
                aria-label="Diminuir HP atual"
              >
                <Minus size={10} />
              </button>
            </div>
            <input
              type="number"
              value={hp.current}
              onChange={(e) => onHpChange('current', parseInt(e.target.value) || 0)}
              style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
              className="w-12 h-10 bg-input border-2 border-primary text-primary text-center focus:outline-none focus:ring-2 focus:ring-primary text-sm p-1"
              min="0"
            />
            <span className="text-xs text-muted-foreground">/</span>
            <input
              type="number"
              value={hp.max}
              onChange={(e) => onHpChange('max', parseInt(e.target.value) || 0)}
              style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
              className="w-12 h-10 bg-input border-2 border-primary text-primary text-center focus:outline-none focus:ring-2 focus:ring-primary text-sm p-1"
              min="0"
            />
          </div>

          {onVitalityCutsChange && (
            <div
              className="flex items-center justify-end gap-1.5"
              title={`Relógio de Vitalidade: ${vitalityCuts}/3 cortes`}
            >
              <span className="font-display text-[11px] text-primary/80 uppercase tracking-widest font-bold">
                Ferimentos
              </span>
              <div className="flex gap-2 mx-1 items-center">
                {[0, 1, 2].map((i) => {
                  const isFilled = vitalityCuts > i;
                  const isCritical = vitalityCuts === 2 && isFilled;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onVitalityCutsChange(isFilled ? i : i + 1)}
                      aria-label={`Marcar corte ${i + 1} do Relógio de Vitalidade`}
                      className={`relative w-2.5 h-2.5 transform rotate-45 transition-all duration-300 hover:scale-125 ${
                        isFilled 
                          ? (isCritical 
                              ? 'bg-red-600 border border-red-500 shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-pulse' 
                              : 'bg-primary border border-primary shadow-[0_0_5px_rgba(249,115,22,0.6)]')
                          : 'bg-black/40 border border-primary/50 hover:border-primary hover:bg-primary/20'
                      }`}
                    />
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => onVitalityCutsChange(vitalityCuts + 1)}
                className="btn-occult flex items-center justify-center p-0 w-4 h-4"
                aria-label="Adicionar ferimento"
              >
                <Plus size={12} strokeWidth={3} />
              </button>
            </div>
          )}
        </div>

        <div className="w-full bg-black border border-primary h-3 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Determinação */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="font-display text-sm text-primary uppercase block">Determinação</label>
        </div>
        <div className="flex justify-between items-end w-full">
          <div className="flex gap-1 items-center">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => onSanityChange('current', sanity.current + 1)}
                className="btn-occult p-0.5 h-6 w-6 flex items-center justify-center"
                aria-label="Aumentar determinação atual"
              >
                <Plus size={10} />
              </button>
              <button
                onClick={() => onSanityChange('current', Math.max(0, sanity.current - 1))}
                className="btn-occult p-0.5 h-6 w-6 flex items-center justify-center"
                aria-label="Diminuir determinação atual"
              >
                <Minus size={10} />
              </button>
            </div>
            <input
              type="number"
              value={sanity.current}
              onChange={(e) => onSanityChange('current', parseInt(e.target.value) || 0)}
              style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
              className="w-12 h-10 bg-input border-2 border-primary text-primary text-center focus:outline-none focus:ring-2 focus:ring-primary text-sm p-1"
              min="0"
            />
            <span className="text-xs text-muted-foreground">/</span>
            <input
              type="number"
              value={sanity.max}
              onChange={(e) => onSanityChange('max', parseInt(e.target.value) || 0)}
              style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
              className="w-12 h-10 bg-input border-2 border-primary text-primary text-center focus:outline-none focus:ring-2 focus:ring-primary text-sm p-1"
              min="0"
            />
            {fearTags.length > 0 && (
              <div className="ml-1 flex-1 min-w-0 overflow-x-auto">
                <div className="flex gap-1 w-max">
                  {fearTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => onFearTagClick?.(tag.id)}
                      className="px-2 h-7 text-[10px] uppercase border border-purple-500 text-purple-200 bg-purple-950/20 hover:bg-purple-500/20 whitespace-nowrap"
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-1.5">
            <span className="font-display text-[11px] text-purple-400/80 uppercase tracking-widest font-bold">Degradação</span>
            <div className="flex gap-2 mx-1 items-center">
              {[1, 2, 3].map((level) => {
                const isFilled = (sanity.degradationLevel || 0) >= level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onSanityChange('degradationLevel', isFilled && sanity.degradationLevel === level ? level - 1 : level)}
                    title={level === 1 ? 'Estresse Mental' : level === 2 ? 'Fadiga Oculta' : 'Colapso Paranormal'}
                    className={`w-3 h-3 border ${
                      isFilled
                        ? 'bg-purple-600 border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                        : 'bg-black/40 border-purple-900 hover:border-purple-500'
                    } transition-all`}
                  />
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                const current = sanity.degradationLevel || 0;
                if (current < 3) onSanityChange('degradationLevel', current + 1);
              }}
              className="btn-occult flex items-center justify-center p-0 w-4 h-4"
              aria-label="Adicionar nível de degradação"
            >
              <Plus size={12} strokeWidth={3} />
            </button>
          </div>
        </div>

        <div className="w-full bg-black border border-primary h-3 overflow-hidden">
          <div
            ref={sanityBarRef}
            className="h-full transition-all duration-300 bg-[#1E3A8A]"
            style={{ width: `${sanityPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
