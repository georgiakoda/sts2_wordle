export type Card = {
  id: string;
  name: string;
  cost: number;
  is_x_cost: boolean | null;
  type: string;
  rarity: string;
  color: string;
  keywords: string[] | null;
};

export type FieldResult = 'correct' | 'wrong';

export type GuessResult = {
  card: Card;
  fields: {
    name: FieldResult;
    color: FieldResult;
    type: FieldResult;
    cost: FieldResult;
    rarity: FieldResult;
    keywords: FieldResult;
  };
};

export function normalizeCost(card: Card): string {
  return card.is_x_cost ? 'X' : String(card.cost);
}

export function displayCost(card: Card): string {
  return card.is_x_cost ? 'X' : String(card.cost);
}

export function displayKeywords(card: Card): string {
  return card.keywords && card.keywords.length ? card.keywords.join(', ') : 'None';
}

function keywordsMatch(a: Card, b: Card): boolean {
  const kA = (a.keywords ?? []).slice().sort().join(',');
  const kB = (b.keywords ?? []).slice().sort().join(',');
  return kA === kB;
}

export function evaluateGuess(guess: Card, target: Card): GuessResult {
  return {
    card: guess,
    fields: {
      name: guess.id === target.id ? 'correct' : 'wrong',
      color: guess.color === target.color ? 'correct' : 'wrong',
      type: guess.type === target.type ? 'correct' : 'wrong',
      cost: normalizeCost(guess) === normalizeCost(target) ? 'correct' : 'wrong',
      rarity: guess.rarity === target.rarity ? 'correct' : 'wrong',
      keywords: keywordsMatch(guess, target) ? 'correct' : 'wrong',
    }
  };
}
