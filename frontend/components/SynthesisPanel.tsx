"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Link2, Shield, TrendingUp } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { SourceCard } from "./SourceCard";
import { FactCheckBadge } from "./FactCheckBadge";
import type {
  Citation,
  FactCheck,
  ResearchStatus,
} from "@/hooks/useResearchStream";

interface SynthesisPanelProps {
  synthesis: string | null;
  confidence: number | null;
  citations: Citation[];
  factChecks: FactCheck[];
  status: ResearchStatus;
}

type Tab = "synthesis" | "sources" | "factchecks";

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
          className="absolute inset-0 flex items-center justify-center text-xs font-bold"
          style={{ color }}
        >
          {pct}
        </span>
      </div>
      <div>
        <p className="text-xs text-[var(--text-muted)]">Confidence</p>
        <p className="text-sm font-bold" style={{ color }}>
          {pct >= 70 ? "High" : pct >= 50 ? "Medium" : "Low"}
        </p>
      </div>
    </div>
  );
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

/* ── Main component ───────────────────────────────────────────────────────── */
export function SynthesisPanel({
  synthesis,
  confidence,
  citations,
  factChecks,
  status,
}: SynthesisPanelProps) {
  const [tab, setTab] = useState<Tab>("synthesis");

  const TABS: {
    id: Tab;
    label: string;
    Icon: React.ElementType;
    count?: number;
  }[] = [
    { id: "synthesis", label: "Synthesis", Icon: FileText },
    { id: "sources", label: "Sources", Icon: Link2, count: citations.length },
    {
      id: "factchecks",
      label: "Fact Checks",
      Icon: Shield,
      count: factChecks.length,
    },
  ];

  /* Empty state */
  if (!synthesis && status === "idle") {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center mb-5 text-[var(--accent-pink)]"
        >
          <TrendingUp className="w-10 h-10" />
        </motion.div>
        <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">
          Ready to Research
        </h3>
        <p className="text-xs text-[var(--text-secondary)] max-w-xs leading-relaxed">
          Enter a complex question on the left and watch four AI agents
          collaborate to deliver a verified, cited answer — live.
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
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              tab === id
                ? "bg-[var(--accent-pink)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {count != null && count > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs ${
                  tab === id
                    ? "bg-white/20 text-white"
                    : "bg-[var(--bg-card)] text-[var(--text-muted)]"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Confidence gauge */}
      <AnimatePresence>
        {confidence !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-4 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]"
          >
            <ConfidenceGauge value={confidence} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <AnimatePresence mode="wait">
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
                <p className="text-xs text-[var(--text-muted)] text-center py-10">
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
                <p className="text-xs text-[var(--text-muted)] text-center py-10">
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
