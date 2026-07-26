"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  X,
  BookOpen,
  Flag,
  ChevronDown,
  ChevronUp,
  Globe,
  FileSearch,
  Hash,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface PdfAnalysisResult {
  session_id: string | null;
  filename: string;
  page_count: number;
  char_count: number;
  word_count: number;
  document_title: string;
  document_type: string;
  main_topic: string;
  summary: string;
  research_query: string;
  key_claims: Array<{
    claim: string;
    importance: "high" | "medium" | "low";
    page_hint: number;
  }>;
  red_flags: string[];
  language: string;
  extracted_text_preview: string;
  fact_checkable: boolean;
}

interface PdfUploadProps {
  onReady: (query: string, sessionId: string) => void;
}

const IMPORTANCE_COLORS = {
  high: { bg: "bg-rose-500/15", text: "text-rose-500", dot: "bg-rose-500" },
  medium: { bg: "bg-amber-500/15", text: "text-amber-500", dot: "bg-amber-500" },
  low: { bg: "bg-slate-500/15", text: "text-[var(--text-muted)]", dot: "bg-slate-400" },
};

const DOC_TYPE_ICONS: Record<string, React.ReactNode> = {
  "news article": <Globe className="w-3.5 h-3.5" />,
  "research paper": <BookOpen className="w-3.5 h-3.5" />,
  "government document": <FileText className="w-3.5 h-3.5" />,
  "social media post": <Hash className="w-3.5 h-3.5" />,
  "report": <FileSearch className="w-3.5 h-3.5" />,
};

export function PdfUpload({ onReady }: PdfUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PdfAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showClaims, setShowClaims] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setError("Please upload a PDF file (.pdf)");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File too large. Maximum 20 MB allowed.");
      return;
    }

    setFileName(file.name);
    setResult(null);
    setError(null);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/api/analyze-pdf`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Analysis failed" }));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }

      const data: PdfAnalysisResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFactCheck = () => {
    if (result?.research_query && result.session_id) {
      onReady(result.research_query, result.session_id);
    }
  };

  const handleReset = () => {
    setFileName(null);
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatBytes = (chars: number) => {
    if (chars > 1000) return `${(chars / 1000).toFixed(1)}k chars`;
    return `${chars} chars`;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      {!fileName && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-blue-500 bg-blue-500/5 scale-[1.01]"
              : "border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-blue-500/50 hover:bg-[var(--bg-card-hover)]"
          }`}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? "bg-blue-500/20" : "bg-[var(--bg-secondary)]"}`}>
            <FileText className={`w-7 h-7 ${isDragging ? "text-blue-400" : "text-[var(--text-muted)]"}`} />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-[var(--text-primary)] mb-1">
              Drop a PDF here
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              News articles, research papers, reports, documents
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              PDF only • Max 20 MB • Up to 50 pages analyzed
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-bold text-blue-400">Choose PDF</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={onFileChange}
          />
        </motion.div>
      )}

      {/* File selected indicator */}
      {fileName && !isAnalyzing && !result && !error && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-[var(--text-primary)] truncate flex-1">{fileName}</span>
        </div>
      )}

      {/* Loading */}
      {isAnalyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 py-8 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)]"
        >
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-7 h-7 text-blue-400" />
            </div>
            <Loader2 className="w-5 h-5 text-[var(--accent-pink)] animate-spin absolute -top-1 -right-1" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-[var(--text-primary)]">Analyzing PDF…</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Extracting text → Identifying claims → Building research query
            </p>
          </div>
          <div className="flex items-center gap-2">
            {["Extract", "Analyze", "Prepare"].map((step, i) => (
              <div key={step} className="flex items-center gap-1.5">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-[var(--accent-pink)]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
                />
                <span className="text-xs text-[var(--text-muted)]">{step}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20"
        >
          <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-rose-500">Analysis Failed</p>
            <p className="text-xs text-rose-400 mt-0.5">{error}</p>
          </div>
          <button onClick={handleReset} className="text-rose-400 hover:text-rose-300">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Analysis Results */}
      <AnimatePresence>
        {result && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3"
          >
            {/* Document Header */}
            <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-[var(--text-primary)] leading-tight truncate">
                    {result.document_title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {/* Document type badge */}
                    <span className="flex items-center gap-1 text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      {DOC_TYPE_ICONS[result.document_type] || <FileText className="w-3.5 h-3.5" />}
                      {result.document_type}
                    </span>
                    {result.language !== "unknown" && (
                      <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
                        {result.language}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="w-6 h-6 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center hover:bg-[var(--bg-card-hover)] flex-shrink-0"
                >
                  <X className="w-3 h-3 text-[var(--text-muted)]" />
                </button>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-2">
                <span>{result.page_count} page{result.page_count !== 1 ? "s" : ""}</span>
                <span>·</span>
                <span>{result.word_count.toLocaleString()} words</span>
                <span>·</span>
                <span>{formatBytes(result.char_count)}</span>
              </div>
            </div>

            {/* Summary */}
            {result.summary && (
              <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Document Summary
                </p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{result.summary}</p>
              </div>
            )}

            {/* Red Flags */}
            {result.red_flags.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs font-bold text-amber-500 mb-2 flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5" />
                  POTENTIAL RED FLAGS ({result.red_flags.length})
                </p>
                <ul className="space-y-1">
                  {result.red_flags.map((flag, i) => (
                    <li key={i} className="text-xs text-amber-400 flex items-start gap-1.5">
                      <span className="flex-shrink-0 mt-0.5">•</span>
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key Claims */}
            {result.key_claims.length > 0 && (
              <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden">
                <button
                  onClick={() => setShowClaims(!showClaims)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    KEY CLAIMS TO VERIFY ({result.key_claims.length})
                  </span>
                  {showClaims ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <AnimatePresence>
                  {showClaims && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-2">
                        {result.key_claims.map((claim, i) => {
                          const colors = IMPORTANCE_COLORS[claim.importance] || IMPORTANCE_COLORS.medium;
                          return (
                            <div
                              key={i}
                              className={`flex items-start gap-2 p-2 rounded-lg ${colors.bg}`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} mt-1.5 flex-shrink-0`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-[var(--text-primary)] leading-snug">{claim.claim}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs font-bold ${colors.text}`}>
                                    {claim.importance} priority
                                  </span>
                                  {claim.page_hint && (
                                    <span className="text-xs text-[var(--text-muted)]">
                                      p.{claim.page_hint}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Text Preview */}
            {result.extracted_text_preview && (
              <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileSearch className="w-3.5 h-3.5" />
                    TEXT PREVIEW
                  </span>
                  {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <AnimatePresence>
                  {showPreview && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3">
                        <div className="p-3 rounded-lg bg-[var(--bg-secondary)] max-h-36 overflow-y-auto">
                          <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed font-mono">
                            {result.extracted_text_preview}
                            {result.char_count > 1000 && (
                              <span className="text-[var(--text-muted)] italic">
                                {"\n"}… ({result.char_count.toLocaleString()} total characters extracted)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Research Query preview */}
            <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                Research Query
              </p>
              <p className="text-xs text-[var(--text-primary)] italic leading-relaxed line-clamp-3">
                "{result.research_query}"
              </p>
            </div>

            {/* CTA Button */}
            {result.fact_checkable && result.session_id ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFactCheck}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-blue-500 to-[var(--accent-pink)] hover:opacity-90 transition-opacity shadow-lg"
              >
                <Zap className="w-4 h-4" />
                Fact-Check This PDF
              </motion.button>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                <AlertTriangle className="w-4 h-4 text-[var(--text-muted)]" />
                <p className="text-xs text-[var(--text-muted)]">
                  Could not prepare fact-check session for this document.
                </p>
              </div>
            )}

            <button
              onClick={handleReset}
              className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors underline underline-offset-2 self-center"
            >
              Upload another PDF
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
