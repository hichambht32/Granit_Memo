import type { KnowledgeItem } from "../types";

export interface ScoreResult {
  points: number;
  basePoints: number;
  streakBonus: number;
  timeGapBonus: number;
}

/**
 * Calculates points earned for a correct answer
 */
export function calculatePoints(
  item: KnowledgeItem,
  correct: boolean
): ScoreResult {
  if (!correct) {
    return {
      points: 0,
      basePoints: 0,
      streakBonus: 0,
      timeGapBonus: 0,
    };
  }

  // Base points by difficulty
  const basePoints = getBasePoints(item.difficulty);

  // Streak bonus
  let streakMultiplier = 0;
  if (item.currentStreak >= 5) {
    streakMultiplier = 1.0; // +100%
  } else if (item.currentStreak >= 3) {
    streakMultiplier = 0.5; // +50%
  } else if (item.currentStreak >= 1) {
    streakMultiplier = 0.25; // +25%
  }

  const streakBonus = Math.round(basePoints * streakMultiplier);

  // Time gap bonus
  let timeGapBonus = 0;
  if (item.lastAnsweredAt) {
    const daysSinceLastAnswer =
      (Date.now() - item.lastAnsweredAt) / (1000 * 60 * 60 * 24);
    if (daysSinceLastAnswer >= 7) {
      timeGapBonus = Math.round(basePoints * 0.2); // +20%
    }
  }

  const points = basePoints + streakBonus + timeGapBonus;

  return {
    points,
    basePoints,
    streakBonus,
    timeGapBonus,
  };
}

function getBasePoints(difficulty: number): number {
  const pointsMap: Record<number, number> = {
    1: 5,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
  };
  return pointsMap[difficulty] ?? 8;
}

/**
 * Updates daily practice streak
 */
export function updateDailyStreak(
  lastPracticeDate: string | null,
  currentStreak: number
): { streak: number; today: string } {
  const today = new Date().toISOString().split("T")[0];

  if (!lastPracticeDate) {
    return { streak: 1, today };
  }

  if (lastPracticeDate === today) {
    return { streak: currentStreak, today };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (lastPracticeDate === yesterdayStr) {
    return { streak: currentStreak + 1, today };
  }

  // Streak broken
  return { streak: 1, today };
}

