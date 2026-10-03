import { Link, useLocation } from "react-router-dom";
import { Sparkles, LogOut, Target } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const onWeakTopics = pathname === "/weak-topics";

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-500">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">StudyLens</span>
          </Link>

          <Link
            to="/weak-topics"
            className={`hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition sm:flex ${
              onWeakTopics ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            <Target size={14} />
            Weak Topics
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right leading-tight">
            <p className="text-sm font-medium text-slate-800">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}