import { Routes, Route, Link } from "react-router-dom";
import { ListPage } from "./pages/ListPage";
import { AddPage } from "./pages/AddPage";
import { ChatPage } from "./pages/ChatPage";

export default function App() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border bg-bg-soft">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="text-fg font-mono text-sm hover:text-accent transition-colors">
            ancestor-chat
          </Link>
          <nav className="flex gap-2 text-xs text-muted-fg">
            <Link to="/" className="hover:text-fg transition-colors">List</Link>
            <span className="text-micro-fg">/</span>
            <Link to="/add" className="hover:text-fg transition-colors">Add</Link>
          </nav>
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
