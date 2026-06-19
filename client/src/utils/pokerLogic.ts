export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | 'joker';

export interface Card {
  id: string; // ex: "hearts-A", "joker-1", "joker-2"
  suit: Suit;
  rank: Rank;
}

export type HandGrade = 0 | 1 | 2 | 3 | 4 | 5;

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14,
  'joker': 0
};

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${suit}-${rank}`, suit, rank });
    }
  }
  deck.push({ id: 'joker-1', suit: 'joker', rank: 'joker' });
  deck.push({ id: 'joker-2', suit: 'joker', rank: 'joker' });
  return shuffle(deck);
}

export function shuffle(deck: Card[]): Card[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

export interface EvaluatedHand {
  grade: HandGrade;
  name: string;
}

export function drawCard(deck: Card[], count: number): { drawnCards: Card[], newDeck: Card[] } {
  const drawnCards = deck.slice(0, count);
  const newDeck = deck.slice(count);
  return { drawnCards, newDeck };
}

// Basic evaluation of 5 cards without wildcards
function evaluateStandard5Cards(cards: Card[]): EvaluatedHand {
  if (cards.length !== 5) return { grade: 0, name: 'Carta Alta' };

  const ranks = cards.map(c => RANK_VALUES[c.rank]).sort((a, b) => a - b);
  const isFlush = cards.every(c => c.suit === cards[0].suit);
  
  // Straight check including A-2-3-4-5
  let isStraight = false;
  if (ranks[0] === 2 && ranks[1] === 3 && ranks[2] === 4 && ranks[3] === 5 && ranks[4] === 14) {
    isStraight = true; // Ace low
  } else {
    isStraight = ranks.every((r, i) => i === 0 || r === ranks[i - 1] + 1);
  }

  const counts: Record<number, number> = {};
  for (const r of ranks) {
    counts[r] = (counts[r] || 0) + 1;
  }
  const countValues = Object.values(counts).sort((a, b) => b - a);

  // Royal Flush / Five of a kind
  if (countValues[0] === 5) return { grade: 5, name: 'Quina' };
  if (isFlush && isStraight && ranks[4] === 14 && ranks[0] === 10) return { grade: 5, name: 'Royal Flush' };

  // Straight Flush / Four of a kind
  if (countValues[0] === 4) return { grade: 4, name: 'Quadra' };
  if (isFlush && isStraight) return { grade: 4, name: 'Straight Flush' };

  // Full House / Flush / Straight
  if (countValues[0] === 3 && countValues[1] === 2) return { grade: 3, name: 'Full House' };
  if (isFlush) return { grade: 3, name: 'Flush' };
  if (isStraight) return { grade: 3, name: 'Sequência' };

  // Three of a kind / Two Pair
  if (countValues[0] === 3) return { grade: 2, name: 'Trinca' };
  if (countValues[0] === 2 && countValues[1] === 2) return { grade: 2, name: 'Dois Pares' };

  // One Pair
  if (countValues[0] === 2) return { grade: 1, name: 'Um Par' };

  return { grade: 0, name: 'Carta Alta' };
}

// Evaluate 5 cards dealing with 0, 1, or 2 Jokers
export function evaluate5CardHand(cards: Card[]): EvaluatedHand {
  if (cards.length !== 5) return { grade: 0, name: 'Carta Alta' };

  const normalCards = cards.filter(c => c.rank !== 'joker');
  const jokerCount = cards.length - normalCards.length;

  if (jokerCount === 0) {
    return evaluateStandard5Cards(cards);
  }

  // Generate all standard 52 cards as possible substitutes for jokers
  const allSubstitutes: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      allSubstitutes.push({ id: `sub-${suit}-${rank}`, suit, rank });
    }
  }

  let bestHand: EvaluatedHand = { grade: 0, name: 'Carta Alta' };

  if (jokerCount === 1) {
    for (const sub1 of allSubstitutes) {
      const testHand = [...normalCards, sub1];
      const result = evaluateStandard5Cards(testHand);
      if (result.grade > bestHand.grade || (result.grade === 5 && result.name === 'Royal Flush')) {
        bestHand = result;
      }
    }
  } else if (jokerCount === 2) {
    for (const sub1 of allSubstitutes) {
      for (const sub2 of allSubstitutes) {
        const testHand = [...normalCards, sub1, sub2];
        const result = evaluateStandard5Cards(testHand);
        if (result.grade > bestHand.grade || (result.grade === 5 && result.name === 'Royal Flush')) {
          bestHand = result;
        }
      }
    }
  }

  return bestHand;
}

// Helper to find the best 5-card subset out of N cards (useful for UI hints or auto-evaluation)
export function findBest5CardHand(cards: Card[]): { bestCards: Card[], evaluation: EvaluatedHand } {
  if (cards.length <= 5) {
    return { bestCards: cards, evaluation: evaluate5CardHand(cards) };
  }

  const combinations = getCombinations(cards, 5);
  let bestCards = combinations[0];
  let bestEval = evaluate5CardHand(bestCards);

  for (const combo of combinations) {
    const ev = evaluate5CardHand(combo);
    if (ev.grade > bestEval.grade) {
      bestEval = ev;
      bestCards = combo;
    }
  }

  return { bestCards, evaluation: bestEval };
}

function getCombinations<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  function backtrack(start: number, current: T[]) {
    if (current.length === size) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < array.length; i++) {
      current.push(array[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  backtrack(0, []);
  return result;
}

export type SpellEffect = 'Ruptura' | 'Padrão' | 'Discente' | 'Discente Maximizado' | 'Anomalia Narrativa';

export function getConjurationEffect(grade: HandGrade, circle: 1 | 2 | 3, isRetained: boolean = false): SpellEffect {
  const matrix: Record<HandGrade, Record<1 | 2 | 3, SpellEffect>> = {
    0: { 1: 'Ruptura', 2: 'Ruptura', 3: 'Ruptura' },
    1: { 1: 'Padrão', 2: 'Ruptura', 3: 'Ruptura' },
    2: { 1: 'Discente', 2: 'Padrão', 3: 'Ruptura' },
    3: { 1: 'Discente Maximizado', 2: 'Discente', 3: 'Padrão' },
    4: { 1: 'Discente Maximizado', 2: 'Discente Maximizado', 3: 'Discente Maximizado' },
    5: { 1: 'Anomalia Narrativa', 2: 'Anomalia Narrativa', 3: 'Anomalia Narrativa' },
  };
  let effect = matrix[grade][circle];

  if (isRetained) {
    if (effect === 'Anomalia Narrativa' || effect === 'Discente Maximizado') {
      effect = 'Discente';
    }
  }

  return effect;
}

export function getTargetResistanceDT(handGrade: HandGrade, circle: number): number {
  return 8 + handGrade + circle;
}

export function getAnchorTestDT(damageReceived: number): number {
  return 8 + Math.floor(damageReceived / 2);
}
