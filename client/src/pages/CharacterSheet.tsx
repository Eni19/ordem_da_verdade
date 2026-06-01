import { useCallback, useEffect, useRef, useState } from 'react';
import AttributeHexagon from '@/components/AttributeHexagon';
import SkillsList from '@/components/SkillsList';
import DiceRoller from '@/components/DiceRoller';
import VitalStats from '@/components/VitalStats';
import Pericias from '@/components/Pericias';
import HopeCounter from '@/components/HopeCounter';
import EvasionPanel, { type EvasionProtection } from '@/components/EvasionPanel';
import InventoryPanel from '@/components/InventoryPanel';
import InsanityPanel from '@/components/InsanityPanel';
import RitualsPanel from '@/components/RitualsPanel';
import SaveLoad from '@/components/SaveLoad';
import CharacterManager from '@/components/CharacterManager';
import symbols, { type RitualSymbol } from '@/data/symbols';
import fearEffects, { type FearEffect } from '@/data/fear';

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
}

type AttributeKey = 'força' | 'agilidade' | 'inteligência' | 'presença' | 'vigor';

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

type RitualType = 'dano' | 'aflicao' | 'utilidade';

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
}

interface RitualComponent {
  id: string;
  name: string;
  description: string;
}

interface RitualConjureState {
  ritualId: string;
  symbolChoices: RitualSymbol[];
  selectedSymbol: RitualSymbol | null;
  step: number; // 1 = escolha do símbolo, 2 = escolha de componente, 3 = final
  chosenComponentId?: string | null;
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
  ritualComponents: RitualComponent[];
}

interface SkillRollRequest {
  id: number;
  periciaName: string;
  attributeLabel: string;
  trainingLabel: string;
  attributeValue: number;
  trainingDie: number;
}

const ATTRIBUTE_KEYS: Array<keyof CharacterData['attributes']> = [
  'força',
  'agilidade',
  'inteligência',
  'presença',
  'vigor',
];

const ATTRIBUTE_LABELS: Record<keyof CharacterData['attributes'], string> = {
  força: 'Forca',
  agilidade: 'Agilidade',
  inteligência: 'Inteligencia',
  presença: 'Presenca',
  vigor: 'Vigor',
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
  const [ritualConjureState, setRitualConjureState] = useState<RitualConjureState | null>(null);
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
  const [activeFearTags, setActiveFearTags] = useState<ActiveFearTag[]>([]);
  const [fearRouletteState, setFearRouletteState] = useState<FearRouletteState>(
    createInitialFearRouletteState()
  );
  const [fearResultAttributeChoice, setFearResultAttributeChoice] = useState<AttributeKey | null>(null);
  const [selectedFearTag, setSelectedFearTag] = useState<ActiveFearTag | null>(null);
  const [fearTagPendingRemoval, setFearTagPendingRemoval] = useState<ActiveFearTag | null>(null);
  const [showFearDebug, setShowFearDebug] = useState(false);
  const [debugResultTwoAttribute, setDebugResultTwoAttribute] = useState<AttributeKey>('força');
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
    ritualComponents: [],
  });

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
    if (!characterId) return;

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
        }
      } catch {
        // Silently fail on auto-save — user can manually save
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
    ritualComponents: character.ritualComponents,
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
      alert('Erro ao salvar na nuvem. Verifique se o servidor está rodando.');
      console.error(err);
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
      attributes: { força: 0, agilidade: 0, inteligência: 0, presença: 0, vigor: 0 },
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
      ritualComponents: [],
    });
  };

  const resolveFearEffect = (total: number): FearEffect => {
    if (total >= 20) {
      return fearEffects.find((effect) => effect.resultado === '20+') ?? fearEffects[fearEffects.length - 1];
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
          if (attribute === 'força' || attribute === 'agilidade') return sum + 1;
          if (attribute === 'inteligência' || attribute === 'presença') return sum - 1;
          return sum;
        case '4':
          return attribute === 'agilidade' ? sum - 1 : sum;
        case '5':
          return attribute === 'força' ? sum - 1 : sum;
        case '6':
          return attribute === 'inteligência' ? sum - 1 : sum;
        case '7':
          return attribute === 'presença' ? sum - 1 : sum;
        case '14':
          return attribute === 'vigor' ? sum - 2 : sum;
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

  const getConfusionAdjustedAttribute = (attribute: AttributeKey) => {
    const isConfused = activeFearTags.some((tag) => tag.effectResult === '13');

    if (!isConfused || attribute === 'vigor') {
      return { attribute, wasSwapped: false };
    }

    if (Math.random() < 0.5) {
      return { attribute, wasSwapped: false };
    }

    const swappedAttribute: AttributeKey =
      attribute === 'força'
        ? 'agilidade'
        : attribute === 'agilidade'
          ? 'força'
          : attribute === 'inteligência'
            ? 'presença'
            : 'inteligência';

    return { attribute: swappedAttribute, wasSwapped: true };
  };

  const getDespairAdjustedTrainingDie = (trainingDie: number) => {
    const hasDespair = activeFearTags.some((tag) => tag.effectResult === '11');
    return hasDespair ? getReducedTrainingDie(trainingDie) : trainingDie;
  };

  const isFear8Active = activeFearTags.some((tag) => tag.effectResult === '8');

  const isFearAffectedAttribute = (attribute: AttributeKey): boolean => {
    return activeFearTags.some((tag) => {
      switch (tag.effectResult) {
        case '2':
          return tag.selectedAttribute === attribute;
        case '3':
          return attribute === 'força' || attribute === 'agilidade' || attribute === 'inteligência' || attribute === 'presença';
        case '4':
          return attribute === 'agilidade';
        case '5':
          return attribute === 'força';
        case '6':
          return attribute === 'inteligência';
        case '7':
          return attribute === 'presença';
        case '13':
          return attribute !== 'vigor';
        case '14':
          return attribute === 'vigor';
        default:
          return false;
      }
    });
  };

  const closeFearRoulette = () => {
    setFearRouletteState(createInitialFearRouletteState());
    setFearResultAttributeChoice(null);
  };

  const buildFearTag = (
    effect: FearEffect,
    params: {
      rollTotal: number;
      bonusApplied: number;
      sourceInsanityId: string;
      sourceInsanityName: string;
      selectedAttribute?: AttributeKey;
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

  const toggleFearDebugCondition = (result: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '10' | '11' | '13' | '14') => {
    const existing = activeFearTags.find(
      (tag) =>
        tag.sourceInsanityId === 'debug-fear' &&
        tag.effectResult === result &&
        (result !== '2' || tag.selectedAttribute === debugResultTwoAttribute)
    );

    if (existing) {
      handleRemoveFearTag(existing.id);
      return;
    }

    const effect = fearEffects.find((item) => item.resultado === result);
    if (!effect) return;

    const debugTag = buildFearTag(effect, {
      rollTotal: Number(result),
      bonusApplied: 0,
      sourceInsanityId: 'debug-fear',
      sourceInsanityName: 'Debug',
      selectedAttribute: result === '2' ? debugResultTwoAttribute : undefined,
    });

    setActiveFearTags((prev) => [...prev, debugTag]);
  };

  const handleConfirmFearAttribute = () => {
    const pending = fearRouletteState.pendingTag;
    if (!pending || pending.effectResult !== '2' || !fearResultAttributeChoice) return;

    setActiveFearTags((prev) => [
      ...prev,
      {
        ...pending,
        selectedAttribute: fearResultAttributeChoice,
      },
    ]);

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

    setCharacter({
      ...character,
      pericias: character.pericias.filter((pericia) => pericia.id !== id),
    });
  };

  const handleRollPericia = (id: string, selectedAttribute: keyof CharacterData['attributes']) => {
    const pericia = character.pericias.find((p) => p.id === id);
    if (!pericia) return;

    const selectedAttributeKey = selectedAttribute as AttributeKey;
    const adjustedAttribute = getConfusionAdjustedAttribute(selectedAttributeKey);
    const normalizedAttribute = getEffectiveAttributeValue(adjustedAttribute.attribute);

    const baseTrainingDie = pericia.isGeneric ? 4 : TRAINING_DIE_MAP[pericia.training];
    const trainingDie = getDespairAdjustedTrainingDie(baseTrainingDie);
    const trainingLabel = getTrainingLabelForDie(trainingDie);

    setPendingRoll({
      id: Date.now(),
      periciaName: pericia.name || 'Pericia sem nome',
      attributeLabel: `${ATTRIBUTE_LABELS[adjustedAttribute.attribute]}${adjustedAttribute.wasSwapped ? ' (Confusão)' : ''}`,
      trainingLabel,
      attributeValue: normalizedAttribute,
      trainingDie,
    });
  };

  const handleRollWeaponTest = (weapon: Weapon) => {
    if (!weapon.attribute || !weapon.skill) return;

    const attributeKey = weapon.attribute as AttributeKey;
    const adjustedAttribute = getConfusionAdjustedAttribute(attributeKey);
    const normalizedAttribute = getEffectiveAttributeValue(adjustedAttribute.attribute);
    
    // Find the training die for the weapon skill
    const skillTrainingDie = SKILL_DICE[weapon.skill as keyof typeof SKILL_DICE] || 6;

    setPendingRoll({
      id: Date.now(),
      periciaName: weapon.name || 'Arma sem nome',
      attributeLabel: `${ATTRIBUTE_LABELS[adjustedAttribute.attribute] || weapon.attribute}${adjustedAttribute.wasSwapped ? ' (Confusão)' : ''}`,
      trainingLabel: `${weapon.skill} (1d${skillTrainingDie})`,
      attributeValue: normalizedAttribute,
      trainingDie: skillTrainingDie,
      weaponName: weapon.name || 'Arma sem nome',
      criticalThreshold: weapon.criticalThreshold,
      criticalMultiplier: weapon.criticalMultiplier,
      damageDiceCount: weapon.damageDiceCount,
      damageDiceSides: weapon.damageDiceSides,
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

  const getRandomSymbolChoices = (): RitualSymbol[] => {
    const pool = [...symbols];
    for (let index = pool.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
    }

    return pool.slice(0, 3);
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

  const handleConjureRitual = (_ritual: Ritual) => {
    const ritual = _ritual;
    const activeVersion = ritual.versions[ritual.activeVersion] ?? ritual.versions[0];

    if (activeVersion?.retained) {
      handleUpdateRitual(ritual.id, {
        ...ritual,
        versions: ritual.versions.map((version, index) =>
          index === ritual.activeVersion ? { ...version, retained: false } : version
        ),
      });
      return;
    }

    setRitualConjureState({
      ritualId: ritual.id,
      symbolChoices: getRandomSymbolChoices(),
      selectedSymbol: null,
      step: 1,
      chosenComponentId: null,
    });
    setOpenSidebar('rituals');
  };

  const handleChooseRitualSymbol = (symbol: RitualSymbol) => {
    setRitualConjureState((prev) =>
      prev ? { ...prev, selectedSymbol: symbol } : prev
    );
  };

  const handleContinueRitual = (_ritualId: string) => {
    setRitualConjureState((prev) => {
      if (!prev) return prev;
      if (prev.step === 1 && prev.selectedSymbol) {
        return { ...prev, step: 2 };
      }
      if (prev.step === 2) {
        return { ...prev, step: 3 };
      }
      return prev;
    });
    setOpenSidebar('rituals');
  };

  const handleContinueWithoutComponents = (ritualId: string) => {
    setRitualConjureState((prev) => (prev && prev.ritualId === ritualId ? { ...prev, step: 3 } : prev));
    setOpenSidebar('rituals');
  };

  const handleCancelConjure = () => {
    setRitualConjureState(null);
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
    const adjustedAttribute = getConfusionAdjustedAttribute(attributeKey);
    const attributeValue = getEffectiveAttributeValue(adjustedAttribute.attribute);
    const pericia = character.pericias.find((p) => p.id === ritualResolveState.selectedPericiaId) ?? character.pericias[0];
    const baseTrainingDie = pericia?.isGeneric ? 4 : TRAINING_DIE_MAP[pericia?.training ?? 'treinado'];
    const trainingDie = getDespairAdjustedTrainingDie(baseTrainingDie);

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
    setRitualConjureState(null);
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

  const handleInvokeInsanity = (insanity: Insanity) => {
    const gain = insanity.type === 'fobia' ? 2 : 1;
    setCharacter((prev) => ({ ...prev, hope: Math.min(prev.hope + gain, 3) }));

    if (insanity.type !== 'fobia') {
      return;
    }

    const dieOne = Math.floor(Math.random() * 10) + 1;
    const dieTwo = Math.floor(Math.random() * 10) + 1;
    const bonus = activeFearTags.length;
    const total = dieOne + dieTwo + bonus;
    const finalEffect = resolveFearEffect(total);
    const finalIndex = Math.max(
      0,
      fearEffects.findIndex((effect) => effect.resultado === finalEffect.resultado)
    );

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
      ? data.skills.map((skill) => ({
          id: skill.id,
          name: skill.name ?? 'Habilidade',
          origin: skill.origin ?? skill.source ?? '',
          cost: skill.cost != null ? String(skill.cost) : '',
          effect: skill.effect ?? skill.description ?? skill.damage ?? '',
        }))
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
      type: version?.type ?? 'utilidade',
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

    const loadedRitualComponents: RitualComponent[] = Array.isArray(data.ritualComponents)
      ? data.ritualComponents.map((component) => ({
          id: component.id,
          name: component.name ?? '',
          description: component.description ?? '',
        }))
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
      },
      skills: loadedSkills.length > 0 ? loadedSkills : prev.skills,
      pericias: ensureGenericPericia(loadedPericias.length > 0 ? loadedPericias : prev.pericias),
      rituals: loadedRituals.length > 0 ? loadedRituals : prev.rituals,
      ritualComponents:
        loadedRitualComponents.length > 0 ? loadedRitualComponents : prev.ritualComponents,
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

  return (
    <div className="min-h-screen bg-black text-white font-mono overflow-hidden flex flex-col">
      {/* Header */}
      <div className="border-b-2 border-primary bg-black p-2 md:p-4 flex-shrink-0 space-y-2 md:space-y-3 overflow-y-auto max-h-screen md:max-h-none">
        <h1 className="font-display text-2xl md:text-4xl text-primary">ORDEM DA VERDADE</h1>
        <input
          type="text"
          value={character.name}
          onChange={handleNameChange}
          className="input-occult text-lg md:text-2xl font-display bg-black border-b-2 border-primary focus:border-primary w-full"
          placeholder="Nome do Personagem"
        />

        {/* Save/Load Buttons */}
        <SaveLoad
          characterData={character}
          onLoadCharacter={handleLoadCharacter}
          characterId={characterId}
          onSaveToCloud={handleSaveToCloud}
          onOpenManager={() => setIsManagerOpen(true)}
          isCloudSaving={isCloudSaving}
          lastCloudSave={lastCloudSave}
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
            <div className="mt-2 border border-purple-500/60 bg-purple-950/10 p-2 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase font-bold text-purple-300">Debug Medo</div>
                <button
                  onClick={() => setShowFearDebug((prev) => !prev)}
                  className="text-[10px] px-2 py-1 border border-purple-500 text-purple-300 hover:bg-purple-500/10"
                >
                  {showFearDebug ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {showFearDebug && (
                <div className="space-y-2">
                  <div className="text-[10px] text-purple-200/80">
                    Ative/desative rapidamente os efeitos de medo para testar os modificadores.
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-purple-300 uppercase">Atributo do Resultado 2</label>
                    <select
                      value={debugResultTwoAttribute}
                      onChange={(event) => setDebugResultTwoAttribute(event.target.value as AttributeKey)}
                      className="bg-black border border-purple-500 text-purple-200 text-[10px] px-2 py-1"
                    >
                      {ATTRIBUTE_KEYS.map((attribute) => (
                        <option key={attribute} value={attribute}>
                          {ATTRIBUTE_LABELS[attribute]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {(['2', '3', '4', '5', '6', '7', '8', '10', '11', '13', '14'] as const).map((result) => {
                      const isActive = activeFearTags.some(
                        (tag) =>
                          tag.sourceInsanityId === 'debug-fear' &&
                          tag.effectResult === result &&
                          (result !== '2' || tag.selectedAttribute === debugResultTwoAttribute)
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
                evasionPenalty={isFear8Active ? 3 : 0}
                isFearLimited={isFear8Active}
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
                value={character.attributes[attr]}
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
              isTrainingAffected={activeFearTags.some((tag) => tag.effectResult === '11')}
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

      {fearRouletteState.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl border-2 border-purple-500 bg-black p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-500 pb-2">
              <h3 className="font-display text-lg text-purple-300 uppercase">Roleta do Medo</h3>
              {!fearRouletteState.isRolling && (
                <button
                  onClick={closeFearRoulette}
                  className="text-xs px-2 py-1 border border-purple-500 text-purple-300 hover:bg-purple-500/10"
                >
                  Fechar
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs uppercase font-bold">
              <div className="border border-purple-500 p-2 text-purple-200">D10: {fearRouletteState.dice?.[0] ?? '-'}</div>
              <div className="border border-purple-500 p-2 text-purple-200">D10: {fearRouletteState.dice?.[1] ?? '-'}</div>
              <div className="border border-purple-500 p-2 text-purple-300">Bônus: +{fearRouletteState.bonus}</div>
            </div>

            <div className="border border-purple-500 p-3 space-y-2 min-h-40">
              <div className="text-[10px] text-purple-400 uppercase font-bold">
                {fearRouletteState.isRolling ? 'Sorteando medo...' : `Resultado final: ${fearRouletteState.total}`}
              </div>
                <div className="space-y-2">
                  <div className={`text-sm uppercase tracking-wider font-display ${fearRouletteState.isRolling ? 'text-purple-300' : 'text-purple-200'}`}>
                    {(fearRouletteState.isRolling
                      ? fearEffects[fearRouletteState.displayIndex]
                      : fearRouletteState.finalEffect
                    )?.nome}
                  </div>

                  <div className={`text-base md:text-lg font-display ${fearRouletteState.isRolling ? 'text-purple-300 animate-pulse' : 'text-purple-100'}`}>
                    {(fearRouletteState.isRolling
                      ? fearEffects[fearRouletteState.displayIndex]
                      : fearRouletteState.finalEffect
                    )?.descricaoNarrativa}
                  </div>

                  <div className="text-[10px] uppercase text-purple-400 font-bold">Efeito Mecânico</div>
                  <div className="text-xs text-purple-200/60 leading-relaxed">
                    {(fearRouletteState.isRolling
                      ? fearEffects[fearRouletteState.displayIndex]
                      : fearRouletteState.finalEffect
                    )?.descricaoMecanica}
                  </div>
                </div>
            </div>

            {!fearRouletteState.isRolling && fearRouletteState.finalEffect?.resultado === '2' && (
              <div className="space-y-2">
                <div className="text-xs uppercase font-bold text-purple-300">Escolha o atributo para +1 passo</div>
                <div className="grid grid-cols-5 gap-1">
                  {ATTRIBUTE_KEYS.map((attribute) => (
                    <button
                      key={attribute}
                      onClick={() => setFearResultAttributeChoice(attribute)}
                      className={`py-1 text-[10px] uppercase border ${fearResultAttributeChoice === attribute ? 'bg-purple-500 text-black border-purple-500' : 'bg-black text-purple-300 border-purple-500 hover:bg-purple-500/20'}`}
                    >
                      {ATTRIBUTE_LABELS[attribute]}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleConfirmFearAttribute}
                  disabled={!fearResultAttributeChoice}
                  className="w-full py-2 bg-purple-500 text-black font-bold uppercase border border-purple-400 hover:bg-purple-400 disabled:opacity-40"
                >
                  Aplicar Efeito
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
        paranormalPowers={character.paranormalPowers}
        onInsanityAdd={handleAddInsanity}
        onInsanityRemove={handleRemoveInsanity}
        onInsanityUpdate={handleUpdateInsanity}
        onInsanityInvoke={handleInvokeInsanity}
        onPowerAdd={handleAddPower}
        onPowerRemove={handleRemovePower}
        onPowerUpdate={handleUpdatePower}
      />

      <RitualsPanel
        isOpen={openSidebar === 'rituals'}
        showToggle={openSidebar !== 'inventory' && openSidebar !== 'insanity'}
        onToggle={toggleRitualsPanel}
        rituals={character.rituals}
        components={character.ritualComponents}
        onAddRitual={handleAddRitual}
        onUpdateRitual={handleUpdateRitual}
        ritualConjureState={ritualConjureState}
        onChooseRitualSymbol={handleChooseRitualSymbol}
        onSetRitualVersion={handleSetRitualVersion}
        onContinueRitual={handleContinueRitual}
        onContinueWithoutComponents={handleContinueWithoutComponents}
        onCancelConjure={handleCancelConjure}
        onResolveRitual={handleResolveRitual}
        onRemoveRitual={handleRemoveRitual}
        onConjureRitual={handleConjureRitual}
      />

      {/* Resolve Ritual Modal */}
      {ritualResolveState && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl border-2 border-purple-500 bg-black p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-purple-300 uppercase">Resolver Ritual</h3>
              <button onClick={handleCloseResolve} className="text-xs text-purple-300 border border-purple-500 px-2 py-1">Fechar</button>
            </div>

            {!ritualResolveState.rolls || ritualResolveState.isRolling === undefined ? (
              <div className="space-y-2">
                <div className="text-xs text-purple-200">Escolha atributo</div>
                <div className="grid grid-cols-3 gap-2">
                  {ATTRIBUTE_KEYS.map((key) => (
                    <button
                      key={key}
                      onClick={() => setRitualResolveState((prev) => (prev ? { ...prev, selectedAttribute: key } : prev))}
                      className={`py-2 text-xs uppercase border ${ritualResolveState.selectedAttribute === key ? 'bg-purple-500 text-black' : 'text-purple-300 border-purple-500'}`}
                    >
                      {ATTRIBUTE_LABELS[key]}
                    </button>
                  ))}
                </div>

                <div>
                  <div className="text-xs text-purple-200">Escolha pericia</div>
                  <select
                    value={ritualResolveState.selectedPericiaId ?? ''}
                    onChange={(e) => setRitualResolveState((prev) => (prev ? { ...prev, selectedPericiaId: e.target.value } : prev))}
                    className="w-full bg-black border border-purple-500 p-2 text-purple-200"
                  >
                    <option value="">(usar primeira)</option>
                    {character.pericias.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handlePerformResolveRoll}
                    className="flex-1 bg-purple-500 text-black py-2 uppercase font-bold"
                  >
                    Rolar
                  </button>
                  <button onClick={handleCloseResolve} className="flex-1 border border-purple-500 text-purple-300 py-2 uppercase">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-purple-200 uppercase">Resultado</div>
                <div className="flex gap-3">
                  <div className="h-16 w-16 border-2 border-blue-500 flex items-center justify-center text-2xl font-bold">{ritualResolveState.rolls?.[0]}</div>
                  <div className="h-16 w-16 border-2 border-purple-600 flex items-center justify-center text-2xl font-bold">{ritualResolveState.rolls?.[1]}</div>
                  <div className="flex-1 border-2 border-red-500 p-3">
                    <div className="text-sm font-bold text-purple-200">Total: {ritualResolveState.total}</div>
                    <div className={`mt-1 text-xs font-bold ${ritualResolveState.passed ? 'text-green-400' : 'text-red-400'}`}>{ritualResolveState.passed ? 'Sucesso' : 'Falha'}</div>
                    <div className="text-[10px] text-purple-300 mt-2">Dificuldade: {ritualResolveState.difficulty}</div>
                  </div>
                </div>

                <div className="border border-purple-500 p-3">
                  <div className="text-xs text-purple-200 uppercase font-bold">Efeito do Ritual</div>
                  <div className="mt-2 text-sm text-purple-100">{(character.rituals.find((r) => r.id === ritualResolveState.ritualId)?.versions[0]?.description) || 'Descrição do ritual'}</div>
                  <div className="mt-2 text-[10px] text-purple-300">Símbolo: {ritualConjureState?.selectedSymbol?.simbolo ?? 'Nenhum'}</div>
                  <div className="mt-1 text-[10px] text-purple-300">Componentes: Nenhum selecionado</div>
                </div>

                <div className="flex gap-2">
                  <button onClick={handleCloseResolve} className="flex-1 bg-purple-500 text-black py-2 uppercase font-bold">Fechar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
