import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    ArrowLeft, ArrowRight, Loader2, AlertCircle, RotateCcw, Shuffle,
    CheckCircle2, XCircle, Trophy, Layers,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { getFlashcardSet } from "../api/flashcards";

const shuffleArray = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};
const sourceLabel = (type) => ({ slide: "slide", section: "section" }[type] || "page");
export default function FlashcardStudy() {
    const { setId } = useParams();

    const [set, setSet] = useState(null);
    const [deck, setDeck] = useState([]); // cards in the current round, each tagged with its original id
    const [pos, setPos] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [results, setResults] = useState({}); // { [cardId]: "known" | "review" }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getFlashcardSet(setId)
            .then((data) => {
                setSet(data.set);
                setDeck(data.set.cards.map((c, i) => ({ ...c, id: i })));
            })
            .catch((err) => setError(err.response?.data?.message || "Failed to load flashcards"))
            .finally(() => setLoading(false));
    }, [setId]);

    const finished = deck.length > 0 && pos >= deck.length;
    const card = deck[pos];

    const flip = useCallback(() => setFlipped((f) => !f), []);
    const goNext = useCallback(() => {
        setFlipped(false);
        setPos((p) => Math.min(p + 1, deck.length));
    }, [deck.length]);
    const goPrev = useCallback(() => {
        setFlipped(false);
        setPos((p) => Math.max(p - 1, 0));
    }, []);

    const mark = (status) => {
        if (!card) return;
        setResults((prev) => ({ ...prev, [card.id]: status }));
        goNext();
    };

    const startRound = (cards) => {
        setDeck(cards);
        setPos(0);
        setFlipped(false);
    };

    const restartAll = () => {
        setResults({});
        startRound(set.cards.map((c, i) => ({ ...c, id: i })));
    };

    const studyMissed = () => {
        const missed = deck.filter((c) => results[c.id] !== "known");
        setResults((prev) => {
            const next = { ...prev };
            missed.forEach((c) => delete next[c.id]);
            return next;
        });
        startRound(missed);
    };

    const handleShuffle = () => startRound(shuffleArray(deck));

    // Keyboard shortcuts: Space/Enter = flip, ← / → = previous / next
    useEffect(() => {
        if (finished || !card) return;
        const onKey = (e) => {
            const tag = e.target.tagName;
            if (tag === "BUTTON" || tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") return;
            if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); }
            else if (e.key === "ArrowRight") goNext();
            else if (e.key === "ArrowLeft") goPrev();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [finished, card, flip, goNext, goPrev]);

    const summary = useMemo(() => {
        const known = deck.filter((c) => results[c.id] === "known").length;
        return { known, review: deck.length - known };
    }, [deck, results]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 size={20} className="animate-spin text-brand-500" />
            </div>
        );
    }

    if (error || !set) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="mx-auto max-w-xl px-6 py-16">
                    <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
                        <AlertCircle size={16} className="flex-none" />
                        {error || "Flashcard set not found"}
                    </div>
                </div>
            </div>
        );
    }

    const progress = deck.length ? Math.round((Math.min(pos, deck.length) / deck.length) * 100) : 0;

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-3">
                <Link
                    to={`/flashcards/${set.documentId}`}
                    className="text-slate-400 transition hover:text-slate-700"
                >
                    <ArrowLeft size={18} />
                </Link>
                <Layers size={16} className="text-amber-500" />
                <span className="truncate text-sm font-semibold text-slate-800">{set.title}</span>
            </div>

            <main className="mx-auto max-w-2xl px-6 py-8">
                {finished ? (
                    /* ------------------------- Round summary ------------------------- */
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                            <Trophy size={26} className="text-amber-500" />
                        </div>
                        <h1 className="mt-4 text-xl font-bold text-slate-900">Round complete!</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            You went through {deck.length} card{deck.length === 1 ? "" : "s"}.
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-emerald-50 px-4 py-3">
                                <p className="text-2xl font-bold text-emerald-600">{summary.known}</p>
                                <p className="text-xs font-medium text-emerald-700">Got it</p>
                            </div>
                            <div className="rounded-xl bg-rose-50 px-4 py-3">
                                <p className="text-2xl font-bold text-rose-600">{summary.review}</p>
                                <p className="text-xs font-medium text-rose-700">Still learning</p>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            {summary.review > 0 && (
                                <button
                                    onClick={studyMissed}
                                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-200"
                                >
                                    <RotateCcw size={15} />
                                    Study {summary.review} missed card{summary.review === 1 ? "" : "s"}
                                </button>
                            )}
                            <button
                                onClick={restartAll}
                                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Restart whole set
                            </button>
                        </div>
                    </div>
                ) : (
                    /* --------------------------- Study view --------------------------- */
                    <>
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                            <span>Card {pos + 1} of {deck.length}</span>
                            <button
                                onClick={handleShuffle}
                                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-slate-500 transition hover:bg-white hover:text-slate-800"
                            >
                                <Shuffle size={13} />
                                Shuffle
                            </button>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* key={card.id} remounts the card on every change, so the next card never flashes its answer */}
                        <div key={`${pos}-${card.id}`} className="flip-scene mt-6">
                            <div
                                role="button"
                                tabIndex={-1}
                                onClick={flip}
                                className={`flip-card relative h-72 w-full cursor-pointer select-none sm:h-80 ${flipped ? "is-flipped" : ""}`}
                            >
                                {/* Front */}
                                <div className="flip-face flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg shadow-slate-200/60">
                                    <span className="absolute left-5 top-5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                                        {card.topic}
                                    </span>
                                    <p className="text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">
                                        {card.front}
                                    </p>
                                    <p className="absolute bottom-5 text-xs text-slate-400">Click or press space to reveal</p>
                                </div>

                                {/* Back */}
                                <div className="flip-face flip-back flex flex-col items-center justify-center rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-600 to-brand-500 p-8 text-center text-white shadow-lg shadow-brand-200">
                                    <span className="absolute left-5 top-5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold">
                                        {card.topic}
                                    </span>
                                    <p className="thin-scroll max-h-[75%] overflow-y-auto text-base leading-relaxed sm:text-lg">
                                        {card.back}
                                    </p>
                                    {card.sourceNumber && (
                                        <p className="absolute bottom-5 text-xs text-white/70">
                                            Source: {sourceLabel(card.sourceType)} {card.sourceNumber}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-center gap-3">
                            <button
                                onClick={goPrev}
                                disabled={pos === 0}
                                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                                title="Previous (←)"
                            >
                                <ArrowLeft size={18} />
                            </button>

                            <button
                                onClick={() => mark("review")}
                                disabled={!flipped}
                                className="flex items-center gap-2 rounded-xl bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-40"
                            >
                                <XCircle size={16} />
                                Still learning
                            </button>
                            <button
                                onClick={() => mark("known")}
                                disabled={!flipped}
                                className="flex items-center gap-2 rounded-xl bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-40"
                            >
                                <CheckCircle2 size={16} />
                                Got it
                            </button>

                            <button
                                onClick={goNext}
                                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                                title="Next (→)"
                            >
                                <ArrowRight size={18} />
                            </button>
                        </div>
                        <p className="mt-4 text-center text-xs text-slate-400">
                            Shortcuts: Space = flip · ← → = navigate
                        </p>
                    </>
                )}
            </main>
        </div>
    );
}