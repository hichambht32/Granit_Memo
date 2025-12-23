import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { AppData, KnowledgeItem, AnswerLog, AppSettings } from "../types";
import { loadData, saveData, exportData as exportDataFn, importData as importDataFn, resetData as resetDataFn } from "../lib/storage";
import { updateSchedule } from "../lib/scheduling";
import { calculatePoints, updateDailyStreak } from "../lib/scoring";
import { loadSeedDataIfEmpty } from "../lib/seedData";
import { useAuth } from "./AuthContext";

interface AppContextType {
  data: AppData;
  addKnowledgeItem: (item: KnowledgeItem) => void;
  updateKnowledgeItem: (id: string, updates: Partial<KnowledgeItem>) => void;
  deleteKnowledgeItem: (id: string) => void;
  recordAnswer: (
    knowledgeItemId: string,
    questionVariantId: string,
    userAnswer: string,
    isCorrect: boolean,
    mode: string,
    skipped?: boolean
  ) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  exportData: () => string;
  importData: (json: string) => boolean;
  resetData: () => void;
  reloadData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, family } = useAuth();
  
  // Load seed data if localStorage is empty (only for personal data, not family data)
  if (!user?.familyId) {
    loadSeedDataIfEmpty();
  }
  
  const [data, setData] = useState<AppData>(() => loadData(user?.familyId));

  // Reload data when family changes
  useEffect(() => {
    const newData = loadData(user?.familyId);
    setData(newData);
  }, [user?.familyId, family]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    saveData(data);
  }, [data]);

  const addKnowledgeItem = (item: KnowledgeItem) => {
    setData((prev) => ({
      ...prev,
      knowledgeItems: [...prev.knowledgeItems, item],
    }));
  };

  const updateKnowledgeItem = (id: string, updates: Partial<KnowledgeItem>) => {
    setData((prev) => ({
      ...prev,
      knowledgeItems: prev.knowledgeItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  };

  const deleteKnowledgeItem = (id: string) => {
    setData((prev) => ({
      ...prev,
      knowledgeItems: prev.knowledgeItems.filter((item) => item.id !== id),
      answerLogs: prev.answerLogs.filter((log) => log.knowledgeItemId !== id),
    }));
  };

  const recordAnswer = (
    knowledgeItemId: string,
    questionVariantId: string,
    userAnswer: string,
    isCorrect: boolean,
    mode: string,
    skipped: boolean = false
  ) => {
    setData((prev) => {
      const item = prev.knowledgeItems.find((i) => i.id === knowledgeItemId);
      if (!item) return prev;

      // Calculate points
      const scoreResult = calculatePoints(item, isCorrect);

      // Create answer log
      const answerLog: AnswerLog = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        knowledgeItemId,
        questionVariantId,
        answeredAt: Date.now(),
        mode: mode as any,
        userAnswer,
        isCorrect,
        pointsAwarded: scoreResult.points,
      };

      // Update schedule
      const scheduleUpdate = updateSchedule(item, isCorrect, skipped);

      // Update daily streak
      const streakUpdate = updateDailyStreak(
        prev.lastPracticeDate,
        prev.dailyPracticeStreak
      );

      return {
        ...prev,
        knowledgeItems: prev.knowledgeItems.map((i) =>
          i.id === knowledgeItemId ? { ...i, ...scheduleUpdate } : i
        ),
        answerLogs: [...prev.answerLogs, answerLog],
        totalPoints: prev.totalPoints + scoreResult.points,
        dailyPracticeStreak: streakUpdate.streak,
        lastPracticeDate: streakUpdate.today,
      };
    });
  };

  const updateSettings = (settings: Partial<AppSettings>) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  };

  const exportDataFunc = () => {
    return exportDataFn(user?.familyId);
  };

  const importDataFunc = (json: string) => {
    return importDataFn(json, user?.familyId);
  };

  const resetDataFunc = () => {
    resetDataFn(user?.familyId);
    setData(loadData(user?.familyId));
  };

  const reloadData = () => {
    setData(loadData(user?.familyId));
  };

  return (
    <AppContext.Provider
      value={{
        data,
        addKnowledgeItem,
        updateKnowledgeItem,
        deleteKnowledgeItem,
        recordAnswer,
        updateSettings,
        exportData: exportDataFunc,
        importData: importDataFunc,
        resetData: resetDataFunc,
        reloadData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}

