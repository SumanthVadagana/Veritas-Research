import Link from "next/link";
import { Shield, CheckCircle2, AlertCircle, Clock, ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/api";
import { FactCheckBadge } from "@/components/FactCheckBadge";
import { SourceCard } from "@/components/SourceCard";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import type { FactCheck, Citation } from "@/hooks/useResearchStream";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: PageProps) {
  const { id } = await params;

  let session;
  try {
    session = await getSession(id);
  } catch {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-slate-600" />
          </div>
          <h1 className="text-lg font-semibold text-slate-300 mb-2">
            Session not found
          </h1>
          <p className="text-sm text-slate-600 mb-5">
            This session may have been deleted or doesn&apos;t exist.
          </p>
          <Link
            href="/history"
            className="text-sky-400 hover:underline text-sm"
          >
            ← Back to history
          </Link>
        </div>
      </div>
    );
  }

  const statusColor =
    session.status === "completed"
      ? "text-emerald-400"
      : session.status === "failed"
      ? "text-rose-400"
      : "text-amber-400";

  const StatusIcon =
    session.status === "completed"
      ? CheckCircle2
      : session.status === "failed"
      ? AlertCircle
      : Clock;

  const confPct =
    session.confidence_score != null
      ? Math.round(session.confidence_score * 100)
      : null;

  // Map DB records → component prop shapes
  const factChecks: FactCheck[] = (session.claims || []).map((c) => ({
    claim: c.claim_text,
    verdict: c.verdict,
    confidence: c.confidence,
    explanation: c.explanation,
    supporting_sources: c.supporting_sources,
  }));

  const citations: Citation[] = (session.sources || []).map((s) => ({
    url: s.url,
    title: s.title,
    snippet: s.snippet,
    source_index: s.source_index ?? 0,
  }));

  const synthesis = session.final_report?.synthesis;

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-3.5 border-b border-white/6 sticky top-0 bg-[#0a0a1a]/95 backdrop-blur-sm z-10">
        <Link href="/" className="flex items-center gap-2 mr-1">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-white text-sm hidden md:block">
            Veritas Research
          </span>
        </Link>

        <div className="flex items-center gap-1.5 text-slate-600 text-sm">
          <span>/</span>
          <Link
            href="/history"
            className="hover:text-slate-300 transition-colors"
          >
            History
          </Link>
          <span>/</span>
          <span className="text-slate-500 font-mono text-xs">
            {id.slice(0, 8)}
          </span>
        </div>

        <Link
          href="/research"
          className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          New research
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-8">
        {/* Query header */}
        <div className="mb-8">
          <div className={`flex items-center gap-2 text-xs mb-3 ${statusColor}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="font-semibold capitalize">{session.status}</span>
            {confPct !== null && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-slate-500">
                  {confPct}% confidence
                </span>
              </>
            )}
            <span className="text-slate-700">·</span>
            <span className="text-slate-600">
              {new Date(session.created_at).toLocaleString()}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white leading-snug">
            {session.query}
          </h1>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Synthesis (2/3 width) */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-6">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Synthesis
              </h2>
              {synthesis ? (
                <MarkdownRenderer content={synthesis} />
              ) : (
                <p className="text-sm text-slate-600">
                  No synthesis available for this session.
                </p>
              )}
            </div>
          </div>

          {/* Sidebar (1/3 width) */}
          <div className="flex flex-col gap-4">
            {/* Fact checks */}
            {factChecks.length > 0 && (
              <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Fact Checks ({factChecks.length})
                </h2>
                <div className="flex flex-col gap-2">
                  {factChecks.map((fc, i) => (
                    <FactCheckBadge key={i} {...fc} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Sources */}
            {citations.length > 0 && (
              <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Sources ({citations.length})
                </h2>
                <div className="flex flex-col gap-2">
                  {citations.map((c, i) => (
                    <SourceCard key={i} {...c} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Agent output count */}
            {session.agent_outputs && session.agent_outputs.length > 0 && (
              <div className="rounded-xl border border-white/6 bg-white/[0.02] px-4 py-3">
                <p className="text-xs text-slate-600">
                  <span className="text-slate-400 font-semibold">
                    {session.agent_outputs.length}
                  </span>{" "}
                  agent outputs logged · Depth {session.depth}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
