import { useState } from "react";
import { Sparkles, AlertTriangle } from "lucide-react";

export default function ChatMessage({ message }) {
  const [expanded, setExpanded] = useState(null);
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2.5 text-sm text-white shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  const refused = message.refused;

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <div
          className={`flex items-start gap-2.5 rounded-2xl rounded-bl-sm border px-4 py-3 text-sm shadow-sm ${
            refused
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-slate-200 bg-white text-slate-800"
          }`}
        >
          <div
            className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full ${
              refused ? "bg-amber-100" : "bg-gradient-to-br from-brand-500 to-accent-500"
            }`}
          >
            {refused ? (
              <AlertTriangle size={13} className="text-amber-600" />
            ) : (
              <Sparkles size={12} className="text-white" />
            )}
          </div>
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>

        {message.sources?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 pl-1">
            {message.sources.map((s, i) => (
              <button
                key={i}
                onClick={() => setExpanded(expanded === i ? null : i)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                  expanded === i
                    ? "border-brand-300 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-slate-50 text-slate-500 hover:border-brand-200 hover:text-brand-600"
                }`}
              >
                Page {s.pageNumber} · {Math.round(s.score * 100)}%
              </button>
            ))}
          </div>
        )}

        {expanded !== null && message.sources?.[expanded] && (
          <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
            {message.sources[expanded].snippet}...
          </div>
        )}
      </div>
    </div>
  );
}