import { Link } from "react-router-dom";
import { Sparkles, UploadCloud, Search, ShieldCheck, BrainCircuit, Quote, ArrowRight } from "lucide-react";

const FEATURES = [
  { icon: UploadCloud, title: "Upload your material", desc: "Notes, PDFs, lecture slides — build your own private knowledge base in seconds." },
  { icon: Search, title: "Semantic retrieval", desc: "Ask in your own words. StudyLens finds the exact chunks that actually answer it — not just keyword matches." },
  { icon: Quote, title: "Evidence, not guesses", desc: "Every answer links back to the page it came from. Verify it yourself in one click." },
  { icon: ShieldCheck, title: "Refuses unsupported questions", desc: "If it's not in your material, StudyLens says so — instead of making something up." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-400">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">StudyLens</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-slate-200 transition hover:text-white">Login</Link>
          <Link to="/register" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">Get started</Link>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 pb-24 pt-16 text-center">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-brand-600/30 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-brand-200">
            <BrainCircuit size={13} />
            RepoForge Hackathon · Team Gencode
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Stop scrolling your notes.
            <br />
            <span className="bg-gradient-to-r from-brand-300 via-brand-200 to-accent-300 bg-clip-text text-transparent">
              Ask them instead.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-300">
            Upload your study material and get answers{" "}
            <span className="text-white">grounded strictly in your own content</span> — with page-level citations, not AI guesses.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/register" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand-900/40 transition hover:shadow-brand-700/40">
              Start studying free
              <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
            </Link>
            <Link to="/login" className="rounded-xl border border-white/15 px-6 py-3 text-base font-semibold text-slate-100 transition hover:bg-white/5">
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-slate-900/60 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Upload → Ask → Evidence → Learn</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-slate-400">A study assistant that's actually accountable to your material.</p>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-brand-400/40 hover:bg-white/[0.06]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/20 to-accent-500/20">
                  <Icon size={19} className="text-accent-300" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-slate-500">
        StudyLens — RAG-Based Student Study Assistant Chatbot · PS001
      </footer>
    </div>
  );
}