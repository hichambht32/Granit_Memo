import type { KnowledgeItem, QuestionType } from "../types";

export interface ScheduleUpdate {
  nextAskAt: number;
  intervalDays: number;
  currentStreak: number;
  timesAsked: number;
  timesCorrect: number;
  lastAnsweredAt: number;
  lastAnswerCorrect: boolean;
}

/**
 * Updates scheduling parameters after answering a question
 */
export function updateSchedule(
  item: KnowledgeItem,
  correct: boolean,
  skipped: boolean = false
): ScheduleUpdate {
  const now = Date.now();
  
  if (skipped) {
    // Reschedule for soon but not immediate
    return {
      nextAskAt: now + 1000 * 60 * 60 * 24, // 1 day
      intervalDays: item.intervalDays,
      currentStreak: item.currentStreak,
      timesAsked: item.timesAsked,
      timesCorrect: item.timesCorrect,
      lastAnsweredAt: now,
      lastAnswerCorrect: item.lastAnswerCorrect ?? false,
    };
  }

  const newTimesAsked = item.timesAsked + 1;
  const newTimesCorrect = correct ? item.timesCorrect + 1 : item.timesCorrect;
  const newStreak = correct ? item.currentStreak + 1 : 0;

  let newIntervalDays: number;

  if (correct) {
    // Increase interval (but cap at 21 days for monthly randomness)
    if (item.intervalDays === 0) {
      newIntervalDays = 2;
    } else {
      newIntervalDays = Math.min(item.intervalDays * 2, 21);
    }
  } else {
    // Decrease interval back to 1-2 days
    newIntervalDays = 1;
  }

  const nextAskAt = now + newIntervalDays * 24 * 60 * 60 * 1000;

  return {
    nextAskAt,
    intervalDays: newIntervalDays,
    currentStreak: newStreak,
    timesAsked: newTimesAsked,
    timesCorrect: newTimesCorrect,
    lastAnsweredAt: now,
    lastAnswerCorrect: correct,
  };
}

/**
 * Gets questions that are due or eligible for practice
 */
export function getDueItems(
  items: KnowledgeItem[],
  mode: QuestionType | "mixed" = "mixed",
  maxItems: number = 10
): KnowledgeItem[] {
  const now = Date.now();
  
  // Filter by mode
  let filtered = items.filter((item) => {
    if (item.questionVariants.length === 0) return false;
    if (mode === "mixed") return true;
    return item.questionVariants.some((v) => v.type === mode);
  });

  // Separate into due and not-due
  const due = filtered.filter((item) => item.nextAskAt <= now);
  const notDue = filtered.filter((item) => item.nextAskAt > now);

  // Start with due items
  let result = [...due];

  // If we need more, add some random items from not-due for monthly randomness
  if (result.length < maxItems && notDue.length > 0) {
    const needed = maxItems - result.length;
    const shuffled = shuffleArray([...notDue]);
    result = [...result, ...shuffled.slice(0, needed)];
  }

  // Shuffle the result for randomness
  result = shuffleArray(result);

  return result.slice(0, maxItems);
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Selects a question variant from an item based on mode
 */
export function selectQuestionVariant(
  item: KnowledgeItem,
  mode: QuestionType | "mixed"
): number {
  if (mode === "mixed") {
    return Math.floor(Math.random() * item.questionVariants.length);
  }

  const matching = item.questionVariants
    .map((v, i) => ({ variant: v, index: i }))
    .filter(({ variant }) => variant.type === mode);

  if (matching.length === 0) {
    return 0; // Fallback
  }

  const selected = matching[Math.floor(Math.random() * matching.length)];
  return selected.index;
}

