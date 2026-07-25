"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Globe, ChevronDown, ShieldCheck } from "lucide-react";
import type { Citation } from "@/hooks/useResearchStream";

interface SourceCardProps extends Citation {
  index: number;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url.slice(0, 40);
  }
}

export function SourceCard({
  url,
  title,
  snippet,
  source_index,
  credibility_score,
  index,
}: SourceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const domain = getDomain(url);
  const credPct = credibility_score != null ? Math.round(credibility_score * 100) : 75;

  const credColor =
    credPct >= 80 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
    credPct >= 60 ? "text-sky-400 bg-sky-500/10 border-sky-500/20" :
    "text-amber-400 bg-amber-500/10 border-amber-500/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="rounded-xl border border-white/7 bg-white/[0.025] hover:bg-white/[0.04] transition-all duration-200 overflow-hidden"
    >
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-3.5 flex items-start gap-3 cursor-pointer select-none"
      >
        {/* Index badge */}
        {source_index != null && (
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center mt-0.5">
            {source_index}
          </span>
        )}

        {/* Title & Domain */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-200 truncate hover:text-sky-300 transition-colors leading-tight">
            {title || domain}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-slate-500 flex-shrink-0" />
              <span className="text-xs text-slate-500 truncate">{domain}</span>
            </div>

            {/* Credibility Badge */}
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded border ${credColor}`}>
              <ShieldCheck className="w-2.5 h-2.5" />
              {credPct}% trust
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-white/5 transition-colors"
            title="Open external link"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-slate-500"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.div>
        </div>
      </div>

      {/* Expandable Snippet Section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-3.5 pb-3.5 pt-0 border-t border-white/5"
          >
            <p className="text-xs text-slate-400 leading-relaxed mt-2 bg-black/20 p-2.5 rounded-lg border border-white/5">
              {snippet || "No detailed excerpt available for this source."}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-mono text-[10px] truncate max-w-[240px]">
                {url}
              </span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:underline flex items-center gap-1"
              >
                Visit Source <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
