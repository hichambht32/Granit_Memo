import { useMemo } from "react";
import { TrendingUp, Award, Target, Flame } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { useApp } from "../store/AppContext";

export function StatsPage() {
  const { data } = useApp();

  const stats = useMemo(() => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const recentLogs = data.answerLogs.filter((log) => log.answeredAt >= thirtyDaysAgo);

    // Overall retention
    const totalAnswers = data.answerLogs.length;
    const totalCorrect = data.answerLogs.filter((log) => log.isCorrect).length;
    const overallRetention = totalAnswers > 0 ? (totalCorrect / totalAnswers) * 100 : 0;

    // Last 30 days retention
    const last30DaysCorrect = recentLogs.filter((log) => log.isCorrect).length;
    const last30DaysRetention =
      recentLogs.length > 0 ? (last30DaysCorrect / recentLogs.length) * 100 : 0;

    // Points this week
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const weekLogs = data.answerLogs.filter((log) => log.answeredAt >= oneWeekAgo);
    const pointsThisWeek = weekLogs.reduce((sum, log) => sum + log.pointsAwarded, 0);

    // Points this month
    const pointsThisMonth = recentLogs.reduce((sum, log) => sum + log.pointsAwarded, 0);

    // Top remembered items
    const topItems = data.knowledgeItems
      .filter((item) => item.currentStreak > 0)
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .slice(0, 5);

    // Most forgotten tags
    const tagStats: Record<string, { correct: number; total: number }> = {};
    data.knowledgeItems.forEach((item) => {
      const itemLogs = data.answerLogs.filter((log) => log.knowledgeItemId === item.id);
      item.tags.forEach((tag) => {
        if (!tagStats[tag]) {
          tagStats[tag] = { correct: 0, total: 0 };
        }
        tagStats[tag].total += itemLogs.length;
        tagStats[tag].correct += itemLogs.filter((log) => log.isCorrect).length;
      });
    });

    const mostForgottenTags = Object.entries(tagStats)
      .map(([tag, stats]) => ({
        tag,
        accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
        total: stats.total,
      }))
      .filter((t) => t.total > 0)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    // Hardest items
    const hardestItems = data.knowledgeItems
      .filter((item) => item.timesAsked >= 3)
      .map((item) => ({
        title: item.title,
        accuracy: (item.timesCorrect / item.timesAsked) * 100,
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    // Ready to level up
    const readyToLevelUp = data.knowledgeItems
      .filter((item) => item.currentStreak >= 3 && item.intervalDays >= 7)
      .slice(0, 5);

    // Points per day (last 30 days)
    const pointsPerDay: Record<string, number> = {};
    recentLogs.forEach((log) => {
      const date = new Date(log.answeredAt).toISOString().split("T")[0];
      pointsPerDay[date] = (pointsPerDay[date] || 0) + log.pointsAwarded;
    });

    const pointsChartData = Object.entries(pointsPerDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, points]) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        points,
      }));

    // Accuracy per day (last 30 days)
    const accuracyPerDay: Record<string, { correct: number; total: number }> = {};
    recentLogs.forEach((log) => {
      const date = new Date(log.answeredAt).toISOString().split("T")[0];
      if (!accuracyPerDay[date]) {
        accuracyPerDay[date] = { correct: 0, total: 0 };
      }
      accuracyPerDay[date].total++;
      if (log.isCorrect) accuracyPerDay[date].correct++;
    });

    const accuracyChartData = Object.entries(accuracyPerDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        accuracy: (stats.correct / stats.total) * 100,
      }));

    // Interval distribution
    const intervalDistribution = [
      { range: "0-3 days", count: 0 },
      { range: "4-7 days", count: 0 },
      { range: "8-14 days", count: 0 },
      { range: "15-21 days", count: 0 },
      { range: "21+ days", count: 0 },
    ];

    data.knowledgeItems.forEach((item) => {
      if (item.intervalDays <= 3) intervalDistribution[0].count++;
      else if (item.intervalDays <= 7) intervalDistribution[1].count++;
      else if (item.intervalDays <= 14) intervalDistribution[2].count++;
      else if (item.intervalDays <= 21) intervalDistribution[3].count++;
      else intervalDistribution[4].count++;
    });

    return {
      overallRetention,
      last30DaysRetention,
      pointsThisWeek,
      pointsThisMonth,
      topItems,
      mostForgottenTags,
      hardestItems,
      readyToLevelUp,
      pointsChartData,
      accuracyChartData,
      intervalDistribution,
    };
  }, [data]);

  return (
    <div className="space-y-4 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2 text-gray-900 dark:text-gray-100">Statistics</h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Track your learning progress</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
            <CardTitle className="text-xs md:text-sm font-medium">Total Points</CardTitle>
            <Award className="h-3 w-3 md:h-4 md:w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-300">{data.totalPoints}</div>
            <p className="text-[10px] md:text-xs text-purple-600 dark:text-purple-400">
              +{stats.pointsThisWeek} this week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200 dark:border-teal-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
            <CardTitle className="text-xs md:text-sm font-medium">Retention Rate</CardTitle>
            <Target className="h-3 w-3 md:h-4 md:w-4 text-teal-600 dark:text-teal-400" />
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-teal-700 dark:text-teal-300">
              {Math.round(stats.overallRetention)}%
            </div>
            <p className="text-[10px] md:text-xs text-teal-600 dark:text-teal-400">
              {Math.round(stats.last30DaysRetention)}% last 30d
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
            <CardTitle className="text-xs md:text-sm font-medium">Daily Streak</CardTitle>
            <Flame className="h-3 w-3 md:h-4 md:w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-orange-700 dark:text-orange-300">{data.dailyPracticeStreak}</div>
            <p className="text-[10px] md:text-xs text-orange-600 dark:text-orange-400">days in a row</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-900/20 dark:to-sky-800/20 border-sky-200 dark:border-sky-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
            <CardTitle className="text-xs md:text-sm font-medium">Total Items</CardTitle>
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-sky-600 dark:test-sky-400" />
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-sky-700 dark:text-sky-300">{data.knowledgeItems.length}</div>
            <p className="text-[10px] md:text-xs text-sky-600 dark:text-sky-400">
              {data.answerLogs.length} attempts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-3 md:gap-4 lg:grid-cols-2">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm md:text-base text-blue-900 dark:text-blue-100">Points per Day (Last 30 Days)</CardTitle>
            <CardDescription className="text-xs md:text-sm text-blue-700 dark:text-blue-300">Your daily point accumulation</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.pointsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={stats.pointsChartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="points"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm md:text-base text-green-900 dark:text-green-100">Accuracy per Day (Last 30 Days)</CardTitle>
            <CardDescription className="text-xs md:text-sm text-green-700 dark:text-green-300">Your daily accuracy percentage</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.accuracyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={stats.accuracyChartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" fontSize={10} />
                  <YAxis fontSize={10} domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Interval Distribution */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm md:text-base text-purple-900 dark:text-purple-100">Item Distribution by Interval</CardTitle>
          <CardDescription className="text-xs md:text-sm text-purple-700 dark:text-purple-300">How far scheduled out your items are</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.intervalDistribution}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="range" fontSize={9} angle={-15} textAnchor="end" height={60} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insights */}
      <div className="grid gap-3 md:gap-4 sm:grid-cols-2">
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm md:text-base text-yellow-900 dark:text-yellow-100">Top Remembered Items 🏆</CardTitle>
            <CardDescription className="text-xs md:text-sm text-yellow-700 dark:text-yellow-300">Highest streak items</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topItems.length > 0 ? (
              <div className="space-y-1.5 md:space-y-2">
                {stats.topItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 gap-2"
                  >
                    <span className="text-xs md:text-sm font-medium truncate flex-1">
                      {item.title}
                    </span>
                    <Badge variant="secondary" className="text-xs shrink-0">🔥 {item.currentStreak}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                No items with streaks yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 border-rose-200 dark:border-rose-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm md:text-base text-rose-900 dark:text-rose-100">Most Forgotten Tags 💭</CardTitle>
            <CardDescription className="text-xs md:text-sm text-rose-700 dark:text-rose-300">Tags with lowest accuracy</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.mostForgottenTags.length > 0 ? (
              <div className="space-y-1.5 md:space-y-2">
                {stats.mostForgottenTags.map(({ tag, accuracy }) => (
                  <div
                    key={tag}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 gap-2"
                  >
                    <Badge variant="outline" className="text-xs">{tag}</Badge>
                    <span className="text-xs md:text-sm font-medium shrink-0">
                      {Math.round(accuracy)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                No tag data available yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm md:text-base text-orange-900 dark:text-orange-100">Hardest Items 📚</CardTitle>
            <CardDescription className="text-xs md:text-sm text-orange-700 dark:text-orange-300">Items with lowest accuracy</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.hardestItems.length > 0 ? (
              <div className="space-y-1.5 md:space-y-2">
                {stats.hardestItems.map(({ title, accuracy }) => (
                  <div
                    key={title}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 gap-2"
                  >
                    <span className="text-xs md:text-sm font-medium truncate flex-1">
                      {title}
                    </span>
                    <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400 shrink-0">
                      {Math.round(accuracy)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Not enough data yet (min 3 attempts)
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-cyan-200 dark:border-cyan-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm md:text-base text-cyan-900 dark:text-cyan-100">Ready to Level Up 🚀</CardTitle>
            <CardDescription className="text-xs md:text-sm text-cyan-700 dark:text-cyan-300">High streak + long interval items</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.readyToLevelUp.length > 0 ? (
              <div className="space-y-1.5 md:space-y-2">
                {stats.readyToLevelUp.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 gap-2"
                  >
                    <span className="text-xs md:text-sm font-medium truncate flex-1">
                      {item.title}
                    </span>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {item.intervalDays} days
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Keep practicing to build streaks!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

