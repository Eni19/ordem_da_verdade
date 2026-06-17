import { Minus, Plus } from 'lucide-react';
import { useEffect, useRef } from 'react';
import anime from 'animejs';

interface FearTagChip {
  id: string;
  label: string;
}

interface VitalStatsProps {
  hp: { current: number; max: number };
  sanity: { current: number; max: number };
  onHpChange: (field: 'current' | 'max', value: number) => void;
  onSanityChange: (field: 'current' | 'max', value: number) => void;
  fearTags?: FearTagChip[];
  onFearTagClick?: (id: string) => void;
}

export default function VitalStats({
  hp,
  sanity,
  onHpChange,
  onSanityChange,
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
        <label className="font-display text-sm text-primary uppercase block">HP</label>
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
        <div className="w-full bg-black border border-primary h-3 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Determinação */}
      <div className="space-y-1">
        <label className="font-display text-sm text-primary uppercase block">Determinação</label>
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
