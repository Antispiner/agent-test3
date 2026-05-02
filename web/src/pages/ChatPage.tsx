import { useEffect, useRef, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { useAncestorsStore } from "../stores/ancestorsStore";
import { useChatStore } from "../stores/chatStore";
import { MessageRow } from "../components/MessageRow";

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { current, fetchOne, error: ancestorErr } = useAncestorsStore();
  const { messages, streaming, isStreaming, error, loadHistory, send, reset } =
    useChatStore();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    fetchOne(id);
    loadHistory(id);
    return () => reset();
  }, [id, fetchOne, loadHistory, reset]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, streaming]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id || !draft.trim()) return;
    const text = draft;
    setDraft("");
    await send(id, text);
  }

  if (!id) return <div className="text-red font-mono text-sm">No chat id.</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <header className="bg-card border border-border rounded-lg p-3.5 mb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link to="/" className="text-micro-fg font-mono text-[11px] hover:text-fg">
                ← back
              </Link>
            </div>
            <h2 className="font-mono text-fg text-[14px] truncate">
              {current?.name ?? "Loading..."}
            </h2>
            {current && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="badge badge-secondary font-mono">
                  {current.birth_year}-{current.death_year}
                </span>
                <span className="badge badge-default">{current.relation}</span>
                <span className="text-[11px] text-micro-fg font-mono">
                  {current.birthplace}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {(ancestorErr || error) && (
        <div className="border border-red/40 bg-red/10 text-red rounded-lg px-3 py-2 text-xs mb-3 font-mono">
          {ancestorErr || error}
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-card border border-border rounded-lg px-3 py-1"
      >
        {messages.length === 0 && !isStreaming && (
          <div className="text-muted-fg text-xs font-mono py-6 text-center">
            No messages yet. Start the conversation.
          </div>
        )}
        {messages.map((m, i) => (
          <MessageRow key={i} message={m} />
        ))}
        {isStreaming && (
          <MessageRow
            streaming
            message={{
              role: "ancestor",
              content: streaming,
              created_at: new Date().toISOString(),
            }}
          />
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="sticky bottom-0 bg-bg-soft border border-border rounded-lg p-2 mt-3 flex gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask your ancestor..."
          className="input flex-1"
          disabled={isStreaming && !draft}
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="btn btn-primary"
        >
          Send
        </button>
      </form>
    </div>
  );
}
