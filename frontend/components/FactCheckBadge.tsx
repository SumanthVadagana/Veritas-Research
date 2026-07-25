"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, HelpCircle, ShieldCheck } from "lucide-react";
import type { FactCheck } from "@/hooks/useResearchStream";

interface FactCheckBadgeProps extends FactCheck {
  index: number;
}

const VERDICT = {
  verified: {
    Icon: CheckCircle2,
    label: "Verified",
    text: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/25",
    dot: "bg-emerald-400",
  },
  disputed: {
    Icon: AlertCircle,
    label: "Disputed",
    text: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/25",
    dot: "bg-rose-400",
  },
  unverified: {
    Icon: HelpCircle,
    label: "Unverified",
    text: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/25",
    dot: "bg-amber-400",
  },
} as const;

const CONF_COLOR: Record<string, string> = {
  high: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  medium: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  low: "text-rose-400 border-rose-500/30 bg-rose-500/10",
};

export function FactCheckBadge({
  claim,
  verdict,
  confidence,
  confidence_score,
  explanation,
  supporting_sources,
  index,
}: FactCheckBadgeProps) {
  const cfg = VERDICT[verdict] ?? VERDICT.unverified;
  const { Icon } = cfg;
  const confStyle = CONF_COLOR[confidence] || CONF_COLOR.medium;
  const scorePct = confidence_score != null ? Math.round(confidence_score * 100) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`rounded-xl border p-3.5 ${cfg.bg} ${cfg.border} hover:border-white/20 transition-colors`}
    >
      <div className="flex items-start gap-2.5">
        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.text}`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-200 leading-snug">{claim}</p>
          
          {explanation && (
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed bg-black/20 p-2 rounded-lg border border-white/5">
              {explanation}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            {/* Verdict pill */}
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>

            {/* Confidence Score Pill */}
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${confStyle}`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span className="capitalize">{confidence} Confidence</span>
              {scorePct !== null && <span className="font-mono">({scorePct}%)</span>}
            </span>

            {supporting_sources > 0 && (
              <span className="text-[11px] text-slate-500 font-medium">
                {supporting_sources} supporting source{supporting_sources > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
