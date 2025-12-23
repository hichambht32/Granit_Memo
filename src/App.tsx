import { useState } from "react";
import { Layout } from "./components/Layout";
import { MemoPage } from "./pages/MemoPage";
import { QuizPage } from "./pages/QuizPage";
import { StatsPage } from "./pages/StatsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { FamilyPage } from "./pages/FamilyPage";
import { AuthPage } from "./pages/AuthPage";
import { useAuth } from "./store/AuthContext";

function App() {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState("memo");

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "memo":
        return <MemoPage />;
      case "quiz":
        return <QuizPage />;
      case "stats":
        return <StatsPage />;
      case "family":
        return <FamilyPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <MemoPage />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default App;
