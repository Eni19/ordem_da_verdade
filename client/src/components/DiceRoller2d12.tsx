import { useState, useEffect } from 'react';
import { Dice6 } from 'lucide-react';

interface DiceResult {
  formula: string;
  total: number;
  rolls: number[];
  timestamp: string;
  isCritical?: boolean;
  advantage?: number;
  disadvantage?: number;
}

interface Props {
  onRoll: (result: DiceResult) => void;
}

export default function DiceRoller2d12({ onRoll }: Props) {
  const [isRolling, setIsRolling] = useState(false);
  const [hopeRoll, setHopeRoll] = useState<number | null>(null);
  const [fearRoll, setFearRoll] = useState<number | null>(null);
  const [advantage, setAdvantage] = useState(0);
  const [disadvantage, setDisadvantage] = useState(0);
  const [animatingHope, setAnimatingHope] = useState(false);
  const [animatingFear, setAnimatingFear] = useState(false);

  const rollDice = async () => {
    if (isRolling) return;
    
    setIsRolling(true);
    setAnimatingHope(true);
    setAnimatingFear(true);
    
    // Animação de rolagem
    const animationDuration = 600;
    const startTime = Date.now();
    
    const animateRoll = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < animationDuration) {
        setHopeRoll(Math.floor(Math.random() * 12) + 1);
        setFearRoll(Math.floor(Math.random() * 12) + 1);
        requestAnimationFrame(animateRoll);
      } else {
        // Resultado final
        const finalHope = Math.floor(Math.random() * 12) + 1;
        const finalFear = Math.floor(Math.random() * 12) + 1;
        setHopeRoll(finalHope);
        setFearRoll(finalFear);
        setAnimatingHope(false);
        setAnimatingFear(false);
        
        // Calcular resultado total
        let total = finalHope + finalFear;
        const rolls = [finalHope, finalFear];
        const isCritical = finalHope === finalFear;
        
        // Aplicar vantagem/desvantagem
        let advantageRoll = 0;
        let disadvantageRoll = 0;
        
        if (advantage > 0) {
          advantageRoll = Math.floor(Math.random() * 6) + 1;
          total += advantageRoll;
          rolls.push(advantageRoll);
        }
        
        if (disadvantage > 0) {
          disadvantageRoll = Math.floor(Math.random() * 6) + 1;
          total -= disadvantageRoll;
          rolls.push(-disadvantageRoll);
        }
        
        const result: DiceResult = {
          formula: `2d12${advantage > 0 ? '+1d6' : ''}${disadvantage > 0 ? '-1d6' : ''}`,
          total,
          rolls,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          isCritical,
          advantage: advantage > 0 ? advantageRoll : undefined,
          disadvantage: disadvantage > 0 ? disadvantageRoll : undefined,
        };
        
        onRoll(result);
        setIsRolling(false);
        // Valores permanecem visíveis até limpeza manual
      }
    };
    
    animateRoll();
  };

  return (
    <div className="space-y-4">
      {/* 2d12 Display */}
      <div className="flex gap-4 justify-center items-center">
        {/* Esperança (Azul) */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs font-bold text-blue-400 uppercase">Esperança</div>
          <div className={`w-16 h-16 border-2 border-blue-500 bg-black flex items-center justify-center text-2xl font-bold transition-all ${
            animatingHope ? 'animate-pulse text-blue-400' : 'text-blue-500'
          }`}>
            {hopeRoll !== null ? hopeRoll : '-'}
          </div>
        </div>

        {/* Medo (Roxo) */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs font-bold text-purple-400 uppercase">Medo</div>
          <div className={`w-16 h-16 border-2 border-purple-600 bg-black flex items-center justify-center text-2xl font-bold transition-all ${
            animatingFear ? 'animate-pulse text-purple-400' : 'text-purple-600'
          }`}>
            {fearRoll !== null ? fearRoll : '-'}
          </div>
        </div>
      </div>

      {/* Vantagem/Desvantagem */}
      <div className="flex gap-4 justify-center items-center">
        <button
          onClick={() => setAdvantage(advantage === 0 ? 1 : 0)}
          className={`px-3 py-1 text-xs font-bold uppercase border-2 transition-all ${
            advantage > 0
              ? 'bg-primary border-primary text-black'
              : 'border-primary text-primary hover:bg-primary hover:text-black'
          }`}
        >
          Vantagem
        </button>

        <button
          onClick={() => setDisadvantage(disadvantage === 0 ? 1 : 0)}
          className={`px-3 py-1 text-xs font-bold uppercase border-2 transition-all ${
            disadvantage > 0
              ? 'bg-red-600 border-red-500 text-white'
              : 'border-red-500 text-red-500 hover:bg-red-500 hover:text-black'
          }`}
        >
          Desvantagem
        </button>
      </div>

      {/* Botão Rolar */}
      <button
        onClick={rollDice}
        disabled={isRolling}
        className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-900 text-white font-bold uppercase border-2 border-red-500 transition-all active:scale-95"
      >
        <Dice6 className="inline mr-2" size={20} />
        {isRolling ? 'Rolando...' : 'Rolar 2d12'}
      </button>

      {/* Botão Limpar */}
      {(hopeRoll !== null || fearRoll !== null) && (
        <button
          onClick={() => {
            setHopeRoll(null);
            setFearRoll(null);
          }}
          className="w-full py-2 bg-black border-2 border-primary text-primary hover:bg-primary hover:text-black font-bold uppercase text-xs transition-all"
        >
          Limpar Dados
        </button>
      )}
    </div>
  );
}
