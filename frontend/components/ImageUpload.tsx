"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  ImageIcon,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  FileText,
  Zap,
  X,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ImageAnalysisResult {
  session_id: string | null;
  extracted_text: string;
  has_text: boolean;
  image_description: string;
  realness_score: number;
  realness_label: string;
  manipulation_signals: string[];
  ai_generation_indicators: string[];
  metadata_notes: string;
  content_warnings: string[];
  fact_checkable: boolean;
}

interface ImageUploadProps {
  onTextExtracted: (text: string, sessionId: string) => void;
}

function RealnessBadge({ score, label, signals, aiIndicators }: {
  score: number;
  label: string;
  signals: string[];
  aiIndicators: string[];
}) {
  const isReal   = score >= 75;
  const isMid    = score >= 40 && score < 75;
  const isFake   = score < 40;

  const palette = isReal
    ? { stroke: "#10b981", bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", ring: "rgba(16,185,129,0.15)" }
    : isMid
    ? { stroke: "#f59e0b", bg: "bg-amber-500/10",   border: "border-amber-500/30",   text: "text-amber-400",   ring: "rgba(245,158,11,0.15)" }
    : { stroke: "#f43f5e", bg: "bg-rose-500/10",    border: "border-rose-500/30",    text: "text-rose-400",    ring: "rgba(244,63,94,0.15)"  };

  /* SVG ring params */
  const R   = 38;
  const cx  = 50;
  const cy  = 50;
  const circ = 2 * Math.PI * R;
  const offset = circ * (1 - score / 100);

  const summaryText = isReal
    ? "This image appears genuine and unmanipulated."
    : isMid
    ? "Some manipulation signals were detected. Verify carefully."
    : "This image is likely AI-generated or heavily manipulated.";

  const allSignals = [...signals, ...aiIndicators];

  return (
    <div className={`rounded-2xl border ${palette.border} ${palette.bg} overflow-hidden`}>
      {/* Hero row */}
      <div className="flex items-center gap-5 p-4">
        {/* Circular gauge */}
        <div className="relative flex-shrink-0">
          <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
            {/* Track */}
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
            {/* Glow halo */}
            <circle cx={cx} cy={cy} r={R} fill="none" stroke={palette.ring} strokeWidth="12" />
            {/* Progress */}
            <motion.circle
              cx={cx}
              cy={cy}
              r={R}
              fill="none"
              stroke={palette.stroke}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            />
          </svg>
          {/* Score text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className={`text-2xl font-extrabold leading-none ${palette.text}`}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              {score}
            </motion.span>
            <span className={`text-[10px] font-bold ${palette.text} opacity-70`}>/ 100</span>
          </div>
        </div>

        {/* Text info */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">
            Image Realness Score
          </p>
          <p className={`text-lg font-extrabold leading-tight ${palette.text}`}>{label}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">{summaryText}</p>
        </div>
      </div>

      {/* Score bar */}
      <div className="px-4 pb-3">
        <div className="w-full h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: palette.stroke }}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-bold text-[var(--text-muted)] mt-1">
          <span>0 — AI-Generated</span>
          <span>100 — Fully Real</span>
        </div>
      </div>

      {/* Signals */}
      {allSignals.length > 0 && (
        <div className="border-t border-[var(--border-subtle)] px-4 py-3">
          <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
            ⚠ Detected Signals ({allSignals.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allSignals.slice(0, 6).map((s, i) => (
              <span key={i} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${palette.bg} ${palette.text} border ${palette.border}`}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ImageUpload({ onTextExtracted }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ImageAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSignals, setShowSignals] = useState(false);
  const [showText, setShowText] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPEG, PNG, WebP, GIF)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum 10MB allowed.");
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setFileName(file.name);
    setResult(null);
    setError(null);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/api/analyze-image`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Analysis failed" }));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }

      const data: ImageAnalysisResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image analysis failed");
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
    if (result?.extracted_text && result.session_id) {
      onTextExtracted(result.extracted_text, result.session_id);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setFileName(null);
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      {!preview && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-[var(--accent-pink)] bg-[var(--accent-pink)]/5 scale-[1.01]"
              : "border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent-pink)]/50 hover:bg-[var(--bg-card-hover)]"
          }`}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? "bg-[var(--accent-pink)]/20" : "bg-[var(--bg-secondary)]"}`}>
            <ImageIcon className={`w-7 h-7 ${isDragging ? "text-[var(--accent-pink)]" : "text-[var(--text-muted)]"}`} />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-[var(--text-primary)] mb-1">
              Drop an image here
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              WhatsApp forwards, screenshots, news images, memes
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              PNG, JPEG, WebP • Max 10MB
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-pink)]/10 border border-[var(--accent-pink)]/20">
            <Upload className="w-3.5 h-3.5 text-[var(--accent-pink)]" />
            <span className="text-xs font-bold text-[var(--accent-pink)]">Choose File</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
        </motion.div>
      )}

      {/* Preview + Analysis results */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3"
          >
            {/* Image preview */}
            <div className="relative rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Uploaded image preview"
                className="w-full max-h-48 object-contain"
              />
              <button
                onClick={handleReset}
                className="absolute top-2 right-2 w-7 h-7 bg-[var(--bg-primary)]/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-[var(--bg-card)] transition-colors border border-[var(--border-subtle)]"
              >
                <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>
              {fileName && (
                <div className="absolute bottom-0 inset-x-0 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-xs font-semibold text-white truncate">{fileName}</p>
                </div>
              )}
            </div>

            {/* Loading state */}
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 py-6 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)]"
              >
                <Loader2 className="w-8 h-8 text-[var(--accent-pink)] animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-bold text-[var(--text-primary)]">Analyzing Image…</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Gemini Vision is extracting text & detecting manipulation
                  </p>
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
                <div>
                  <p className="text-sm font-bold text-rose-500">Analysis Failed</p>
                  <p className="text-xs text-rose-400 mt-0.5">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Analysis Results */}
            {result && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3"
              >
                {/* Realness Score */}
                <RealnessBadge
                  score={result.realness_score}
                  label={result.realness_label}
                  signals={result.manipulation_signals}
                  aiIndicators={result.ai_generation_indicators}
                />

                {/* Image Description */}
                {result.image_description && (
                  <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Image Description</p>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{result.image_description}</p>
                  </div>
                )}

                {/* Manipulation signals */}
                {(result.manipulation_signals.length > 0 || result.ai_generation_indicators.length > 0) && (
                  <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden">
                    <button
                      onClick={() => setShowSignals(!showSignals)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-amber-500 hover:bg-[var(--bg-card-hover)] transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5" />
                        DETECTED SIGNALS ({result.manipulation_signals.length + result.ai_generation_indicators.length})
                      </span>
                      {showSignals ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <AnimatePresence>
                      {showSignals && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="px-3 pb-3 overflow-hidden"
                        >
                          <ul className="space-y-1">
                            {[...result.manipulation_signals, ...result.ai_generation_indicators].map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                                <span className="text-amber-500 mt-0.5">•</span>
                                {s}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Content Warnings */}
                {result.content_warnings.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    {result.content_warnings.map((w, i) => (
                      <span key={i} className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-500">
                        ⚠ {w}
                      </span>
                    ))}
                  </div>
                )}

                {/* Extracted Text */}
                {result.has_text && result.extracted_text && (
                  <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden">
                    <button
                      onClick={() => setShowText(!showText)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" />
                        EXTRACTED TEXT
                      </span>
                      {showText ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <AnimatePresence>
                      {showText && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="px-3 pb-3 overflow-hidden"
                        >
                          <div className="p-3 rounded-lg bg-[var(--bg-secondary)] max-h-40 overflow-y-auto">
                            <p className="text-xs text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed font-mono">
                              {result.extracted_text}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Fact-Check Button */}
                {result.fact_checkable && result.session_id ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleFactCheck}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-[var(--accent-pink)] to-purple-500 hover:opacity-90 transition-opacity shadow-lg"
                  >
                    <Zap className="w-4 h-4" />
                    Fact-Check This Image
                  </motion.button>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                    <AlertTriangle className="w-4 h-4 text-[var(--text-muted)]" />
                    <p className="text-xs text-[var(--text-muted)]">
                      {result.has_text ? "Cannot fact-check this image" : "No text found in image to fact-check"}
                    </p>
                  </div>
                )}

                {/* Upload another */}
                <button
                  onClick={handleReset}
                  className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors underline underline-offset-2 self-center"
                >
                  Upload another image
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
