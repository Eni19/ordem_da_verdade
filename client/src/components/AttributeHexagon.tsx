import { useState, useEffect, useRef } from 'react';
import anime from 'animejs';

interface AttributeHexagonProps {
  attribute: string;
  value: number;
  onChange: (value: number) => void;
  isFearAffected?: boolean;
}

const attributeDieMap: Record<number, string> = {
  0: '2d6 (<)',
  1: '1d6',
  2: '1d8',
  3: '1d10',
  4: '1d12',
  5: '2d12 (>)',
};

const attributeLabels: Record<string, string> = {
  força: 'FOR',
  agilidade: 'AGI',
  inteligência: 'INT',
  presença: 'PRE',
  vigor: 'VIG',
  vontade: 'VON',
};

export default function AttributeHexagon({ attribute, value, onChange, isFearAffected = false }: AttributeHexagonProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());
  const hexRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempValue(value.toString());
  }, [value]);

  useEffect(() => {
    if (!isFearAffected || !hexRef.current) return;

    // ==========================================
    // CONTROLE DE VELOCIDADE DAS PARTÍCULAS (animejs):
    // Altere o valor de 'anime.speed' abaixo para controlar a velocidade global de reprodução.
    // > 1 acelera as animações | entre 0 e 1 (ex: 0.4) desacelera, deixando o movimento mais lento e suave.
    // ==========================================
    (anime as any).speed = 0.38;

    const createParticle = () => {
      if (!hexRef.current) return;
      const particle = document.createElement('div');
      particle.className = 'absolute w-1 h-1 rounded-full pointer-events-none';

      // Select a random border: 0 = Top, 1 = Right, 2 = Bottom, 3 = Left
      const border = Math.floor(Math.random() * 4);
      let startX = 0;
      let startY = 0;
      let angle = 0;

      if (border === 0) { // Top
        startX = Math.random() * 100;
        startY = 0;
        angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 3); // mostly up
      } else if (border === 1) { // Right
        startX = 100;
        startY = Math.random() * 100;
        angle = (Math.random() - 0.5) * (Math.PI / 3); // mostly right
      } else if (border === 2) { // Bottom
        startX = Math.random() * 100;
        startY = 100;
        angle = Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 3); // mostly down
      } else { // Left
        startX = 0;
        startY = Math.random() * 100;
        angle = Math.PI + (Math.random() - 0.5) * (Math.PI / 3); // mostly left
      }

      // Center the 4px particle exactly on the border line
      particle.style.left = `calc(${startX}% - 2px)`;
      particle.style.top = `calc(${startY}% - 2px)`;

      // Add multiple shades of purple/magenta
      const colors = ['#c084fc', '#a855f7', '#d946ef', '#e879f9', '#818cf8', '#a78bfa'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.backgroundColor = randomColor;

      hexRef.current.appendChild(particle);

      // Move outwards from the border + add a light upward drift
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

    // Particle creation (every 200ms for a more subtle look)
    const interval = setInterval(() => {
      createParticle();
    }, 150);

    return () => clearInterval(interval);
  }, [isFearAffected]);
  const handleSave = () => {
    const parsedValue = parseInt(tempValue) || 0;
    const numValue = Math.max(0, Math.min(5, parsedValue));
    onChange(numValue);
    setTempValue(numValue.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={hexRef}
        className={`relative w-full aspect-square max-w-20 md:max-w-24 mx-auto bg-black border-2 transition-all duration-200 cursor-pointer flex items-center justify-center ${isFearAffected
          ? 'border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)] cursor-not-allowed'
          : 'border-primary hover:shadow-[0_0_10px_rgba(255,23,68,0.35)]'
          }`}
        onClick={() => {
          if (!isFearAffected) setIsEditing(true);
        }}
      >
        {isEditing ? (
          <input
            type="number"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
            className={`w-12 h-12 bg-black text-center text-lg border-none outline-none ${isFearAffected ? 'text-purple-400' : 'text-primary'
              }`}
            min={0}
            max={5}
          />
        ) : (
          <div className="text-center relative z-10">
            <div
              style={{ fontWeight: 700, fontFamily: "'Roboto Mono', monospace" }}
              className={`text-2xl ${isFearAffected ? 'text-purple-400' : 'text-primary'}`}
            >
              {value}
            </div>
            <div className={`text-[10px] font-mono ${isFearAffected ? 'text-purple-400/70' : 'text-muted-foreground'}`}>
              {attributeDieMap[Math.max(0, Math.min(5, value))]}
            </div>
          </div>
        )}
      </div>
      <span className={`text-sm font-display uppercase tracking-wider font-bold ${isFearAffected ? 'text-purple-400' : 'text-primary'}`}>
        {attributeLabels[attribute]}
      </span>
    </div>
  );
}
