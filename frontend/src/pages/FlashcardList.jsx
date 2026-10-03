import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Layers, Loader2, AlertCircle, FileText, Trash2 } from "lucide-react";
import Navbar from "../components/Navbar";
import { getDocument } from "../api/documents";
import { generateFlashcards, listFlashcardSets, deleteFlashcardSet } from "../api/flashcards";

export default function FlashcardList() {
  const { documentId } = useParams();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [numCards, setNumCards] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [docData, setData] = await Promise.all([
        getDocument(documentId),
        listFlashcardSets(documentId),
      ]);
      setDocument(docData.document);
      setSets(setData.sets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const data = await generateFlashcards(documentId, numCards);
      navigate(`/flashcards/study/${data.set._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Flashcard generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault(); // the row is a <Link>; don't navigate when deleting
    e.stopPropagation();
    if (!window.confirm("Delete this flashcard set?")) return;
    try {
      await deleteFlashcardSet(id);
      setSets((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete the set");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-3">
        <Link to="/dashboard" className="text-slate-400 transition hover:text-slate-700">
          <ArrowLeft size={18} />
        </Link>
        <FileText size={16} className="text-brand-500" />
        <span className="text-sm font-semibold text-slate-800">
          {document?.title || "Loading..."}
        </span>
      </div>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Layers size={20} className="text-amber-500" />
          Flashcards
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Generated strictly from this document — flip through them to revise key concepts quickly.
        </p>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Sparkles size={16} className="text-accent-600" />
            Generate a new flashcard set
          </h2>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="text-sm text-slate-600">Number of cards</label>
            <select
              value={numCards}
              onChange={(e) => setNumCards(Number(e.target.value))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            >
              {[5, 10, 15, 20].map((n) => (
                <option key={n} value={n}>{n} cards</option>
              ))}
            </select>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="ml-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-200 transition disabled:opacity-60"
            >
              {generating && <Loader2 size={15} className="animate-spin" />}
              {generating ? "Generating..." : "Generate flashcards"}
            </button>
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
              <AlertCircle size={15} className="flex-none" />
              {error}
            </div>
          )}
        </section>

        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Your flashcard sets</h2>
          {loading && <p className="text-sm text-slate-400">Loading...</p>}
          {!loading && sets.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
              No flashcards yet — generate your first set above.
            </p>
          )}
          <div className="space-y-2.5">
            {sets.map((s) => (
              <Link
                key={s._id}
                to={`/flashcards/study/${s._id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-amber-200 hover:bg-amber-50/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{s.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {s.cardCount} cards · {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-3">
                  <span className="text-xs font-medium text-amber-600">Study →</span>
                  <button
                    onClick={(e) => handleDelete(e, s._id)}
                    className="text-slate-300 transition hover:text-rose-500"
                    title="Delete set"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}