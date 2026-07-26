"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Share2,
  Check,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Sparkles,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SynthesisPanel } from "@/components/SynthesisPanel";
import { getSession, SessionDetail } from "@/lib/api";
import type { FactCheck, Citation, SourceUsed } from "@/hooks/useResearchStream";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SharedReportPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getSession(id)
      .then((data) => {
        setSession(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load report");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadPdf = () => {
    if (id) {
      window.open(`${API_URL}/api/sessions/${id}/pdf`, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[var(--accent-pink)] animate-spin" />
          <p className="text-xs font-semibold text-[var(--text-muted)]">Loading Shared Verification Report…</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center px-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[var(--text-primary)]">Report Not Found</h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">{error || "The requested verification report does not exist or has been removed."}</p>
          </div>
          <button
            onClick={() => router.push("/research")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-[var(--accent-pink)] hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Research Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Transform backend models to SynthesisPanel formats
  const factChecks: FactCheck[] = (session.claims || []).map((c) => ({
    claim: c.claim_text,
    verdict: c.verdict,
    confidence: c.confidence,
    confidence_score: c.confidence_score,
    explanation: c.explanation,
    supporting_sources: c.supporting_sources,
    contrasting_sources: c.contrasting_sources,
  }));

  const citations: Citation[] = (session.sources || []).map((s, idx) => ({
    url: s.url,
    title: s.title,
    snippet: s.snippet,
    source_index: s.source_index ?? idx + 1,
    credibility_score: s.relevance_score ?? 0.8,
  }));

  const sourcesUsed: SourceUsed[] = (session.sources || []).map((s, idx) => ({
    index: s.source_index ?? idx + 1,
    url: s.url,
    title: s.title || s.url,
    credibility: s.relevance_score ?? 0.8,
  }));

  const synthesisText = session.final_report?.synthesis || "";
  const overallConfidence = session.confidence_score ?? session.final_report?.confidence_score ?? 0.8;
  const verifiedAnswer = synthesisText.split("\n\n")[0] || session.query;
  const explanationText = synthesisText.split("\n\n").slice(1).join("\n\n") || null;

  const formattedDate = session.created_at
    ? new Date(session.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recently";

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col transition-colors duration-300">
      <Navbar />

      {/* Top Banner & Actions Header */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] py-4 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--accent-pink)] uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              Verified Public Report
            </div>
            <h1 className="text-xl font-extrabold text-[var(--text-primary)] leading-tight">
              {session.query}
            </h1>
            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mt-1.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
              <span>·</span>
              <span className="font-mono text-[11px] bg-[var(--bg-card)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-md">
                ID: {session.id.slice(0, 8)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-blue-500 to-[var(--accent-pink)] hover:opacity-90 transition-opacity shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF Report
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold text-[var(--text-primary)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] transition-colors shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[var(--accent-pink)]" />
                  <span>Share Link</span>
                </>
              )}
            </button>

            <button
              onClick={() => router.push("/research")}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              New Research
            </button>
          </div>
        </div>
      </div>

      {/* Main Report Body */}
      <div className="max-w-5xl w-full mx-auto p-6 flex-1">
        <SynthesisPanel
          synthesis={synthesisText}
          confidence={overallConfidence}
          citations={citations}
          factChecks={factChecks}
          sourcesUsed={sourcesUsed}
          verifiedAnswer={verifiedAnswer}
          explanation={explanationText}
          status="completed"
        />
      </div>
    </div>
  );
}
