import { Link } from "react-router-dom";
import { Sparkles, Quote, ShieldCheck, Search } from "lucide-react";

const POINTS = [
  { icon: Search, text: "Semantic search across all your material" },
  { icon: Quote, text: "Every answer cites the exact page" },
  { icon: ShieldCheck, text: "Refuses to answer outside your notes" },
];

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-brand-600/30 blur-3xl" aria-hidden="true" />
        <Link to="/" className="relative flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-400">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">StudyLens</span>
        </Link>

        <div className="relative">
          <h2 className="text-3xl font-bold leading-snug">Your notes, now answerable.</h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-slate-300">
                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-white/10">
                  <Icon size={15} className="text-accent-300" />
                </div>
                <span className="text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">RepoForge Hackathon · Team Gencode</p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-500">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-bold text-slate-900">StudyLens</span>
          </Link>

          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-sm text-slate-500">{footer}</p>
        </div>
      </div>
    </div>
  );
}