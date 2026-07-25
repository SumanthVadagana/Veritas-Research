"use client";

import { useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Sparkles,
} from "lucide-react";
import { useResearchStream } from "@/hooks/useResearchStream";
import { QueryInput } from "@/components/QueryInput";
import { AgentTimeline } from "@/components/AgentTimeline";
import { SynthesisPanel } from "@/components/SynthesisPanel";
import { Navbar } from "@/components/Navbar";

const STATUS_CFG = {
  idle: { label: "Ready", Icon: Shield, color: "text-[var(--text-muted)]" },
  running: { label: "Multi-Agent Active", Icon: Cpu, color: "text-amber-500" },
  completed: { label: "Complete & Verified", Icon: CheckCircle2, color: "text-emerald-500" },
  failed: { label: "Failed", Icon: AlertCircle, color: "text-rose-500" },
} as const;

function DashboardContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get("topic");
  const initialDepth = searchParams.get("depth") || "standard";
  const autoStarted = useRef(false);

  const {
    status,
    events,
    synthesis,
    confidence,
    citations,
    factChecks,
    error,
    sessionId,
    progressMessage,
    startResearch,
    reset,
  } = useResearchStream();

  const timelineRef = useRef<HTMLDivElement>(null);

  // Auto-start if topic is passed in query string
  useEffect(() => {
    if (initialTopic && !autoStarted.current) {
      autoStarted.current = true;
      startResearch(initialTopic, initialDepth);
    }
  }, [initialTopic, initialDepth, startResearch]);

  // Auto-scroll timeline to bottom on new events
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [events]);

  const { label, Icon, color } = STATUS_CFG[status] ?? STATUS_CFG.idle;

  return (
    <div className="h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col overflow-hidden transition-colors duration-300">
      <Navbar />

      {/* Progress & Session Status bar */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-xs flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 font-semibold ${color}`}>
            {status === "running" ? (
              <motion.div
                className="w-2 h-2 rounded-full bg-amber-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            ) : (
              <Icon className="w-3.5 h-3.5" />
            )}
            <span>{label}</span>
          </div>

          {progressMessage && status === "running" && (
            <div className="flex items-center gap-1.5 text-[var(--accent-sky)] font-medium">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>{progressMessage}</span>
            </div>
          )}
        </div>

        {sessionId && (
          <span className="text-[11px] text-[var(--text-muted)] font-mono bg-[var(--bg-card)] border border-[var(--border-subtle)] px-2.5 py-0.5 rounded-lg">
            Session: {sessionId.slice(0, 8)}
          </span>
        )}
      </div>

      {/* Main split grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — query input + agent timeline */}
        <div className="w-full md:w-[400px] xl:w-[440px] flex-shrink-0 flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 overflow-hidden">
          <div className="p-4 border-b border-[var(--border-subtle)] flex-shrink-0">
            <QueryInput
              onSubmit={startResearch}
              isLoading={status === "running"}
              onReset={reset}
            />
          </div>

          <div
            ref={timelineRef}
            className="flex-1 overflow-y-auto p-4 scroll-smooth"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Live Agent Activity
              </h2>
              {events.length > 0 && (
                <span className="text-[11px] font-mono text-[var(--accent-pink)] font-semibold">
                  {events.length} event{events.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            <AgentTimeline events={events} status={status} />
          </div>
        </div>

        {/* Right panel — Synthesis + Claims + Sources */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-primary)]">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="m-4 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-semibold flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-hidden p-5">
            <SynthesisPanel
              synthesis={synthesis}
              confidence={confidence}
              citations={citations}
              factChecks={factChecks}
              status={status}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResearchPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-muted)] text-xs">Loading Live Research Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
