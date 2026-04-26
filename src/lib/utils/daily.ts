import cards from '$lib/data/cards.json';
import type { Card } from './game';

// Deterministic daily card based on the date
export function getDailyCard(): Card {
  const epoch = new Date('2025-01-01').getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayIndex = Math.floor((today.getTime() - epoch) / 86400000);
  return (cards as Card[])[dayIndex % cards.length];
}