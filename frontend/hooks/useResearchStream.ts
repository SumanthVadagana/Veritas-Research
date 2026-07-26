"use client";

import { useCallback, useRef, useState } from "react";

export type AgentEvent = {
  id: string;
  agent: string;
  event_type: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
};

export type FactCheck = {
  claim: string;
  verdict: "verified" | "disputed" | "unverified";
  confidence: "high" | "medium" | "low";
  confidence_score?: number;
  explanation?: string;
  supporting_sources: number;
};

export type Citation = {
  url: string;
  title?: string;
  snippet?: string;
  source_index: number;
  credibility_score?: number;
};

export type SourceUsed = {
  index: number;
  url: string;
  title: string;
  credibility: number;
};

export type ResearchStatus = "idle" | "running" | "completed" | "failed";

export interface ResearchState {
  sessionId: string | null;
  status: ResearchStatus;
  events: AgentEvent[];
  synthesis: string | null;
  verifiedAnswer: string | null;
  explanation: string | null;
  confidence: number | null;
  citations: Citation[];
  factChecks: FactCheck[];
  sourcesUsed: SourceUsed[];
  error: string | null;
  progressMessage?: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://veritas-backend-5e3o.onrender.com";


let _eventCounter = 0;

export function useResearchStream() {
  const [state, setState] = useState<ResearchState>({
    sessionId: null,
    status: "idle",
    events: [],
    synthesis: null,
    verifiedAnswer: null,
    explanation: null,
    confidence: null,
    citations: [],
    factChecks: [],
    sourcesUsed: [],
    error: null,
    progressMessage: undefined,
  });

  const esRef = useRef<EventSource | null>(null);

  const startResearch = useCallback(
    async (topic: string, depth: string | number = 3) => {
      // Close existing stream
      esRef.current?.close();
      _eventCounter = 0;

      setState({
        sessionId: null,
        status: "running",
        events: [],
        synthesis: null,
        verifiedAnswer: null,
        explanation: null,
        confidence: null,
        citations: [],
        factChecks: [],
        sourcesUsed: [],
        error: null,
        progressMessage: "Initializing multi-agent pipeline...",
      });

      try {
        // 1. Create session
        const res = await fetch(`${API_URL}/api/research`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ topic, query: topic, depth }),
        });
        if (!res.ok) throw new Error("Failed to create research session");

        const data: { session_id: string } = await res.json();
        const sessionId = data.session_id;

        setState((prev) => ({ ...prev, sessionId }));

        // 2. Connect to SSE Stream
        const es = new EventSource(`${API_URL}/api/stream/${sessionId}`);
        esRef.current = es;

        es.onmessage = (e: MessageEvent<string>) => {
          try {
            const payload = JSON.parse(e.data) as Record<string, unknown>;
            const type = payload.type as string;

            if (type === "status") {
              setState((prev) => ({
                ...prev,
                progressMessage: payload.message as string,
              }));
            } else if (type === "agent_event") {
              const event: AgentEvent = {
                id: String(++_eventCounter),
                agent: payload.agent as string,
                event_type: payload.event_type as string,
                message: payload.message as string,
                metadata: payload.metadata as Record<string, unknown> | undefined,
                timestamp: new Date(),
              };
              setState((prev) => ({
                ...prev,
                events: [...prev.events, event],
              }));
            } else if (type === "researcher") {
              const sources = (payload.sources as Citation[]) || [];
              setState((prev) => ({
                ...prev,
                citations: sources,
              }));
            } else if (type === "verifier" || type === "fact_checks") {
              const rawChecks = (payload.verified_claims || payload.fact_checks) as Record<string, unknown>[];
              if (Array.isArray(rawChecks)) {
                const checks: FactCheck[] = rawChecks.map((c) => ({
                  claim: (c.claim as string) || "",
                  verdict: ((c.verdict as string) || "unverified") as FactCheck["verdict"],
                  confidence: ((c.confidence as string) || "low") as FactCheck["confidence"],
                  confidence_score: c.confidence_score as number | undefined,
                  explanation: c.explanation as string | undefined,
                  supporting_sources: Array.isArray(c.supporting_source_indices)
                    ? c.supporting_source_indices.length
                    : (c.supporting_sources as number) || 0,
                }));
                setState((prev) => ({
                  ...prev,
                  factChecks: checks,
                }));
              }
            } else if (type === "final_report" || type === "synthesis") {
              const synth = (payload.synthesis || payload.synthesis_markdown) as string;
              const conf = (payload.overall_confidence || payload.confidence) as number;
              const verifiedAnswer = (payload.verified_answer as string) || null;
              const explanation = (payload.explanation as string) || null;
              const rawSourcesUsed = (payload.sources_used as SourceUsed[]) || [];

              setState((prev) => ({
                ...prev,
                synthesis: synth,
                confidence: conf,
                verifiedAnswer,
                explanation,
                sourcesUsed: rawSourcesUsed,
              }));
            } else if (type === "complete") {
              setState((prev) => ({
                ...prev,
                status: "completed",
                progressMessage: undefined,
              }));
              es.close();
            } else if (type === "error") {
              setState((prev) => ({
                ...prev,
                status: "failed",
                error: payload.message as string,
                progressMessage: undefined,
              }));
              es.close();
            }
          } catch {
            // Ignore JSON parse errors
          }
        };

        es.onerror = () => {
          setState((prev) => ({
            ...prev,
            status: prev.status === "completed" ? "completed" : "failed",
            error: prev.status === "completed" ? null : "Connection interrupted",
          }));
          es.close();
        };
      } catch (err) {
        setState((prev) => ({
          ...prev,
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        }));
      }
    },
    []
  );

  const loadSession = useCallback(async (id: string) => {
    esRef.current?.close();
    _eventCounter = 0;

    setState({
      sessionId: id,
      status: "running",
      events: [],
      synthesis: null,
      verifiedAnswer: null,
      explanation: null,
      confidence: null,
      citations: [],
      factChecks: [],
      sourcesUsed: [],
      error: null,
      progressMessage: "Loading research session details...",
    });

    try {
      const res = await fetch(`${API_URL}/api/sessions/${id}`);
      if (!res.ok) throw new Error("Failed to fetch session details");
      const data = await res.json();

      // Transform backend session records
      const rawEvents: AgentEvent[] = (data.agent_outputs || []).map((output: any, idx: number) => ({
        id: output.id || String(idx + 1),
        agent: output.agent_name || "System",
        event_type: output.event_type || "info",
        message: output.message || "",
        metadata: output.payload || undefined,
        timestamp: new Date(output.created_at || Date.now()),
      }));

      const citations: Citation[] = (data.sources || []).map((s: any, idx: number) => ({
        url: s.url,
        title: s.title,
        snippet: s.snippet,
        source_index: s.source_index ?? idx + 1,
        credibility_score: s.relevance_score ?? 0.8,
      }));

      const factChecks: FactCheck[] = (data.claims || []).map((c: any) => ({
        claim: c.claim_text,
        verdict: c.verdict,
        confidence: c.confidence,
        confidence_score: c.confidence_score,
        explanation: c.explanation,
        supporting_sources: c.supporting_sources,
      }));

      const synthesis = data.final_report?.synthesis || null;
      const confidence = data.confidence_score ?? data.final_report?.confidence_score ?? null;
      const verifiedAnswer = synthesis ? synthesis.split("\n\n")[0] : null;
      const explanation = synthesis ? synthesis.split("\n\n").slice(1).join("\n\n") : null;

      const isCompleted = data.status === "completed" || synthesis != null;

      setState({
        sessionId: id,
        status: isCompleted ? "completed" : data.status === "failed" ? "failed" : "running",
        events: rawEvents,
        synthesis,
        verifiedAnswer,
        explanation,
        confidence,
        citations,
        factChecks,
        sourcesUsed: citations.map((c) => ({
          index: c.source_index,
          url: c.url,
          title: c.title || c.url,
          credibility: c.credibility_score ?? 0.8,
        })),
        error: data.status === "failed" ? "Session failed during execution" : null,
        progressMessage: undefined,
      });

      // If still running, connect to SSE stream to stream remaining events
      if (data.status === "pending" || data.status === "running") {
        const es = new EventSource(`${API_URL}/api/stream/${id}`);
        esRef.current = es;

        es.onmessage = (e: MessageEvent<string>) => {
          try {
            const payload = JSON.parse(e.data) as Record<string, unknown>;
            const type = payload.type as string;

            if (type === "complete") {
              setState((prev) => ({ ...prev, status: "completed", progressMessage: undefined }));
              es.close();
            } else if (type === "error") {
              setState((prev) => ({ ...prev, status: "failed", error: payload.message as string }));
              es.close();
            }
          } catch {
            /* ignore parse errors */
          }
        };

        es.onerror = () => {
          es.close();
        };
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "failed",
        error: err instanceof Error ? err.message : "Failed to load session",
        progressMessage: undefined,
      }));
    }
  }, []);

  const reset = useCallback(() => {
    esRef.current?.close();
    _eventCounter = 0;
    setState({
      sessionId: null,
      status: "idle",
      events: [],
      synthesis: null,
      verifiedAnswer: null,
      explanation: null,
      confidence: null,
      citations: [],
      factChecks: [],
      sourcesUsed: [],
      error: null,
      progressMessage: undefined,
    });
  }, []);

  return { ...state, startResearch, loadSession, reset };
}

