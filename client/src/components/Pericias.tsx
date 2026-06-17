import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import anime from 'animejs';
import { useEffect, useRef } from 'react';

type TrainingLevel = 'treinado' | 'veterano' | 'expert';
type AttributeKey = 'força' | 'agilidade' | 'inteligência' | 'presença' | 'vigor' | 'vontade';

interface Pericia {
  id: string;
  name: string;
  training: TrainingLevel;
  isGeneric?: boolean;
}

interface PericiasProps {
  pericias: Pericia[];
  onAddPericia: () => void;
  onUpdatePericia: (id: string, field: keyof Pericia, value: string) => void;
  onDeletePericia: (id: string) => void;
  onRollPericia: (id: string, attribute: AttributeKey) => void;
  isFearAffectedSkill?: (name: string) => boolean;
  getFearAdjustedTrainingLevel?: (training: string, skillName: string) => string;
}

const ATTRIBUTE_OPTIONS: Array<{ value: AttributeKey; label: string }> = [
  { value: 'força', label: 'Forca' },
  { value: 'agilidade', label: 'Agilidade' },
  { value: 'inteligência', label: 'Inteligencia' },
  { value: 'presença', label: 'Presenca' },
  { value: 'vigor', label: 'Vigor' },
  { value: 'vontade', label: 'Vontade' },
];

const TRAINING_OPTIONS: Array<{ value: TrainingLevel; label: string }> = [
  { value: 'treinado', label: 'Treinado (1d6)' },
  { value: 'veterano', label: 'Veterano (1d8)' },
  { value: 'expert', label: 'Expert (1d10)' },
];

export default function Pericias({
  pericias,
  onAddPericia,
  onUpdatePericia,
  onDeletePericia,
  onRollPericia,
  isFearAffectedSkill,
  getFearAdjustedTrainingLevel,
}: PericiasProps) {
  const [pendingRoll, setPendingRoll] = useState<{ periciaId: string; attribute: AttributeKey } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    anime.speed = 0.38;

    const createParticle = (el: HTMLElement) => {
      const particle = document.createElement('div');
      particle.className = 'absolute w-1 h-1 rounded-full pointer-events-none z-10';

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

      el.appendChild(particle);

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
      if (!containerRef.current) return;
      const elements = containerRef.current.querySelectorAll('.fear-affected-skill');
      elements.forEach(el => {
        createParticle(el as HTMLElement);
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card-occult flex flex-col gap-2 h-full min-h-0" ref={containerRef}>
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="font-display text-base text-primary uppercase">Pericias</h3>
        <button
          onClick={onAddPericia}
          className="btn-occult text-sm px-2 py-1 flex items-center gap-1 flex-shrink-0"
        >
          <Plus size={12} />
          ADD
        </button>
      </div>

      <ScrollArea className="flex-1 border border-primary bg-black p-2 min-h-0">
        <div className="space-y-2 pr-3">
          {pericias.length === 0 ? (
            <div className="flex items-center justify-center text-muted-foreground text-center py-4">
              <p className="font-mono text-xs">Adicione pericias para rolar testes.</p>
            </div>
          ) : (
            pericias.map((pericia) => {
              const isRollMenuActive = pendingRoll?.periciaId === pericia.id;
              const isGeneric = pericia.isGeneric ?? false;
              const isAffected = isFearAffectedSkill ? isFearAffectedSkill(pericia.name) : false;
              
              const adjustedTraining = getFearAdjustedTrainingLevel ? getFearAdjustedTrainingLevel(pericia.training, pericia.name) as TrainingLevel | 'destreinado' : pericia.training;
              const isEffectivelyUntrained = isGeneric || adjustedTraining === 'destreinado';

              return (
              <div
                key={pericia.id}
                className={`group border p-2 space-y-2 flex-shrink-0 transition-colors duration-200 relative ${
                  isAffected 
                    ? `fear-affected-skill border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)] ${isRollMenuActive ? 'bg-purple-500' : 'bg-purple-950/20 hover:bg-purple-900/40'}`
                    : `border-primary ${isRollMenuActive ? 'bg-primary' : 'bg-black hover:bg-primary'}`
                }`}
              >
                <div className="flex items-center gap-2 relative z-10">
                  <input
                    type="text"
                    value={pericia.name}
                    onChange={(e) => onUpdatePericia(pericia.id, 'name', e.target.value)}
                    disabled={isGeneric}
                    className={`flex-1 min-w-0 bg-transparent border font-display text-sm focus:outline-none focus:ring-0 uppercase px-2 py-1 h-8 transition-colors duration-200 ${
                      isGeneric ? 'cursor-not-allowed opacity-75' : ''
                    } ${
                      isRollMenuActive
                        ? 'border-black text-black placeholder:text-black'
                        : isAffected
                          ? 'border-purple-500 text-purple-200 group-hover:border-purple-400 group-hover:text-purple-100 placeholder:text-purple-400'
                          : 'border-primary text-primary group-hover:border-black group-hover:text-black group-hover:placeholder:text-black'
                    }`}
                    placeholder="Nome"
                  />

                  <div
                    className={`w-36 border text-sm p-1 focus:outline-none h-8 transition-colors duration-200 relative overflow-hidden ${
                      isRollMenuActive
                        ? isAffected
                          ? 'bg-purple-500 border-black text-black'
                          : 'bg-primary border-black text-black'
                        : isAffected
                          ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)] group-hover:bg-purple-900/50 group-hover:border-purple-400 group-hover:text-purple-100'
                          : 'bg-input border-primary text-primary group-hover:bg-primary group-hover:border-black group-hover:text-black'
                    }`}
                  >
                    {isEffectivelyUntrained ? (
                      <span className={`h-full flex items-center text-xs ${isAffected ? 'text-purple-200' : ''}`}>
                        Sem treino (1d4)
                      </span>
                    ) : (
                      <select
                        value={adjustedTraining}
                        disabled={isAffected}
                        onChange={(e) => onUpdatePericia(pericia.id, 'training', e.target.value)}
                        className={`w-full bg-transparent h-full ${isAffected ? 'text-purple-100 opacity-80 cursor-not-allowed' : ''}`}
                      >
                        {TRAINING_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value} className="bg-black text-primary">
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setPendingRoll((prev) =>
                        prev?.periciaId === pericia.id
                          ? null
                          : { periciaId: pericia.id, attribute: 'força' }
                      )
                    }
                    className={`w-20 h-8 font-bold uppercase text-sm border-2 transition-all ${
                      isRollMenuActive
                        ? isAffected 
                          ? 'bg-black text-purple-400 border-black hover:bg-black hover:text-purple-300'
                          : 'bg-black text-primary border-black hover:bg-black hover:text-primary'
                        : isAffected
                          ? 'bg-purple-500 text-black border-purple-500 group-hover:bg-black group-hover:text-purple-400 group-hover:border-purple-500 hover:bg-black hover:text-purple-400'
                          : 'bg-primary text-black border-primary group-hover:bg-black group-hover:text-primary group-hover:border-black hover:bg-black hover:text-primary'
                    }`}
                  >
                    Rolar
                  </button>

                  {!isGeneric && (
                    <button
                      onClick={() => onDeletePericia(pericia.id)}
                      className={`transition-colors p-0 flex-shrink-0 h-8 w-8 border flex items-center justify-center ${
                        isRollMenuActive
                          ? 'text-black border-black hover:text-secondary'
                          : isAffected
                            ? 'text-purple-300 border-purple-500 hover:text-purple-100 group-hover:text-purple-300 group-hover:border-purple-400'
                            : 'text-primary border-primary hover:text-secondary group-hover:text-black group-hover:border-black'
                      }`}
                      aria-label="Remover pericia"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}

                  {isGeneric && <div className="h-8 w-8 flex-shrink-0" aria-hidden="true" />}
                </div>

                {pendingRoll?.periciaId === pericia.id && (
                  <div className={`border p-2 space-y-2 ${isAffected ? 'border-purple-500/60 bg-purple-950/90' : 'border-primary/60 bg-black/70'}`}>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {ATTRIBUTE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            onRollPericia(pericia.id, option.value);
                            setPendingRoll(null);
                          }}
                          className={`h-8 px-2 text-sm uppercase font-bold border transition-all ${
                            isAffected
                              ? 'bg-black text-purple-300 border-purple-500 hover:bg-purple-500 hover:text-black'
                              : 'bg-black text-primary border-primary hover:bg-primary hover:text-black'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
