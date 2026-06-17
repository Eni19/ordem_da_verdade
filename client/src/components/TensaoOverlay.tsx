import { useEffect } from 'react';

export function TensaoOverlay() {
  useEffect(() => {
    // Adiciona uma distorção cromática (RGB split) mais forte em toda a tela
    document.body.style.textShadow = '1.5px 0 2px rgba(255,0,0,0.7), -1.5px 0 2px rgba(0,0,255,0.7)';
    
    // Evita o scrollbar horizontal causado pelo jitter da tela
    const originalOverflowX = document.body.style.overflowX;
    document.body.style.overflowX = 'hidden';

    return () => {
      document.body.style.textShadow = '';
      document.body.style.overflowX = originalOverflowX;
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes vhs-jitter {
          0% { transform: translateX(0) skewX(0); }
          5% { transform: translateX(-4px) skewX(1deg); }
          10% { transform: translateX(4px) skewX(-1deg); }
          15% { transform: translateX(-2px) skewX(0.5deg); }
          20% { transform: translateX(0) skewX(0); }
          100% { transform: translateX(0) skewX(0); }
        }
        
        .vhs-overlay-container {
          position: fixed;
          inset: -10px; /* Expande para compensar o tremor sem vazar para a barra de rolagem */
          z-index: 50;
          pointer-events: none;
          overflow: hidden;
          /* O próprio contêiner dos efeitos pisca e treme, ajudando na sensação de instabilidade */
          animation: vhs-jitter 3s infinite linear;
        }

        .vhs-scanlines {
          position: absolute;
          inset: 0;
          /* Linhas CRT levemente mais visíveis */
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), 
                      linear-gradient(90deg, rgba(255, 0, 0, 0.04), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.04));
          background-size: 100% 4px, 3px 100%;
          mix-blend-mode: overlay;
        }
        
        .vhs-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 50%, rgba(40, 0, 60, 0.5) 100%);
          mix-blend-mode: multiply;
        }
      `}</style>

      <div className="vhs-overlay-container">
        <div className="vhs-scanlines"></div>
        <div className="vhs-vignette"></div>
      </div>
    </>
  );
}
