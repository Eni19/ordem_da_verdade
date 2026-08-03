import { useEffect, useRef, useState } from 'react';
import { HopeUseOverlay } from '@/components/HopeUseOverlay';
import { HopeUse } from '@/data/hope_use';

interface HopeCounterProps {
  current: number;
  onChange: (value: number) => void;
}

const MAX_HOPE = 3;

export default function HopeCounter({ current, onChange }: HopeCounterProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Refs for smooth animation transitions across renders
  const ampRef = useRef(2);
  const freqRef = useRef(0.01);
  const speedRef = useRef(0.01);
  const timeRef = useRef(0);

  const handleIncrement = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (current < MAX_HOPE) {
      onChange(current + 1);
    }
  };

  const handleDecrement = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (current > 0) {
      setDialogOpen(true);
    }
  };

  const handleUseHope = (use: HopeUse) => {
    onChange(current - use.custo);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Lida com resoluções de tela altas (retina displays) para deixar a linha bem nítida
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * 2 || canvas.height !== rect.height * 2) {
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationFrameId: number;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Alvos de amplitude, frequência e velocidade baseados na esperança atual
      const targetAmplitude = current === 0 ? 2 : 10 + (current * 10);
      const targetFrequency = current === 0 ? 0.01 : 0.015 + (current * 0.005);
      
      // Velocidade um pouco reduzida em relação à versão anterior para ficar mais orgânico
      const targetSpeed = current === 0 ? 0.01 : 0.03 + (current * 0.02);

      // Interpolação suave para não haver cortes quando a esperança muda
      ampRef.current += (targetAmplitude - ampRef.current) * 0.08;
      freqRef.current += (targetFrequency - freqRef.current) * 0.08;
      speedRef.current += (targetSpeed - speedRef.current) * 0.08;

      // Fundo com "ghosting" leve para simular o rastro do fósforo na tela
      ctx.fillStyle = 'rgba(10, 10, 12, 0.35)';
      ctx.fillRect(0, 0, rect.width, rect.height);

      const centerY = rect.height / 2;
      
      // Efeito de brilho do feixe de elétrons
      ctx.globalCompositeOperation = "lighter";
      
      /* --- CORES ORIGINAIS (ROXO) GUARDADAS AQUI ---
      ctx.shadowColor = "rgba(180, 140, 255, 0.8)";
      const waves = [
        { phase: 0, ampMult: 1, freqMult: 1, color: 'rgba(200, 162, 200, 0.9)', width: 2 },
        { phase: 2, ampMult: 0.6, freqMult: 1.5, color: 'rgba(120, 80, 220, 0.6)', width: 1.5 },
        { phase: 4, ampMult: 0.3, freqMult: 2.5, color: 'rgba(80, 40, 180, 0.4)', width: 1 }
      ];
      ---------------------------------------------- */

      // Novas cores douradas para teste
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(255, 200, 50, 0.8)";
      const waves = [
        { phase: 0, ampMult: 1, freqMult: 1, color: 'rgba(255, 215, 0, 0.9)', width: 2 }, // Ouro
        { phase: 2, ampMult: 0.6, freqMult: 1.5, color: 'rgba(218, 165, 32, 0.6)', width: 1.5 }, // Ouro velho
        { phase: 4, ampMult: 0.3, freqMult: 2.5, color: 'rgba(184, 134, 11, 0.4)', width: 1 } // Bronze
      ];

      waves.forEach(wave => {
        ctx.beginPath();
        for (let x = 0; x <= rect.width; x += 3) {
          // Ruído leve na onda para um toque paranormal quando a esperança está alta
          const noise = current > 1 ? (Math.random() - 0.5) * current * 1.5 : 0;
          const y = centerY + (Math.sin(x * freqRef.current * wave.freqMult + timeRef.current + wave.phase) * ampRef.current * wave.ampMult) + noise;
          
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = wave.width;
        ctx.stroke();
      });

      ctx.globalCompositeOperation = "source-over";
      ctx.shadowBlur = 0;

      timeRef.current -= speedRef.current;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [current]);

  return (
    <>
      <div className="card-occult space-y-2 relative group pb-3 px-3 pt-3">
        <div className="flex justify-start items-center gap-3 pl-1">
          <h3 className="font-display text-sm text-primary uppercase tracking-widest">
            Esperança
          </h3>
          <button 
            onClick={handleIncrement}
            disabled={current === MAX_HOPE}
            className="btn-occult flex items-center justify-center w-4 h-5 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed leading-none shadow-[0_0_5px_rgba(255,215,0,0.15)]"
            title="Recuperar Esperança"
          >
            +
          </button>
        </div>

        {/* Container do Osciloscópio Reduzido */}
        <div 
          className="relative w-full h-14 rounded border border-primary/20 overflow-hidden bg-[#050508] cursor-crosshair shadow-[inset_0_0_15px_rgba(0,0,0,0.9)]"
          onClick={(e) => {
            if (current > 0) {
              handleDecrement(e);
            }
          }}
          title={current > 0 ? "Clique nas ondas para Usar Esperança" : ""}
        >
          {/* Grade de tela do osciloscópio (dourada clara) */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.2]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255, 215, 50, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 215, 50, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '15px 15px'
            }}
          />
          {/* Eixo horizontal central */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-yellow-500/10 pointer-events-none -translate-y-1/2" />
          {/* Eixo vertical central */}
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-yellow-500/10 pointer-events-none -translate-x-1/2" />
          
          <canvas 
            ref={canvasRef} 
            className="w-full h-full block pointer-events-none"
          />

          {/* Indicador Numérico */}
          <div className="absolute bottom-0.5 right-1.5 pointer-events-none opacity-80">
            <span className="font-mono text-[10px] text-yellow-500/70">{current}/{MAX_HOPE}</span>
          </div>
        </div>
      </div>

      <HopeUseOverlay
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelectUse={handleUseHope}
      />
    </>
  );
}
