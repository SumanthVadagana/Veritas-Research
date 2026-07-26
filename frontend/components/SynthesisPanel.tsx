"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Link2,
  Shield,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Target,
} from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { SourceCard } from "./SourceCard";
import { FactCheckBadge } from "./FactCheckBadge";
import type {
  Citation,
  FactCheck,
  ResearchStatus,
  SourceUsed,
} from "@/hooks/useResearchStream";

interface SynthesisPanelProps {
  synthesis: string | null;
  confidence: number | null;
  citations: Citation[];
  factChecks: FactCheck[];
  sourcesUsed?: SourceUsed[];
  verifiedAnswer?: string | null;
  explanation?: string | null;
  status: ResearchStatus;
}

type Tab = "answer" | "synthesis" | "sources" | "factchecks";

/* ── Confidence gauge ─────────────────────────────────────────────────────── */
function ConfidenceGauge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 70 ? "var(--accent-emerald)" : pct >= 50 ? "var(--accent-amber)" : "var(--accent-pink)";
  const circumference = 2 * Math.PI * 14; // r=14

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth="3"
          />
          <motion.circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{
              strokeDashoffset: circumference * (1 - value),
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-xs font-extrabold"
          style={{ color }}
        >
          {pct}
        </span>
      </div>
      <div>
        <p className="text-xs font-semibold text-[var(--text-muted)]">Confidence Score</p>
        <p className="text-sm font-extrabold" style={{ color }}>
          {pct >= 70 ? "High Confidence" : pct >= 50 ? "Medium Confidence" : "Low Confidence"}
        </p>
      </div>
    </div>
  );
}

/* ── Verdict icon ────────────────────────────────────────────────────────── */
function VerdictIcon({ verdict }: { verdict: "verified" | "disputed" | "unverified" }) {
  if (verdict === "verified") return <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
  if (verdict === "disputed") return <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
  return <HelpCircle className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />;
}

/* ── Skeleton loader ──────────────────────────────────────────────────────── */
function SynthesisSkeleton() {
  return (
    <div className="space-y-2.5">
      {[100, 95, 88, 100, 78, 90, 60].map((w, i) => (
        <div
          key={i}
          className="shimmer h-3.5 rounded"
          style={{ width: `${w}%` }}
        />
      ))}
      <div className="shimmer h-3.5 rounded w-1/2 mt-4" />
      {[100, 92, 84].map((w, i) => (
        <div
          key={i}
          className="shimmer h-3.5 rounded"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}

/* ── Answer Tab Content ───────────────────────────────────────────────────── */
function AnswerTab({
  verifiedAnswer,
  explanation,
  confidence,
  sourcesUsed,
  factChecks,
}: {
  verifiedAnswer: string | null;
  explanation: string | null;
  confidence: number | null;
  sourcesUsed: SourceUsed[];
  factChecks: FactCheck[];
}) {
  const [showExplanation, setShowExplanation] = useState(true);
  const [showClaims, setShowClaims] = useState(true);

  if (!verifiedAnswer) {
    return <SynthesisSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Verified Answer Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Verified Answer</p>
        </div>
        <p className="text-sm font-semibold text-[var(--text-primary)] leading-relaxed">
          {verifiedAnswer}
        </p>
      </motion.div>

      {/* Confidence gauge */}
      {confidence !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]"
        >
          <ConfidenceGauge value={confidence} />
        </motion.div>
      )}

      {/* Explanation */}
      {explanation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden"
        >
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              EXPLANATION
            </span>
            {showExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 pb-4"
              >
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                  {explanation}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Fact-check claims summary */}
      {factChecks.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden"
        >
          <button
            onClick={() => setShowClaims(!showClaims)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              FACT CHECKS ({factChecks.length})
            </span>
            {showClaims ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <AnimatePresence>
            {showClaims && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 pb-4 space-y-2"
              >
                {factChecks.slice(0, 5).map((fc, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 rounded-lg bg-[var(--bg-secondary)]"
                  >
                    <VerdictIcon verdict={fc.verdict} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug">{fc.claim}</p>
                      {fc.explanation && (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{fc.explanation}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            fc.verdict === "verified"
                              ? "bg-emerald-500/15 text-emerald-500"
                              : fc.verdict === "disputed"
                              ? "bg-amber-500/15 text-amber-500"
                              : "bg-slate-500/15 text-[var(--text-muted)]"
                          }`}
                        >
                          {fc.verdict.toUpperCase()}
                        </span>
                        {fc.confidence_score != null && (
                          <span className="text-xs text-[var(--text-muted)]">
                            {Math.round(fc.confidence_score * 100)}% confidence
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Sources used */}
      {sourcesUsed.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4"
        >
          <p className="text-xs font-bold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
            <Link2 className="w-3.5 h-3.5" />
            SOURCES USED
          </p>
          <div className="space-y-2">
            {sourcesUsed.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-hover)] transition-colors group"
              >
                <span className="text-xs font-bold text-[var(--accent-pink)] w-5 flex-shrink-0">[{s.index}]</span>
                <span className="text-xs text-[var(--text-primary)] truncate flex-1">{s.title || s.url}</span>
                <ExternalLink className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
              </a>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */
export function SynthesisPanel({
  synthesis,
  confidence,
  citations,
  factChecks,
  sourcesUsed = [],
  verifiedAnswer = null,
  explanation = null,
  status,
}: SynthesisPanelProps) {
  const hasAnswer = Boolean(verifiedAnswer);
  const [tab, setTab] = useState<Tab>(hasAnswer ? "answer" : "synthesis");

  // Switch to answer tab automatically when answer arrives
  if (hasAnswer && tab === "synthesis" && status === "completed") {
    // Only auto-switch when first completing
  }

  const TABS: {
    id: Tab;
    label: string;
    Icon: React.ElementType;
    count?: number;
    show: boolean;
  }[] = [
    { id: "answer", label: "Answer", Icon: Target, show: true },
    { id: "synthesis", label: "Full Report", Icon: FileText, show: true },
    { id: "sources", label: "Sources", Icon: Link2, count: citations.length, show: true },
    {
      id: "factchecks",
      label: "Fact Checks",
      Icon: Shield,
      count: factChecks.length,
      show: true,
    },
  ].filter((t) => t.show);

  /* Empty state */
  if (!synthesis && status === "idle") {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center mb-5 text-[var(--accent-pink)] shadow-md"
        >
          <TrendingUp className="w-10 h-10" />
        </motion.div>
        <h3 className="text-base font-extrabold text-[var(--text-primary)] mb-2">
          Ready to Research
        </h3>
        <p className="text-xs font-semibold text-[var(--text-secondary)] max-w-xs leading-relaxed">
          Enter a complex question or upload an image — watch four AI agents
          verify and deliver a cited, structured answer live.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-4 p-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)]">
        {TABS.map(({ id, label, Icon, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-extrabold transition-all duration-200 ${
              tab === id
                ? "bg-[var(--accent-pink)] text-white shadow-sm"
                : "text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {count != null && count > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  tab === id
                    ? "bg-white/20 text-white"
                    : "bg-[var(--bg-card)] text-[var(--text-primary)]"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <AnimatePresence mode="wait">
          {tab === "answer" && (
            <motion.div
              key="answer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AnswerTab
                verifiedAnswer={verifiedAnswer}
                explanation={explanation}
                confidence={confidence}
                sourcesUsed={sourcesUsed}
                factChecks={factChecks}
              />
            </motion.div>
          )}

          {tab === "synthesis" && (
            <motion.div
              key="synthesis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {synthesis ? (
                <MarkdownRenderer content={synthesis} />
              ) : (
                <SynthesisSkeleton />
              )}
            </motion.div>
          )}

          {tab === "sources" && (
            <motion.div
              key="sources"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-2"
            >
              {citations.length === 0 ? (
                <p className="text-xs font-bold text-[var(--text-primary)] text-center py-10">
                  {status === "running"
                    ? "Gathering sources…"
                    : "No sources found"}
                </p>
              ) : (
                citations.map((c, i) => (
                  <SourceCard key={i} {...c} index={i} />
                ))
              )}
            </motion.div>
          )}

          {tab === "factchecks" && (
            <motion.div
              key="factchecks"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-2"
            >
              {factChecks.length === 0 ? (
                <p className="text-xs font-bold text-[var(--text-primary)] text-center py-10">
                  {status === "running"
                    ? "Verifying claims…"
                    : "No fact checks available"}
                </p>
              ) : (
                factChecks.map((fc, i) => (
                  <FactCheckBadge key={i} {...fc} index={i} />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
