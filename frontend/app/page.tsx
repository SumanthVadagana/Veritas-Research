"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  Mail,
  Lock,
  User,
  ArrowUpRight,
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
  const { user, isAuthenticated, login, signup } = useAuth();
  
  // Auth Form State
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");
  const [guestAllowed, setGuestAllowed] = useState(false);

  // Search State
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<"quick" | "standard" | "deep">("standard");

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!email || !email.includes("@")) {
      setAuthError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 4) {
      setAuthError("Password must be at least 4 characters long.");
      return;
    }

    if (authTab === "signup") {
      if (!name.trim()) {
        setAuthError("Please enter your full name.");
        return;
      }
      signup(email, name);
    } else {
      login(email);
    }
  };

  const handleStartResearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      router.push("/research");
      return;
    }
    router.push(`/research?topic=${encodeURIComponent(topic.trim())}&depth=${depth}`);
  };

  // If NOT authenticated and guest mode not manually bypassed -> Render Dedicated Login Page
  if (!isAuthenticated && !guestAllowed) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] grid-bg flex flex-col justify-between transition-colors duration-300">
        <Navbar />

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Top brand header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center mx-auto mb-3 shadow-md">
                <Shield className="w-6 h-6 text-white stroke-[2.5]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Veritas <span className="gradient-text">Research</span>
              </h1>
              <p className="text-xs text-[var(--text-muted)] font-semibold mt-1">
                {authTab === "signin"
                  ? "Sign in to access the Multi-Agent Research Engine"
                  : "Create your account to start fact-verifying research"}
              </p>
            </div>

            {/* Auth Tab Switcher */}
            <div className="flex items-center gap-1 p-1 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthTab("signin");
                  setAuthError("");
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  authTab === "signin"
                    ? "bg-[var(--accent-pink)] text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab("signup");
                  setAuthError("");
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  authTab === "signup"
                    ? "bg-[var(--accent-pink)] text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Sign Up
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs font-bold text-center">
                {authError}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
              {authTab === "signup" && (
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl px-10 py-3 text-xs font-semibold text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent-pink)] transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl px-10 py-3 text-xs font-semibold text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent-pink)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl px-10 py-3 text-xs font-semibold text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent-pink)] transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 w-full py-3 rounded-xl bg-[var(--accent-pink)] hover:opacity-90 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <span>{authTab === "signup" ? "Create Free Account" : "Sign In to Dashboard"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Bypassing Guest Link */}
            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] text-center">
              <button
                type="button"
                onClick={() => setGuestAllowed(true)}
                className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--accent-pink)] transition-colors inline-flex items-center gap-1"
              >
                Explore Demo as Guest <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </div>

        <Footer />
      </div>
    );
  }

  // Once authenticated or guest mode chosen -> Render Main Research Engine
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs font-bold text-[var(--accent-pink)] mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Agent AI Fact Verification System</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6 text-[var(--text-primary)]">
              Autonomous Fact-Verification & <br className="hidden sm:block" />
              <span className="gradient-text">Research Intelligence</span>
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-base font-semibold text-[var(--text-secondary)] mb-8 leading-relaxed">
              Verify facts, analyze claims, and synthesize evidence using 4 collaborating AI agents in real time.
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.form
            onSubmit={handleStartResearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <div className="p-2 sm:p-2.5 rounded-3xl border border-[var(--border-medium)] bg-[var(--bg-secondary)] shadow-2xl flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter any claim or topic (e.g., Is coffee healthy for memory?)..."
                className="flex-1 px-4 py-3 bg-transparent text-sm font-semibold text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-[var(--accent-pink)] hover:opacity-95 text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
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
                <h3 className="text-base font-extrabold text-[var(--text-primary)] mb-2">
                  {title}
                </h3>
                <p className="text-xs font-semibold text-[var(--text-secondary)] leading-relaxed">
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
