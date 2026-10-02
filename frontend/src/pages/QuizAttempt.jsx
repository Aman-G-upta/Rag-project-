import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import Navbar from "../components/Navbar";
import { getQuiz, submitQuiz } from "../api/quiz";

export default function QuizAttempt() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getQuiz(quizId)
      .then((data) => {
        setQuiz(data.quiz);
        setAnswers(new Array(data.quiz.questions.length).fill(null));
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load quiz"))
      .finally(() => setLoading(false));
  }, [quizId]);

  const selectAnswer = (questionIndex, optionIndex) => {
    if (result) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  };

  const allAnswered = answers.length > 0 && answers.every((a) => a !== null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const data = await submitQuiz(quizId, answers);
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 size={20} className="animate-spin text-brand-500" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
        <p className="text-sm text-slate-500">{error || "Quiz not found"}</p>
        <button onClick={() => navigate(-1)} className="text-sm font-medium text-brand-600">
          Go back
        </button>
      </div>
    );
  }

  const answeredCount = answers.filter((a) => a !== null).length;
  const scorePct = result ? Math.round((result.score / result.totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-3">
        <button onClick={() => navigate(-1)} className="text-slate-400 transition hover:text-slate-700">
          <ArrowLeft size={18} />
        </button>
        <span className="text-sm font-semibold text-slate-800">{quiz.title}</span>
        {!result && (
          <span className="ml-auto text-xs font-medium text-slate-400">
            {answeredCount}/{quiz.questions.length} answered
          </span>
        )}
      </div>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {result && (
          <div className="mb-8 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-500 p-6 text-center text-white shadow-lg">
            <p className="text-sm font-medium text-brand-100">Your score</p>
            <p className="mt-1 text-4xl font-extrabold">{result.score}/{result.totalQuestions}</p>
            <p className="mt-1 text-sm text-brand-100">{scorePct}% correct</p>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
            <AlertCircle size={15} className="flex-none" />
            {error}
          </div>
        )}

        <div className="space-y-5">
          {(result ? result.results : quiz.questions).map((q, qi) => {
            const graded = result?.results[qi];
            return (
              <div key={qi} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{qi + 1}. {q.questionText}</p>
                  {q.topic && (
                    <span className="flex-none rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                      {q.topic}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const isSelected = answers[qi] === oi;
                    let style = "border-slate-200 hover:border-brand-300 hover:bg-slate-50";

                    if (result) {
                      if (oi === graded.correctIndex) style = "border-emerald-300 bg-emerald-50";
                      else if (isSelected && !graded.correct) style = "border-rose-300 bg-rose-50";
                      else style = "border-slate-100 opacity-60";
                    } else if (isSelected) {
                      style = "border-brand-400 bg-brand-50";
                    }

                    return (
                      <button
                        key={oi}
                        type="button"
                        onClick={() => selectAnswer(qi, oi)}
                        disabled={!!result}
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm text-slate-700 transition ${style}`}
                      >
                        <span>{opt}</span>
                        {result && oi === graded.correctIndex && (
                          <CheckCircle2 size={16} className="flex-none text-emerald-600" />
                        )}
                        {result && isSelected && !graded.correct && oi !== graded.correctIndex && (
                          <XCircle size={16} className="flex-none text-rose-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {result && (
                  <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
                    {graded.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-center">
          {!result ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-8 py-3 text-sm font-semibold text-white shadow-md shadow-brand-200 transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? "Grading..." : "Submit quiz"}
            </button>
          ) : (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <RotateCcw size={15} />
              Back to quizzes
            </button>
          )}
        </div>
      </main>
    </div>
  );
}