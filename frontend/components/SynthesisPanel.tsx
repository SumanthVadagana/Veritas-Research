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
  Globe,
  Sparkles,
} from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { SourceCard } from "./SourceCard";
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

type Tab = "answer" | "report" | "sources";

/* ─────────────────────────────────────────────────────────────────────────────
   Confidence bar: green ≥75%, yellow 40–74%, red <40%
───────────────────────────────────────────────────────────────────────────── */
function ConfidenceBar({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 75
      ? { bar: "#10b981", text: "text-emerald-400", label: "High", bg: "bg-emerald-500/10", border: "border-emerald-500/25" }
      : pct >= 40
      ? { bar: "#f59e0b", text: "text-amber-400", label: "Medium", bg: "bg-amber-500/10", border: "border-amber-500/25" }
      : { bar: "#f43f5e", text: "text-rose-400", label: "Low", bg: "bg-rose-500/10", border: "border-rose-500/25" };

  const heights = { sm: "h-1.5", md: "h-2", lg: "h-2.5" };
  const textSizes = { sm: "text-[11px]", md: "text-xs", lg: "text-sm" };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className={`${textSizes[size]} font-bold text-[var(--text-muted)] uppercase tracking-wider`}>
          Confidence
        </span>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${color.bg} ${color.border}`}>
          <span className={`text-[11px] font-extrabold ${color.text}`}>{color.label}</span>
          <span className={`font-mono font-extrabold text-[11px] ${color.text}`}>{pct}%</span>
        </div>
      </div>
      <div className={`w-full ${heights[size]} bg-[var(--bg-secondary)] rounded-full overflow-hidden`}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color.bar }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Single Claim Card — the main result unit
───────────────────────────────────────────────────────────────────────────── */
function ClaimCard({
  fc,
  index,
  sourcesUsed,
  citations,
  query,
}: {
  fc: FactCheck;
  index: number;
  sourcesUsed: SourceUsed[];
  citations: Citation[];
  query?: string;
}) {
  const [showSources, setShowSources] = useState(false);

  const VERDICT_CFG = {
    verified: {
      Icon: CheckCircle2,
      label: "✓ Verified",
      iconColor: "text-emerald-500",
      bg: "bg-emerald-500/8",
      border: "border-emerald-500/30",
      headerBg: "bg-emerald-500/10",
      pill: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    },
    disputed: {
      Icon: AlertCircle,
      label: "⚠ Disputed",
      iconColor: "text-amber-500",
      bg: "bg-amber-500/8",
      border: "border-amber-500/30",
      headerBg: "bg-amber-500/10",
      pill: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    },
    unverified: {
      Icon: HelpCircle,
      label: "? Unverified",
      iconColor: "text-slate-400",
      bg: "bg-slate-500/8",
      border: "border-slate-500/20",
      headerBg: "bg-slate-500/8",
      pill: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    },
  } as const;

  const cfg = VERDICT_CFG[fc.verdict] ?? VERDICT_CFG.unverified;
  const { Icon } = cfg;
  const score = fc.confidence_score ?? 0.5;

  // Find linked sources for this claim
  const linkedSources = sourcesUsed.filter((_, i) => i < fc.supporting_sources);
  const fallbackCitations = citations.slice(0, fc.supporting_sources || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
      className={`rounded-2xl border ${cfg.border} overflow-hidden`}
    >
      {/* ── Header: verdict badge ── */}
      <div className={`flex items-center gap-2 px-4 py-2.5 ${cfg.headerBg} border-b ${cfg.border}`}>
        <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.iconColor}`} />
        <span className={`text-xs font-extrabold uppercase tracking-wider ${cfg.iconColor}`}>
          {cfg.label}
        </span>
        <span className="text-xs text-[var(--text-muted)] ml-auto">Claim {index + 1}</span>
      </div>

      <div className={`p-4 space-y-4 ${cfg.bg}`}>
        {/* ── Claim / Question ── */}
        <div>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">
            📌 Claim / Question
          </p>
          <p className="text-sm font-semibold text-[var(--text-primary)] leading-relaxed">
            {fc.claim}
          </p>
        </div>

        {/* ── Verified Answer ── */}
        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            Verified Answer
          </p>
          <p className="text-sm font-bold text-[var(--text-primary)] leading-relaxed">
            {fc.verdict === "verified"
              ? "✅ " + (fc.explanation?.split(".")[0] || fc.claim)
              : fc.verdict === "disputed"
              ? "⚠️ This claim is disputed. " + (fc.explanation?.split(".")[0] || "Conflicting evidence found.")
              : "❓ Could not be conclusively verified. " + (fc.explanation?.split(".")[0] || "")}
          </p>
        </div>

        {/* ── Confidence Score ── */}
        <ConfidenceBar score={score} size="md" />

        {/* ── Short Explanation ── */}
        {fc.explanation && (
          <div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">
              📝 Explanation
            </p>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-subtle)]">
              {fc.explanation}
            </p>
          </div>
        )}

        {/* ── Sources ── */}
        {fc.supporting_sources > 0 && (
          <div>
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center justify-between w-full"
            >
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                <Link2 className="w-3 h-3" />
                Sources ({fc.supporting_sources})
              </p>
              {showSources ? (
                <ChevronUp className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              )}
            </button>

            <AnimatePresence>
              {showSources && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-2 space-y-1.5"
                >
                  {(linkedSources.length > 0 ? linkedSources : fallbackCitations.map((c, i) => ({
                    index: c.source_index ?? i + 1,
                    url: c.url,
                    title: c.title || c.url,
                    credibility: c.credibility_score ?? 0.7,
                  }))).map((s, si) => {
                    let domain = s.url;
                    try { domain = new URL(s.url).hostname.replace("www.", ""); } catch { /* ignore */ }
                    return (
                      <a
                        key={si}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)] border border-[var(--border-subtle)] transition-colors group"
                      >
                        <span className="text-xs font-extrabold text-[var(--accent-pink)] w-5 flex-shrink-0">
                          [{s.index}]
                        </span>
                        <Globe className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{s.title}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">{domain}</p>
                        </div>
                        <ExternalLink className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                      </a>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Overall Answer Hero — top of the Answer tab
───────────────────────────────────────────────────────────────────────────── */
function AnswerHero({
  verifiedAnswer,
  explanation,
  confidence,
}: {
  verifiedAnswer: string;
  explanation: string | null;
  confidence: number | null;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden mb-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-[var(--accent-pink)]/10 to-purple-500/5 border-b border-[var(--border-subtle)]">
        <div className="w-7 h-7 rounded-lg bg-[var(--accent-pink)]/20 flex items-center justify-center flex-shrink-0">
          <Target className="w-4 h-4 text-[var(--accent-pink)]" />
        </div>
        <div>
          <p className="text-xs font-extrabold text-[var(--accent-pink)] uppercase tracking-wider">
            Verified Answer
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">AI-verified by 4-agent pipeline</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* The answer */}
        <p className="text-sm font-bold text-[var(--text-primary)] leading-relaxed">
          {verifiedAnswer}
        </p>

        {/* Overall confidence bar */}
        {confidence !== null && <ConfidenceBar score={confidence} size="lg" />}

        {/* Explanation collapsible */}
        {explanation && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-between w-full text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <span className="flex items-center gap-1.5 uppercase tracking-widest text-[10px]">
                <FileText className="w-3 h-3" />
                Explanation
              </span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-[var(--text-secondary)] leading-relaxed overflow-hidden"
                >
                  {explanation}
                </motion.p>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Skeleton while loading
───────────────────────────────────────────────────────────────────────────── */
function ClaimSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
          <div className="h-9 shimmer" />
          <div className="p-4 space-y-3">
            <div className="shimmer h-4 rounded w-3/4" />
            <div className="shimmer h-14 rounded" />
            <div className="shimmer h-3 rounded" />
            <div className="shimmer h-10 rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main SynthesisPanel
───────────────────────────────────────────────────────────────────────────── */
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
  const [tab, setTab] = useState<Tab>("answer");

  const TABS: { id: Tab; label: string; Icon: React.ElementType; count?: number }[] = [
    { id: "answer",  label: "Results",     Icon: Target,    count: factChecks.length },
    { id: "report",  label: "Full Report", Icon: FileText                             },
    { id: "sources", label: "Sources",     Icon: Link2,     count: citations.length   },
  ];

  /* ── Empty / idle state ── */
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
        <p className="text-xs text-[var(--text-secondary)] max-w-xs leading-relaxed">
          Type a query, upload an image, or drop a PDF — the 4-agent pipeline will verify every claim and show you a clear answer with confidence scores.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Tab bar ── */}
      <div className="flex items-center gap-1 mb-5 p-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] flex-shrink-0">
        {TABS.map(({ id, label, Icon, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-extrabold transition-all duration-200 ${
              tab === id
                ? "bg-[var(--accent-pink)] text-white shadow-sm"
                : "text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {count != null && count > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  tab === id ? "bg-white/25 text-white" : "bg-[var(--bg-card)] text-[var(--text-primary)]"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-0.5">
        <AnimatePresence mode="wait">

          {/* RESULTS TAB — per-claim cards + hero answer */}
          {tab === "answer" && (
            <motion.div
              key="answer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              {/* Overall verified answer hero */}
              {verifiedAnswer ? (
                <AnswerHero
                  verifiedAnswer={verifiedAnswer}
                  explanation={explanation}
                  confidence={confidence}
                />
              ) : status === "running" ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <p className="text-xs font-semibold text-amber-400">Agents are verifying claims…</p>
                </div>
              ) : null}

              {/* Divider */}
              {factChecks.length > 0 && (
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                    <Shield className="w-3 h-3" />
                    Claim-by-Claim Breakdown
                  </p>
                  <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                </div>
              )}

              {/* Claim cards */}
              {factChecks.length > 0 ? (
                factChecks.map((fc, i) => (
                  <ClaimCard
                    key={i}
                    fc={fc}
                    index={i}
                    sourcesUsed={sourcesUsed}
                    citations={citations}
                  />
                ))
              ) : status === "running" ? (
                <ClaimSkeleton />
              ) : (
                <p className="text-xs text-center text-[var(--text-muted)] py-10">
                  No claims were extracted yet.
                </p>
              )}
            </motion.div>
          )}

          {/* FULL REPORT TAB */}
          {tab === "report" && (
            <motion.div
              key="report"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {synthesis ? (
                <MarkdownRenderer content={synthesis} />
              ) : (
                <div className="space-y-2.5">
                  {[100, 95, 88, 100, 78, 90, 60, 100, 92, 84].map((w, i) => (
                    <div key={i} className="shimmer h-3.5 rounded" style={{ width: `${w}%` }} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* SOURCES TAB */}
          {tab === "sources" && (
            <motion.div
              key="sources"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-2"
            >
              {citations.length === 0 ? (
                <p className="text-xs font-bold text-[var(--text-primary)] text-center py-10">
                  {status === "running" ? "Gathering sources…" : "No sources found"}
                </p>
              ) : (
                citations.map((c, i) => <SourceCard key={i} {...c} index={i} />)
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
