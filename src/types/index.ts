export type QuestionType = "mcq" | "short" | "flashcard";

export interface MCQChoice {
  text: string;
  isCorrect: boolean;
}

export interface QuestionVariant {
  id: string;
  type: QuestionType;
  prompt: string;
  // MCQ specific
  choices?: MCQChoice[];
  correctChoiceIndex?: number;
  // Short answer specific
  acceptedAnswers?: string[];
  answerGuidance?: string;
  // Flashcard specific
  front?: string;
  back?: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  difficulty: number; // 1-5
  source: string;
  questionVariants: QuestionVariant[];
  // Scheduling fields
  introducedAt: number;
  nextAskAt: number;
  intervalDays: number;
  timesAsked: number;
  timesCorrect: number;
  currentStreak: number;
  lastAnsweredAt: number | null;
  lastAnswerCorrect: boolean | null;
}

export interface AnswerLog {
  id: string;
  knowledgeItemId: string;
  questionVariantId: string;
  answeredAt: number;
  mode: QuestionType;
  userAnswer: string;
  isCorrect: boolean;
  pointsAwarded: number;
}

export interface AppSettings {
  darkMode: boolean;
  questionsPerSession: number;
  defaultQuizMode: QuestionType | "mixed";
  showExplanations: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: number;
  familyId: string | null;
}

export interface Family {
  id: string;
  name: string;
  createdAt: number;
  createdBy: string;
  members: FamilyMember[];
  inviteCode: string;
}

export interface FamilyMember {
  userId: string;
  userName: string;
  userEmail: string;
  joinedAt: number;
  role: "owner" | "member";
}

export interface AppData {
  knowledgeItems: KnowledgeItem[];
  answerLogs: AnswerLog[];
  settings: AppSettings;
  version: string;
  totalPoints: number;
  dailyPracticeStreak: number;
  lastPracticeDate: string | null;
  familyId: string | null;
}

