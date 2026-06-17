import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import type { FearEffect } from '@/data/fear';

type AttributeKey = 'força' | 'agilidade' | 'inteligência' | 'presença' | 'vigor' | 'vontade';

const ATTRIBUTE_KEYS: AttributeKey[] = ['força', 'agilidade', 'inteligência', 'presença', 'vigor', 'vontade'];
const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  'força': 'Força',
  'agilidade': 'Agilidade',
  'inteligência': 'Inteligência',
  'presença': 'Presença',
  'vigor': 'Vigor',
  'vontade': 'Vontade',
};

interface ActiveFearTag {
  id: string;
  effectResult: string;
  effectName: string;
  effectDescription: string;
  effectNarrative: string;
  rollTotal: number;
  bonusApplied: number;
  sourceInsanityId: string;
  sourceInsanityName: string;
  selectedAttribute?: AttributeKey;
  secondaryAttribute?: AttributeKey;
}

export interface FearRouletteState {
  isOpen: boolean;
  isRolling: boolean;
  displayIndex: number;
  finalEffect: FearEffect | null;
  dice: [number, number] | null;
  total: number;
  bonus: number;
  pendingTag: ActiveFearTag | null;
}

interface FearRouletteOverlayProps {
  fearRouletteState: FearRouletteState;
  fearEffects: FearEffect[];
  closeFearRoulette: () => void;
  fearResultAttributeChoice: string | null;
  setFearResultAttributeChoice: (attr: string | null) => void;
  fearSecondaryAttributeChoice: string | null;
  setFearSecondaryAttributeChoice: (attr: string | null) => void;
  handleConfirmFearAttribute: () => void;
}

export function FearRouletteOverlay({
  fearRouletteState,
  fearEffects,
  closeFearRoulette,
  fearResultAttributeChoice,
  setFearResultAttributeChoice,
  fearSecondaryAttributeChoice,
  setFearSecondaryAttributeChoice,
  handleConfirmFearAttribute,
}: FearRouletteOverlayProps) {
  const [phase, setPhase] = useState<'rolling' | 'name' | 'narrative' | 'mechanics'>('rolling');
  const narrativeRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (fearRouletteState.isRolling) {
      setPhase('rolling');
    } else if (fearRouletteState.finalEffect && phase === 'rolling') {
      // Começa o processo sequencial de revelação após a rolagem
      setPhase('name');
    }
  }, [fearRouletteState.isRolling, fearRouletteState.finalEffect, phase]);

  useEffect(() => {
    if (phase === 'name' && nameRef.current) {
      // Efeito Glitch/Text scramble no nome
      const textWrapper = nameRef.current;
      const text = textWrapper.textContent || '';
      // Agrupa letras em palavras para evitar que a palavra quebre na metade da linha
      textWrapper.innerHTML = text.split(' ').map(word => 
        `<span class="inline-block whitespace-nowrap">${word.replace(/\S/g, "<span class='letter inline-block'>$&</span>")}</span>`
      ).join(' ');

      anime.timeline({ loop: false })
        .add({
          targets: '.fear-name .letter',
          opacity: [0, 1],
          translateY: [-20, 0],
          easing: "easeOutExpo",
          duration: 1200,
          delay: (el, i) => 40 * i,
          complete: () => {
            setTimeout(() => setPhase('narrative'), 500);
          }
        });
    }

    if (phase === 'narrative' && narrativeRef.current) {
      // Efeito de revelação lenta (typewriter) na narrativa
      const textWrapper = narrativeRef.current;
      const text = textWrapper.textContent || '';
      // Agrupa letras em palavras
      textWrapper.innerHTML = text.split(' ').map(word => 
        `<span class="inline-block whitespace-nowrap">${word.replace(/\S/g, "<span class='letter inline-block'>$&</span>")}</span>`
      ).join(' ');

      anime.timeline({ loop: false })
        .add({
          targets: '.fear-narrative .letter',
          opacity: [0, 1],
          easing: "easeOutExpo",
          duration: 500,
          delay: (el, i) => 15 * (i + 1),
          complete: () => {
            setTimeout(() => setPhase('mechanics'), 800);
          }
        });
    }
  }, [phase]);

  if (!fearRouletteState.isOpen) return null;

  const currentEffect = fearRouletteState.isRolling
    ? fearEffects[fearRouletteState.displayIndex]
    : fearRouletteState.finalEffect;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl border-2 border-purple-500 bg-black p-4 space-y-4 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-500 pb-2">
          <h3 className="font-display text-lg text-purple-300 uppercase tracking-widest">
            Roleta do Medo
          </h3>
          {!fearRouletteState.isRolling && phase === 'mechanics' && (
            <button
              onClick={closeFearRoulette}
              className="text-xs px-2 py-1 border border-purple-500 text-purple-300 hover:bg-purple-500 hover:text-black transition-colors uppercase font-bold"
            >
              Fechar
            </button>
          )}
        </div>

        {/* Dice Info */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs uppercase font-bold">
          <div className="border border-purple-500/50 p-2 text-purple-200">
            D10: {fearRouletteState.dice?.[0] ?? '-'}
          </div>
          <div className="border border-purple-500/50 p-2 text-purple-200">
            D10: {fearRouletteState.dice?.[1] ?? '-'}
          </div>
          <div className="border border-purple-500 p-2 text-purple-300">
            Bônus: +{fearRouletteState.bonus}
          </div>
        </div>

        {/* Efeito Central */}
        <div className="border border-purple-500 p-4 space-y-4 min-h-64 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-2 left-2 text-[10px] text-purple-500 uppercase font-bold">
            {fearRouletteState.isRolling ? 'Sorteando...' : `Resultado Final: ${fearRouletteState.total}`}
          </div>

          <div className="space-y-4 pt-4">
            {/* Nome do Medo */}
            <div className={`text-xl md:text-2xl uppercase tracking-[0.2em] font-display text-center font-bold
              ${fearRouletteState.isRolling ? 'text-purple-400/50 animate-pulse' : 'text-purple-300 fear-name'}`}
              ref={nameRef}
              style={{ opacity: phase === 'rolling' || phase === 'name' ? 1 : (phase === 'narrative' || phase === 'mechanics' ? 1 : 0) }}
            >
              {currentEffect?.nome}
            </div>

            {/* Narrativa */}
            {(phase === 'narrative' || phase === 'mechanics') && (
              <div 
                className="text-base md:text-lg font-display text-purple-100 italic text-center px-4 fear-narrative leading-relaxed"
                ref={narrativeRef}
              >
                {currentEffect?.descricaoNarrativa}
              </div>
            )}

            {/* Mecânica (Fade In) */}
            {phase === 'mechanics' && (
              <div className="mt-6 pt-4 border-t border-purple-500/30 animate-in fade-in duration-1000">
                <div className="text-[10px] uppercase text-purple-400 font-bold mb-2 tracking-widest">Efeito Mecânico</div>
                <div className="text-sm text-purple-200/80 leading-relaxed text-justify">
                  {currentEffect?.descricaoMecanica}
                </div>

                {/* Escolhas (apenas para medos 2 e 3) */}
                {currentEffect?.resultado === '2' && (
                  <div className="mt-4 space-y-2">
                    <div className="text-xs uppercase font-bold text-purple-300 text-center mb-2">
                      Escolha o atributo para +1 passo
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {ATTRIBUTE_KEYS.map((attribute) => (
                        <button
                          key={attribute}
                          onClick={() => setFearResultAttributeChoice(attribute)}
                          className={`py-2 text-[10px] uppercase border transition-colors ${
                            fearResultAttributeChoice === attribute 
                              ? 'bg-purple-500 text-black border-purple-500' 
                              : 'bg-black text-purple-300 border-purple-500 hover:bg-purple-500/20'
                          }`}
                        >
                          {ATTRIBUTE_LABELS[attribute as AttributeKey]}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleConfirmFearAttribute}
                      disabled={!fearResultAttributeChoice}
                      className="w-full mt-4 py-3 bg-purple-500 text-black font-bold uppercase border border-purple-400 hover:bg-purple-400 disabled:opacity-40 transition-colors"
                    >
                      Aplicar Efeito
                    </button>
                  </div>
                )}

                {currentEffect?.resultado === '3' && (
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <div className="text-xs uppercase font-bold text-purple-300 text-center">
                        Escolha o atributo para +1 passo (Força ou Agilidade)
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {(['força', 'agilidade'] as AttributeKey[]).map((attribute) => (
                          <button
                            key={attribute}
                            onClick={() => setFearResultAttributeChoice(attribute)}
                            className={`py-2 text-[10px] uppercase border transition-colors ${
                              fearResultAttributeChoice === attribute 
                                ? 'bg-purple-500 text-black border-purple-500' 
                                : 'bg-black text-purple-300 border-purple-500 hover:bg-purple-500/20'
                            }`}
                          >
                            {ATTRIBUTE_LABELS[attribute]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs uppercase font-bold text-purple-300 text-center">
                        Escolha o atributo para -1 passo (Inteligência ou Presença)
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {(['inteligência', 'presença'] as AttributeKey[]).map((attribute) => (
                          <button
                            key={attribute}
                            onClick={() => setFearSecondaryAttributeChoice(attribute)}
                            className={`py-2 text-[10px] uppercase border transition-colors ${
                              fearSecondaryAttributeChoice === attribute 
                                ? 'bg-purple-500 text-black border-purple-500' 
                                : 'bg-black text-purple-300 border-purple-500 hover:bg-purple-500/20'
                            }`}
                          >
                            {ATTRIBUTE_LABELS[attribute]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={handleConfirmFearAttribute}
                      disabled={!fearResultAttributeChoice || !fearSecondaryAttributeChoice}
                      className="w-full mt-4 py-3 bg-purple-500 text-black font-bold uppercase border border-purple-400 hover:bg-purple-400 disabled:opacity-40 transition-colors"
                    >
                      Aplicar Efeito
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
