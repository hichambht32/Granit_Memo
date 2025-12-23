import type { QuestionVariant, KnowledgeItem } from "../types";
import { generateId } from "./utils";
import { config } from "./config";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

/**
 * Generates question variants from a knowledge item using AI
 */
export async function generateQuestions(item: KnowledgeItem): Promise<QuestionVariant[]> {
  try {
    // Try AI generation first
    const aiQuestions = await generateQuestionsWithAI(item);
    if (aiQuestions.length > 0) {
      return aiQuestions;
    }
  } catch (error) {
    console.warn("AI generation failed, falling back to local generation:", error);
  }

  // Fallback to local generation
  return generateQuestionsLocally(item);
}

/**
 * Generate questions using AI (Anthropic Claude or OpenAI)
 */
async function generateQuestionsWithAI(item: KnowledgeItem): Promise<QuestionVariant[]> {
  const prompt = `You are a learning assistant that creates quiz questions. Given the following knowledge item, generate exactly 3 questions:

1. One multiple choice question (MCQ) with 4 options
2. One short answer question with 2-3 acceptable answers
3. One flashcard (front: question, back: answer)

Title: ${item.title}
Content: ${item.content}
Tags: ${item.tags.join(", ")}
Difficulty: ${item.difficulty}/5

Please respond ONLY with a valid JSON array in this exact format:
[
  {
    "type": "mcq",
    "prompt": "question text",
    "choices": [
      {"text": "option 1", "isCorrect": true},
      {"text": "option 2", "isCorrect": false},
      {"text": "option 3", "isCorrect": false},
      {"text": "option 4", "isCorrect": false}
    ]
  },
  {
    "type": "short",
    "prompt": "question text",
    "acceptedAnswers": ["answer1", "answer2"],
    "answerGuidance": "hint text"
  },
  {
    "type": "flashcard",
    "front": "question",
    "back": "answer"
  }
]`;

  let responseText = "";

  if (config.provider === "anthropic") {
    const anthropic = new Anthropic({
      apiKey: config.anthropicApiKey,
      dangerouslyAllowBrowser: true, // Note: In production, use a backend proxy
    });

    const message = await anthropic.messages.create({
      model: config.model,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    responseText = message.content[0].type === "text" ? message.content[0].text : "";
  } else {
    const openai = new OpenAI({
      apiKey: config.openaiApiKey,
      dangerouslyAllowBrowser: true, // Note: In production, use a backend proxy
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    responseText = completion.choices[0].message.content || "";
  }

  // Parse the JSON response
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("No valid JSON found in response");
  }

  const questionsData = JSON.parse(jsonMatch[0]);

  // Convert to QuestionVariant format
  return questionsData.map((q: any) => {
    const base = {
      id: generateId(),
      type: q.type,
      prompt: q.prompt || q.front || "",
    };

    if (q.type === "mcq") {
      const correctIndex = q.choices.findIndex((c: any) => c.isCorrect);
      return {
        ...base,
        choices: q.choices,
        correctChoiceIndex: correctIndex,
      };
    } else if (q.type === "short") {
      return {
        ...base,
        acceptedAnswers: q.acceptedAnswers || [],
        answerGuidance: q.answerGuidance || "",
      };
    } else {
      return {
        ...base,
        front: q.front || "",
        back: q.back || "",
      };
    }
  });
}

/**
 * Local fallback question generation
 */
function generateQuestionsLocally(item: KnowledgeItem): QuestionVariant[] {
  const questions: QuestionVariant[] = [];

  // Generate flashcard
  questions.push(generateFlashcard(item));

  // Generate short answer
  questions.push(...generateShortAnswers(item));

  // Generate MCQ
  questions.push(...generateMCQs(item));

  return questions;
}

function generateFlashcard(item: KnowledgeItem): QuestionVariant {
  // Front: question from title
  const front = item.title.endsWith("?")
    ? item.title
    : `What is ${item.title}?`;

  // Back: summary from content (first 200 chars or first paragraph)
  const back = item.content.split("\n")[0].slice(0, 200);

  return {
    id: generateId(),
    type: "flashcard",
    prompt: front,
    front,
    back,
  };
}

function generateShortAnswers(item: KnowledgeItem): QuestionVariant[] {
  const questions: QuestionVariant[] = [];
  const sentences = extractKeyStatements(item.content);

  sentences.slice(0, 2).forEach((sentence) => {
    const prompt = convertToQuestion(sentence);
    const answer = extractAnswer(sentence);

    questions.push({
      id: generateId(),
      type: "short",
      prompt,
      acceptedAnswers: [answer, sentence],
      answerGuidance: `Key concept: ${item.title}`,
    });
  });

  return questions;
}

function generateMCQs(item: KnowledgeItem): QuestionVariant[] {
  const questions: QuestionVariant[] = [];
  const keyStatements = extractKeyStatements(item.content);

  keyStatements.slice(0, 1).forEach((statement) => {
    const prompt = `Which statement about "${item.title}" is correct?`;
    const correctAnswer = statement;
    const distractors = generateDistractors(item, correctAnswer);

    const choices = [
      { text: correctAnswer, isCorrect: true },
      ...distractors.map((text) => ({ text, isCorrect: false })),
    ];

    // Shuffle choices
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }

    const correctIndex = choices.findIndex((c) => c.isCorrect);

    questions.push({
      id: generateId(),
      type: "mcq",
      prompt,
      choices,
      correctChoiceIndex: correctIndex,
    });
  });

  return questions;
}

function extractKeyStatements(content: string): string[] {
  // Split by periods, newlines, or semicolons
  const sentences = content
    .split(/[.\n;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length < 200);

  return sentences.slice(0, 3);
}

function convertToQuestion(statement: string): string {
  // Simple conversion to question format
  const lower = statement.toLowerCase();

  if (lower.includes(" is ") || lower.includes(" are ")) {
    return `What ${statement.substring(statement.toLowerCase().indexOf(" is "))}?`;
  }

  if (lower.includes(" helps ") || lower.includes(" allows ")) {
    return `How does this work: ${statement}?`;
  }

  return `Explain: ${statement}`;
}

function extractAnswer(statement: string): string {
  // Extract the key concept from the statement
  const words = statement.split(" ");
  
  // Take first 5-10 words as the answer
  if (words.length > 10) {
    return words.slice(0, 10).join(" ");
  }
  
  return statement;
}

function generateDistractors(
  item: KnowledgeItem,
  correctAnswer: string
): string[] {
  const distractors: string[] = [];
  const words = item.content.split(/\s+/);

  // Distractor 1: Similar-sounding but wrong
  const variation1 = correctAnswer
    .replace(/increases/i, "decreases")
    .replace(/helps/i, "prevents")
    .replace(/allows/i, "restricts")
    .replace(/improves/i, "worsens");
  
  if (variation1 !== correctAnswer) {
    distractors.push(variation1);
  }

  // Distractor 2: Use different words from content
  if (words.length > 10) {
    const randomStart = Math.floor(Math.random() * (words.length - 10));
    const distractor2 = words.slice(randomStart, randomStart + 10).join(" ");
    if (distractor2 !== correctAnswer && !distractors.includes(distractor2)) {
      distractors.push(distractor2);
    }
  }

  // Distractor 3: Generic plausible but wrong
  const generic = [
    "This concept is not related to the main topic",
    "This statement contradicts the core principle",
    "This is a common misconception about the subject",
  ];
  
  const randomGeneric = generic[Math.floor(Math.random() * generic.length)];
  if (!distractors.includes(randomGeneric)) {
    distractors.push(randomGeneric);
  }

  // Ensure we have exactly 3 distractors
  while (distractors.length < 3) {
    distractors.push(`Alternative explanation ${distractors.length + 1}`);
  }

  return distractors.slice(0, 3);
}

