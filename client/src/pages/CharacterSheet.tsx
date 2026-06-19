import { useCallback, useEffect, useRef, useState } from 'react';
import { Settings, X } from 'lucide-react';
import AttributeHexagon from '@/components/AttributeHexagon';
import SkillsList from '@/components/SkillsList';
import DiceRoller from '@/components/DiceRoller';
import VitalStats from '@/components/VitalStats';
import Pericias from '@/components/Pericias';
import HopeCounter from '@/components/HopeCounter';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { TensaoOverlay } from '@/components/TensaoOverlay';
import EvasionPanel, { type EvasionProtection } from '@/components/EvasionPanel';
import InventoryPanel from '@/components/InventoryPanel';
import InsanityPanel from '@/components/InsanityPanel';
import RitualsPanel from '@/components/RitualsPanel';
import ConjurationOverlay from '@/components/ConjurationOverlay';
import SaveLoad from '@/components/SaveLoad';
import CharacterManager from '@/components/CharacterManager';
import { FearRouletteOverlay } from '@/components/FearRouletteOverlay';
import fearEffects, { type FearEffect } from '@/data/fear';
import type { Card, HandGrade, SpellEffect } from '@/utils/pokerLogic';

/**
 * Dark Occult Minimalism - Ficha de RPG Daggerheart
 * 
 * Estrutura:
 * - Topo: Nome do personagem
 * - Abaixo do nome: Vitals + Hope Counter
 * - Coluna esquerda: Atributos em hexágonos vermelhos
 * - Centro: Habilidades com scroll fixo, Expertises abaixo com scroll
 * - Direita: Rolagem de dados + Menu retrátil (Inventário/Equipamentos)
 */

interface Skill {
  id: string;
  name: string;
  origin: string;
  cost: string;
  effect: string;
}

interface Pericia {
  id: string;
  name: string;
  training: 'treinado' | 'veterano' | 'expert';
  isGeneric?: boolean;
}

interface InventoryItem {
  id: string;
  name: string;
  description: string;
}

interface WeaponTag {
  id: string;
  name: string;
  description: string;
}

interface Weapon {
  id: string;
  name: string;
  category: string;
  damageDiceCount: number;
  damageDiceSides: number;
  criticalThreshold: number;
  criticalMultiplier: number;
  skill: string;
  attribute: string;
  hasExtraEffect: boolean;
  extraEffect?: string;
  isActive?: boolean;
  tags: WeaponTag[];
}

interface DamageRollRequest {
  id: number;
  weaponName: string;
  diceCount: number;
  diceType: number;
  modifier: number;
}

interface Insanity {
  id: string;
  name: string;
  description: string;
  type: 'fobia' | 'mania' | 'surto';
  compulsoes?: number;
}

type AttributeKey = 'força' | 'agilidade' | 'inteligência' | 'presença' | 'vigor' | 'vontade';

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

interface FearRouletteState {
  isOpen: boolean;
  isRolling: boolean;
  displayIndex: number;
  finalEffect: FearEffect | null;
  dice: [number, number] | null;
  total: number;
  bonus: number;
  pendingTag: ActiveFearTag | null;
}

interface ParanormalPower {
  id: string;
  name: string;
  description: string;
}

type RitualType = 'dano' | 'aflicao' | 'suporte';

interface RitualVersion {
  name: string;
  circle: string;
  cost: string;
  duration: string;
  resistance: number;
  type: RitualType;
  description: string;
  retained: boolean;
}

interface Ritual {
  id: string;
  versions: RitualVersion[];
  activeVersion: number;
  slotIndex?: number;
}

interface PokerConjureState {
  ritualId: string;
  turn: 1 | 2 | 3;
  phase: 'draw' | 'discard_roll' | 'discard_select' | 'omen_select' | 'decision' | 'showdown' | 'resolved' | 'immediate_showdown';
  deck: Card[];
  hand: Card[];
  discardLimit: number;
  selectedCards: string[]; // card IDs
  handGrade?: HandGrade;
  spellEffect?: SpellEffect;
  targetDT?: number;
}

interface LoadedRitual extends Partial<Omit<Ritual, 'versions'>> {
  name?: string;
  circle?: string;
  cost?: string;
  duration?: string;
  resistance?: number;
  type?: RitualType;
  description?: string;
  retained?: boolean;
  versions?: Array<Partial<RitualVersion>>;
}

interface CharacterData {
  name: string;
  attributes: {
    força: number;
    agilidade: number;
    inteligência: number;
    presença: number;
    vigor: number;
    vontade: number;
  };
  skills: Skill[];
  pericias: Pericia[];
  hp: { current: number; max: number };
  sanity: { current: number; max: number };
  hope: number;
  evasion: {
    protection: EvasionProtection;
    defensiveCharges: number;
    maxDefensiveCharges: number;
  };
  inventory: InventoryItem[];
  weapons: Weapon[];
  insanities: Insanity[];
  paranormalPowers: ParanormalPower[];
  rituals: Ritual[];
  activeFearTags: ActiveFearTag[];
}

interface SkillRollRequest {
  id: number;
  periciaName: string;
  attributeLabel: string;
  trainingLabel: string;
  attributeValue: number;
  trainingDie: number;
  weaponName?: string;
  criticalThreshold?: number;
  criticalMultiplier?: number;
  damageDiceCount?: number;
  damageDiceSides?: number;
  modifier?: number;
  isAnsiedadeActive?: boolean;
}

const ATTRIBUTE_KEYS: Array<keyof CharacterData['attributes']> = [
  'força',
  'agilidade',
  'inteligência',
  'presença',
  'vigor',
  'vontade',
];

const ATTRIBUTE_LABELS: Record<keyof CharacterData['attributes'], string> = {
  força: 'Forca',
  agilidade: 'Agilidade',
  inteligência: 'Inteligencia',
  presença: 'Presenca',
  vigor: 'Vigor',
  vontade: 'Vontade',
};

const TRAINING_DIE_MAP: Record<Pericia['training'], number> = {
  treinado: 6,
  veterano: 8,
  expert: 10,
};

const TRAINING_DICE_STEPS = [4, 6, 8, 10] as const;

const getTrainingLabelForDie = (trainingDie: number): string => {
  switch (trainingDie) {
    case 4:
      return 'Sem treino (1d4)';
    case 6:
      return 'Treinado (1d6)';
    case 8:
      return 'Veterano (1d8)';
    case 10:
      return 'Expert (1d10)';
    default:
      return `1d${trainingDie}`;
  }
};

const getReducedTrainingDie = (trainingDie: number): number => {
  const currentIndex = TRAINING_DICE_STEPS.indexOf(trainingDie as (typeof TRAINING_DICE_STEPS)[number]);
  if (currentIndex <= 0) {
    return TRAINING_DICE_STEPS[0];
  }

  return TRAINING_DICE_STEPS[currentIndex - 1];
};

const SKILL_DICE: Record<string, number> = {
  'Luta': 6,
  'Pontaria': 8,
  'Ocultismo': 10,
};

const GENERIC_PERICIA_ID = '0';
const GENERIC_PERICIA_NAME = 'Teste sem treinamento';

const createInitialFearRouletteState = (): FearRouletteState => ({
  isOpen: false,
  isRolling: false,
  displayIndex: 0,
  finalEffect: null,
  dice: null,
  total: 0,
  bonus: 0,
  pendingTag: null,
});

const ensureGenericPericia = (pericias: Pericia[]): Pericia[] => {
  const genericPericia: Pericia = {
    id: GENERIC_PERICIA_ID,
    name: GENERIC_PERICIA_NAME,
    training: 'treinado',
    isGeneric: true,
  };

  const nonGenericPericias = pericias.filter(
    (pericia) => !pericia.isGeneric && pericia.id !== GENERIC_PERICIA_ID
  );

  return [genericPericia, ...nonGenericPericias];
};

export default function CharacterSheet() {
  const [pendingRoll, setPendingRoll] = useState<SkillRollRequest | null>(null);
  const [pendingDamageRoll, setPendingDamageRoll] = useState<DamageRollRequest | null>(null);
  const [openSidebar, setOpenSidebar] = useState<'inventory' | 'insanity' | 'rituals' | null>(null);
  const [pokerConjureState, setPokerConjureState] = useState<PokerConjureState | null>(null);
  const [suspendedConjurations, setSuspendedConjurations] = useState<Record<string, PokerConjureState>>({});
  const [lastConjuredEffect, setLastConjuredEffect] = useState<{ritualId: string, effect: string, type: string} | null>(null);
  const [isConjurationOverlayOpen, setIsConjurationOverlayOpen] = useState(false);
  const [ritualResolveState, setRitualResolveState] = useState<
    | {
        ritualId: string;
        selectedAttribute?: keyof CharacterData['attributes'];
        selectedPericiaId?: string | null;
        isRolling?: boolean;
        rolls?: number[];
        total?: number;
        passed?: boolean;
        difficulty?: number;
      }
    | null
  >(null);
  const [fearRouletteState, setFearRouletteState] = useState<FearRouletteState>(
    createInitialFearRouletteState()
  );
  const [fearResultAttributeChoice, setFearResultAttributeChoice] = useState<AttributeKey | null>(null);
  const [fearSecondaryAttributeChoice, setFearSecondaryAttributeChoice] = useState<AttributeKey | null>(null);
  const [selectedFearTag, setSelectedFearTag] = useState<ActiveFearTag | null>(null);
  const [fearTagPendingRemoval, setFearTagPendingRemoval] = useState<ActiveFearTag | null>(null);
  const [showFearDebug, setShowFearDebug] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    try {
      return localStorage.getItem('odv_auto_save_enabled') !== 'false';
    } catch {
      return true;
    }
  });

  const toggleAutoSave = () => {
    setAutoSaveEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem('odv_auto_save_enabled', String(next));
      } catch {}
      return next;
    });
  };
  const [debugResultTwoAttribute, setDebugResultTwoAttribute] = useState<AttributeKey>('força');
  const [debugDebuffAttribute, setDebugDebuffAttribute] = useState<AttributeKey>('inteligência');
  const fearRouletteIntervalRef = useRef<number | null>(null);
  const fearRouletteTimeoutRef = useRef<number | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [characterId, setCharacterId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('odv_current_character_id');
    } catch {
      return null;
    }
  });
  const [isCloudSaving, setIsCloudSaving] = useState(false);
  const [lastCloudSave, setLastCloudSave] = useState<string | null>(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [character, setCharacter] = useState<CharacterData>({
    name: 'Seu Personagem',
    attributes: {
      força: 0,
      agilidade: 0,
      inteligência: 0,
      presença: 0,
      vigor: 0,
      vontade: 0,
    },
    skills: [],
    pericias: [
      { id: GENERIC_PERICIA_ID, name: GENERIC_PERICIA_NAME, training: 'treinado', isGeneric: true },
      { id: '1', name: 'Luta', training: 'treinado' },
      { id: '2', name: 'Pontaria', training: 'veterano' },
    ],
    hp: { current: 20, max: 20 },
    sanity: { current: 10, max: 10 },
    hope: 3,
    evasion: {
      protection: 'none',
      defensiveCharges: 3,
      maxDefensiveCharges: 2,
    },
    inventory: [],
    weapons: [
      {
        id: '1',
        name: 'Arma 1',
        category: '',
        damageDiceCount: 1,
        damageDiceSides: 6,
        criticalThreshold: 18,
        criticalMultiplier: 2,
        skill: '',
        attribute: '',
        hasExtraEffect: false,
        extraEffect: '',
        isActive: true,
        tags: [],
      },
    ],
    insanities: [],
    paranormalPowers: [],
    rituals: [],
    activeFearTags: [],
  });

  const activeFearTags = character.activeFearTags || [];
  const setActiveFearTags = (updater: React.SetStateAction<ActiveFearTag[]>) => {
    setCharacter((prev) => ({
      ...prev,
      activeFearTags: typeof updater === 'function' ? updater(prev.activeFearTags || []) : updater,
    }));
  };

  useEffect(() => {
    return () => {
      if (fearRouletteIntervalRef.current) {
        clearInterval(fearRouletteIntervalRef.current);
      }
      if (fearRouletteTimeoutRef.current) {
        clearTimeout(fearRouletteTimeoutRef.current);
      }
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Auto-save to cloud with debounce (2s after last change) when characterId exists
  useEffect(() => {
    if (!characterId || !autoSaveEnabled) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const dataToSave = extractCharacterData();
        const res = await fetch(`/api/characters/${characterId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: character.name,
            data: dataToSave,
          }),
        });
        if (res.ok) {
          setLastCloudSave(new Date().toISOString());
        } else {
          console.warn(`[CharacterSheet] Auto-save retornou status ${res.status}`);
        }
      } catch (err) {
        console.warn('[CharacterSheet] Auto-save falhou:', err);
      }
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [character, characterId]);

  const extractCharacterData = useCallback(() => ({
    name: character.name,
    attributes: character.attributes,
    skills: character.skills,
    pericias: character.pericias,
    hp: character.hp,
    sanity: character.sanity,
    hope: character.hope,
    evasion: character.evasion,
    inventory: character.inventory,
    weapons: character.weapons,
    insanities: character.insanities,
    paranormalPowers: character.paranormalPowers,
    rituals: character.rituals,
    activeFearTags: character.activeFearTags,
  }), [character]);

  const handleSaveToCloud = async () => {
    setIsCloudSaving(true);
    try {
      const dataToSave = extractCharacterData();
      if (characterId) {
        // Update existing
        const res = await fetch(`/api/characters/${characterId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: character.name, data: dataToSave }),
        });
        if (!res.ok) throw new Error('Falha ao atualizar');
        const updated = await res.json();
        setLastCloudSave(updated.updated_at);
      } else {
        // Create new
        const res = await fetch('/api/characters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: character.name, data: dataToSave }),
        });
        if (!res.ok) throw new Error('Falha ao criar');
        const created = await res.json();
        setCharacterId(created.id);
        setLastCloudSave(created.updated_at);
        try {
          localStorage.setItem('odv_current_character_id', created.id);
        } catch { /* ignore */ }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      alert(`Erro ao salvar na nuvem: ${msg}`);
      console.error('[CharacterSheet] Erro ao salvar:', err);
    } finally {
      setIsCloudSaving(false);
    }
  };

  const handleOpenFromCloud = (id: string, data: any) => {
    handleLoadCharacter(data, id);
  };

  const handleCreateNew = () => {
    setCharacterId(null);
    setLastCloudSave(null);
    try {
      localStorage.removeItem('odv_current_character_id');
    } catch { /* ignore */ }
    setCharacter({
      name: 'Novo Personagem',
      attributes: { força: 0, agilidade: 0, inteligência: 0, presença: 0, vigor: 0, vontade: 0 },
      skills: [],
      pericias: [
        { id: GENERIC_PERICIA_ID, name: GENERIC_PERICIA_NAME, training: 'treinado', isGeneric: true },
        { id: '1', name: 'Luta', training: 'treinado' },
        { id: '2', name: 'Pontaria', training: 'veterano' },
      ],
      hp: { current: 20, max: 20 },
      sanity: { current: 10, max: 10 },
      hope: 3,
      evasion: { protection: 'none', defensiveCharges: 3, maxDefensiveCharges: 2 },
      inventory: [],
      weapons: [
        {
          id: '1', name: 'Arma 1', category: '', damageDiceCount: 1, damageDiceSides: 6,
          criticalThreshold: 18, criticalMultiplier: 2, skill: '', attribute: '',
          hasExtraEffect: false, extraEffect: '', isActive: true, tags: [],
        },
      ],
      insanities: [],
      paranormalPowers: [],
      rituals: [],
      activeFearTags: [],
    });
  };

  const resolveFearEffect = (total: number): FearEffect => {
    if (total >= 24) {
      return fearEffects.find((effect) => effect.resultado === '24+') ?? fearEffects[fearEffects.length - 1];
    }

    const exact = fearEffects.find((effect) => effect.resultado === String(total));
    return exact ?? fearEffects[0];
  };

  const getFearModifierForAttribute = (attribute: AttributeKey): number => {
    return activeFearTags.reduce((sum, tag) => {
      switch (tag.effectResult) {
        case '2':
          return tag.selectedAttribute === attribute ? sum + 1 : sum;
        case '3':
          if (tag.selectedAttribute === attribute) return sum + 1;
          if (tag.secondaryAttribute === attribute) return sum - 1;
          return sum;
        case '4':
          return attribute === 'inteligência' ? sum - 1 : sum;
        case '5':
          return attribute === 'agilidade' ? sum - 1 : sum;
        case '6':
          return attribute === 'força' ? sum - 1 : sum;
        case '8':
          return attribute === 'presença' ? sum - 1 : sum;
        case '10':
          return attribute === 'vontade' ? sum - 1 : sum;
        default:
          return sum;
      }
    }, 0);
  };

  const getEffectiveAttributeValue = (attribute: AttributeKey): number => {
    const base = character.attributes[attribute] ?? 0;
    const modified = base + getFearModifierForAttribute(attribute);
    return Math.max(0, Math.min(5, modified));
  };



  const getFearAdjustedTrainingDie = (trainingDie: number, skillName: string) => {
    const isPanicoSomatico = activeFearTags.some((tag) => tag.effectResult === '16');
    const isTremor = activeFearTags.some((tag) => tag.effectResult === '7');
    
    const normalizedName = skillName.toLowerCase();
    const isAffectedByTremor = normalizedName.includes('furtividade') || normalizedName.includes('enganação') || normalizedName.includes('enganacao');
    
    let stepsToReduce = 0;
    if (isPanicoSomatico) stepsToReduce += 1;
    if (isTremor && isAffectedByTremor) stepsToReduce += 1;

    let finalDie = trainingDie;
    for (let i = 0; i < stepsToReduce; i++) {
      finalDie = getReducedTrainingDie(finalDie);
    }
    return finalDie;
  };

  const getFearAdjustedTrainingLevel = (trainingLevel: string, skillName: string): string => {
    const isPanicoSomatico = activeFearTags.some((tag) => tag.effectResult === '16');
    const isTremor = activeFearTags.some((tag) => tag.effectResult === '7');
    
    const normalizedName = skillName.toLowerCase();
    const isAffectedByTremor = normalizedName.includes('furtividade') || normalizedName.includes('enganação') || normalizedName.includes('enganacao');
    
    let stepsToReduce = 0;
    if (isPanicoSomatico) stepsToReduce += 1;
    if (isTremor && isAffectedByTremor) stepsToReduce += 1;

    const levels = ['destreinado', 'treinado', 'veterano', 'expert'];
    let currentIndex = levels.indexOf(trainingLevel);
    if (currentIndex === -1) currentIndex = 0;
    
    currentIndex = Math.max(0, currentIndex - stepsToReduce);
    return levels[currentIndex];
  };

  const getFearModifierForSkillRoll = (skillName: string) => {
    const isHisteria = activeFearTags.some((tag) => tag.effectResult === '8');
    const normalizedName = skillName.toLowerCase();
    const isAffectedByHisteria = normalizedName.includes('furtividade') || 
                                  normalizedName.includes('enganação') || 
                                  normalizedName.includes('enganacao') || 
                                  normalizedName.includes('diplomacia') || 
                                  normalizedName.includes('intimidação') ||
                                  normalizedName.includes('intimidacao');
                                  
    return isHisteria && isAffectedByHisteria ? -3 : 0;
  };

  const isFearAffectedSkill = (skillName: string): boolean => {
    const isPanicoSomatico = activeFearTags.some((tag) => tag.effectResult === '16');
    if (isPanicoSomatico) return true;
    
    const isTremor = activeFearTags.some((tag) => tag.effectResult === '7');
    const isHisteria = activeFearTags.some((tag) => tag.effectResult === '8');
    
    const normalizedName = skillName.toLowerCase();
    if (isTremor && (normalizedName.includes('furtividade') || normalizedName.includes('enganação') || normalizedName.includes('enganacao'))) return true;
    if (isHisteria && (normalizedName.includes('furtividade') || normalizedName.includes('enganação') || normalizedName.includes('enganacao') || normalizedName.includes('diplomacia') || normalizedName.includes('intimidação') || normalizedName.includes('intimidacao'))) return true;
    
    return false;
  };

  const isFear8Active = activeFearTags.some((tag) => tag.effectResult === '8');

  const isFearAffectedAttribute = (attribute: AttributeKey): boolean => {
    return activeFearTags.some((tag) => {
      switch (tag.effectResult) {
        case '2':
          return tag.selectedAttribute === attribute;
        case '3':
          return tag.selectedAttribute === attribute || tag.secondaryAttribute === attribute;
        case '4':
          return attribute === 'inteligência';
        case '5':
          return attribute === 'agilidade';
        case '6':
          return attribute === 'força';
        case '8':
          return attribute === 'presença';
        case '10':
          return attribute === 'vontade';
        default:
          return false;
      }
    });
  };

  const closeFearRoulette = () => {
    setFearRouletteState(createInitialFearRouletteState());
    setFearResultAttributeChoice(null);
    setFearSecondaryAttributeChoice(null);
  };

  const buildFearTag = (
    effect: FearEffect,
    params: {
      rollTotal: number;
      bonusApplied: number;
      sourceInsanityId: string;
      sourceInsanityName: string;
      selectedAttribute?: AttributeKey;
      secondaryAttribute?: AttributeKey;
    }
  ): ActiveFearTag => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    effectResult: effect.resultado,
    effectName: effect.nome,
    effectDescription: effect.descricaoMecanica,
    effectNarrative: effect.descricaoNarrativa,
    rollTotal: params.rollTotal,
    bonusApplied: params.bonusApplied,
    sourceInsanityId: params.sourceInsanityId,
    sourceInsanityName: params.sourceInsanityName,
    selectedAttribute: params.selectedAttribute,
    secondaryAttribute: params.secondaryAttribute,
  });

  const handleOpenFearTagDetails = (id: string) => {
    const target = activeFearTags.find((tag) => tag.id === id);
    if (!target) return;
    setSelectedFearTag(target);
  };

  const handleRemoveFearTag = (id: string) => {
    setActiveFearTags((prev) => prev.filter((tag) => tag.id !== id));
    setSelectedFearTag((prev) => (prev?.id === id ? null : prev));
    setFearTagPendingRemoval((prev) => (prev?.id === id ? null : prev));
  };

  const toggleFearDebugCondition = (result: string) => {
    // Para remover, checamos se existe uma tag de debug desse resultado
    const existing = activeFearTags.find(
      (tag) =>
        tag.sourceInsanityId === 'debug-fear' &&
        tag.effectResult === result
    );

    if (existing) {
      handleRemoveFearTag(existing.id);
      return;
    }

    const effect = fearEffects.find((item) => item.resultado === result);
    if (!effect) return;

    if (result === '2' || result === '3') {
      // Abre a roleta no estado final para forçar a escolha
      setFearRouletteState({
        isOpen: true,
        isRolling: false,
        displayIndex: 0,
        finalEffect: effect,
        dice: null,
        total: Number(result) || parseInt(result) || 0,
        bonus: 0,
        pendingTag: {
          id: `debug-${Date.now()}`,
          effectResult: effect.resultado,
          effectName: effect.nome,
          effectDescription: effect.descricaoMecanica,
          effectNarrative: effect.descricaoNarrativa,
          rollTotal: Number(result) || parseInt(result) || 0,
          bonusApplied: 0,
          sourceInsanityId: 'debug-fear',
          sourceInsanityName: 'Debug',
        }
      });
      return;
    }

    const debugTag = buildFearTag(effect, {
      rollTotal: Number(result) || parseInt(result) || 0,
      bonusApplied: 0,
      sourceInsanityId: 'debug-fear',
      sourceInsanityName: 'Debug',
    });

    setActiveFearTags((prev) => [...prev, debugTag]);
  };

  const handleConfirmFearAttribute = () => {
    const pending = fearRouletteState.pendingTag;
    if (!pending) return;

    if (pending.effectResult === '2') {
      if (!fearResultAttributeChoice) return;
      setActiveFearTags((prev) => [
        ...prev,
        { ...pending, selectedAttribute: fearResultAttributeChoice },
      ]);
    } else if (pending.effectResult === '3') {
      if (!fearResultAttributeChoice || !fearSecondaryAttributeChoice) return;
      setActiveFearTags((prev) => [
        ...prev,
        { ...pending, selectedAttribute: fearResultAttributeChoice, secondaryAttribute: fearSecondaryAttributeChoice },
      ]);
    }

    closeFearRoulette();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCharacter({ ...character, name: e.target.value });
  };

  const handleAttributeChange = (attr: keyof typeof character.attributes, value: number) => {
    setCharacter({
      ...character,
      attributes: { ...character.attributes, [attr]: value },
    });
  };

  const handleAddSkill = () => {
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: 'Nova Habilidade',
      origin: 'Origem da habilidade',
      cost: '0',
      effect: 'Descricao da habilidade',
    };
    setCharacter((prev) => ({ ...prev, skills: [...prev.skills, newSkill] }));
  };

  const handleUpdateSkill = (id: string, field: keyof Skill, value: string | number | boolean) => {
    setCharacter((prev) => ({
      ...prev,
      skills: prev.skills.map((skill) =>
        skill.id === id ? { ...skill, [field]: value } : skill
      ),
    }));
  };

  const handleDeleteSkill = (id: string) => {
    setCharacter((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill.id !== id),
    }));
  };

  const handleReorderSkills = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    setCharacter((prev) => {
      const fromIndex = prev.skills.findIndex((skill) => skill.id === draggedId);
      const toIndex = prev.skills.findIndex((skill) => skill.id === targetId);

      if (fromIndex === -1 || toIndex === -1) return prev;

      const reordered = [...prev.skills];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);

      return {
        ...prev,
        skills: reordered,
      };
    });
  };

  const handleReorderPericias = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    setCharacter((prev) => {
      const fromIndex = prev.pericias.findIndex((p) => p.id === draggedId);
      const toIndex = prev.pericias.findIndex((p) => p.id === targetId);

      if (fromIndex === -1 || toIndex === -1) return prev;

      const reordered = [...prev.pericias];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);

      return {
        ...prev,
        pericias: reordered,
      };
    });
  };

  const handleAddPericia = () => {
    const newPericia: Pericia = {
      id: Date.now().toString(),
      name: 'Nova Pericia',
      training: 'treinado',
    };
    setCharacter({ ...character, pericias: [...character.pericias, newPericia] });
  };

  const handleUpdatePericia = (id: string, field: keyof Pericia, value: string) => {
    setCharacter({
      ...character,
      pericias: character.pericias.map((pericia) =>
        pericia.id === id
          ? pericia.isGeneric
            ? pericia
            : { ...pericia, [field]: value }
          : pericia
      ),
    });
  };

  const handleDeletePericia = (id: string) => {
    const targetPericia = character.pericias.find((pericia) => pericia.id === id);
    if (!targetPericia || targetPericia.isGeneric || targetPericia.id === GENERIC_PERICIA_ID) {
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir a perícia "${targetPericia.name}"?`)) {
      return;
    }

    setCharacter({
      ...character,
      pericias: character.pericias.filter((pericia) => pericia.id !== id),
    });
  };

  const handleRollPericia = (id: string, selectedAttribute: keyof CharacterData['attributes']) => {
    const pericia = character.pericias.find((p) => p.id === id);
    if (!pericia) return;

    const selectedAttributeKey = selectedAttribute as AttributeKey;
    const normalizedAttribute = getEffectiveAttributeValue(selectedAttributeKey);

    const baseTrainingDie = pericia.isGeneric ? 4 : TRAINING_DIE_MAP[pericia.training];
    const trainingDie = getFearAdjustedTrainingDie(baseTrainingDie, pericia.name);
    const trainingLabel = getTrainingLabelForDie(trainingDie);
    
    const modifier = getFearModifierForSkillRoll(pericia.name);
    const isAnsiedadeActive = activeFearTags.some((tag) => tag.effectResult === '13');

    setPendingRoll({
      id: Date.now(),
      periciaName: pericia.name || 'Pericia sem nome',
      attributeLabel: `${ATTRIBUTE_LABELS[selectedAttributeKey]}`,
      trainingLabel,
      attributeValue: normalizedAttribute,
      trainingDie,
      modifier,
      isAnsiedadeActive,
    });
  };

  const handleRollWeaponTest = (weapon: Weapon) => {
    if (!weapon.attribute || !weapon.skill) return;

    const attributeKey = weapon.attribute as AttributeKey;
    const normalizedAttribute = getEffectiveAttributeValue(attributeKey);
    
    // Find the training die for the weapon skill
    const skillTrainingDie = SKILL_DICE[weapon.skill as keyof typeof SKILL_DICE] || 6;

    setPendingRoll({
      id: Date.now(),
      periciaName: weapon.name || 'Arma sem nome',
      attributeLabel: `${ATTRIBUTE_LABELS[attributeKey] || weapon.attribute}`,
      trainingLabel: `${weapon.skill} (1d${skillTrainingDie})`,
      attributeValue: normalizedAttribute,
      trainingDie: skillTrainingDie,
      weaponName: weapon.name || 'Arma sem nome',
      criticalThreshold: weapon.criticalThreshold,
      criticalMultiplier: weapon.criticalMultiplier,
      damageDiceCount: weapon.damageDiceCount,
      damageDiceSides: weapon.damageDiceSides,
      isAnsiedadeActive: activeFearTags.some((tag) => tag.effectResult === '13'),
    });

    // Minimiza/fecha o menu lateral quando fazer um ataque
    setOpenSidebar(null);
  };

  const handleVitalChange = (type: 'hp' | 'sanity', field: 'current' | 'max', value: number): void => {
    setCharacter({
      ...character,
      [type]: { ...character[type], [field]: value },
    });
  };

  const handleHopeChange = (value: number) => {
    setCharacter({ ...character, hope: value });
  };

  const handleEvasionProtectionChange = (value: EvasionProtection) => {
    setCharacter((prev) => ({
      ...prev,
      evasion: {
        ...prev.evasion,
        protection: value,
      },
    }));
  };

  const handleDefensiveChargesChange = (value: number) => {
    setCharacter((prev) => {
      const maxValue = (1 << prev.evasion.maxDefensiveCharges) - 1;
      return {
        ...prev,
        evasion: {
          ...prev.evasion,
          defensiveCharges: Math.max(0, Math.min(maxValue, value)),
        },
      };
    });
  };

  const handleMaxDefensiveChargesChange = (value: number) => {
    setCharacter((prev) => ({
      ...prev,
      evasion: {
        ...prev.evasion,
        maxDefensiveCharges: Math.max(1, Math.min(4, value)),
        defensiveCharges: Math.max(0, Math.min((1 << value) - 1, prev.evasion.defensiveCharges)),
      },
    }));
  };

  const handleAddInventoryItem = () => {
    const newItem: InventoryItem = {
      id: Date.now().toString(),
      name: 'Novo Item',
      description: '',
    };
    setCharacter({ ...character, inventory: [...character.inventory, newItem] });
  };

  const handleUpdateInventoryItem = (id: string, field: keyof InventoryItem, value: string) => {
    setCharacter({
      ...character,
      inventory: character.inventory.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  const handleDeleteInventoryItem = (id: string) => {
    setCharacter({
      ...character,
      inventory: character.inventory.filter((item) => item.id !== id),
    });
  };

  const handleUpdateWeapon = (weaponId: string, field: keyof Weapon, value: any) => {
    setCharacter({
      ...character,
      weapons: character.weapons.map((w) =>
        w.id === weaponId ? { ...w, [field]: value } : w
      ),
    });
  };

  const handleAddWeapon = () => {
    const newWeapon: Weapon = {
      id: Date.now().toString(),
      name: 'Nova Arma',
      category: '',
      damageDiceCount: 1,
      damageDiceSides: 6,
      criticalThreshold: 18,
      criticalMultiplier: 2,
      skill: '',
      attribute: '',
      hasExtraEffect: false,
      extraEffect: '',
      isActive: false,
      tags: [],
    };
    setCharacter({
      ...character,
      weapons: [...character.weapons, newWeapon],
    });
  };

  const handleDeleteWeapon = (weaponId: string) => {
    setCharacter({
      ...character,
      weapons: character.weapons.filter((w) => w.id !== weaponId),
    });
  };

  const handleToggleWeaponActive = (weaponId: string) => {
    const weapon = character.weapons.find((w) => w.id === weaponId);
    if (!weapon) return;

    if (weapon.isActive) {
      // Se está ativo, apenas desativa
      setCharacter({
        ...character,
        weapons: character.weapons.map((w) =>
          w.id === weaponId ? { ...w, isActive: false } : w
        ),
      });
    } else {
      // Se está inativo, ativa
      const activeCount = character.weapons.filter((w) => w.isActive).length;

      if (activeCount < 2) {
        // Se tem menos de 2 ativas, ativa sem problemas
        setCharacter({
          ...character,
          weapons: character.weapons.map((w) =>
            w.id === weaponId ? { ...w, isActive: true } : w
          ),
        });
      } else {
        // Se já tem 2 ativas, desativa a primeira e ativa a nova
        let firstActiveFound = false;
        setCharacter({
          ...character,
          weapons: character.weapons.map((w) => {
            if (w.id === weaponId) {
              return { ...w, isActive: true };
            }
            if (w.isActive && !firstActiveFound) {
              firstActiveFound = true;
              return { ...w, isActive: false };
            }
            return w;
          }),
        });
      }
    }
  };

  const toggleInventoryPanel = () => {
    setOpenSidebar((prev) => (prev === 'inventory' ? null : 'inventory'));
  };

  const toggleInsanityPanel = () => {
    setOpenSidebar((prev) => (prev === 'insanity' ? null : 'insanity'));
  };

  const toggleRitualsPanel = () => {
    setOpenSidebar((prev) => (prev === 'rituals' ? null : 'rituals'));
  };

  const handleAddRitual = (ritual: Ritual) => {
    setCharacter((prev) => {
      const activeVersion = ritual.versions[ritual.activeVersion] ?? ritual.versions[0];
      const costValue = parseInt(activeVersion?.cost || '0') || 0;

      const newSanity = activeVersion?.retained
        ? {
            current: Math.max(0, prev.sanity.current - costValue),
            max: Math.max(0, prev.sanity.max - costValue),
          }
        : prev.sanity;

      return {
        ...prev,
        sanity: newSanity,
        rituals: [...prev.rituals, ritual],
      };
    });
  };



  const handleSetRitualVersion = (id: string, activeVersion: number) => {
    setCharacter((prev) => ({
      ...prev,
      rituals: prev.rituals.map((ritual) =>
        ritual.id === id
          ? {
              ...ritual,
              activeVersion: Math.max(0, Math.min(activeVersion, ritual.versions.length - 1)),
            }
          : ritual
      ),
    }));
  };

  const handleUpdateRitual = (id: string, ritual: Ritual) => {
    setCharacter((prev) => {
      const oldRitual = prev.rituals.find((r) => r.id === id);
      const oldVersion = oldRitual?.versions[oldRitual.activeVersion] ?? oldRitual?.versions[0];
      const newVersion = ritual.versions[ritual.activeVersion] ?? ritual.versions[0];
      const wasRetained = oldVersion?.retained ?? false;
      const isRetained = newVersion?.retained ?? false;
      const costValue = parseInt(newVersion?.cost || '0') || 0;

      let newSanity = prev.sanity;

      if (!wasRetained && isRetained) {
        // Ritual is being retained - deduct cost from current and max
        newSanity = {
          current: Math.max(0, prev.sanity.current - costValue),
          max: Math.max(0, prev.sanity.max - costValue),
        };
      } else if (wasRetained && !isRetained) {
        // Ritual is no longer retained - restore max sanity
        newSanity = {
          current: prev.sanity.current,
          max: prev.sanity.max + costValue,
        };
      }

      return {
        ...prev,
        sanity: newSanity,
        rituals: prev.rituals.map((item) => (item.id === id ? ritual : item)),
      };
    });
  };

  const handleRemoveRitual = (id: string) => {
    setCharacter((prev) => {
      const ritualToRemove = prev.rituals.find((r) => r.id === id);
      const currentVersion = ritualToRemove?.versions[ritualToRemove.activeVersion] ?? ritualToRemove?.versions[0];
      const costValue = parseInt(currentVersion?.cost || '0') || 0;

      let newSanity = prev.sanity;
      if (currentVersion?.retained) {
        // If removing a retained ritual, restore max sanity
        newSanity = {
          current: prev.sanity.current,
          max: prev.sanity.max + costValue,
        };
      }

      return {
        ...prev,
        sanity: newSanity,
        rituals: prev.rituals.filter((item) => item.id !== id),
      };
    });
  };

  const handleStartConjuration = (_ritual: Ritual) => {
    const ritual = _ritual;
    const activeVersion = ritual.versions[ritual.activeVersion] ?? ritual.versions[0];

    // We removed the block that prevented starting a conjuration for a retained ritual.
    // Retained rituals can now be conjured (and they will be suspended at turn 3).

    const ocultismoPericia = character.pericias.find(p => p.name === 'Ocultismo');
    // Destreinado falls under this catch if we had 'destreinado', but in this system it's either in the array with a training or not.
    // Generic is id=0.
    if (!ocultismoPericia || ocultismoPericia.isGeneric) {
        alert("Apenas personagens com treinamento em Ocultismo podem iniciar um Transe Ritualístico.");
        return;
    }

    setPokerConjureState({
      ritualId: ritual.id,
      turn: 1,
      phase: 'draw',
      deck: [], // Deck is created in the overlay
      hand: [],
      discardLimit: 0,
      selectedCards: [],
    });
    
    setLastConjuredEffect(null); // Limpa o efeito anterior ao iniciar novo transe

    setIsConjurationOverlayOpen(true);
    if (!activeVersion?.retained) {
      setOpenSidebar(null); // Fecha a sidebar apenas para rituais não retidos
    }
  };

  const handleResumeConjuration = () => {
    setIsConjurationOverlayOpen(true);
    setOpenSidebar(null);
  };

  const handleForceShowdown = () => {
    setPokerConjureState(prev => prev ? { ...prev, phase: 'showdown', selectedCards: [] } : prev);
    setIsConjurationOverlayOpen(true);
    setOpenSidebar(null);
  };

  const handleCancelConjuration = (effect?: string) => {
    if (effect && pokerConjureState) {
      const ritualId = pokerConjureState.ritualId;
      const type = character.rituals.find(r => r.id === ritualId)
        ?.versions[character.rituals.find(r => r.id === ritualId)?.activeVersion || 0]?.type || 'suporte';
      setLastConjuredEffect({ ritualId, effect, type });

      // If it was a suspended conjuration that we just concluded, remove it from suspended list
      if (suspendedConjurations[ritualId]) {
        setSuspendedConjurations(prev => {
          const newSuspended = { ...prev };
          delete newSuspended[ritualId];
          return newSuspended;
        });

        // Un-retain it and restore max sanity
        const ritualToUpdate = character.rituals.find(r => r.id === ritualId);
        if (ritualToUpdate) {
          const currentVersion = ritualToUpdate.versions[ritualToUpdate.activeVersion] ?? ritualToUpdate.versions[0];
          const costValue = parseInt(currentVersion?.cost || '0') || 0;
          
          setCharacter(prev => ({
            ...prev,
            sanity: {
              current: prev.sanity.current,
              max: prev.sanity.max + costValue, // restaura max
            },
            rituals: prev.rituals.map(r => r.id === ritualId ? {
              ...r,
              versions: r.versions.map((v, i) => i === r.activeVersion ? { ...v, retained: false } : v)
            } : r)
          }));
        }
      }
    }
    setPokerConjureState(null);
    setIsConjurationOverlayOpen(false);
  };

  const handleSuspendConjuration = (state: PokerConjureState) => {
    setSuspendedConjurations(prev => ({
      ...prev,
      [state.ritualId]: state
    }));
    setPokerConjureState(null);
    setLastConjuredEffect(null); // Limpa o efeito para não mostrar card vazio
    setIsConjurationOverlayOpen(false);
    setOpenSidebar('rituals'); // Volta para a tela de rituais
  };

  const handleReleaseRitual = (ritualId: string) => {
    const suspendedState = suspendedConjurations[ritualId];
    if (suspendedState) {
      // Retoma o transe diretamente na fase de showdown
      setPokerConjureState({ ...suspendedState, phase: 'immediate_showdown' });
      setIsConjurationOverlayOpen(true);
      setOpenSidebar(null);
    }
  };

  const handleResolveRitual = (ritualId: string) => {
    setRitualResolveState({ ritualId });
    setOpenSidebar('rituals');
  };

  const rollAttributeValueLocal = (attributeValue: number) => {
    switch (attributeValue) {
      case 0: {
        const a = Math.floor(Math.random() * 6) + 1;
        const b = Math.floor(Math.random() * 6) + 1;
        return Math.min(a, b);
      }
      case 1:
        return Math.floor(Math.random() * 6) + 1;
      case 2:
        return Math.floor(Math.random() * 8) + 1;
      case 3:
        return Math.floor(Math.random() * 10) + 1;
      case 4:
        return Math.floor(Math.random() * 12) + 1;
      case 5: {
        const a = Math.floor(Math.random() * 12) + 1;
        const b = Math.floor(Math.random() * 12) + 1;
        return Math.max(a, b);
      }
      default:
        return Math.floor(Math.random() * 6) + 1;
    }
  };

  const handlePerformResolveRoll = async () => {
    if (!ritualResolveState) return;

    const ritual = character.rituals.find((r) => r.id === ritualResolveState.ritualId);
    if (!ritual) return;

    const version = ritual.versions[ritual.activeVersion] ?? ritual.versions[0];
    const costValue = parseInt(version.cost || '0') || 0;
    const difficulty = 7 + costValue;

    const attributeKey = (ritualResolveState.selectedAttribute ?? 'força') as AttributeKey;
    const attributeValue = getEffectiveAttributeValue(attributeKey);
    const pericia = character.pericias.find((p) => p.id === ritualResolveState.selectedPericiaId) ?? character.pericias[0];
    const baseTrainingDie = pericia?.isGeneric ? 4 : TRAINING_DIE_MAP[pericia?.training ?? 'treinado'];
    const trainingDie = getFearAdjustedTrainingDie(baseTrainingDie, pericia?.name || 'Ocultismo');

    setRitualResolveState((prev) => (prev ? { ...prev, isRolling: true, difficulty } : prev));

    const animationDuration = 900;
    const start = Date.now();
    let rafId: number | null = null;

    const animate = () => {
      const elapsed = Date.now() - start;
      if (elapsed < animationDuration) {
        // show random values
        setRitualResolveState((prev) =>
          prev
            ? { ...prev, rolls: [Math.floor(Math.random() * (attributeValue >= 5 ? 12 : 6)) + 1, Math.floor(Math.random() * trainingDie) + 1] }
            : prev
        );
        rafId = requestAnimationFrame(animate);
        return;
      }

      // final rolls
      const attrRoll = rollAttributeValueLocal(attributeValue);
      const trainRoll = Math.floor(Math.random() * trainingDie) + 1;
      const total = attrRoll + trainRoll;
      const passed = total >= difficulty;

      setRitualResolveState((prev) =>
        prev
          ? { ...prev, rolls: [attrRoll, trainRoll], total, passed, isRolling: false, difficulty }
          : prev
      );
      if (rafId) cancelAnimationFrame(rafId);
    };

    animate();
  };

  const handleCloseResolve = () => {
    setRitualResolveState(null);
    setPokerConjureState(null);
  };

  const handleAddInsanity = (insanity: Insanity) => {
    setCharacter({ ...character, insanities: [...character.insanities, insanity] });
  };

  const handleUpdateInsanity = (id: string, insanity: Insanity) => {
    setCharacter({
      ...character,
      insanities: character.insanities.map((i) => (i.id === id ? insanity : i)),
    });
  };

  const handleRemoveInsanity = (id: string) => {
    setCharacter({
      ...character,
      insanities: character.insanities.filter((i) => i.id !== id),
    });
  };

  const handleAddPower = (power: ParanormalPower) => {
    setCharacter({ ...character, paranormalPowers: [...character.paranormalPowers, power] });
  };

  const handleUpdatePower = (id: string, power: ParanormalPower) => {
    setCharacter({
      ...character,
      paranormalPowers: character.paranormalPowers.map((p) => (p.id === id ? power : p)),
    });
  };

  const handleRemovePower = (id: string) => {
    setCharacter({
      ...character,
      paranormalPowers: character.paranormalPowers.filter((p) => p.id !== id),
    });
  };

  const handleInvokeInsanity = (insanity: Insanity, action?: 'fobia-mestre' | 'fobia-jogador' | 'mania-complicacao' | 'mania-influencia') => {
    if (action === 'mania-influencia') {
      const currentCompulsoes = insanity.compulsoes || 0;
      if (currentCompulsoes >= 2) {
        // atingiu 3: zera as compulsões e ganha 1 esperança
        setCharacter((prev) => ({
          ...prev,
          hope: Math.min(prev.hope + 1, 3),
          insanities: prev.insanities.map(i => i.id === insanity.id ? { ...i, compulsoes: 0 } : i)
        }));
      } else {
        // apenas adiciona 1 compulsão
        setCharacter((prev) => ({
          ...prev,
          insanities: prev.insanities.map(i => i.id === insanity.id ? { ...i, compulsoes: currentCompulsoes + 1 } : i)
        }));
      }
      return;
    }

    let gain = 0;
    if (action === 'fobia-mestre' || action === 'mania-complicacao') {
      gain = 1;
    } else if (action === 'fobia-jogador') {
      gain = 2;
    } else if (!action) {
      // Fallback genérico
      gain = insanity.type === 'fobia' ? 2 : 1;
    }

    if (gain > 0) {
      setCharacter((prev) => ({ ...prev, hope: Math.min(prev.hope + gain, 3) }));
    }

    // Se não for fobia, encerra (não gira a roleta de medo)
    if (insanity.type !== 'fobia') {
      return;
    }

    const dieOne = Math.floor(Math.random() * 10) + 1;
    const dieTwo = Math.floor(Math.random() * 10) + 1;
    const bonus = activeFearTags.length;
    const total = dieOne + dieTwo + bonus;
    let finalEffect = resolveFearEffect(total);
    let finalIndex = Math.max(
      0,
      fearEffects.findIndex((effect) => effect.resultado === finalEffect.resultado)
    );

    let loopCount = 0;
    while (
      activeFearTags.some((tag) => tag.effectResult === finalEffect.resultado) &&
      loopCount < fearEffects.length
    ) {
      finalIndex = (finalIndex + 1) % fearEffects.length;
      finalEffect = fearEffects[finalIndex];
      loopCount++;
    }

    const pendingTag = buildFearTag(finalEffect, {
      rollTotal: total,
      bonusApplied: bonus,
      sourceInsanityId: insanity.id,
      sourceInsanityName: insanity.name,
    });

    if (fearRouletteIntervalRef.current) {
      clearInterval(fearRouletteIntervalRef.current);
    }
    if (fearRouletteTimeoutRef.current) {
      clearTimeout(fearRouletteTimeoutRef.current);
    }

    setFearResultAttributeChoice(null);
    setFearRouletteState({
      isOpen: true,
      isRolling: true,
      displayIndex: 0,
      finalEffect: null,
      dice: [dieOne, dieTwo],
      total,
      bonus,
      pendingTag: null,
    });

    let displayIndex = 0;
    fearRouletteIntervalRef.current = window.setInterval(() => {
      displayIndex = (displayIndex + 1) % fearEffects.length;
      setFearRouletteState((prev) => ({ ...prev, displayIndex }));
    }, 85);

    fearRouletteTimeoutRef.current = window.setTimeout(() => {
      if (fearRouletteIntervalRef.current) {
        clearInterval(fearRouletteIntervalRef.current);
      }

      setFearRouletteState((prev) => ({
        ...prev,
        isRolling: false,
        displayIndex: finalIndex,
        finalEffect,
        pendingTag: finalEffect.resultado === '2' ? pendingTag : null,
      }));

      if (finalEffect.resultado !== '2') {
        setActiveFearTags((prev) => [...prev, pendingTag]);
      }
    }, 2200);
  };

  const handleRollDirectFear = () => {
    const dieOne = Math.floor(Math.random() * 10) + 1;
    const dieTwo = Math.floor(Math.random() * 10) + 1;
    const bonus = activeFearTags.length;
    const total = dieOne + dieTwo + bonus;
    let finalEffect = resolveFearEffect(total);
    let finalIndex = Math.max(
      0,
      fearEffects.findIndex((effect) => effect.resultado === finalEffect.resultado)
    );

    let loopCount = 0;
    while (
      activeFearTags.some((tag) => tag.effectResult === finalEffect.resultado) &&
      loopCount < fearEffects.length
    ) {
      finalIndex = (finalIndex + 1) % fearEffects.length;
      finalEffect = fearEffects[finalIndex];
      loopCount++;
    }

    const pendingTag = buildFearTag(finalEffect, {
      rollTotal: total,
      bonusApplied: bonus,
      sourceInsanityId: 'direto',
      sourceInsanityName: 'Sanidade',
    });

    if (fearRouletteIntervalRef.current) {
      clearInterval(fearRouletteIntervalRef.current);
    }
    if (fearRouletteTimeoutRef.current) {
      clearTimeout(fearRouletteTimeoutRef.current);
    }

    setFearResultAttributeChoice(null);
    setFearRouletteState({
      isOpen: true,
      isRolling: true,
      displayIndex: 0,
      finalEffect: null,
      dice: [dieOne, dieTwo],
      total,
      bonus,
      pendingTag: null,
    });

    let displayIndex = 0;
    fearRouletteIntervalRef.current = window.setInterval(() => {
      displayIndex = (displayIndex + 1) % fearEffects.length;
      setFearRouletteState((prev) => ({ ...prev, displayIndex }));
    }, 85);

    fearRouletteTimeoutRef.current = window.setTimeout(() => {
      if (fearRouletteIntervalRef.current) {
        clearInterval(fearRouletteIntervalRef.current);
      }

      setFearRouletteState((prev) => ({
        ...prev,
        isRolling: false,
        displayIndex: finalIndex,
        finalEffect,
        pendingTag: finalEffect.resultado === '2' ? pendingTag : null,
      }));

      if (finalEffect.resultado !== '2') {
        setActiveFearTags((prev) => [...prev, pendingTag]);
      }
    }, 2200);
  };

  const handleLoadCharacter = (
    data: Partial<Omit<CharacterData, 'rituals'>> & {
      expertises?: Array<{ id: string; name: string }>;
      skills?: Array<
        Partial<Skill> & {
          id: string;
          name?: string;
          source?: string;
          description?: string;
          damage?: string;
          cost?: string | number;
        }
      >;
      rituals?: LoadedRitual[];
    },
    cloudId?: string | null
  ) => {
    const loadedSkills: Skill[] = Array.isArray(data.skills)
      ? data.skills.map((skill) => {
          const s = skill as any;
          return {
            id: s.id,
            name: s.name ?? 'Habilidade',
            origin: s.origin ?? s.source ?? '',
            cost: s.cost != null ? String(s.cost) : '',
            effect: s.effect ?? s.description ?? s.damage ?? '',
          };
        })
      : [];

    const loadedPericias: Pericia[] = Array.isArray(data.pericias)
      ? data.pericias.map((pericia) => ({
          id: pericia.id,
          name: pericia.name,
          training: pericia.training ?? 'treinado',
          isGeneric: pericia.isGeneric ?? false,
        }))
      : (data.expertises || []).map((expertise) => ({
          id: expertise.id,
          name: expertise.name,
          training: 'treinado' as const,
        }));

    const normalizeRitualVersion = (version: Partial<RitualVersion> | undefined): RitualVersion => ({
      name: version?.name ?? '',
      circle: version?.circle ?? '',
      cost: version?.cost ?? '',
      duration: version?.duration ?? '',
      resistance: Number(version?.resistance ?? 0),
      type: version?.type ?? 'suporte',
      description: version?.description ?? '',
      retained: Boolean(version?.retained ?? false),
    });

    const loadedRituals: Ritual[] = Array.isArray(data.rituals)
      ? data.rituals.map((ritual) => {
          const versions = Array.isArray(ritual.versions) && ritual.versions.length > 0
            ? ritual.versions.slice(0, 3).map((version) => normalizeRitualVersion(version))
            : [
                normalizeRitualVersion({
                  name: ritual.name,
                  circle: ritual.circle,
                  cost: ritual.cost,
                  duration: ritual.duration,
                  resistance: ritual.resistance,
                  type: ritual.type,
                  description: ritual.description,
                  retained: ritual.retained,
                }),
              ];

          return {
            id: ritual.id ?? Date.now().toString(),
            versions,
            activeVersion: Math.max(
              0,
              Math.min(Number(ritual.activeVersion ?? 0), versions.length - 1)
            ),
          };
        })
      : [];



    setCharacter((prev) => ({
      ...prev,
      // Only spread known-safe scalar/object fields from loaded data
      // Arrays are handled explicitly below to avoid undefined overwrites
      name: typeof data.name === 'string' ? data.name : prev.name,
      hp: data.hp ? {
        current: Number(data.hp.current ?? prev.hp.current),
        max: Number(data.hp.max ?? prev.hp.max),
      } : prev.hp,
      sanity: data.sanity ? {
        current: Number(data.sanity.current ?? prev.sanity.current),
        max: Number(data.sanity.max ?? prev.sanity.max),
      } : prev.sanity,
      hope: typeof data.hope === 'number' ? data.hope : prev.hope,
      inventory: Array.isArray(data.inventory) ? data.inventory : prev.inventory,
      weapons: Array.isArray(data.weapons) ? data.weapons : prev.weapons,
      insanities: Array.isArray(data.insanities) ? data.insanities : prev.insanities,
      paranormalPowers: Array.isArray(data.paranormalPowers) ? data.paranormalPowers : prev.paranormalPowers,
      attributes: {
        força: Number(data.attributes?.força ?? prev.attributes.força ?? 0),
        agilidade: Number(data.attributes?.agilidade ?? prev.attributes.agilidade ?? 0),
        inteligência: Number(data.attributes?.inteligência ?? prev.attributes.inteligência ?? 0),
        presença: Number(data.attributes?.presença ?? prev.attributes.presença ?? 0),
        vigor: Number(data.attributes?.vigor ?? prev.attributes.vigor ?? 0),
        vontade: Number(data.attributes?.vontade ?? prev.attributes.vontade ?? 0),
      },
      skills: loadedSkills.length > 0 ? loadedSkills : prev.skills,
      pericias: ensureGenericPericia(loadedPericias.length > 0 ? loadedPericias : prev.pericias),
      rituals: loadedRituals.length > 0 ? loadedRituals : prev.rituals,

      evasion: {
        protection: data.evasion?.protection ?? prev.evasion.protection,
        defensiveCharges: Math.max(
          0,
          Math.min((1 << (data.evasion?.maxDefensiveCharges ?? prev.evasion.maxDefensiveCharges)) - 1, Number(data.evasion?.defensiveCharges ?? prev.evasion.defensiveCharges))
        ),
        maxDefensiveCharges: Math.max(
          1,
          Math.min(4, Number(data.evasion?.maxDefensiveCharges ?? prev.evasion.maxDefensiveCharges))
        ),
      },
      activeFearTags: Array.isArray((data as any).activeFearTags) ? (data as any).activeFearTags : (prev.activeFearTags || []),
    }));

    // Update cloud tracking
    if (cloudId) {
      setCharacterId(cloudId);
      setLastCloudSave(new Date().toISOString());
      try {
        localStorage.setItem('odv_current_character_id', cloudId);
      } catch { /* ignore */ }
    }
  };
  const isTensaoActive = activeFearTags.some(tag => ['12', '17', '14', '15', '18', '19', '20', '21', '22', '23', '24'].includes(tag.effectResult || ''));

  return (
    <div className="min-h-screen bg-black text-white font-mono overflow-hidden flex flex-col relative">
      {isTensaoActive && <TensaoOverlay />}
      {/* Header */}
      <div className="border-b-2 border-primary bg-black p-2 md:p-4 flex-shrink-0 space-y-2 md:space-y-3 overflow-y-auto max-h-screen md:max-h-none">
        <div className="flex justify-between items-center relative">
          <h1 className="font-display text-2xl md:text-4xl text-primary">ORDEM DA VERDADE</h1>
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className={`p-2 transition-colors ${showSettings ? 'text-primary' : 'text-primary/50 hover:text-primary'}`}
            title="Configurações"
          >
            <Settings size={24} />
          </button>
          
          {showSettings && (
            <div className="absolute top-12 right-0 z-50 bg-black border-2 border-primary p-4 shadow-[0_0_15px_rgba(255,23,68,0.3)] w-[340px] max-h-[80vh] overflow-y-auto flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-primary font-bold uppercase text-xs">Configurações</span>
                <button onClick={() => setShowSettings(false)} className="text-primary/50 hover:text-primary">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between border border-primary/20 p-2">
                  <span className="text-primary font-bold uppercase text-xs">Auto-Save na Nuvem</span>
                  <button 
                    onClick={toggleAutoSave}
                    className={`flex items-center justify-center w-12 h-6 border ${autoSaveEnabled ? 'border-primary bg-primary/20 text-primary' : 'border-primary/50 text-primary/50 hover:border-primary'} transition-all text-xs font-bold`}
                  >
                    {autoSaveEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                <div className="flex items-center justify-between border border-purple-500/20 p-2">
                  <span className="text-purple-300 font-bold uppercase text-xs">Debug de Medo</span>
                  <button 
                    onClick={() => setShowFearDebug(prev => !prev)}
                    className={`flex items-center justify-center w-12 h-6 border ${showFearDebug ? 'border-purple-500 bg-purple-500/20 text-purple-300' : 'border-purple-500/50 text-purple-500/50 hover:border-purple-500'} transition-all text-xs font-bold`}
                  >
                    {showFearDebug ? 'ON' : 'OFF'}
                  </button>
                </div>

                {showFearDebug && (
                  <div className="space-y-2 border border-purple-500/60 bg-purple-950/10 p-2">
                    <div className="text-[10px] text-purple-200/80 mb-2">
                      Ative/desative rapidamente os efeitos de medo para testar os modificadores. Se um efeito necessitar de escolha, uma janela se abrirá.
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {fearEffects.map((effect) => {
                        const result = effect.resultado;
                        const isActive = activeFearTags.some(
                          (tag) =>
                            tag.sourceInsanityId === 'debug-fear' &&
                            tag.effectResult === result
                        );
                        return (
                          <button
                            key={result}
                            onClick={() => toggleFearDebugCondition(result)}
                            className={`text-[10px] py-1 uppercase border ${isActive ? 'bg-purple-500 text-black border-purple-500' : 'text-purple-200 border-purple-500 hover:bg-purple-500/20'}`}
                          >
                            {isActive ? 'Desativar' : 'Ativar'} {result}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="border-t border-primary/20 pt-4 space-y-2">
                <div className="text-primary font-bold uppercase text-xs mb-2">Ações de Ficha</div>
                <SaveLoad
                  characterData={character}
                  onLoadCharacter={handleLoadCharacter}
                  characterId={characterId}
                  onSaveToCloud={handleSaveToCloud}
                  onOpenManager={() => setIsManagerOpen(true)}
                  isCloudSaving={isCloudSaving}
                  lastCloudSave={lastCloudSave}
                  hideCloud={true}
                />
              </div>
            </div>
          )}
        </div>
        <input
          type="text"
          value={character.name}
          onChange={handleNameChange}
          className="input-occult text-lg md:text-2xl font-display bg-black border-b-2 border-primary focus:border-primary w-full mb-2"
          placeholder="Nome do Personagem"
        />

        {/* Save/Load Buttons (Cloud Only) */}
        <SaveLoad
          characterData={character}
          onLoadCharacter={handleLoadCharacter}
          characterId={characterId}
          onSaveToCloud={handleSaveToCloud}
          onOpenManager={() => setIsManagerOpen(true)}
          isCloudSaving={isCloudSaving}
          lastCloudSave={lastCloudSave}
          hideJson={true}
        />

        {/* Vitals + Hope + Evasion Row - Stack on mobile */}
        <div className="flex flex-col md:flex-row gap-2 md:gap-4">
          <div className="flex-1 min-w-0">
            <VitalStats
              hp={character.hp}
              sanity={character.sanity}
              onHpChange={(field, value) => handleVitalChange('hp', field, value)}
              onSanityChange={(field, value) => handleVitalChange('sanity', field, value)}
              fearTags={activeFearTags.map((tag) => ({
                id: tag.id,
                label: `${tag.effectResult}: ${tag.effectName}${tag.selectedAttribute ? ` (${ATTRIBUTE_LABELS[tag.selectedAttribute]})` : ''}`,
              }))}
              onFearTagClick={handleOpenFearTagDetails}
            />

          </div>
          <div className="w-full md:w-56 flex-shrink-0">
            <HopeCounter
              current={character.hope}
              onChange={handleHopeChange}
            />
            <div className="mt-2">
              <EvasionPanel
                agility={getEffectiveAttributeValue('agilidade')}
                protection={character.evasion.protection}
                defensiveCharges={character.evasion.defensiveCharges}
                maxDefensiveCharges={character.evasion.maxDefensiveCharges}
                evasionPenalty={activeFearTags.some(t => t.effectResult === '9') ? 3 : 0}
                isEvasionAffected={activeFearTags.some(t => t.effectResult === '9')}
                areChargesDisabled={activeFearTags.some(t => t.effectResult === '11')}
                onProtectionChange={handleEvasionProtectionChange}
                onDefensiveChargesChange={handleDefensiveChargesChange}
                onMaxDefensiveChargesChange={handleMaxDefensiveChargesChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-1 gap-2 md:gap-4 p-2 md:p-4 overflow-hidden pr-0">
        {/* Left Column - Attributes */}
        <div className="flex-shrink-0 w-full md:w-40">
          <h2 className="font-display text-xs md:text-sm text-primary uppercase mb-2 md:mb-3">Atributos</h2>
          <div className="grid grid-cols-3 md:grid-cols-2 gap-2 md:gap-3">
            {ATTRIBUTE_KEYS.map((attr) => (
              <AttributeHexagon
                key={attr}
                attribute={attr}
                value={getEffectiveAttributeValue(attr)}
                onChange={(val) => handleAttributeChange(attr, val)}
                isFearAffected={isFearAffectedAttribute(attr)}
              />
            ))}
          </div>
        </div>

        {/* Center Column - Skills & Pericias */}
        <div className="flex-1 flex flex-col min-w-0 gap-2 md:gap-4 md:ml-3">
          {/* Pericias Section */}
          <div className="h-80 md:h-[32rem] flex flex-col min-h-0 flex-shrink-0">
            <Pericias
              pericias={character.pericias}
              onAddPericia={handleAddPericia}
              onUpdatePericia={handleUpdatePericia}
              onDeletePericia={handleDeletePericia}
              onRollPericia={handleRollPericia}
              onReorderPericias={handleReorderPericias}
              isFearAffectedSkill={isFearAffectedSkill}
              getFearAdjustedTrainingLevel={getFearAdjustedTrainingLevel}
            />
          </div>

          {/* Skills Section - Fixed Height with Scroll */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <h2 className="font-display text-sm md:text-lg text-primary">HABILIDADES</h2>
              <button
                onClick={handleAddSkill}
                className="btn-occult text-xs px-2 py-1"
              >
                + ADD
              </button>
            </div>
            <SkillsList
              skills={character.skills}
              onUpdateSkill={handleUpdateSkill}
              onDeleteSkill={handleDeleteSkill}
              onReorderSkills={handleReorderSkills}
            />
          </div>
        </div>

        {/* Right Column - Dice */}
        <div className="flex-shrink-0 w-full md:w-56 pr-0 md:pr-4">
          <DiceRoller rollRequest={pendingRoll} damageRollRequest={pendingDamageRoll} />
        </div>
      </div>

      {selectedFearTag && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl border-2 border-purple-500 bg-black p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-purple-500 pb-2">
              <h3 className="font-display text-lg text-purple-300 uppercase">
                {selectedFearTag.effectResult}: {selectedFearTag.effectName}
              </h3>
              <button
                onClick={() => setSelectedFearTag(null)}
                className="text-xs px-2 py-1 border border-purple-500 text-purple-300 hover:bg-purple-500/10"
              >
                Fechar
              </button>
            </div>

            <div className="text-[10px] uppercase text-purple-400 font-bold">Narrativa</div>
            <p className="text-sm text-purple-100/90 leading-relaxed">{selectedFearTag.effectNarrative}</p>

            <div className="text-[10px] uppercase text-purple-400 font-bold">Efeito Mecânico</div>
            <p className="text-sm text-purple-100/90 leading-relaxed">{selectedFearTag.effectDescription}</p>

            <div className="text-[10px] text-purple-300/90 uppercase">
              Origem: {selectedFearTag.sourceInsanityName} | Total: {selectedFearTag.rollTotal} | Bônus aplicado: +{selectedFearTag.bonusApplied}
            </div>

            <button
              onClick={() => setFearTagPendingRemoval(selectedFearTag)}
              className="w-full py-2 border border-red-500 text-red-300 hover:bg-red-500/10 uppercase text-xs font-bold"
            >
              Remover Tag
            </button>
          </div>
        </div>
      )}

      {fearTagPendingRemoval && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md border-2 border-red-500 bg-black p-4 space-y-3">
            <h3 className="font-display text-lg text-red-300 uppercase">Remover medo ativo?</h3>
            <p className="text-sm text-red-100/90">
              Você tem certeza que deseja remover a tag <strong>{fearTagPendingRemoval.effectResult}: {fearTagPendingRemoval.effectName}</strong>?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFearTagPendingRemoval(null)}
                className="py-2 border border-red-500 text-red-300 hover:bg-red-500/10 uppercase text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  handleRemoveFearTag(fearTagPendingRemoval.id);
                  setFearTagPendingRemoval(null);
                }}
                className="py-2 bg-red-500 text-black hover:bg-red-400 uppercase text-xs font-bold"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <FearRouletteOverlay
        fearRouletteState={fearRouletteState as any}
        fearEffects={fearEffects}
        closeFearRoulette={closeFearRoulette}
        fearResultAttributeChoice={fearResultAttributeChoice}
        setFearResultAttributeChoice={(attr) => setFearResultAttributeChoice(attr as AttributeKey | null)}
        fearSecondaryAttributeChoice={fearSecondaryAttributeChoice}
        setFearSecondaryAttributeChoice={(attr) => setFearSecondaryAttributeChoice(attr as AttributeKey | null)}
        handleConfirmFearAttribute={handleConfirmFearAttribute}
      />

      {/* Character Manager Modal */}
      <CharacterManager
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        onOpenCharacter={handleOpenFromCloud}
        onCreateNew={handleCreateNew}
        currentCharacterId={characterId}
      />

      {/* Inventory Panel - Retractable Sidebar */}
      <InventoryPanel
        isOpen={openSidebar === 'inventory'}
        showToggle={openSidebar !== 'insanity' && openSidebar !== 'rituals'}
        onToggle={toggleInventoryPanel}
        inventory={character.inventory}
        onAddItem={handleAddInventoryItem}
        onUpdateItem={handleUpdateInventoryItem}
        onDeleteItem={handleDeleteInventoryItem}
        weapons={character.weapons}
        onUpdateWeapon={handleUpdateWeapon}
        onAddWeapon={handleAddWeapon}
        onDeleteWeapon={handleDeleteWeapon}
        onToggleWeaponActive={handleToggleWeaponActive}
        onRollWeaponTest={handleRollWeaponTest}
        onCloseMenu={() => setOpenSidebar(null)}
      />

      {/* Insanity Panel - Second Retractable Sidebar */}
      <InsanityPanel
        isOpen={openSidebar === 'insanity'}
        showToggle={openSidebar !== 'inventory' && openSidebar !== 'rituals'}
        onToggle={toggleInsanityPanel}
        insanities={character.insanities}
        activeFearTags={activeFearTags as any}
        onInsanityAdd={handleAddInsanity}
        onInsanityRemove={handleRemoveInsanity}
        onInsanityUpdate={handleUpdateInsanity}
        onInsanityInvoke={handleInvokeInsanity}
        onRollNewFear={handleRollDirectFear}
        onRemoveFearTag={handleRemoveFearTag}
        onOpenFearTagDetails={handleOpenFearTagDetails}
      />

      <RitualsPanel
        isOpen={openSidebar === 'rituals'}
        showToggle={openSidebar !== 'inventory' && openSidebar !== 'insanity'}
        onToggle={toggleRitualsPanel}
        rituals={character.rituals}
        onAddRitual={handleAddRitual}
        onUpdateRitual={handleUpdateRitual}
        onSetRitualVersion={handleSetRitualVersion}
        onRemoveRitual={handleRemoveRitual}
        onConjureRitual={handleStartConjuration}
        activeConjuration={pokerConjureState}
        suspendedConjurations={suspendedConjurations}
        onResumeConjuration={handleResumeConjuration}
        onForceShowdown={handleForceShowdown}
        onCancelConjuration={handleCancelConjuration}
        onReleaseRitual={handleReleaseRitual}
        lastConjuredEffect={lastConjuredEffect}
        onClearLastEffect={() => setLastConjuredEffect(null)}
      />

      {isConjurationOverlayOpen && pokerConjureState && (
        <ConjurationOverlay
          state={pokerConjureState as any}
          setState={setPokerConjureState as any}
          ritualName={
            character.rituals.find(r => r.id === pokerConjureState.ritualId)
              ?.versions[character.rituals.find(r => r.id === pokerConjureState.ritualId)?.activeVersion || 0]?.name || 'Ritual'
          }
          ritualCircle={
            character.rituals.find(r => r.id === pokerConjureState.ritualId)
              ?.versions[character.rituals.find(r => r.id === pokerConjureState.ritualId)?.activeVersion || 0]?.circle || '1'
          }
          ritualType={
            (character.rituals.find(r => r.id === pokerConjureState.ritualId)
              ?.versions[character.rituals.find(r => r.id === pokerConjureState.ritualId)?.activeVersion || 0]?.type || 'suporte') as any
          }
          isRetained={
            character.rituals.find(r => r.id === pokerConjureState.ritualId)
              ?.versions[character.rituals.find(r => r.id === pokerConjureState.ritualId)?.activeVersion || 0]?.retained || false
          }
          ocultismoLevel={
            character.pericias.find(p => p.name === 'Ocultismo')?.training || 'treinado'
          }
          inteligencia={character.attributes.inteligência}
          getRollConfig={(attr) => {
            const attributeValue = getEffectiveAttributeValue(attr);
            const pericia = character.pericias.find(p => p.name === 'Ocultismo');
            const baseTrainingDie = pericia?.isGeneric ? 4 : TRAINING_DIE_MAP[pericia?.training ?? 'treinado'];
            const trainingDie = getFearAdjustedTrainingDie(baseTrainingDie, 'Ocultismo');
            return {
              attributeValue,
              trainingDie,
              wasSwapped: false,
              realAttribute: attr
            };
          }}
          onClose={() => setIsConjurationOverlayOpen(false)}
          onConclude={handleCancelConjuration}
          onSuspend={handleSuspendConjuration}
        />
      )}
    </div>
  );
}
