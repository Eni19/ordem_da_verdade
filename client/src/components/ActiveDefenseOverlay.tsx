import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { ShieldHalf, Wind, Swords, X } from 'lucide-react';
import {
  type DefenseType,
  type ProtectionCategory,
  rollDie,
  rollAttributeDie,
  resolveBloqueio,
  resolveEsquiva,
  resolveChoqueDeArmas,
  resolveBrecha,
  rollCounterAttackDamage,
  type BloqueioResult,
  type EsquivaResult,
  type ChoqueDeArmasResult,
} from '@/utils/activeDefenseLogic';

export interface ActiveDefenseWeaponOption {
  id: string;
  name: string;
  damageDiceCount: number;
  damageDiceSides: number;
}

interface ActiveDefenseOverlayProps {
  open: boolean;
  defenseType: DefenseType | null;
  onClose: () => void;
  onSpendCharge: () => void;
  onApplyDamage?: (amount: number) => void;
  fortitudeDie: number | null;
  reflexosDie: number | null;
  lutaDie: number | null;
  protectionCategory: ProtectionCategory;
  attributeValues: Record<string, number>;
  passiveEvasion: number;
  meleeWeapons: ActiveDefenseWeaponOption[];
}

type Phase = 'input' | 'rolling' | 'reveal';

const DEFENSE_INFO: Record<DefenseType, { title: string; flavor: string; icon: typeof ShieldHalf }> = {
  bloqueio: {
    title: 'Bloqueio',
    flavor: 'Interponha sua arma, escudo ou as placas da armadura para atenuar a violência do golpe.',
    icon: ShieldHalf,
  },
  esquiva: {
    title: 'Esquiva',
    flavor: 'Escape da trajetória do perigo antes que ele te alcance.',
    icon: Wind,
  },
  aparar: {
    title: 'Aparar',
    flavor: 'Uma troca franca e violenta — alto risco de falhar, com chance de punir o agressor.',
    icon: Swords,
  },
};

const ESQUIVA_ATTRIBUTES: { key: string; label: string }[] = [
  { key: 'agilidade', label: 'Agilidade' },
  { key: 'inteligência', label: 'Inteligência' },
  { key: 'presença', label: 'Presença' },
];

const APARAR_ATTRIBUTES: { key: string; label: string }[] = [
  { key: 'força', label: 'Força' },
  { key: 'agilidade', label: 'Agilidade' },
];

function spawnResultBurst(x: number, y: number) {
  const particles: HTMLDivElement[] = [];
  const count = 20;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'hope-particle';
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    document.body.appendChild(p);
    particles.push(p);
  }
  anime({
    targets: particles,
    translateX: () => anime.random(-150, 150),
    translateY: () => anime.random(-150, 150),
    scale: [1, 0],
    opacity: [1, 0],
    duration: () => anime.random(700, 1100),
    easing: 'easeOutExpo',
    complete: () => particles.forEach((p) => p.remove()),
  });

  const ring = document.createElement('div');
  ring.className = 'hope-shockwave';
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  document.body.appendChild(ring);
  anime({
    targets: ring,
    scale: [0.4, 8],
    opacity: [0.9, 0],
    duration: 700,
    easing: 'easeOutExpo',
    complete: () => ring.remove(),
  });
}

interface DieBoxProps {
  value: number | null;
  dim?: boolean;
  strike?: boolean;
  pulseRed?: boolean;
  small?: boolean;
  dieClass?: string;
}

function DieBox({ value, dim, strike, pulseRed, small, dieClass }: DieBoxProps) {
  return (
    <div
      className={`adf-die relative flex items-center justify-center border font-display transition-all rotate-45 mx-2 my-2 ${
        small ? 'w-10 h-10 text-sm border-[1px]' : 'w-16 h-16 text-2xl border-[1.5px]'
      } ${
        pulseRed
          ? 'border-[#ACBFA4] text-[#ACBFA4] bg-[#ACBFA4]/20 shadow-[0_0_20px_rgba(172,191,164,0.5)] scale-110'
          : dim
          ? 'border-[#ACBFA4]/30 text-[#ACBFA4]/40 bg-black/40'
          : 'border-[#ACBFA4]/50 text-[#ACBFA4] bg-black/60 shadow-[inset_0_0_10px_rgba(172,191,164,0.2)]'
      } ${dieClass ?? ''}`}
    >
      <span className="-rotate-45 drop-shadow-[0_0_5px_currentColor]">{value ?? '-'}</span>
      {strike && (
        <span className="adf-strike pointer-events-none absolute left-1/2 top-1/2 h-[2px] w-[140%] bg-[#ACBFA4]/50 origin-center -translate-x-1/2 -translate-y-1/2 rotate-0 scale-x-0" />
      )}
    </div>
  );
}

export function ActiveDefenseOverlay({
  open,
  defenseType,
  onClose,
  onSpendCharge,
  onApplyDamage,
  fortitudeDie,
  reflexosDie,
  lutaDie,
  protectionCategory,
  attributeValues,
  passiveEvasion,
  meleeWeapons,
}: ActiveDefenseOverlayProps) {
  const [phase, setPhase] = useState<Phase>('input');
  const [chosenAttribute, setChosenAttribute] = useState<string | null>(null);
  const [chosenWeaponId, setChosenWeaponId] = useState<string | null>(null);
  const [attackerTotalInput, setAttackerTotalInput] = useState('');
  const [attackerRawDamageInput, setAttackerRawDamageInput] = useState('');
  const [attackerDiceInputs, setAttackerDiceInputs] = useState<string[]>(['', '']);
  const [enemyDamageDiceCount, setEnemyDamageDiceCount] = useState(1);
  const [chosenArmorType, setChosenArmorType] = useState<'light' | 'heavy' | null>(null);
  const [spinningDice, setSpinningDice] = useState<number[]>([]);
  const [spinningDiceSides, setSpinningDiceSides] = useState<number[]>([]);

  const [bloqueioResult, setBloqueioResult] = useState<BloqueioResult | null>(null);
  const [esquivaResult, setEsquivaResult] = useState<EsquivaResult | null>(null);
  const [apararResult, setApararResult] = useState<{
    yourDice: [number, number];
    yourTotal: number;
    counter: { rolls: number[]; total: number } | null;
  } | null>(null);
  const [showBrecha, setShowBrecha] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const brechaStampRef = useRef<HTMLDivElement>(null);
  const missTextRef = useRef<HTMLDivElement>(null);
  const diceContainerRef = useRef<HTMLDivElement>(null);

  // Reset ao abrir com um novo tipo de defesa
  useEffect(() => {
    if (!open || !defenseType) return;
    setPhase('input');
    setChosenAttribute(null);
    setChosenWeaponId(meleeWeapons.length === 1 ? meleeWeapons[0].id : null);
    setAttackerTotalInput('');
    setAttackerRawDamageInput('');
    setAttackerDiceInputs(defenseType === 'bloqueio' ? ['', ''] : ['', '']);
    setEnemyDamageDiceCount(1);
    setChosenArmorType(protectionCategory === 'heavy' ? 'heavy' : 'light');
    setBloqueioResult(null);
    setEsquivaResult(null);
    setApararResult(null);
    setShowBrecha(false);
  }, [open, defenseType]);

  useEffect(() => {
    if (open && panelRef.current) {
      anime({
        targets: panelRef.current,
        opacity: [0, 1],
        scale: [0.94, 1],
        duration: 200,
        easing: 'easeOutExpo',
      });
      anime({
        targets: '.adf-title-panel',
        opacity: [0, 1],
        translateX: [-40, 0],
        duration: 350,
        delay: 100,
        easing: 'easeOutExpo',
      });
    }
  }, [open, defenseType]);

  useEffect(() => {
    if (phase !== 'reveal') return;

    anime({
      targets: '.adf-die',
      scale: [1.3, 1],
      duration: 250,
      delay: anime.stagger(40),
      easing: 'easeOutBack',
    });
    anime({
      targets: '.adf-die',
      boxShadow: [
        '0 0 0px rgba(172,191,164,0)',
        '0 0 16px rgba(172,191,164,0.85)',
        '0 0 4px rgba(172,191,164,0.4)',
      ],
      duration: 300,
      delay: anime.stagger(40),
      easing: 'easeOutQuad',
    });

    if (bloqueioResult) {
      anime({
        targets: '.adf-strike',
        scaleX: [0, 1],
        duration: 300,
        delay: anime.stagger(80, { start: 300 }),
        easing: 'easeInOutQuad',
      });
    }

    if ((defenseType === 'esquiva' || defenseType === 'bloqueio') && missTextRef.current) {
      anime.remove(missTextRef.current);
      anime({
        targets: missTextRef.current,
        opacity: [0, 1],
        scale: [1.28, 1],
        duration: 180,
        delay: 450,
        easing: 'easeOutExpo',
      });
      if (diceContainerRef.current) {
        anime.remove(diceContainerRef.current);
        anime({
          targets: diceContainerRef.current,
          opacity: [1, 0],
          scale: [1, 0.9],
          duration: 150,
          delay: 350,
          easing: 'easeInExpo',
        });
      }
    }

    if (apararResult?.brecha) {
      const timer = setTimeout(() => {
        setShowBrecha(true);
        if (panelRef.current) {
          const rect = panelRef.current.getBoundingClientRect();
          spawnResultBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [phase, bloqueioResult, esquivaResult, apararResult]);

  useEffect(() => {
    if (showBrecha && brechaStampRef.current) {
      anime({
        targets: brechaStampRef.current,
        opacity: [0, 1],
        scale: [1.3, 1],
        duration: 380,
        easing: 'easeOutExpo',
      });
    }
  }, [showBrecha]);

  if (!open || !defenseType) return null;

  const info = DEFENSE_INFO[defenseType];
  const Icon = info.icon;

  const spinDice = (sidesList: number[], onDone: () => void) => {
    setSpinningDiceSides(sidesList);
    setSpinningDice(sidesList.map((s) => rollDie(s)));
    const duration = 750;
    const start = Date.now();
    let r = requestAnimationFrame(function loop() {
      const now = Date.now();
      if (now - start > duration) {
        onDone();
        return;
      }
      if (Math.random() < 0.3) {
        setSpinningDice(sidesList.map((s) => rollDie(s)));
      }
      r = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(r);
  };

  const canRoll = (() => {
    if (phase !== 'input') return false;
    if (defenseType === 'esquiva') return chosenAttribute !== null;
    if (defenseType === 'bloqueio') return chosenArmorType !== null;
    if (defenseType === 'aparar') {
      return chosenAttribute !== null && chosenWeaponId !== null;
    }
    return true;
  })();

  const handleRolar = () => {
    if (!canRoll) return;
    onSpendCharge();
    setPhase('rolling');

    if (defenseType === 'esquiva') {
      const attrValue = attributeValues[chosenAttribute!] ?? 0;
      spinDice([6, reflexosDie ?? 6], () => {
        const attributeDie = rollAttributeDie(attrValue);
        const reflexosRoll = rollDie(reflexosDie ?? 6);
        const result = resolveEsquiva({
          protectionCategory: protectionCategory === 'heavy' ? 'none' : protectionCategory,
          attributeDie,
          reflexosDie: reflexosRoll,
          attackerTotal: 0,
          passiveEvasion,
        });
        setEsquivaResult(result);
        setPhase('reveal');
      });
      return;
    }

    if (defenseType === 'bloqueio') {
      const blockDiceCount = Math.max(
        1,
        chosenArmorType === 'light' ? Math.floor(enemyDamageDiceCount / 2) : Math.ceil(enemyDamageDiceCount / 2)
      );
      const die = fortitudeDie ?? 6;
      spinDice(
        Array.from({ length: blockDiceCount }, () => die),
        () => {
          const result = resolveBloqueio({
            protectionCategory: chosenArmorType ?? 'light',
            fortitudeDie: die,
            attackerDiceCount: enemyDamageDiceCount,
          });
          setBloqueioResult(result);
          setPhase('reveal');
        }
      );
      return;
    }

    if (defenseType === 'aparar') {
      const attrValue = attributeValues[chosenAttribute!] ?? 0;
      spinDice([6, lutaDie ?? 6], () => {
        const attributeDie = rollAttributeDie(attrValue);
        const lutaRoll = rollDie(lutaDie ?? 6);
        const yourTotal = attributeDie + lutaRoll;

        setApararResult({ yourDice: [attributeDie, lutaRoll], yourTotal, counter: null });
        setPhase('reveal');
      });
    }
  };

  const handleRollBrecha = () => {
    if (!apararResult || !chosenAttribute) return;
    const attrValue = attributeValues[chosenAttribute] ?? 0;
    const weapon = meleeWeapons.find((w) => w.id === chosenWeaponId);
    if (weapon) {
      const counter = rollCounterAttackDamage({
        damageDiceCount: weapon.damageDiceCount,
        damageDiceSides: weapon.damageDiceSides,
        attributeValue: attrValue,
      });
      setApararResult({ ...apararResult, counter });
      setShowBrecha(true);
      if (panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect();
        spawnResultBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
    }
  };

  const handleDiceCountChange = (delta: number) => {
    setAttackerDiceInputs((prev) => {
      const next = Math.max(1, Math.min(8, prev.length + delta));
      if (next > prev.length) {
        return [...prev, ...Array.from({ length: next - prev.length }, () => '')];
      }
      return prev.slice(0, next);
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center gap-12 lg:gap-24 p-4 overflow-hidden">
      
      <div className="hidden lg:flex flex-col justify-center items-end opacity-0 pointer-events-none select-none max-w-xl shrink-0 adf-title-panel text-right">
        <Icon size={80} className="text-[#ACBFA4] mb-4 opacity-50" />
        <h1 className="text-6xl xl:text-[6rem] font-display text-[#ACBFA4] uppercase tracking-tighter font-black leading-none drop-shadow-[0_0_15px_rgba(172,191,164,0.5)]">
          {info.title}
        </h1>
        <div className="h-1 w-32 bg-[#ACBFA4]/80 mt-4 mb-6 rounded-full transition-all duration-300 mr-2" />
        <p className="text-[#ACBFA4]/90 font-mono text-sm max-w-sm uppercase tracking-widest leading-relaxed mr-2">
          {info.flavor}
        </p>
      </div>

      <div
        ref={panelRef}
        className="relative w-full max-w-md flex flex-col items-center opacity-0 shrink-0"
      >
        <div className="flex items-center justify-between w-full mb-6">
          <h3 className="font-display text-lg text-[#ACBFA4] uppercase tracking-widest lg:hidden">
            {info.title}
          </h3>
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 border border-[#ACBFA4]/50 text-[#ACBFA4] hover:bg-[#ACBFA4] hover:text-black transition-colors uppercase font-bold z-10 ml-auto"
            aria-label="Fechar"
          >
            Cancelar
          </button>
        </div>

        <div className="w-full">
        {phase === 'input' && (
          <div className="space-y-4">
            {defenseType === 'esquiva' && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#ACBFA4]">Atributo utilizado</label>
                <div className="flex justify-center gap-4 mt-2">
                  {ESQUIVA_ATTRIBUTES.map((a) => (
                    <button
                      key={a.key}
                      onClick={() => setChosenAttribute(a.key)}
                      className={`relative overflow-hidden group py-3 px-6 text-xs font-bold uppercase tracking-widest transition-all skew-x-[-15deg] ${
                        chosenAttribute === a.key
                          ? 'text-black bg-[#ACBFA4] shadow-[0_0_15px_rgba(172,191,164,0.6)]'
                          : 'text-[#ACBFA4] border border-[#ACBFA4]/30 bg-black/50 hover:border-[#ACBFA4]/80 hover:bg-[#ACBFA4]/10 hover:shadow-[0_0_10px_rgba(172,191,164,0.3)]'
                      }`}
                    >
                      <span className="block skew-x-[15deg]">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {defenseType === 'aparar' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#ACBFA4]">Atributo utilizado</label>
                  <div className="flex justify-center gap-4 mt-2">
                    {APARAR_ATTRIBUTES.map((a) => (
                      <button
                        key={a.key}
                        onClick={() => setChosenAttribute(a.key)}
                        className={`relative overflow-hidden group py-3 px-6 text-xs font-bold uppercase tracking-widest transition-all skew-x-[-15deg] ${
                          chosenAttribute === a.key
                            ? 'text-black bg-[#ACBFA4] shadow-[0_0_15px_rgba(172,191,164,0.6)]'
                            : 'text-[#ACBFA4] border border-[#ACBFA4]/30 bg-black/50 hover:border-[#ACBFA4]/80 hover:bg-[#ACBFA4]/10 hover:shadow-[0_0_10px_rgba(172,191,164,0.3)]'
                        }`}
                      >
                        <span className="block skew-x-[15deg]">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {meleeWeapons.length > 1 && (
                  <div className="space-y-1 mt-6">
                    <label className="text-[10px] uppercase font-bold text-[#ACBFA4]">Arma (Para possível Contra-Ataque)</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {meleeWeapons.map((w) => (
                        <button
                          key={w.id}
                          onClick={() => setChosenWeaponId(w.id)}
                          className={`py-3 text-[10px] font-bold uppercase border transition-colors skew-x-[-15deg] ${
                            chosenWeaponId === w.id
                              ? 'bg-[#ACBFA4] text-black border-[#ACBFA4] shadow-[0_0_10px_rgba(172,191,164,0.4)]'
                              : 'border-[#ACBFA4]/50 text-[#ACBFA4] hover:bg-[#ACBFA4]/10 hover:border-[#ACBFA4]'
                          }`}
                        >
                          <span className="block skew-x-[15deg]">{w.name || 'Arma sem nome'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {defenseType === 'bloqueio' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#ACBFA4]">Proteção Utilizada</label>
                  <div className="flex justify-center gap-4 mt-2">
                    <button
                      onClick={() => setChosenArmorType('light')}
                      className={`relative overflow-hidden group py-3 px-6 text-xs font-bold uppercase tracking-widest transition-all skew-x-[-15deg] ${
                        chosenArmorType === 'light'
                          ? 'text-black bg-[#ACBFA4] shadow-[0_0_15px_rgba(172,191,164,0.6)]'
                          : 'text-[#ACBFA4] border border-[#ACBFA4]/30 bg-black/50 hover:border-[#ACBFA4]/80 hover:bg-[#ACBFA4]/10 hover:shadow-[0_0_10px_rgba(172,191,164,0.3)]'
                      }`}
                    >
                      <span className="block skew-x-[15deg]">Leve</span>
                    </button>
                    <button
                      onClick={() => setChosenArmorType('heavy')}
                      className={`relative overflow-hidden group py-3 px-6 text-xs font-bold uppercase tracking-widest transition-all skew-x-[-15deg] ${
                        chosenArmorType === 'heavy'
                          ? 'text-black bg-[#ACBFA4] shadow-[0_0_15px_rgba(172,191,164,0.6)]'
                          : 'text-[#ACBFA4] border border-[#ACBFA4]/30 bg-black/50 hover:border-[#ACBFA4]/80 hover:bg-[#ACBFA4]/10 hover:shadow-[0_0_10px_rgba(172,191,164,0.3)]'
                      }`}
                    >
                      <span className="block skew-x-[15deg]">Pesada</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1 mt-6">
                  <div className="flex flex-col items-center gap-2">
                    <label className="text-[10px] uppercase font-bold text-[#ACBFA4]">
                      Qtd. de Dados de Dano do Inimigo
                    </label>
                    <div className="flex items-center gap-4 bg-black/50 border border-[#ACBFA4]/30 p-2">
                      <button
                        onClick={() => setEnemyDamageDiceCount(Math.max(1, enemyDamageDiceCount - 1))}
                        className="w-10 h-10 flex items-center justify-center text-xl font-bold border border-[#ACBFA4]/60 text-[#ACBFA4] hover:bg-[#ACBFA4]/10 transition-colors"
                      >
                        -
                      </button>
                      <span className="font-display text-4xl text-[#ACBFA4] w-12 text-center drop-shadow-[0_0_8px_rgba(172,191,164,0.5)]">
                        {enemyDamageDiceCount}
                      </span>
                      <button
                        onClick={() => setEnemyDamageDiceCount(Math.min(20, enemyDamageDiceCount + 1))}
                        className="w-10 h-10 flex items-center justify-center text-xl font-bold border border-[#ACBFA4]/60 text-[#ACBFA4] hover:bg-[#ACBFA4]/10 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            <button
              onClick={handleRolar}
              disabled={!canRoll}
              className="group relative w-full py-4 mt-6 overflow-hidden bg-black border border-[#ACBFA4]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <div className="absolute inset-0 bg-[#ACBFA4]/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative text-[#ACBFA4] group-hover:text-white font-display text-xl uppercase tracking-widest drop-shadow-[0_0_8px_rgba(172,191,164,0.5)]">
                Rolar {info.title}
              </span>
            </button>
          </div>
        )}

        {phase === 'rolling' && (
          <div className="py-12 flex flex-col items-center gap-8">
            <div className="flex flex-wrap justify-center gap-4">
              {spinningDice.map((v, i) => (
                <DieBox key={i} value={v} small={spinningDiceSides.length > 3} />
              ))}
            </div>
            <span className="text-[#ACBFA4] text-xs uppercase tracking-widest animate-pulse mt-4">Calculando destino...</span>
          </div>
        )}

        {phase === 'reveal' && defenseType === 'esquiva' && esquivaResult && (
          <div className="space-y-12">
            <div ref={diceContainerRef} className="flex justify-center items-end gap-12 mt-6">
              <div className={`flex flex-col items-center gap-4 transition-all duration-700 ${esquivaResult.usedDie === esquivaResult.attributeDie ? 'scale-110' : 'scale-75 opacity-40 blur-[2px] grayscale'}`}>
                <span className="text-[10px] uppercase font-bold text-[#ACBFA4]/70 tracking-widest">
                  {ESQUIVA_ATTRIBUTES.find((a) => a.key === chosenAttribute)?.label}
                </span>
                <DieBox
                  value={esquivaResult.attributeDie}
                  pulseRed={esquivaResult.usedDie === esquivaResult.attributeDie && esquivaResult.attributeDie >= esquivaResult.reflexosDie}
                />
              </div>
              <div className={`flex flex-col items-center gap-4 transition-all duration-700 ${esquivaResult.usedDie === esquivaResult.reflexosDie && esquivaResult.reflexosDie > esquivaResult.attributeDie ? 'scale-110' : 'scale-75 opacity-40 blur-[2px] grayscale'}`}>
                <span className="text-[10px] uppercase font-bold text-[#ACBFA4]/70 tracking-widest">Reflexos</span>
                <DieBox
                  value={esquivaResult.reflexosDie}
                  pulseRed={esquivaResult.usedDie === esquivaResult.reflexosDie && esquivaResult.reflexosDie > esquivaResult.attributeDie}
                />
              </div>
            </div>
          </div>
        )}

        {phase === 'reveal' && defenseType === 'bloqueio' && bloqueioResult && (
          <div className="space-y-12">
            <div ref={diceContainerRef} className="flex justify-center items-end gap-6 mt-6">
              {bloqueioResult.fortitudeRolls.map((v, i) => (
                <div key={i} className="flex flex-col items-center gap-4 transition-all duration-700">
                  <span className="text-[10px] uppercase font-bold text-[#ACBFA4]/70 tracking-widest">Fortitude</span>
                  <DieBox value={v} pulseRed />
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === 'reveal' && defenseType === 'aparar' && apararResult && (
          <div className="space-y-12">
            <div className="flex flex-col items-center gap-6 mt-6">
              <span className="text-[10px] uppercase font-bold text-[#ACBFA4]/70 tracking-widest text-center">
                Seu Resultado Total (Para o Choque de Armas)
              </span>
              <span className="font-display text-[#ACBFA4] text-7xl md:text-8xl tracking-widest drop-shadow-[0_0_20px_rgba(172,191,164,0.8)]">
                {apararResult.yourTotal}
              </span>
            </div>
            <div className="flex flex-col items-center gap-4">
              <span className="text-[10px] uppercase font-bold text-[#ACBFA4]/70 tracking-widest text-center">
                Seus Dados (Para procurar Brecha)
              </span>
              <div className="flex justify-center items-end gap-6">
                <div className="flex flex-col items-center gap-4">
                  <span className="text-[10px] uppercase font-bold text-[#ACBFA4]/50">
                    {APARAR_ATTRIBUTES.find((a) => a.key === chosenAttribute)?.label}
                  </span>
                  <DieBox value={apararResult.yourDice[0]} />
                </div>
                <div className="flex flex-col items-center gap-4">
                  <span className="text-[10px] uppercase font-bold text-[#ACBFA4]/50">Luta</span>
                  <DieBox value={apararResult.yourDice[1]} />
                </div>
              </div>
            </div>

            {!apararResult.counter && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={handleRollBrecha}
                  className="group relative w-full max-w-xs py-4 overflow-hidden bg-primary/20 border border-primary/50 transition-all hover:bg-primary/40 hover:border-primary shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)]"
                >
                  <div className="absolute inset-0 bg-primary/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative text-primary font-display text-sm uppercase tracking-widest group-hover:text-white">
                    Encontrei uma Brecha!
                  </span>
                </button>
              </div>
            )}

            {apararResult.counter && showBrecha && (
              <div
                ref={brechaStampRef}
                className="opacity-0 flex flex-col items-center gap-4 border-t border-primary/40 pt-6 mt-6"
              >
                <div className="font-display text-3xl md:text-4xl text-primary uppercase tracking-[0.15em] drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">
                  Contra-Ataque!
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[#ACBFA4] text-xs uppercase tracking-widest">Dano Causado</span>
                  <span className="font-display text-primary text-5xl drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]">
                    {apararResult.counter.total}
                  </span>
                </div>
                <div className="text-[10px] text-[#ACBFA4]/60 uppercase font-mono tracking-wider">
                  ({apararResult.counter.rolls.join(' + ')} dados + atributo)
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 'reveal' && defenseType === 'esquiva' && esquivaResult && (
          <div
            ref={missTextRef}
            className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center text-center px-6 opacity-0"
          >
            <div className="absolute w-64 h-64 rounded-full bg-[#ACBFA4]/20 blur-3xl" />
            <span className="relative font-display text-[#ACBFA4] text-5xl md:text-6xl uppercase tracking-widest drop-shadow-[0_0_20px_rgba(172,191,164,0.8)]">
              ESQUIVA +{esquivaResult.usedDie}
            </span>
          </div>
        )}

        {phase === 'reveal' && defenseType === 'bloqueio' && bloqueioResult && (
          <div
            ref={missTextRef}
            className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center text-center px-6 opacity-0"
          >
            <div className="absolute w-[400px] h-[400px] rounded-full bg-[#ACBFA4]/20 blur-3xl" />
            <span className="relative text-[#ACBFA4] uppercase font-bold tracking-[0.2em] mb-2 drop-shadow-[0_0_8px_rgba(172,191,164,0.8)]">
              Anula dados até
            </span>
            <div className="relative flex flex-wrap justify-center gap-4 md:gap-6 mt-2 items-center">
              {bloqueioResult.fortitudeRolls.map((v, i) => (
                <div key={i} className="flex items-center gap-4 md:gap-6">
                  <span className="font-display text-[#ACBFA4] text-6xl md:text-7xl drop-shadow-[0_0_20px_rgba(172,191,164,0.8)]">
                    {v + (bloqueioResult.protectionCategory === 'heavy' ? 1 : 0)}
                  </span>
                  {i < bloqueioResult.fortitudeRolls.length - 1 && (
                    <span className="text-[#ACBFA4]/30 text-4xl md:text-5xl drop-shadow-[0_0_10px_rgba(172,191,164,0.5)]">
                      •
                    </span>
                  )}
                </div>
              ))}
            </div>
            {bloqueioResult.protectionCategory === 'heavy' && (
              <span className="relative mt-8 text-[10px] uppercase text-[#ACBFA4]/80 font-mono bg-[#ACBFA4]/10 px-3 py-1 border border-[#ACBFA4]/30">
                +1 Bônus Pesado Incluído
              </span>
            )}
          </div>
        )}

        {phase === 'reveal' && (
          <div className="w-full mt-10">
            <button
              onClick={onClose}
              className="group relative w-full py-4 overflow-hidden bg-black border border-[#ACBFA4]/50 transition-all"
            >
              <div className="absolute inset-0 bg-[#ACBFA4]/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative text-[#ACBFA4] group-hover:text-white font-display text-sm uppercase tracking-widest drop-shadow-[0_0_8px_rgba(172,191,164,0.5)]">
                Concluir Reação
              </span>
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default ActiveDefenseOverlay;
