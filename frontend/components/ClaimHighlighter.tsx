"use client";

import { motion } from "framer-motion";
import type { FactCheck } from "@/hooks/useResearchStream";

interface ClaimHighlighterProps {
  synthesis: string | null;
  factChecks: FactCheck[];
}

/* ── helpers ─────────────────────────────────────────────────────────────── */
function tokenize(text: string): string[] {
  if (!text || typeof text !== "string") return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

function overlapScore(a: string, b: string): number {
  if (!a || !b) return 0;
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  if (!ta.size || !tb.size) return 0;
  let matches = 0;
  tb.forEach((w) => { if (ta.has(w)) matches++; });
  return matches / Math.max(ta.size, tb.size);
}

interface Segment {
  text: string;
  verdict: "verified" | "disputed" | "unverified" | null;
  confidence_score: number | null;
  claim: string | null;
}

function buildSegments(synthesis: string | null, factChecks: FactCheck[]): Segment[] {
  if (!synthesis || typeof synthesis !== "string") return [];
  const safeChecks = Array.isArray(factChecks) ? factChecks : [];

  try {
    const raw = synthesis
      .replace(/#{1,6}\s+/g, "")        // strip markdown headings
      .replace(/\*\*|__|\*|_/g, "")     // strip bold/italic
      .replace(/\[.*?\]\(.*?\)/g, "")   // strip links
      .trim();

    const sentences = raw.match(/[^.!?\n]+[.!?\n]*/g) ?? [raw];

    return sentences.map((sent) => {
      const trimmed = sent.trim();
      if (!trimmed || trimmed.length < 20) return { text: sent, verdict: null, confidence_score: null, claim: null };

      let best: FactCheck | null = null;
      let bestScore = 0;
      for (const fc of safeChecks) {
        if (!fc || !fc.claim) continue;
        const s = overlapScore(trimmed, fc.claim);
        if (s > bestScore && s >= 0.12) {
          bestScore = s;
          best = fc;
        }
      }

      if (!best) return { text: sent, verdict: null, confidence_score: null, claim: null };

      return {
        text: sent,
        verdict: best.verdict,
        confidence_score: best.confidence_score ?? null,
        claim: best.claim,
      };
    });
  } catch {
    return [];
  }
}


  return sentences.map((sent) => {
    const trimmed = sent.trim();
    if (!trimmed || trimmed.length < 20) return { text: sent, verdict: null, confidence_score: null, claim: null };

    // Find best matching fact-check claim
    let best: FactCheck | null = null;
    let bestScore = 0;
    for (const fc of factChecks) {
      const s = overlapScore(trimmed, fc.claim);
      if (s > bestScore && s >= 0.12) {
        bestScore = s;
        best = fc;
      }
    }

    if (!best) return { text: sent, verdict: null, confidence_score: null, claim: null };

    return {
      text: sent,
      verdict: best.verdict,
      confidence_score: best.confidence_score ?? null,
      claim: best.claim,
    };
  });
}

/* ── color helpers ───────────────────────────────────────────────────────── */
function getSegmentStyle(seg: Segment) {
  if (!seg.verdict) return { bg: "", border: "", tooltip: null, dot: "" };

  const score = seg.confidence_score ?? 0.5;
  const pct = Math.round(score * 100);

  if (seg.verdict === "verified" && score >= 0.7) {
    return { bg: "bg-emerald-500/15", border: "border-l-2 border-emerald-500", tooltip: `✓ Verified — ${pct}% confidence`, dot: "bg-emerald-500" };
  } else if (seg.verdict === "disputed" || (score >= 0.4 && score < 0.7)) {
    return { bg: "bg-amber-500/12", border: "border-l-2 border-amber-500", tooltip: `⚠ Disputed — ${pct}% confidence`, dot: "bg-amber-500" };
  } else {
    return { bg: "bg-rose-500/12", border: "border-l-2 border-rose-500", tooltip: `✗ Low confidence — ${pct}% confidence`, dot: "bg-rose-500" };
  }
}

/* ── Legend ──────────────────────────────────────────────────────────────── */
function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-[var(--text-muted)] mb-4 p-2.5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)]">
      <span className="uppercase tracking-widest">Highlight Key</span>
      {[
        { dot: "bg-emerald-500", label: "High confidence (≥70%)" },
        { dot: "bg-amber-500",   label: "Medium confidence (40–69%)" },
        { dot: "bg-rose-500",    label: "Low / disputed (<40%)" },
      ].map(({ dot, label }) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-sm ${dot}`} />
          {label}
        </span>
      ))}
    </div>
  );
}

/* ── Highlighted sentence pill ────────────────────────────────────────────── */
function Sentence({ seg, index }: { seg: Segment; index: number }) {
  const style = getSegmentStyle(seg);
  const isHighlighted = Boolean(seg.verdict);
  const pct = seg.confidence_score != null ? Math.round(seg.confidence_score * 100) : null;

  if (!isHighlighted) {
    return (
      <span className="text-sm text-[var(--text-secondary)] leading-relaxed">
        {seg.text}
      </span>
    );
  }

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className={`inline relative group ${style.bg} ${style.border} px-1.5 py-0.5 rounded-md mx-0.5 cursor-default text-sm text-[var(--text-primary)] leading-relaxed`}
      title={style.tooltip ?? ""}
    >
      {seg.text}
      {/* Inline confidence badge */}
      <span
        className={`inline-flex items-center gap-0.5 ml-1 px-1 py-0.5 rounded text-[9px] font-extrabold ${style.bg} ${
          seg.verdict === "verified" && (seg.confidence_score ?? 0) >= 0.7
            ? "text-emerald-500"
            : seg.verdict === "disputed" || ((seg.confidence_score ?? 0.5) >= 0.4 && (seg.confidence_score ?? 0.5) < 0.7)
            ? "text-amber-500"
            : "text-rose-500"
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot} flex-shrink-0`} />
        {pct != null ? `${pct}%` : seg.verdict}
      </span>

      {/* Hover tooltip with claim text */}
      {seg.claim && (
        <span className="absolute bottom-full left-0 mb-1.5 w-64 z-20 hidden group-hover:block">
          <span className="block bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-2.5 shadow-xl text-[10px] text-[var(--text-secondary)] leading-relaxed">
            <span className="block font-extrabold text-[var(--text-primary)] mb-1">Matched Claim:</span>
            {seg.claim}
          </span>
        </span>
      )}
    </motion.span>
  );
}

/* ── Summary bar ─────────────────────────────────────────────────────────── */
function SummaryBar({ factChecks }: { factChecks: FactCheck[] }) {
  const verified = factChecks.filter((f) => f.verdict === "verified").length;
  const disputed = factChecks.filter((f) => f.verdict === "disputed").length;
  const unverified = factChecks.filter((f) => f.verdict === "unverified").length;
  const total = factChecks.length;

  if (!total) return null;

  return (
    <div className="flex items-center gap-3 mb-4 p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)]">
      <div className="flex-1 h-3 rounded-full overflow-hidden bg-[var(--bg-secondary)] flex">
        <motion.div
          className="h-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${(verified / total) * 100}%` }}
          transition={{ duration: 0.6 }}
        />
        <motion.div
          className="h-full bg-amber-500"
          initial={{ width: 0 }}
          animate={{ width: `${(disputed / total) * 100}%` }}
          transition={{ duration: 0.6, delay: 0.1 }}
        />
        <motion.div
          className="h-full bg-rose-500"
          initial={{ width: 0 }}
          animate={{ width: `${(unverified / total) * 100}%` }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />
      </div>
      <div className="flex items-center gap-3 text-[10px] font-extrabold flex-shrink-0">
        <span className="text-emerald-500">✓ {verified}</span>
        <span className="text-amber-500">⚠ {disputed}</span>
        <span className="text-rose-400">✗ {unverified}</span>
      </div>
    </div>
  );
}

/* ── Main export ─────────────────────────────────────────────────────────── */
export function ClaimHighlighter({ synthesis, factChecks }: ClaimHighlighterProps) {
  if (!synthesis) {
    return (
      <div className="flex flex-col gap-2">
        {[100, 88, 95, 70, 82].map((w, i) => (
          <div key={i} className="shimmer h-4 rounded" style={{ width: `${w}%` }} />
        ))}
      </div>
    );
  }

  const segments = buildSegments(synthesis, factChecks);
  const highlightedCount = segments.filter((s) => s.verdict).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Summary bar */}
      <SummaryBar factChecks={factChecks} />

      {/* Legend */}
      <Legend />

      {/* Highlighted text body */}
      <div className="text-sm leading-8 text-[var(--text-secondary)]">
        {segments.map((seg, i) => (
          <Sentence key={i} seg={seg} index={i} />
        ))}
      </div>

      {/* Footer note */}
      {highlightedCount === 0 && (
        <p className="text-[11px] text-[var(--text-muted)] text-center mt-2 italic">
          No sentence-level matches found. View the Results tab for claim-by-claim breakdown.
        </p>
      )}
    </div>
  );
}
