"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Brain,
  Shield,
  Zap,
  Search,
  GitBranch,
  Sparkles,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const FEATURES = [
  {
    Icon: Brain,
    title: "4-Agent Autonomous Pipeline",
    desc: "Researcher, Verifier, Critic, and Synthesizer agents execute sequentially with step-by-step transparency.",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-400/20",
  },
  {
    Icon: Search,
    title: "Parallel Web Research",
    desc: "Powered by Tavily AI to execute parallel search sub-queries across hundreds of sources.",
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
    border: "border-indigo-400/20",
  },
  {
    Icon: ShieldCheck,
    title: "Claim Verification",
    desc: "Cross-references claims across sources to produce Verified, Disputed, or Unverified confidence scores.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
  {
    Icon: Zap,
    title: "Real-Time Streaming",
    desc: "Watch agent activity, claims, and final synthesis stream live via Server-Sent Events (SSE).",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  {
    Icon: GitBranch,
    title: "Source Credibility Scoring",
    desc: "Algorithms evaluate domain authority, SSL security, content richness, and search relevance.",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
  },
  {
    Icon: FileText,
    title: "Citation-Backed Synthesis",
    desc: "Final markdown report with inline citations, executive summary, and claim-level confidence ratings.",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
  },
];

const AGENTS = [
  { name: "Researcher", color: "#0ea5e9", glow: "rgba(14,165,233,0.4)", desc: "Searches & extracts claims" },
  { name: "Verifier", color: "#10b981", glow: "rgba(16,185,129,0.4)", desc: "Cross-checks evidence" },
  { name: "Critic", color: "#f59e0b", glow: "rgba(245,158,11,0.4)", desc: "Audits contradictions" },
  { name: "Synthesizer", color: "#8b5cf6", glow: "rgba(139,92,246,0.4)", desc: "Citation report" },
];

export default function LandingPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<"quick" | "standard" | "deep">("standard");

  const handleStartResearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      router.push("/research");
      return;
    }
    router.push(`/research?topic=${encodeURIComponent(topic.trim())}&depth=${depth}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] grid-bg overflow-hidden flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Ambient background blobs */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[750px] h-[750px] rounded-full bg-sky-500/5 blur-[150px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[450px] h-[450px] rounded-full bg-indigo-500/5 blur-[120px]" />
          <div className="absolute top-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-emerald-500/4 blur-[110px]" />
        </div>

        {/* Hero */}
        <section className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-300 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Autonomous Multi-Agent Fact Verification System
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight leading-[1.1]">
              Truth, verified by <br />
              <span className="gradient-text">autonomous AI agents.</span>
            </h1>

            <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Input any complex question. Four specialized AI agents conduct parallel web searches,
              score source credibility, cross-verify claims, and synthesize citation-backed answers in real-time.
            </p>

            {/* Quick Input Form */}
            <form onSubmit={handleStartResearch} className="max-w-2xl mx-auto mb-8">
              <div className="p-2 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md shadow-2xl flex flex-col md:flex-row items-center gap-2">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter a research topic (e.g. Is nuclear fusion energy viable by 2030?)"
                  className="w-full bg-transparent px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none"
                />

                {/* Depth Selector */}
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 w-full md:w-auto flex-shrink-0">
                  {(["quick", "standard", "deep"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDepth(d)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                        depth === d
                          ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 flex-shrink-0 transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)]"
                >
                  <Search className="w-3.5 h-3.5" />
                  Research
                </button>
              </div>
            </form>
          </motion.div>

          {/* 4 Agent Visual Pipeline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-12 flex items-center justify-center flex-wrap gap-3 md:gap-4"
          >
            {AGENTS.map((agent, i) => (
              <div key={agent.name} className="flex items-center gap-3">
                <div
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl border bg-white/[0.03] backdrop-blur-sm"
                  style={{ borderColor: `${agent.color}30` }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: agent.color,
                      boxShadow: `0 0 8px ${agent.glow}`,
                    }}
                  />
                  <div className="text-left">
                    <p className="text-xs font-bold" style={{ color: agent.color }}>
                      {agent.name} Agent
                    </p>
                    <p className="text-[10px] text-slate-500">{agent.desc}</p>
                  </div>
                </div>

                {i < AGENTS.length - 1 && (
                  <span className="text-slate-600 text-xs hidden md:inline">→</span>
                )}
              </div>
            ))}
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="relative z-10 max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Multi-Agent Intelligence Architecture
            </h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Transparency, credibility scoring, and verification built into every layer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ Icon, title, desc, color, bg, border }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={`rounded-2xl border ${border} bg-white/[0.025] p-5 hover:bg-white/[0.045] transition-all`}
              >
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1.5">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
