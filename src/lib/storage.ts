import type { AppData, AppSettings } from "../types";

const STORAGE_KEY = "memolil:v1";

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false, // Light mode by default
  questionsPerSession: 10,
  defaultQuizMode: "mixed",
  showExplanations: true,
};

const FAMILY_STORAGE_PREFIX = "memolil-family:";

const DEFAULT_DATA: AppData = {
  knowledgeItems: [],
  answerLogs: [],
  settings: DEFAULT_SETTINGS,
  version: "1.0.0",
  totalPoints: 0,
  dailyPracticeStreak: 0,
  lastPracticeDate: null,
  familyId: null,
};

function getStorageKey(familyId?: string | null): string {
  return familyId ? `${FAMILY_STORAGE_PREFIX}${familyId}` : STORAGE_KEY;
}

export function loadData(familyId?: string | null): AppData {
  try {
    const key = getStorageKey(familyId);
    const stored = localStorage.getItem(key);
    if (!stored) {
      return { ...DEFAULT_DATA, familyId: familyId || null };
    }
    const data = JSON.parse(stored) as AppData;
    return {
      ...DEFAULT_DATA,
      ...data,
      settings: { ...DEFAULT_SETTINGS, ...data.settings },
      familyId: familyId || null,
    };
  } catch (error) {
    console.error("Failed to load data:", error);
    return { ...DEFAULT_DATA, familyId: familyId || null };
  }
}

export function saveData(data: AppData): void {
  try {
    const key = getStorageKey(data.familyId);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save data:", error);
  }
}

export function exportData(familyId?: string | null): string {
  const data = loadData(familyId);
  return JSON.stringify(data, null, 2);
}

export function importData(jsonString: string, familyId?: string | null): boolean {
  try {
    const data = JSON.parse(jsonString) as AppData;
    data.familyId = familyId || null;
    saveData(data);
    return true;
  } catch (error) {
    console.error("Failed to import data:", error);
    return false;
  }
}

export function resetData(familyId?: string | null): void {
  const key = getStorageKey(familyId);
  localStorage.removeItem(key);
}

