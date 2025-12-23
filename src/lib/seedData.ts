import type { KnowledgeItem } from "../types";
import { generateId } from "./utils";

export function getSeedData(): KnowledgeItem[] {
  const now = Date.now();

  const seedItems: Omit<KnowledgeItem, "questionVariants">[] = [
    {
      id: generateId(),
      title: "React useEffect Hook",
      content:
        "useEffect is a React Hook that lets you synchronize a component with an external system. It runs after every render by default, but you can control when it runs by passing a dependency array. The cleanup function returned from useEffect runs before the component unmounts or before the effect runs again.",
      tags: ["react", "hooks", "javascript"],
      createdAt: now - 10 * 24 * 60 * 60 * 1000,
      difficulty: 3,
      source: "typed",
      introducedAt: now - 10 * 24 * 60 * 60 * 1000,
      nextAskAt: now - 2 * 24 * 60 * 60 * 1000,
      intervalDays: 3,
      timesAsked: 5,
      timesCorrect: 4,
      currentStreak: 2,
      lastAnsweredAt: now - 3 * 24 * 60 * 60 * 1000,
      lastAnswerCorrect: true,
    },
    {
      id: generateId(),
      title: "Python List Comprehension",
      content:
        "List comprehensions provide a concise way to create lists in Python. The syntax is [expression for item in iterable if condition]. For example: squares = [x**2 for x in range(10)] creates a list of squares. They are more readable and often faster than traditional for loops.",
      tags: ["python", "syntax", "programming"],
      createdAt: now - 7 * 24 * 60 * 60 * 1000,
      difficulty: 2,
      source: "typed",
      introducedAt: now - 7 * 24 * 60 * 60 * 1000,
      nextAskAt: now,
      intervalDays: 2,
      timesAsked: 3,
      timesCorrect: 3,
      currentStreak: 3,
      lastAnsweredAt: now - 2 * 24 * 60 * 60 * 1000,
      lastAnswerCorrect: true,
    },
    {
      id: generateId(),
      title: "SQL JOIN Types",
      content:
        "SQL has several types of JOINs: INNER JOIN returns rows when there is a match in both tables. LEFT JOIN returns all rows from the left table and matched rows from the right. RIGHT JOIN returns all rows from the right table and matched rows from the left. FULL OUTER JOIN returns all rows when there is a match in either table.",
      tags: ["sql", "database", "joins"],
      createdAt: now - 5 * 24 * 60 * 60 * 1000,
      difficulty: 3,
      source: "typed",
      introducedAt: now - 5 * 24 * 60 * 60 * 1000,
      nextAskAt: now + 1 * 24 * 60 * 60 * 1000,
      intervalDays: 4,
      timesAsked: 4,
      timesCorrect: 2,
      currentStreak: 0,
      lastAnsweredAt: now - 4 * 24 * 60 * 60 * 1000,
      lastAnswerCorrect: false,
    },
    {
      id: generateId(),
      title: "CSS Flexbox",
      content:
        "Flexbox is a one-dimensional layout method for arranging items in rows or columns. Items flex to fill additional space or shrink to fit into smaller spaces. Key properties include display: flex on the container, flex-direction to set the main axis, justify-content for main axis alignment, and align-items for cross axis alignment.",
      tags: ["css", "layout", "frontend"],
      createdAt: now - 3 * 24 * 60 * 60 * 1000,
      difficulty: 2,
      source: "typed",
      introducedAt: now - 3 * 24 * 60 * 60 * 1000,
      nextAskAt: now,
      intervalDays: 1,
      timesAsked: 2,
      timesCorrect: 2,
      currentStreak: 2,
      lastAnsweredAt: now - 1 * 24 * 60 * 60 * 1000,
      lastAnswerCorrect: true,
    },
    {
      id: generateId(),
      title: "Git Rebase vs Merge",
      content:
        "Git merge combines branches by creating a new merge commit that ties together the histories. Git rebase moves or combines a sequence of commits to a new base commit, creating a linear history. Merge preserves history, while rebase rewrites it. Use merge for shared branches and rebase for cleaning up local commits.",
      tags: ["git", "version-control", "workflow"],
      createdAt: now - 1 * 24 * 60 * 60 * 1000,
      difficulty: 4,
      source: "typed",
      introducedAt: now - 1 * 24 * 60 * 60 * 1000,
      nextAskAt: now,
      intervalDays: 1,
      timesAsked: 1,
      timesCorrect: 0,
      currentStreak: 0,
      lastAnsweredAt: now - 1 * 24 * 60 * 60 * 1000,
      lastAnswerCorrect: false,
    },
  ];

  // For seed data, generate questions synchronously using local method
  return seedItems.map((item) => {
    const ki = item as KnowledgeItem;
    return {
      ...ki,
      questionVariants: [
        // Flashcard
        {
          id: generateId(),
          type: "flashcard" as const,
          prompt: ki.title.endsWith("?") ? ki.title : `What is ${ki.title}?`,
          front: ki.title.endsWith("?") ? ki.title : `What is ${ki.title}?`,
          back: ki.content.split("\n")[0].slice(0, 200),
        },
        // Short answer
        {
          id: generateId(),
          type: "short" as const,
          prompt: `Explain ${ki.title}`,
          acceptedAnswers: [ki.content.split(".")[0], ki.title],
          answerGuidance: `Key concept: ${ki.title}`,
        },
        // MCQ
        {
          id: generateId(),
          type: "mcq" as const,
          prompt: `Which statement about "${ki.title}" is correct?`,
          choices: [
            { text: ki.content.split(".")[0], isCorrect: true },
            { text: "This is not related to the topic", isCorrect: false },
            { text: "This contradicts the core principle", isCorrect: false },
            { text: "This is a common misconception", isCorrect: false },
          ],
          correctChoiceIndex: 0,
        },
      ],
    };
  });
}

export function loadSeedDataIfEmpty(): boolean {
  const stored = localStorage.getItem("memolil:v1");
  if (!stored) {
    const seedItems = getSeedData();
    const seedData = {
      knowledgeItems: seedItems,
      answerLogs: [],
      settings: {
        darkMode: false,
        questionsPerSession: 10,
        defaultQuizMode: "mixed" as const,
        showExplanations: true,
      },
      version: "1.0.0",
      totalPoints: 0,
      dailyPracticeStreak: 0,
      lastPracticeDate: null,
    };
    localStorage.setItem("memolil:v1", JSON.stringify(seedData));
    return true;
  }
  return false;
}

