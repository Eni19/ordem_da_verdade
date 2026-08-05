export type DefenseType = 'bloqueio' | 'esquiva' | 'aparar';
export type ProtectionCategory = 'none' | 'light' | 'heavy';
export type TrainingTier = 'treinado' | 'veterano' | 'expert';

export interface PericiaLike {
  name: string;
  training: TrainingTier;
  isGeneric?: boolean;
}

export interface WeaponLike {
  id: string;
  isActive?: boolean;
  range?: 'melee' | 'ranged';
  damageDiceCount: number;
  damageDiceSides: number;
}

export interface InventoryItemLike {
  type: string;
  protectionType?: 'light' | 'heavy';
}

const TRAINING_DIE_MAP: Record<TrainingTier, number> = {
  treinado: 6,
  veterano: 8,
  expert: 10,
};

export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

// Replica a tabela de dado de atributo usada em DiceRoller.tsx (0-5).
export function rollAttributeDie(attributeValue: number): number {
  switch (attributeValue) {
    case 0:
      return Math.min(rollDie(6), rollDie(6));
    case 1:
      return rollDie(6);
    case 2:
      return rollDie(8);
    case 3:
      return rollDie(10);
    case 4:
      return rollDie(12);
    case 5:
      return Math.max(rollDie(12), rollDie(12));
    default:
      return rollDie(6);
  }
}

export function findPericiaTrainingDie(pericias: PericiaLike[], name: string): number | null {
  const target = name.trim().toLowerCase();
  const match = pericias.find(
    (p) => !p.isGeneric && p.name.trim().toLowerCase() === target
  );
  if (!match) return null;
  return TRAINING_DIE_MAP[match.training] ?? null;
}

export function getProtectionCategory(inventory: InventoryItemLike[]): ProtectionCategory {
  const item = inventory.find((i) => i.type === 'protection');
  if (!item) return 'none';
  return item.protectionType === 'heavy' ? 'heavy' : 'light';
}

export function spendDefensiveCharge(current: number): number {
  return current & (current - 1);
}

const PROTECTION_ALLOWED: Record<DefenseType, ProtectionCategory[]> = {
  esquiva: ['none', 'light'],
  bloqueio: ['light', 'heavy'],
  aparar: ['none', 'light', 'heavy'],
};

const REQUIRED_PERICIA: Record<DefenseType, string> = {
  bloqueio: 'Fortitude',
  esquiva: 'Reflexos',
  aparar: 'Luta',
};

export interface DefenseEligibilityContext {
  pericias: PericiaLike[];
  protectionCategory: ProtectionCategory;
  weapons: WeaponLike[];
  defensiveCharges: number;
  areChargesDisabled?: boolean;
}

export interface DefenseEligibility {
  eligible: boolean;
  reason?: string;
}

export function isDefenseEligible(
  type: DefenseType,
  ctx: DefenseEligibilityContext
): DefenseEligibility {
  if (ctx.areChargesDisabled) {
    return { eligible: false, reason: 'Sem reações disponíveis no momento' };
  }
  if (ctx.defensiveCharges === 0) {
    return { eligible: false, reason: 'Sem Cargas Defensivas disponíveis' };
  }
  if (!PROTECTION_ALLOWED[type].includes(ctx.protectionCategory)) {
    if (type === 'esquiva') {
      return { eligible: false, reason: 'Proteção Pesada não pode esquivar' };
    }
    if (type === 'bloqueio') {
      return { eligible: false, reason: 'Requer Proteção Leve ou Pesada' };
    }
  }

  const periciaName = REQUIRED_PERICIA[type];
  const trainingDie = findPericiaTrainingDie(ctx.pericias, periciaName);
  if (trainingDie === null) {
    const suffix = type === 'esquiva' ? 'treinado' : 'treinada';
    return { eligible: false, reason: `Requer ${periciaName} ${suffix}` };
  }

  if (type === 'aparar') {
    const hasMeleeWeapon = ctx.weapons.some((w) => w.isActive && w.range !== 'ranged');
    if (!hasMeleeWeapon) {
      return { eligible: false, reason: 'Requer uma arma corpo a corpo equipada' };
    }
  }

  return { eligible: true };
}

export interface BloqueioResult {
  attributeDieRoll: number;
  fortitudeDieRoll: number;
  valorDeBloqueio: number;
  protectionCategory: 'light' | 'heavy';
}

export function resolveBloqueio(params: {
  protectionCategory: 'light' | 'heavy';
  attributeDieResult: number;
  fortitudeDieResult: number;
}): BloqueioResult {
  const { protectionCategory, attributeDieResult, fortitudeDieResult } = params;
  
  const valorDeBloqueio = protectionCategory === 'heavy'
    ? Math.max(attributeDieResult, fortitudeDieResult)
    : Math.min(attributeDieResult, fortitudeDieResult);

  return {
    attributeDieRoll: attributeDieResult,
    fortitudeDieRoll: fortitudeDieResult,
    valorDeBloqueio,
    protectionCategory,
  };
}

export interface EsquivaResult {
  attributeDie: number;
  reflexosDie: number;
  usedDie: number;
  attackerTotal: number;
  reducedTotal: number;
  isTotalMiss: boolean;
}

export function resolveEsquiva(params: {
  protectionCategory: 'none' | 'light';
  attributeDie: number;
  reflexosDie: number;
  attackerTotal: number;
  passiveEvasion: number;
}): EsquivaResult {
  const { protectionCategory, attributeDie, reflexosDie, attackerTotal, passiveEvasion } = params;
  const usedDie =
    protectionCategory === 'none'
      ? Math.max(attributeDie, reflexosDie)
      : Math.min(attributeDie, reflexosDie);
  const reducedTotal = attackerTotal - usedDie;
  const isTotalMiss = reducedTotal < passiveEvasion;

  return { attributeDie, reflexosDie, usedDie, attackerTotal, reducedTotal, isTotalMiss };
}

export interface ChoqueDeArmasResult {
  yourTotal: number;
  attackerTotal: number;
  youWin: boolean;
  mitigatedDamage?: number;
}

export function resolveChoqueDeArmas(params: {
  yourTotal: number;
  attackerTotal: number;
  attackerRawDamage?: number;
}): ChoqueDeArmasResult {
  const { yourTotal, attackerTotal, attackerRawDamage } = params;
  const youWin = yourTotal >= attackerTotal;
  const mitigatedDamage =
    attackerRawDamage !== undefined
      ? youWin
        ? Math.floor(attackerRawDamage / 2)
        : attackerRawDamage
      : undefined;

  return { yourTotal, attackerTotal, youWin, mitigatedDamage };
}

export function resolveBrecha(yourDice: [number, number], attackerDice: [number, number]): boolean {
  return yourDice.some((y) => attackerDice.includes(y));
}

export function rollCounterAttackDamage(params: {
  damageDiceCount: number;
  damageDiceSides: number;
  attributeValue: number;
}): { rolls: number[]; total: number } {
  const { damageDiceCount, damageDiceSides, attributeValue } = params;
  const rolls = Array.from({ length: damageDiceCount }, () => rollDie(damageDiceSides));
  const total = rolls.reduce((s, v) => s + v, 0) + attributeValue;
  return { rolls, total };
}
