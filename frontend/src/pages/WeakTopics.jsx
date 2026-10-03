import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Target, Loader2, TrendingDown, BookOpen } from "lucide-react";
import Navbar from "../components/Navbar";
import { getWeakTopics } from "../api/quiz";

// Color-codes a topic by accuracy — this is the "where should I revise" signal
function accuracyStyle(accuracy) {
  if (accuracy < 50) return { bar: "bg-rose-500", chip: "bg-rose-50 text-rose-700", label: "Needs revision" };
  if (accuracy < 75) return { bar: "bg-amber-500", chip: "bg-amber-50 text-amber-700", label: "Getting there" };
  return { bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700", label: "Strong" };
}

export default function WeakTopics() {
  const [topics, setTopics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeakTopics()
      .then((data) => setTopics(data.topics))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Target size={20} className="text-brand-600" />
          Weak Topics
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Aggregated from every quiz you've taken, across all documents — weakest first.
        </p>

        {loading && (
          <div className="mt-10 flex justify-center">
            <Loader2 size={20} className="animate-spin text-brand-500" />
          </div>
        )}

        {!loading && topics?.length === 0 && (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
            <TrendingDown size={28} className="text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-600">No quiz data yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Take a quiz on any document and your weak topics will show up here automatically.
            </p>
            <Link
              to="/dashboard"
              className="mt-4 flex items-center gap-1.5 rounded-lg bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-100"
            >
              <BookOpen size={14} />
              Go to your library
            </Link>
          </div>
        )}

        {!loading && topics?.length > 0 && (
          <div className="mt-6 space-y-3">
            {topics.map((t) => {
              const style = accuracyStyle(t.accuracy);
              return (
                <div key={t.topic} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t.topic}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {t.correct}/{t.total} correct across all attempts
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${style.chip}`}>
                        {style.label}
                      </span>
                      <span className="w-12 text-right text-sm font-bold text-slate-700">{t.accuracy}%</span>
                    </div>
                  </div>

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${style.bar}`}
                      style={{ width: `${t.accuracy}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}