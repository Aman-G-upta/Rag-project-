import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Send, Loader2, FileText } from "lucide-react";
import Navbar from "../components/Navbar";
import ChatMessage from "../components/ChatMessage";
import StatusBadge from "../components/StatusBadge";
import { getDocument } from "../api/documents";
import { askQuestion, listConversations, getConversationMessages } from "../api/chat";

export default function Chat() {
  const { documentId } = useParams();
  const [document, setDocument] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    async function init() {
      try {
        const docData = await getDocument(documentId);
        setDocument(docData.document);

        const convData = await listConversations();
        const existing = convData.conversations.find((c) => c.documentId === documentId);
        if (existing) {
          const msgData = await getConversationMessages(existing._id);
          setConversationId(existing._id);
          setMessages(msgData.messages);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInit(false);
      }
    }
    init();
  }, [documentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || sending) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setSending(true);

    try {
      const data = await askQuestion(documentId, question, conversationId);
      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources, refused: data.refused },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err.response?.data?.message || "Something went wrong. Try again.",
          sources: [],
          refused: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <Navbar />

      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-slate-400 transition hover:text-slate-700">
            <ArrowLeft size={18} />
          </Link>
          <FileText size={16} className="text-brand-500" />
          <span className="text-sm font-semibold text-slate-800">
            {document?.title || "Loading..."}
          </span>
          {document && <StatusBadge status={document.status} />}
        </div>
      </div>

      {document && document.status !== "ready" ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-slate-400">
            This document isn't ready yet — go back and wait for processing to finish.
          </p>
        </div>
      ) : (
        <>
          <div className="thin-scroll mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-6 py-6">
            {loadingInit && (
              <p className="py-10 text-center text-sm text-slate-400">Loading conversation...</p>
            )}

            {!loadingInit && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500">
                  <FileText size={20} className="text-white" />
                </div>
                <p className="mt-4 text-sm text-slate-500">
                  Ask anything about{" "}
                  <span className="font-medium text-slate-700">{document?.title}</span>
                </p>
              </div>
            )}

            <div className="space-y-4">
              {messages.map((m, i) => (
                <ChatMessage key={m._id || i} message={m} />
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400 shadow-sm">
                    <Loader2 size={14} className="animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
            </div>
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="border-t border-slate-200 bg-white px-6 py-4">
            <div className="mx-auto flex max-w-3xl items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about this document..."
                disabled={sending}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-50"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}