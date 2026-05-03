import { Routes, Route, Link } from "react-router-dom";
import { ListPage } from "./pages/ListPage";
import { AddPage } from "./pages/AddPage";
import { ChatPage } from "./pages/ChatPage";
import { LangSwitcher } from "./components/LangSwitcher";
import { useT } from "./i18n";

export default function App() {
  const t = useT();
  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border bg-bg-soft">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="text-fg font-mono text-sm hover:text-accent transition-colors"
          >
            {t("app.title")}
          </Link>
          <div className="flex items-center gap-3">
            <nav className="flex gap-2 text-xs text-muted-fg">
              <Link to="/" className="hover:text-fg transition-colors">
                {t("nav.list")}
              </Link>
              <span className="text-micro-fg">/</span>
              <Link to="/add" className="hover:text-fg transition-colors">
                {t("nav.add")}
              </Link>
            </nav>
            <LangSwitcher />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-6">
        <Routes>
          <Route path="/" element={<ListPage />} />
          <Route path="/add" element={<AddPage />} />
          <Route path="/chat/:id" element={<ChatPage />} />
        </Routes>
      </main>
    </div>
  );
}
