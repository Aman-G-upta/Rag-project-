import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Sparkles, ClipboardList, Loader2, AlertCircle, FileText } from "lucide-react";
import Navbar from "../components/Navbar";
import { getDocument } from "../api/documents";
import { generateQuiz, listQuizzes } from "../api/quiz";

export default function QuizList() {
  const { documentId } = useParams();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [numQuestions, setNumQuestions] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [docData, quizData] = await Promise.all([
        getDocument(documentId),
        listQuizzes(documentId),
      ]);
      setDocument(docData.document);
      setQuizzes(quizData.quizzes);
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
      const data = await generateQuiz(documentId, numQuestions);
      navigate(`/quiz/take/${data.quiz._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Quiz generation failed");
    } finally {
      setGenerating(false);
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
          <ClipboardList size={20} className="text-brand-600" />
          Quizzes
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Generated strictly from this document — great way to test what you actually remember.
        </p>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Sparkles size={16} className="text-accent-600" />
            Generate a new quiz
          </h2>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="text-sm text-slate-600">Number of questions</label>
            <select
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            >
              {[3, 5, 7, 10].map((n) => (
                <option key={n} value={n}>{n} questions</option>
              ))}
            </select>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="ml-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-200 transition disabled:opacity-60"
            >
              {generating && <Loader2 size={15} className="animate-spin" />}
              {generating ? "Generating..." : "Generate quiz"}
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
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Past quizzes</h2>
          {loading && <p className="text-sm text-slate-400">Loading...</p>}
          {!loading && quizzes.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
              No quizzes yet — generate your first one above.
            </p>
          )}
          <div className="space-y-2.5">
            {quizzes.map((q) => (
              <Link
                key={q._id}
                to={`/quiz/take/${q._id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{q.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {q.questionCount} questions · {new Date(q.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs font-medium text-brand-600">Take quiz →</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}