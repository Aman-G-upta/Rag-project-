import { useCallback, useEffect, useRef, useState } from "react";
import { UploadCloud, FileText, Trash2, Search, Loader2, Sparkles, BookOpen, AlertCircle, ClipboardList, MessageSquare, Layers } from "lucide-react"; import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import {
  listDocuments,
  getDocument,
  uploadDocument,
  deleteDocument,
  testSearch,
} from "../api/documents";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [deleteDoc, setDeleteDoc] = useState(null);

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const [query, setQuery] = useState("");
  const [filterDocId, setFilterDocId] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchError, setSearchError] = useState("");

  const fetchDocuments = useCallback(async () => {
    try {
      const data = await listDocuments();
      setDocuments(data.documents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === "processing");
    if (!hasProcessing) return;
    const interval = setInterval(fetchDocuments, 3000);
    return () => clearInterval(interval);
  }, [documents, fetchDocuments]);

  const readyDocs = documents.filter((d) => d.status === "ready");

  const handleFileSelect = (selected) => {
    if (!selected) return;

    setFile(selected);

    if (!title) {
      setTitle(
        selected.name.replace(/\.(pdf|docx|pptx)$/i, "")
      );
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");
    setUploadProgress(0);

    try {
      const data = await uploadDocument(file, {
        title,
        subject,
        onProgress: setUploadProgress,
      });

      const uploadedFileName = file.name;

      setFile(null);
      setTitle("");
      setSubject("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      fetchDocuments();

      setUploadSuccess(
        `"${uploadedFileName}" uploaded successfully and processing has started.`
      );

      checkProcessingStatus(data.document._id);

    } catch (err) {
      console.error("Upload error:", err);

      setUploadError(
        err.response?.data?.message || err.message || "Upload failed"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    setDocuments((prev) => prev.filter((d) => d._id !== id));
    try {
      await deleteDocument(id);
    } catch (err) {
      console.error(err);
      fetchDocuments();
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError("");
    setSearchResults(null);
    try {
      const data = await testSearch(query, filterDocId || undefined);
      setSearchResults(data.results);
    } catch (err) {
      setSearchError(err.response?.data?.message || "Search failed");
    } finally {
      setSearching(false);
    }
  };
  const checkProcessingStatus = async (documentId) => {
    const interval = setInterval(async () => {
      try {
        const data = await getDocument(documentId);

        const status = data.document.status;

        if (status === "ready") {
          clearInterval(interval);
          setUploadSuccess("");
          fetchDocuments();
        }

        if (status === "failed") {
          clearInterval(interval);
          setUploadSuccess("");
          fetchDocuments();
        }
      } catch (error) {
        console.error("Error checking document status:", error);
        clearInterval(interval);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Good to see you, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-sm text-slate-500">Upload material, then test semantic search on it below.</p>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-4">
          <StatCard label="Documents" value={documents.length} />
          <StatCard label="Ready" value={readyDocs.length} accent="emerald" />
          <StatCard label="Processing" value={documents.filter((d) => d.status === "processing").length} accent="amber" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <UploadCloud size={18} className="text-brand-600" />
                Upload material
              </h2>

              <form onSubmit={handleUpload} className="mt-4 space-y-3">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFileSelect(e.dataTransfer.files?.[0]); }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${dragActive ? "border-brand-400 bg-brand-50" : "border-slate-200 hover:border-brand-300 hover:bg-slate-50"
                    }`}
                >
                  <FileText size={22} className="text-brand-500" />
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {file ? file.name : "Drop a file here or click to browse"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    PDF, DOCX, PPTX · up to 20MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.pptx"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
                  <input placeholder="Subject (optional)" value={subject} onChange={(e) => setSubject(e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
                </div>

                {uploadError && (
                  <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
                    <AlertCircle size={15} className="flex-none" />
                    {uploadError}
                  </div>
                )}

                {uploadSuccess && (
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 font-bold">
                        ✓
                      </span>
                      {uploadSuccess}
                    </div>

                    <button
                      type="button"
                      onClick={() => setUploadSuccess("")}
                      className="text-emerald-500 hover:text-emerald-700"
                    >
                      ×
                    </button>
                  </div>
                )}

                <button type="submit" disabled={!file || uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-200 transition disabled:cursor-not-allowed disabled:opacity-50">
                  {uploading ? (<><Loader2 size={15} className="animate-spin" />Uploading {uploadProgress}%</>) : "Upload & process"}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <BookOpen size={18} className="text-brand-600" />
                Your library
              </h2>

              <div className="mt-4 space-y-2.5">
                {loadingDocs && <p className="py-6 text-center text-sm text-slate-400">Loading...</p>}
                {!loadingDocs && documents.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-400">No documents yet — upload your first study material above.</p>
                )}
                {documents.map((doc) => (
                  <div key={doc._id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition hover:border-slate-200 hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{doc.title}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {doc.subject || "No subject"} · {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                      {doc.status === "failed" && doc.processingError && (
                        <p className="mt-1 text-xs text-rose-500">{doc.processingError}</p>
                      )}
                    </div>
                    <div className="flex flex-none items-center gap-3">
                      {doc.status === "ready" && (
                        <>
                          <Link
                            to={`/chat/${doc._id}`}
                            className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-100"
                          >
                            <MessageSquare size={13} />
                            Chat
                          </Link>

                          <Link
                            to={`/quiz/${doc._id}`}
                            className="flex items-center gap-1.5 rounded-lg bg-accent-50 px-2.5 py-1.5 text-xs font-medium text-accent-700 transition hover:bg-accent-100"
                          >
                            <ClipboardList size={13} />
                            Quiz
                          </Link>
                          <Link
                            to={`/flashcards/${doc._id}`}
                            className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
                          >
                            <Layers size={13} />
                            Flashcards
                          </Link>
                        </>


                      )}


                      <StatusBadge status={doc.status} />
                      <button
                        onClick={() => setDeleteDoc(doc)}
                        className="text-slate-300 transition hover:text-rose-500"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-2">
            <section className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <Sparkles size={18} className="text-accent-600" />
                Explore retrieval
              </h2>
              <p className="mt-1 text-xs text-slate-400">Preview retrieval before chat is wired up — ask anything from a ready document.</p>

              <form onSubmit={handleSearch} className="mt-4 space-y-3">
                <select value={filterDocId} onChange={(e) => setFilterDocId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100">
                  <option value="">All ready documents</option>
                  {readyDocs.map((d) => (<option key={d._id} value={d._id}>{d.title}</option>))}
                </select>

                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. what is a deadlock?"
                    disabled={readyDocs.length === 0}
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-50" />
                </div>

                <button type="submit" disabled={searching || readyDocs.length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">
                  {searching && <Loader2 size={15} className="animate-spin" />}
                  {searching ? "Searching..." : "Search"}
                </button>
                {readyDocs.length === 0 && (
                  <p className="text-center text-xs text-slate-400">Upload and wait for a document to be "Ready" first.</p>
                )}
              </form>

              {searchError && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
                  <AlertCircle size={15} className="flex-none" />
                  {searchError}
                </div>
              )}

              {searchResults && (
                <div className="thin-scroll mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
                  {searchResults.length === 0 && <p className="py-4 text-center text-sm text-slate-400">No matching chunks found.</p>}
                  {searchResults.map((r, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-brand-700">
                          {r.sourceType === "slide"
                            ? `Slide ${r.sourceNumber}`
                            : r.sourceType === "section"
                              ? `Section ${r.sourceNumber}`
                              : `Page ${r.sourceNumber}`}
                        </span>
                        <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700">
                          {Math.round(r.score * 100)}% match
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-600">
                        {r.content.length > 220 ? `${r.content.slice(0, 220)}...` : r.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {deleteDoc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-rose-50">
                    <Trash2 size={18} className="text-rose-500" />
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Delete document?
                    </h3>

                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                      Are you sure you want to delete{" "}
                      <span className="font-medium text-slate-700">
                        "{deleteDoc.title}"
                      </span>
                      ? This action cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDeleteDoc(null)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleDelete(deleteDoc._id);
                      setDeleteDoc(null);
                    }}
                    className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
                  >
                    Delete
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  const accentClass = accent === "emerald" ? "text-emerald-600" : accent === "amber" ? "text-amber-600" : "text-slate-900";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accentClass}`}>{value}</p>
    </div>
  );
}