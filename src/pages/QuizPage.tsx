import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, CheckCircle, XCircle, SkipForward, RotateCcw, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { useApp } from "../store/AppContext";
import { getDueItems, selectQuestionVariant } from "../lib/scheduling";
import { checkShortAnswer } from "../lib/utils";
import type { KnowledgeItem, QuestionType } from "../types";

interface QuizSession {
  items: KnowledgeItem[];
  currentIndex: number;
  answers: Array<{ correct: boolean; points: number }>;
}

export function QuizPage() {
  const { data, recordAnswer } = useApp();
  const [mode, setMode] = useState<QuestionType | "mixed">("mixed");
  const [session, setSession] = useState<QuizSession | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [flashcardRevealed, setFlashcardRevealed] = useState(false);

  const startSession = () => {
    const items = getDueItems(
      data.knowledgeItems.filter((i) => i.questionVariants.length > 0),
      mode,
      data.settings.questionsPerSession
    );

    if (items.length === 0) {
      alert("No questions available! Create some memos first.");
      return;
    }

    setSession({
      items,
      currentIndex: 0,
      answers: [],
    });
    setUserAnswer("");
    setShowResult(false);
    setFlashcardRevealed(false);
  };

  const currentItem = session?.items[session.currentIndex];
  const currentVariantIndex = currentItem
    ? selectQuestionVariant(currentItem, mode)
    : 0;
  const currentVariant = currentItem?.questionVariants[currentVariantIndex];

  const handleSubmitAnswer = () => {
    if (!currentItem || !currentVariant) return;

    let correct = false;

    if (currentVariant.type === "mcq") {
      const selectedIndex = parseInt(userAnswer);
      correct = selectedIndex === currentVariant.correctChoiceIndex;
    } else if (currentVariant.type === "short") {
      correct = checkShortAnswer(userAnswer, currentVariant.acceptedAnswers || []);
    } else if (currentVariant.type === "flashcard") {
      // For flashcard, user marks themselves
      correct = userAnswer === "correct";
    }

    recordAnswer(
      currentItem.id,
      currentVariant.id,
      userAnswer,
      correct,
      currentVariant.type
    );

    // Calculate points
    const basePoints = [5, 8, 12, 16, 20][currentItem.difficulty - 1] || 8;
    let points = correct ? basePoints : 0;

    if (correct && currentItem.currentStreak >= 1) {
      const streakBonus =
        currentItem.currentStreak >= 5 ? 1.0 : currentItem.currentStreak >= 3 ? 0.5 : 0.25;
      points += Math.round(basePoints * streakBonus);
    }

    setIsCorrect(correct);
    setPointsEarned(points);
    setShowResult(true);

    setSession((prev) =>
      prev
        ? {
            ...prev,
            answers: [...prev.answers, { correct, points }],
          }
        : null
    );
  };

  const handleSkip = () => {
    if (!currentItem || !currentVariant) return;

    recordAnswer(currentItem.id, currentVariant.id, "", false, currentVariant.type, true);

    setSession((prev) =>
      prev
        ? {
            ...prev,
            answers: [...prev.answers, { correct: false, points: 0 }],
          }
        : null
    );

    nextQuestion();
  };

  const nextQuestion = () => {
    if (!session) return;

    if (session.currentIndex + 1 < session.items.length) {
      setSession({
        ...session,
        currentIndex: session.currentIndex + 1,
      });
      setUserAnswer("");
      setShowResult(false);
      setFlashcardRevealed(false);
    } else {
      // Session complete
      setSession({ ...session, currentIndex: session.items.length });
    }
  };

  const renderQuestion = () => {
    if (!currentItem || !currentVariant) return null;

    if (currentVariant.type === "mcq") {
      return (
        <div className="space-y-3">
          <p className="text-base md:text-lg font-medium mb-3 md:mb-4">{currentVariant.prompt}</p>
          <div className="space-y-2">
            {currentVariant.choices?.map((choice, idx) => (
              <Button
                key={idx}
                variant={userAnswer === idx.toString() ? "default" : "outline"}
                className="w-full justify-start text-left h-auto py-2.5 md:py-3 text-sm md:text-base min-h-[44px]"
                onClick={() => !showResult && setUserAnswer(idx.toString())}
                disabled={showResult}
              >
                <span className="mr-2 md:mr-3 font-bold shrink-0">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span className="break-words">{choice.text}</span>
              </Button>
            ))}
          </div>
        </div>
      );
    }

    if (currentVariant.type === "short") {
      return (
        <div className="space-y-4">
          <p className="text-lg font-medium">{currentVariant.prompt}</p>
          <Input
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Type your answer..."
            disabled={showResult}
            onKeyDown={(e) => e.key === "Enter" && !showResult && handleSubmitAnswer()}
          />
          {currentVariant.answerGuidance && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              💡 {currentVariant.answerGuidance}
            </p>
          )}
        </div>
      );
    }

    if (currentVariant.type === "flashcard") {
      return (
        <div className="space-y-4">
          <Card className="min-h-[160px] md:min-h-[200px] flex items-center justify-center cursor-pointer active:scale-[0.98] transition-transform" onClick={() => !showResult && setFlashcardRevealed(true)}>
            <CardContent className="text-center p-4 md:p-8">
              <p className="text-base md:text-xl font-medium">
                {!flashcardRevealed ? currentVariant.front : currentVariant.back}
              </p>
              {!flashcardRevealed && !showResult && (
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-3 md:mt-4">
                  Tap to reveal answer
                </p>
              )}
            </CardContent>
          </Card>
          {flashcardRevealed && !showResult && (
            <div className="flex gap-3">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setUserAnswer("incorrect");
                  handleSubmitAnswer();
                }}
              >
                I Missed It
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setUserAnswer("correct");
                  handleSubmitAnswer();
                }}
              >
                I Got It
              </Button>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  if (!session) {
    return (
      <div className="space-y-4 md:space-y-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2 text-gray-900 dark:text-gray-100">Practice Quiz</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Test your knowledge with smart scheduling
          </p>
        </div>

        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800">
          <CardHeader>
            <CardTitle className="text-indigo-900 dark:text-indigo-100">Start a Quiz Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Question Mode
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(["mixed", "mcq", "short", "flashcard"] as const).map((m) => (
                  <Button
                    key={m}
                    variant={mode === m ? "default" : "outline"}
                    onClick={() => setMode(m)}
                  >
                    {m === "mixed" ? "Mixed" : m.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Questions per session:</span>
                <span className="text-sm font-bold">{data.settings.questionsPerSession}</span>
              </div>
            </div>

            <Button onClick={startSession} size="lg" className="w-full">
              <Brain className="w-5 h-5 mr-2" />
              Start Quiz
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-900 dark:text-green-100">Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-3 gap-2 md:gap-4">
              <div className="text-center">
                <div className="text-xl md:text-3xl font-bold bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
                  {data.totalPoints}
                </div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-3xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
                  {data.dailyPracticeStreak}
                </div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-3xl font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                  {data.knowledgeItems.filter((i) => i.questionVariants.length > 0).length}
                </div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Ready Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Session complete
  if (session.currentIndex >= session.items.length) {
    const totalCorrect = session.answers.filter((a) => a.correct).length;
    const totalPoints = session.answers.reduce((sum, a) => sum + a.points, 0);
    const accuracy = Math.round((totalCorrect / session.answers.length) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-8"
      >
        <Card className="text-center bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="flex justify-center mb-4"
            >
              <Trophy className="w-20 h-20 text-yellow-500 dark:text-yellow-400" />
            </motion.div>
            <CardTitle className="text-3xl text-yellow-900 dark:text-yellow-100">Session Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-3 gap-2 md:gap-4">
              <div>
                <div className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">{totalPoints}</div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Points Earned</div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">{accuracy}%</div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 bg-clip-text text-transparent">
                  {totalCorrect}/{session.answers.length}
                </div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Correct</div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setSession(null)} variant="outline" className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Back to Menu
              </Button>
              <Button onClick={startSession} className="flex-1">
                <Brain className="w-4 h-4 mr-2" />
                Start Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Active question
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-lg md:text-2xl font-bold">Question {session.currentIndex + 1} of {session.items.length}</h1>
        <Badge variant="outline" className="self-start sm:self-auto text-xs">
          {currentVariant?.type.toUpperCase()}
        </Badge>
      </div>

      <div className="w-full bg-blue-100 dark:bg-blue-950 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-400 h-2 rounded-full transition-all duration-300"
          style={{
            width: `${((session.currentIndex + 1) / session.items.length) * 100}%`,
          }}
        />
      </div>

      <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg text-slate-900 dark:text-slate-100">{currentItem?.title}</CardTitle>
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-600 dark:text-gray-400">
            <Badge variant="secondary" className="text-xs">Difficulty: {currentItem?.difficulty}</Badge>
            {currentItem && currentItem.currentStreak > 0 && (
              <Badge variant="secondary" className="text-xs">🔥 Streak: {currentItem.currentStreak}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderQuestion()}

          {!showResult && currentVariant?.type !== "flashcard" && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex-1"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Skip
              </Button>
              <Button
                onClick={handleSubmitAnswer}
                disabled={!userAnswer}
                className="flex-1"
              >
                Submit Answer
              </Button>
            </div>
          )}

          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 rounded-lg ${
                  isCorrect
                    ? "bg-green-500/10 border border-green-500/20"
                    : "bg-red-500/10 border border-red-500/20"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-semibold">
                    {isCorrect ? "Correct!" : "Incorrect"}
                  </span>
                  {pointsEarned > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      +{pointsEarned} points
                    </Badge>
                  )}
                </div>

                {data.settings.showExplanations && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {currentItem?.content.slice(0, 150)}...
                  </p>
                )}

                <Button onClick={nextQuestion} className="w-full mt-4">
                  Next Question
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

