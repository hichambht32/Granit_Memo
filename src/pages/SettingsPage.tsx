import { useState } from "react";
import { Download, Upload, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Label } from "../components/ui/Label";
import { Switch } from "../components/ui/Switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/Dialog";
import { useApp } from "../store/AppContext";
import { resetData } from "../lib/storage";

export function SettingsPage() {
  const { data, updateSettings, exportData, importData } = useApp();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = () => {
    const jsonString = exportData();
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `memolil-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const success = importData(text);
        if (success) {
          setImportError(null);
          alert("Data imported successfully! Reloading...");
          window.location.reload();
        } else {
          setImportError("Invalid data format");
        }
      } catch (error) {
        setImportError("Failed to read file");
      }
    };
    input.click();
  };

  const handleReset = () => {
    resetData();
    window.location.reload();
  };

  return (
    <div className="space-y-4 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2 text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Customize your MemoLil experience</p>
      </div>

      {/* Appearance */}
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg text-purple-900 dark:text-purple-100">Appearance</CardTitle>
          <CardDescription className="text-xs md:text-sm text-purple-700 dark:text-purple-300">Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Label className="text-sm md:text-base">Dark Mode</Label>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Switch between light and dark themes
              </p>
            </div>
            <Switch
              checked={data.settings.darkMode}
              onCheckedChange={(checked) => {
                updateSettings({ darkMode: checked });
                document.documentElement.classList.toggle("dark", checked);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiz Settings */}
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg text-blue-900 dark:text-blue-100">Quiz Settings</CardTitle>
          <CardDescription className="text-xs md:text-sm text-blue-700 dark:text-blue-300">Configure your quiz experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="questions-per-session" className="text-sm md:text-base">Questions per Session</Label>
            <select
              id="questions-per-session"
              value={data.settings.questionsPerSession}
              onChange={(e) =>
                updateSettings({ questionsPerSession: parseInt(e.target.value) })
              }
              className="mt-2 w-full px-3 md:px-4 py-2.5 md:py-2 text-sm md:text-base rounded-lg border border-input bg-background h-11"
            >
              <option value="5">5 questions</option>
              <option value="10">10 questions</option>
              <option value="15">15 questions</option>
              <option value="20">20 questions</option>
              <option value="25">25 questions</option>
            </select>
          </div>

          <div>
            <Label htmlFor="default-mode" className="text-sm md:text-base">Default Quiz Mode</Label>
            <select
              id="default-mode"
              value={data.settings.defaultQuizMode}
              onChange={(e) =>
                updateSettings({ defaultQuizMode: e.target.value as any })
              }
              className="mt-2 w-full px-3 md:px-4 py-2.5 md:py-2 text-sm md:text-base rounded-lg border border-input bg-background h-11"
            >
              <option value="mixed">Mixed</option>
              <option value="mcq">Multiple Choice Only</option>
              <option value="short">Short Answer Only</option>
              <option value="flashcard">Flashcards Only</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Label className="text-sm md:text-base">Show Explanations</Label>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Show memo content after answering
              </p>
            </div>
            <Switch
              checked={data.settings.showExplanations}
              onCheckedChange={(checked) =>
                updateSettings({ showExplanations: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg text-green-900 dark:text-green-100">Data Management</CardTitle>
          <CardDescription className="text-xs md:text-sm text-green-700 dark:text-green-300">Export, import, or reset your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          <div className="space-y-2">
            <Button onClick={handleExport} variant="outline" className="w-full h-11 text-sm md:text-base">
              <Download className="w-4 h-4 mr-2" />
              Export Data as JSON
            </Button>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Download all your memos, questions, and progress
            </p>
          </div>

          <div className="space-y-2">
            <Button onClick={handleImport} variant="outline" className="w-full h-11 text-sm md:text-base">
              <Upload className="w-4 h-4 mr-2" />
              Import Data from JSON
            </Button>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Upload a previously exported backup file
            </p>
            {importError && (
              <p className="text-xs text-destructive">{importError}</p>
            )}
          </div>

          <div className="pt-3 md:pt-4 border-t space-y-2">
            <Button
              onClick={() => setShowResetDialog(true)}
              variant="destructive"
              className="w-full h-11 text-sm md:text-base"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Reset All Data
            </Button>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              ⚠️ This will delete all your memos and progress permanently
            </p>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg text-slate-900 dark:text-slate-100">About MemoLil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-xs md:text-sm">
            <span className="text-gray-600 dark:text-gray-400">Version</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{data.version}</span>
          </div>
          <div className="flex items-center justify-between text-xs md:text-sm">
            <span className="text-gray-600 dark:text-gray-400">Total Memos</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{data.knowledgeItems.length}</span>
          </div>
          <div className="flex items-center justify-between text-xs md:text-sm">
            <span className="text-gray-600 dark:text-gray-400">Total Attempts</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{data.answerLogs.length}</span>
          </div>
          <div className="flex items-center justify-between text-xs md:text-sm">
            <span className="text-gray-600 dark:text-gray-400">Storage Used</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {(JSON.stringify(data).length / 1024).toFixed(2)} KB
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent onClose={() => setShowResetDialog(false)}>
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <DialogTitle>Reset All Data?</DialogTitle>
            </div>
            <DialogDescription>
              This action cannot be undone. All your memos, questions, progress,
              and settings will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
              className="flex-1"
            >
              Reset Everything
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

