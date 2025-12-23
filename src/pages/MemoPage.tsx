import { useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";
import { Label } from "../components/ui/Label";
import { Badge } from "../components/ui/Badge";
import { Slider } from "../components/ui/Slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/Dialog";
import { useApp } from "../store/AppContext";
import { generateQuestions } from "../lib/questionGenerator";
import { generateId } from "../lib/utils";
import type { KnowledgeItem } from "../types";

export function MemoPage() {
  const { data, addKnowledgeItem, updateKnowledgeItem, deleteKnowledgeItem } = useApp();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [difficulty, setDifficulty] = useState(2);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "difficulty" | "retention">("newest");
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleCreateMemo = () => {
    if (!title.trim() || !content.trim()) return;

    const now = Date.now();
    const newItem: KnowledgeItem = {
      id: generateId(),
      title: title.trim(),
      content: content.trim(),
      tags,
      createdAt: now,
      difficulty,
      source: "typed",
      questionVariants: [],
      introducedAt: now,
      nextAskAt: now + 24 * 60 * 60 * 1000, // 1 day from now
      intervalDays: 1,
      timesAsked: 0,
      timesCorrect: 0,
      currentStreak: 0,
      lastAnsweredAt: null,
      lastAnswerCorrect: null,
    };

    addKnowledgeItem(newItem);

    // Reset form
    setTitle("");
    setContent("");
    setTags([]);
    setDifficulty(2);
  };

  const handleGenerateQuestions = async (item: KnowledgeItem) => {
    try {
      // Show loading state
      const questions = await generateQuestions(item);
      updateKnowledgeItem(item.id, { questionVariants: questions });
    } catch (error) {
      console.error("Failed to generate questions:", error);
      alert("Failed to generate questions. Please check your API keys and try again.");
    }
  };

  const handleDeleteMemo = (id: string) => {
    if (confirm("Are you sure you want to delete this memo?")) {
      deleteKnowledgeItem(id);
      setSelectedItem(null);
    }
  };

  const filteredItems = data.knowledgeItems
    .filter((item) => {
      const query = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      if (sortBy === "newest") return b.createdAt - a.createdAt;
      if (sortBy === "difficulty") return b.difficulty - a.difficulty;
      if (sortBy === "retention") {
        const aRate = a.timesAsked > 0 ? a.timesCorrect / a.timesAsked : 0;
        const bRate = b.timesAsked > 0 ? b.timesCorrect / b.timesAsked : 0;
        return bRate - aRate;
      }
      return 0;
    });

  return (
    <div className="space-y-4 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2 text-gray-900 dark:text-gray-100">Knowledge Capture</h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
          Type your learnings and generate questions automatically
        </p>
      </div>

      {/* Create Memo Form */}
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">Create New Memo</CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            Capture what you learned today
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., React useEffect Hook"
            />
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write down what you learned..."
              rows={5}
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag..."
              />
              <Button onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                  {tag} ×
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Difficulty: {difficulty}</Label>
            <Slider
              value={difficulty}
              onChange={setDifficulty}
              min={1}
              max={5}
              step={1}
            />
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
              <span>Easy</span>
              <span>Hard</span>
            </div>
          </div>

          <Button onClick={handleCreateMemo} className="w-full" size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Create Memo
          </Button>
        </CardContent>
      </Card>

      {/* Memo List */}
      <div className="space-y-3 md:space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memos..."
              className="pl-10 h-11"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 md:px-4 py-2.5 md:py-2 text-sm md:text-base rounded-lg border border-input bg-background h-11"
          >
            <option value="newest">Newest First</option>
            <option value="difficulty">By Difficulty</option>
            <option value="retention">By Retention</option>
          </select>
        </div>

        <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-gray-200 dark:border-gray-700">
                <CardHeader onClick={() => setSelectedItem(item)} className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base md:text-lg text-gray-900 dark:text-gray-100">{item.title}</CardTitle>
                    <Badge variant="outline" className="text-xs shrink-0">Diff: {item.difficulty}</Badge>
                  </div>
                  <CardDescription className="line-clamp-2 text-xs md:text-sm text-gray-700 dark:text-gray-300">
                    {item.content}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5 md:gap-2 mb-2 md:mb-3">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      {item.questionVariants.length} question
                      {item.questionVariants.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs">
                      {item.timesAsked > 0
                        ? `${Math.round((item.timesCorrect / item.timesAsked) * 100)}% correct`
                        : "Not practiced"}
                    </span>
                  </div>
                  {item.questionVariants.length === 0 && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateQuestions(item);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                    >
                      Generate Questions
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-gray-600 dark:text-gray-400">
              {searchQuery ? "No memos found matching your search" : "No memos yet. Create your first one!"}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Memo Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        {selectedItem && (
          <DialogContent onClose={() => setSelectedItem(null)} className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">{selectedItem.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Content</Label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedItem.content}</p>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedItem.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Questions ({selectedItem.questionVariants.length})</Label>
                {selectedItem.questionVariants.length === 0 ? (
                  <Button
                    onClick={() => handleGenerateQuestions(selectedItem)}
                    className="mt-2"
                  >
                    Generate Questions
                  </Button>
                ) : (
                  <div className="space-y-3 mt-2">
                    {selectedItem.questionVariants.map((q) => (
                      <Card key={q.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Badge variant="outline" className="mb-2">
                                {q.type.toUpperCase()}
                              </Badge>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{q.prompt}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteMemo(selectedItem.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

