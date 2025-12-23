import { useEffect, type ReactNode } from "react";
import { BookOpen, Brain, BarChart3, Settings, Moon, Sun, Users, LogOut } from "lucide-react";
import { cn } from "../lib/utils";
import { useApp } from "../store/AppContext";
import { useAuth } from "../store/AuthContext";

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { data, updateSettings } = useApp();
  const { user, logout } = useAuth();
  const isDark = data.settings.darkMode;

  const toggleDarkMode = () => {
    updateSettings({ darkMode: !isDark });
    document.documentElement.classList.toggle("dark");
  };

  useEffect(() => {
    // Force light mode by default
    document.documentElement.classList.remove("dark");
    
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const navItems = [
    { id: "memo", label: "Memo", icon: BookOpen },
    { id: "quiz", label: "Quiz", icon: Brain },
    { id: "stats", label: "Stats", icon: BarChart3 },
    { id: "family", label: "Family", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center h-16 flex-shrink-0 px-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
              ✨ MemoLil
            </h1>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all",
                    currentPage === item.id
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30"
                      : "text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-300"
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {user && (
              <div className="px-4 py-2 mb-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            )}
            <button
              onClick={toggleDarkMode}
              className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all"
            >
              {isDark ? (
                <>
                  <Sun className="w-5 h-5 mr-3" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5 mr-3" />
                  Dark Mode
                </>
              )}
            </button>
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
              ✨ MemoLil
            </h1>
            {user && (
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                {user.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex border-t border-gray-200 dark:border-gray-700 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "flex-1 flex flex-col items-center py-3 text-xs transition-all min-w-[60px]",
                  currentPage === item.id
                    ? "text-blue-600 dark:text-cyan-400 font-medium"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Icon className="w-5 h-5 mb-1" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="md:pl-64 pt-[140px] md:pt-0 pb-6 md:pb-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

