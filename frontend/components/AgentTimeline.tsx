"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  CheckCircle2,
  Loader2,
  Search,
  AlertCircle,
  Target,
  ShieldCheck,
  FileText,
} from "lucide-react";
import type { AgentEvent, ResearchStatus } from "@/hooks/useResearchStream";

interface AgentTimelineProps {
  events: AgentEvent[];
  status: ResearchStatus;
}

const AGENT_CFG: Record<
  string,
  { color: string; bg: string; ring: string; label: string; Icon: React.ElementType }
> = {
  Planner: {
    color: "text-indigo-500",
    bg: "bg-indigo-500/15",
    ring: "ring-indigo-500/30",
    label: "Planner",
    Icon: Brain,
  },
  Researcher: {
    color: "text-[var(--accent-sky)]",
    bg: "bg-sky-500/15",
    ring: "ring-sky-500/30",
    label: "Researcher Agent",
    Icon: Search,
  },
  Verifier: {
    color: "text-[var(--accent-emerald)]",
    bg: "bg-emerald-500/15",
    ring: "ring-emerald-500/30",
    label: "Verifier Agent",
    Icon: ShieldCheck,
  },
  FactChecker: {
    color: "text-[var(--accent-emerald)]",
    bg: "bg-emerald-500/15",
    ring: "ring-emerald-500/30",
    label: "Verifier Agent",
    Icon: ShieldCheck,
  },
  Critic: {
    color: "text-amber-500",
    bg: "bg-amber-500/15",
    ring: "ring-amber-500/30",
    label: "Critic Agent",
    Icon: AlertCircle,
  },
  Synthesizer: {
    color: "text-[var(--accent-pink)]",
    bg: "bg-pink-500/15",
    ring: "ring-pink-500/30",
    label: "Synthesizer Agent",
    Icon: FileText,
  },
};

const EVENT_ICON: Record<string, React.ElementType> = {
  thinking: Brain,
  searching: Search,
  found: CheckCircle2,
  done: CheckCircle2,
  error: AlertCircle,
};

function TimelineItem({
  event,
  isLast,
  isRunning,
}: {
  event: AgentEvent;
  isLast: boolean;
  isRunning: boolean;
}) {
  const cfg = AGENT_CFG[event.agent] ?? {
    color: "text-[var(--text-muted)]",
    bg: "bg-[var(--bg-card)]",
    ring: "ring-[var(--border-subtle)]",
    label: event.agent,
    Icon: Brain,
  };
  const EventIcon = EVENT_ICON[event.event_type] ?? cfg.Icon;
  const spinning = isLast && isRunning;

  return (
    <motion.div
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-3"
    >
      {/* Spine */}
      <div className="flex flex-col items-center">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg} ring-1 ${cfg.ring}`}
        >
          {spinning ? (
            <Loader2 className={`w-3.5 h-3.5 ${cfg.color} animate-spin`} />
          ) : (
            <EventIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
          )}
        </div>
        {!isLast && (
          <div className="w-px flex-1 min-h-[12px] mt-1 bg-[var(--border-subtle)]" />
        )}
      </div>

      {/* Body */}
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-xs font-bold ${cfg.color}`}>
            {cfg.label}
          </span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">
            {event.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
        <p className="text-xs text-[var(--text-primary)] leading-relaxed">{event.message}</p>

        {/* Sub-queries list if present */}
        {Array.isArray(event.metadata?.sub_queries) && (
          <ul className="mt-2 flex flex-col gap-1">
            {(event.metadata!.sub_queries as string[]).map((q, i) => (
              <li key={i} className="flex items-start gap-1.5 bg-[var(--bg-card)] p-1.5 rounded-md border border-[var(--border-subtle)]">
                <span className="text-[var(--accent-pink)] mt-0.5 text-xs font-bold">›</span>
                <span className="text-xs text-[var(--text-secondary)] leading-snug">{q}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

export function AgentTimeline({ events, status }: AgentTimelineProps) {
  const isRunning = status === "running";

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center mb-3 text-[var(--text-muted)]">
          <Target className="w-7 h-7" />
        </div>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-[200px]">
          Enter a topic to watch the 4 AI Agents collaborate in real-time
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <AnimatePresence initial={false}>
        {events.map((ev, i) => (
          <TimelineItem
            key={ev.id}
            event={ev}
            isLast={i === events.length - 1}
            isRunning={isRunning}
          />
        ))}
      </AnimatePresence>

      {/* Live progress indicator */}
      {isRunning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 pl-10 pt-1"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[var(--accent-pink)]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                delay: i * 0.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
          <span className="text-xs text-[var(--text-muted)] font-semibold">Agents evaluating evidence…</span>
        </motion.div>
      )}
    </div>
  );
}
