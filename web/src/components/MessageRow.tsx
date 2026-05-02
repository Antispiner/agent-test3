import type { ChatMessage } from "../api/client";

interface Props {
  message: ChatMessage;
  streaming?: boolean;
}

export function MessageRow({ message, streaming }: Props) {
  const isUser = message.role === "user";
  const time = formatTime(message.created_at);
  return (
    <div className="flex gap-3 py-2.5 border-b border-border/40">
      <div className="text-[11px] font-mono text-micro-fg pt-0.5 w-16 shrink-0">
        {time}
      </div>
      <div className="shrink-0 pt-0.5">
        <span className={isUser ? "badge badge-blue" : "badge badge-purple"}>
          {message.role}
        </span>
      </div>
      <div className="text-fg text-[14px] leading-relaxed whitespace-pre-wrap flex-1">
        {message.content}
        {streaming && <span className="inline-block w-[1ch] animate-pulse">▌</span>}
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
