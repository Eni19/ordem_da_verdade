import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import hopeUses, {
  HopeUse,
  HOPE_IMAGE_WIDTH,
  HOPE_IMAGE_HEIGHT,
} from '@/data/hope_use';

interface HopeUseOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUse: (use: HopeUse) => void;
}

function spawnParticleBurst(x: number, y: number) {
  const particles: HTMLDivElement[] = [];
  const count = 18;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'hope-particle';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    document.body.appendChild(particle);
    particles.push(particle);
  }

  anime({
    targets: particles,
    translateX: () => anime.random(-140, 140),
    translateY: () => anime.random(-140, 140),
    scale: [1, 0],
    opacity: [1, 0],
    duration: () => anime.random(700, 1100),
    easing: 'easeOutExpo',
    complete: () => particles.forEach((p) => p.remove()),
  });
}

function spawnShockwave(x: number, y: number) {
  const ring = document.createElement('div');
  ring.className = 'hope-shockwave';
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  document.body.appendChild(ring);

  anime({
    targets: ring,
    scale: [0.4, 9],
    opacity: [0.9, 0],
    duration: 700,
    easing: 'easeOutExpo',
    complete: () => ring.remove(),
  });
}

function HopeStamp({ use }: { use: HopeUse }) {
  const stampRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stampRef.current) return;
    anime.remove(stampRef.current);
    anime({
      targets: stampRef.current,
      opacity: [0, 1],
      scale: [1.28, 1],
      duration: 380,
      easing: 'easeOutExpo',
    });
  }, [use.id]);

  return (
    <div
      ref={stampRef}
      className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6 opacity-0"
    >
      <div className="absolute w-64 h-64 rounded-full bg-primary/25 blur-3xl" />
      <span className="relative font-display text-primary text-3xl sm:text-4xl uppercase tracking-widest drop-shadow-[0_0_18px_rgba(255,23,68,0.8)]">
        {use.nome}
      </span>
      <span className="relative mt-2 text-xs font-mono uppercase tracking-[0.3em] text-primary/70">
        Esperança usada
      </span>
    </div>
  );
}

function HopeTooltip({
  hoveredUse,
  index,
}: {
  hoveredUse: HopeUse;
  index: number;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const expandRight = index % 2 === 0;
    if (tooltipRef.current) {
      anime.remove(tooltipRef.current);
      anime({
        targets: tooltipRef.current,
        opacity: [0, 1],
        translateX: expandRight ? [-18, 0] : [18, 0],
        translateY: ['-50%', '-50%'],
        duration: 320,
        easing: 'easeOutQuint',
      });
    }
    if (titleRef.current) {
      anime.remove(titleRef.current);
      anime({
        targets: titleRef.current,
        opacity: [0, 1],
        translateY: [8, 0],
        duration: 380,
        easing: 'easeOutQuad',
      });
    }
  }, [hoveredUse.id, index]);

  const expandRight = index % 2 === 0;
  const leftPct = (hoveredUse.coord.x / HOPE_IMAGE_WIDTH) * 100;
  const topPct = (hoveredUse.coord.y / HOPE_IMAGE_HEIGHT) * 100;

  return (
    <div
      ref={tooltipRef}
      className="card-occult absolute z-10 w-max px-4 py-2 pointer-events-none opacity-0"
      style={{
        top: `${topPct}%`,
        left: expandRight ? `calc(${leftPct}% + 24px)` : undefined,
        right: !expandRight ? `calc(${100 - leftPct}% + 24px)` : undefined,
        transform: 'translateY(-50%)',
      }}
    >
      <h4 ref={titleRef} className="font-display text-primary text-sm opacity-0">
        {hoveredUse.nome}
      </h4>
    </div>
  );
}

export function HopeUseOverlay({
  open,
  onOpenChange,
  onSelectUse,
}: HopeUseOverlayProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [lastHoveredId, setLastHoveredId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [selectedUse, setSelectedUse] = useState<HopeUse | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const eyesInitedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      eyesInitedRef.current = false;
      return;
    }

    setClosing(false);

    if (panelRef.current) {
      anime({
        targets: panelRef.current,
        opacity: [0, 1],
        scale: [0.94, 1],
        duration: 450,
        easing: 'easeOutExpo',
      });
      anime({
        targets: '.hope-title',
        opacity: [0, 1],
        translateX: [40, 0],
        duration: 600,
        delay: 200,
        easing: 'easeOutExpo',
      });
    }

    if (!eyesInitedRef.current) {
      eyesInitedRef.current = true;
      anime({
        targets: '.hope-eye-ring',
        scale: [0, 1],
        opacity: [0, 1],
        duration: 600,
        delay: anime.stagger(110, { start: 250 }),
        easing: 'easeOutBack',
      });
      anime({
        targets: '.hope-eye-pulse',
        scale: [1, 1.8],
        opacity: [0.55, 0],
        duration: 2000,
        loop: true,
        delay: anime.stagger(260, { start: 700 }),
        easing: 'easeOutSine',
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
      targets: [panelRef.current, '.hope-title'],
      opacity: [1, 0],
      scale: [1, 0.96],
      duration: 250,
      easing: 'easeInExpo',
      complete: () => onOpenChange(false),
    });
  };

  const handleSelect = (use: HopeUse, target: HTMLElement) => {
    if (closing) return;
    setClosing(true);
    setHoveredId(null);
    setSelectedUse(use);

    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    spawnParticleBurst(cx, cy);
    spawnShockwave(cx, cy);

    anime({
      targets: target,
      scale: [1, 2.4],
      opacity: [1, 0],
      duration: 500,
      easing: 'easeOutExpo',
    });

    anime.timeline()
      .add({
        targets: [panelRef.current, '.hope-title'],
        opacity: [1, 0.15],
        scale: [1, 0.97],
        duration: 300,
        easing: 'easeOutQuad',
      })
      .add({
        targets: [panelRef.current, '.hope-title'],
        opacity: [0.15, 0],
        scale: [0.97, 1.03],
        duration: 400,
        easing: 'easeInExpo',
        complete: () => {
          onSelectUse(use);
          onOpenChange(false);
          setClosing(false);
          setSelectedUse(null);
        },
      }, '+=550');
  };

  const hoveredUse = hoveredId
    ? hopeUses.find((u) => u.id === hoveredId) ?? null
    : null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center gap-12 lg:gap-24 p-4 overflow-hidden">
      <div
        ref={panelRef}
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col items-center opacity-0 shrink-0"
      >
        <div className="flex items-center justify-between w-full mb-3">
          <h3 className="font-display text-lg text-primary uppercase tracking-widest">
            Usar Esperança
          </h3>
          <button
            onClick={handleClose}
            className="text-xs px-2 py-1 border border-primary text-primary hover:bg-primary hover:text-black transition-colors uppercase font-bold"
          >
            Fechar
          </button>
        </div>



        <div className="relative w-full">
          <img
            src="/hope.png"
            alt="Esperança"
            className="w-full h-auto select-none pointer-events-none"
            draggable={false}
          />

          {hopeUses.map((use, index) => {
            const leftPct = (use.coord.x / HOPE_IMAGE_WIDTH) * 100;
            const topPct = (use.coord.y / HOPE_IMAGE_HEIGHT) * 100;
            
            let sizeClass = 'w-8 h-8 sm:w-9 sm:h-9';
            if (index === 0) sizeClass = 'w-3 h-3 sm:w-4 sm:h-4';
            else if (index === 2 || index === 3) sizeClass = 'w-5 h-5 sm:w-6 sm:h-6';

            return (
              <button
                key={use.id}
                type="button"
                onMouseEnter={() => {
                  setHoveredId(use.id);
                  setLastHoveredId(use.id);
                }}
                onMouseLeave={() =>
                  setHoveredId((id) => (id === use.id ? null : id))
                }
                onFocus={() => {
                  setHoveredId(use.id);
                  setLastHoveredId(use.id);
                }}
                onBlur={() => setHoveredId((id) => (id === use.id ? null : id))}
                onClick={(e) => handleSelect(use, e.currentTarget)}
                style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                className={`hope-eye absolute -translate-x-1/2 -translate-y-1/2 ${sizeClass} rounded-full focus:outline-none`}
                aria-label={use.nome}
              >
                <span className="hope-eye-pulse pointer-events-none absolute inset-0 rounded-full bg-primary opacity-0" />
                <span
                  className={`hope-eye-ring pointer-events-none absolute inset-0 rounded-full border-2 opacity-0 transition-colors duration-200 ${
                    hoveredId === use.id
                      ? 'border-primary bg-primary/25'
                      : 'border-primary/70 bg-black/10'
                  }`}
                />
              </button>
            );
          })}

          {hoveredUse && (
            <HopeTooltip
              hoveredUse={hoveredUse}
              index={hopeUses.findIndex((u) => u.id === hoveredUse.id)}
            />
          )}
        </div>
      </div>

      <div className="hidden lg:flex flex-col justify-center hope-title opacity-0 pointer-events-none select-none max-w-xl shrink-0">
        <h1 className="text-7xl xl:text-[7.5rem] font-display text-primary uppercase tracking-tighter font-black leading-none">
          ESPERANÇA
        </h1>
        <div className="h-1 w-32 bg-primary/80 mt-8 mb-6 rounded-full transition-all duration-300" />
        <div 
          key={lastHoveredId ?? 'default'}
          className="min-h-[8rem] animate-in fade-in duration-300 flex flex-col gap-2"
        >
          {lastHoveredId ? (
            <>
              <h3 className="text-primary font-display text-xl uppercase tracking-widest">
                {hopeUses.find((u) => u.id === lastHoveredId)?.nome}
              </h3>
              <p className="text-primary/90 font-mono text-sm max-w-sm uppercase tracking-widest leading-relaxed">
                {hopeUses.find((u) => u.id === lastHoveredId)?.efeito}
              </p>
            </>
          ) : (
            <p className="text-primary/90 font-mono text-sm max-w-sm uppercase tracking-widest leading-relaxed">
              A última fagulha contra a escuridão absoluta.
            </p>
          )}
        </div>
      </div>

      {selectedUse && <HopeStamp use={selectedUse} />}
    </div>
  );
}
