"use client";

export const dynamic = "force-dynamic";

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
  LogIn,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";

const FEATURES = [
  {
    Icon: Brain,
    title: "4-Agent Autonomous Pipeline",
    desc: "Researcher, Verifier, Critic, and Synthesizer agents execute sequentially with step-by-step transparency.",
  },
  {
    Icon: Search,
    title: "Parallel Web Research",
    desc: "Powered by Tavily AI to execute parallel search sub-queries across hundreds of sources.",
  },
  {
    Icon: ShieldCheck,
    title: "Claim Verification",
    desc: "Cross-references claims across sources to produce Verified, Disputed, or Unverified confidence scores.",
  },
  {
    Icon: Zap,
    title: "Real-Time Streaming",
    desc: "Watch agent activity, claims, and final synthesis stream live via Server-Sent Events (SSE).",
  },
  {
    Icon: GitBranch,
    title: "Source Credibility Scoring",
    desc: "Algorithms evaluate domain authority, SSL security, content richness, and search relevance.",
  },
  {
    Icon: FileText,
    title: "Citation-Backed Synthesis",
    desc: "Final markdown report with inline citations, executive summary, and claim-level confidence ratings.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { user, isAuthenticated, openAuthModal } = useAuth();
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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] grid-bg overflow-hidden flex flex-col justify-between transition-colors duration-300">
      <div>
        <Navbar />

        {/* Hero Section */}
        <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Top pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs font-semibold text-[var(--accent-pink)] mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Agent AI Fact Verification System</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6 text-[var(--text-primary)]">
              Autonomous Fact-Verification & <br className="hidden sm:block" />
              <span className="gradient-text">Research Intelligence</span>
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-[var(--text-secondary)] mb-8 leading-relaxed">
              Verify facts, analyze claims, and synthesize evidence using 4 collaborating AI agents in real time.
            </p>
          </motion.div>

          {/* Authentication Banner for visitors */}
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="max-w-xl mx-auto mb-10 p-5 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] shadow-xl text-left flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[var(--accent-pink)]" />
                  Sign In to Save Your Research
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Log in or create a free account to track history and access pro research depth.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => openAuthModal("signin")}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card-hover)] text-[var(--text-primary)] text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal("signup")}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[var(--accent-pink)] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Sign Up
                </button>
              </div>
            </motion.div>
          )}

          {/* Search Box */}
          <motion.form
            onSubmit={handleStartResearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <div className="p-2 sm:p-2.5 rounded-3xl border border-[var(--border-medium)] bg-[var(--bg-secondary)] shadow-2xl flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter any claim or topic (e.g., Is coffee healthy for memory?)..."
                className="flex-1 px-4 py-3 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-[var(--accent-pink)] hover:opacity-95 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Start Research</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.form>
        </section>

        {/* Feature Grid */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 border-t border-[var(--border-subtle)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-pink)]/10 flex items-center justify-center mb-4 text-[var(--accent-pink)]">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">
                  {title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
