"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Zap, ChevronDown, X } from "lucide-react";

interface QueryInputProps {
  onSubmit: (query: string, depth: number) => void;
  isLoading?: boolean;
  onReset?: () => void;
}

const EXAMPLES = [
  "Is nuclear fusion energy commercially viable in 2025?",
  "What are the real effects of social media on teenage mental health?",
  "How accurate are AI language models in clinical diagnosis?",
  "What caused the 2023 banking crisis and what lessons were learned?",
];

const DEPTH_LABELS: Record<number, string> = {
  1: "Quick",
  2: "Basic",
  3: "Standard",
  4: "Deep",
  5: "Exhaustive",
};

export function QueryInput({ onSubmit, isLoading, onReset }: QueryInputProps) {
  const [query, setQuery] = useState("");
  const [depth, setDepth] = useState(3);
  const [depthOpen, setDepthOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || isLoading) return;
    onSubmit(q, depth);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit}>
        <div
          className={`relative rounded-2xl border transition-all duration-200 ${
            isLoading
              ? "border-[var(--accent-pink)] shadow-md"
              : "border-[var(--border-subtle)] focus-within:border-[var(--accent-pink)]"
          } bg-[var(--bg-card)] backdrop-blur-sm`}
        >
          <textarea
            ref={textareaRef}
            id="research-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask any complex research question…"
            rows={3}
            disabled={isLoading}
            className="w-full bg-transparent px-4 pt-4 pb-14 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none outline-none leading-relaxed"
          />

          {/* Toolbar */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            {/* Depth picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDepthOpen((o) => !o)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <Zap className="w-3 h-3 text-[var(--accent-pink)]" />
                <span>
                  Depth: {depth} — {DEPTH_LABELS[depth]}
                </span>
                <ChevronDown className="w-3 h-3" />
              </button>

              <AnimatePresence>
                {depthOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-9 left-0 w-44 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl p-1.5 shadow-2xl z-20"
                  >
                    {[1, 2, 3, 4, 5].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setDepth(d);
                          setDepthOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs transition-colors ${
                          depth === d
                            ? "bg-[var(--accent-pink)] text-white font-bold"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <span className="font-semibold">{d}</span>
                        <span className="text-xs">
                          {DEPTH_LABELS[d]}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isLoading && onReset && (
                <button
                  type="button"
                  onClick={onReset}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              )}
              <button
                type="submit"
                id="research-submit"
                disabled={!query.trim() || isLoading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--accent-pink)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md"
              >
                <Search className="w-3.5 h-3.5" />
                {isLoading ? "Researching…" : "Research"}
              </button>
            </div>
          </div>
        </div>

        <p className="mt-1.5 text-[11px] text-[var(--text-muted)] text-right font-mono">
          Ctrl+Enter to submit
        </p>
      </form>

      {/* Examples */}
      {!isLoading && (
        <div>
          <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1.5">
            Examples
          </p>
          <div className="flex flex-col gap-0.5">
            {EXAMPLES.map((q, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(q);
                  textareaRef.current?.focus();
                }}
                className="text-left text-xs text-[var(--text-secondary)] hover:text-[var(--accent-pink)] transition-colors py-1 px-2 rounded-lg hover:bg-[var(--bg-card-hover)] truncate"
              >
                <span className="text-[var(--text-muted)] mr-1.5">›</span>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
