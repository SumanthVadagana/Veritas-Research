"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  Download,
  ArrowLeft,
  Brain,
  Search,
  ShieldCheck,
  FileText,
  Sparkles,
  Zap,
  Globe,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const SLIDES = [
  {
    id: 1,
    tag: "VERITAS RESEARCH",
    title: "Multi-Agent AI Fact-Verification & Research Intelligence System",
    desc: "Collaborative 4-Agent Pipeline Powered by Google Gemini 2.0 & Tavily AI Search",
    badge: "Presented by Sumanth Vadagana | InnovaHack GenAI PS1",
    bullets: [
      "Autonomous claim decomposition, verification, and synthesis",
      "Real-time streaming feedback over Server-Sent Events (SSE)",
      "Citation-backed evidence reports with confidence scoring",
    ],
    color: "var(--accent-pink)",
  },
  {
    id: 2,
    tag: "PROBLEM STATEMENT",
    title: "The Problem: Information Overload & Unverified AI Claims",
    desc: "Why traditional search engines and basic LLMs fall short for high-stakes research",
    cards: [
      {
        title: "01. Hallucinations in LLMs",
        desc: "Standard AI models generate plausible-sounding facts without real-time verification, leading to costly misinformation.",
      },
      {
        title: "02. Unstructured Web Noise",
        desc: "Searching manually across hundreds of articles takes hours, making it difficult to extract verified facts quickly.",
      },
      {
        title: "03. Lack of Citation Proof",
        desc: "Traditional AI search tools provide summaries without claim-level evidence, confidence scores, or source auditing.",
      },
    ],
    color: "var(--accent-sky)",
  },
  {
    id: 3,
    tag: "SOLUTION WORKFLOW",
    title: "The Veritas Solution: 4-Agent Autonomous Pipeline",
    desc: "Collaborative agent architecture running sequentially for grounded results",
    bullets: [
      "1. Deconstruct Topic — Planner & Researcher Agents break queries into structured web search sub-queries.",
      "2. Parallel Evidence Gathering — Executes real-time searches via Tavily AI, scoring domain authority & relevance.",
      "3. Cross-Claim Verification — Verifier Agent evaluates claims into Verified ✅, Disputed ❌, or Unverified ⚠️.",
      "4. Audit & Synthesize — Critic audits methodology for bias while Synthesizer generates a fully cited report.",
    ],
    color: "var(--accent-emerald)",
  },
  {
    id: 4,
    tag: "SYSTEM ARCHITECTURE",
    title: "Production Architecture & Tech Stack",
    desc: "Built with high-performance modern web technologies",
    cards: [
      {
        title: "Frontend Engine",
        desc: "Next.js 15 (App Router), React 19, Tailwind CSS, Framer Motion animations.",
      },
      {
        title: "Backend Framework",
        desc: "FastAPI (Async Python), SQLAlchemy, Uvicorn, SSE Streaming Response.",
      },
      {
        title: "AI Core & LLM",
        desc: "Google Gemini 2.0 Flash (Fast reasoning) & Gemini Pro (Report synthesis).",
      },
      {
        title: "Live Web Search",
        desc: "Tavily AI Search API for structured real-time web evidence extraction.",
      },
    ],
    color: "var(--accent-pink)",
  },
  {
    id: 5,
    tag: "AGENT BREAKDOWN",
    title: "Agent Breakdown: Researcher & Verifier Agents",
    desc: "Deep-dive into the data extraction and verification mechanics",
    bullets: [
      "🔍 Researcher Agent: Decomposes prompt into 3-5 targeted sub-queries and executes parallel searches over Tavily AI.",
      "🌐 Source Credibility: Evaluates domain authority, SSL security, & snippet relevance scores.",
      "🛡️ Verifier Agent: Cross-references each atomic claim against retrieved web evidence.",
      "📊 Verdict Assignment: Assigns Verified ✅, Disputed ❌, or Unverified ⚠️ statuses with quantitative confidence scores.",
    ],
    color: "var(--accent-sky)",
  },
  {
    id: 6,
    tag: "AGENT BREAKDOWN",
    title: "Agent Breakdown: Critic & Synthesizer Agents",
    desc: "Ensuring methodology audit and final report creation",
    bullets: [
      "⚡ Critic Agent: Audits methodology for hidden bias, research gaps, and potential LLM hallucinations.",
      "📈 Quality Score: Computes an overall Quality Score out of 10 for continuous report optimization.",
      "📝 Synthesizer Agent: Generates full Markdown executive summary with inline numeric citations.",
      "📡 Live SSE Stream: Streams the complete report live to the user interface.",
    ],
    color: "var(--accent-pink)",
  },
  {
    id: 7,
    tag: "USER INTERFACE",
    title: "UI Design Aesthetics & Dual Theme System",
    desc: "Tailored visual experience supporting instant theme switching",
    bullets: [
      "🌙 Dark Mode Theme: Midnight Black (#09090d) & Neon Pink (#ec4899) accents for sleek low-light research.",
      "☀️ Light Mode Theme: Pure White (#ffffff) & Crimson Red (#dc2626) with ultra-high contrast pure black text.",
      "🔐 Auth Gate Flow: Dedicated initial visitor login/signup card preventing unauthorized access while keeping demo preview.",
      "⚡ Live Progress Timeline: Real-time visual timeline displaying live agent thought logs, search events, & claims.",
    ],
    color: "var(--accent-emerald)",
  },
  {
    id: 8,
    tag: "CLOUD DEPLOYMENT",
    title: "Production Infrastructure & Live Deployments",
    desc: "Hosted on industry-standard cloud providers for max availability",
    cards: [
      {
        title: "🐍 Backend: Render Cloud",
        desc: "Live API: https://veritas-backend-5ado.onrender.com. Running Python 3.11.9 Async Runtime & FastAPI Uvicorn server.",
      },
      {
        title: "⚡ Frontend: Vercel CDN",
        desc: "Live Site: https://veritas-research-2jgj.vercel.app. Next.js 15 App Router with global CDN & public access.",
      },
    ],
    color: "var(--accent-sky)",
  },
  {
    id: 9,
    tag: "REAL-WORLD IMPACT",
    title: "Real-World Applications & Key Impact",
    desc: "Empowering professionals across domains with verified intelligence",
    bullets: [
      "🎓 Academic & Clinical Research: Instantly verifies medical and scientific claims against authoritative web evidence.",
      "📰 Journalism & Fact-Checking: Empowers investigative journalists to detect false claims and cross-verify statements.",
      "💼 Corporate Intelligence: Pulls market trends, competitor analysis, and financial news with cited backing.",
    ],
    color: "var(--accent-emerald)",
  },
  {
    id: 10,
    tag: "CONCLUSION",
    title: "Veritas Research — Live & Ready for Demonstration!",
    desc: "Thank you for reviewing Veritas Research",
    bullets: [
      "🌐 Live Web Application: https://veritas-research-2jgj.vercel.app",
      "💻 GitHub Repository: https://github.com/SumanthVadagana/Veritas-Research",
      "⚡ Status: Fully Operational & Publicly Accessible!",
    ],
    color: "var(--accent-pink)",
  },
];

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slide = SLIDES[currentSlide];

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) setCurrentSlide(currentSlide + 1);
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col justify-between transition-colors duration-300">
      <div>
        <Navbar />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-extrabold text-[var(--text-secondary)] hover:text-[var(--accent-pink)] transition-colors px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to App
            </Link>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-extrabold text-[var(--text-muted)]">
                Slide {currentSlide + 1} of {SLIDES.length}
              </span>
              <a
                href="/Veritas_Research_Presentation.pptx"
                download="Veritas_Research_Presentation.pptx"
                className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-1.5 rounded-xl bg-[var(--accent-pink)] text-white hover:opacity-90 transition-all shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                Download PPTX
              </a>
            </div>
          </div>

          {/* Slide Stage Container */}
          <div className="relative min-h-[500px] rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6 sm:p-10 shadow-2xl flex flex-col justify-between overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col justify-between"
              >
                <div>
                  {/* Category Tag */}
                  <span
                    className="inline-block text-xs font-black uppercase tracking-wider mb-2"
                    style={{ color: slide.color }}
                  >
                    {slide.tag}
                  </span>

                  {/* Slide Title */}
                  <h1 className="text-2xl sm:text-4xl font-black text-[var(--text-primary)] leading-tight mb-3">
                    {slide.title}
                  </h1>

                  <p className="text-sm font-semibold text-[var(--text-secondary)] mb-8">
                    {slide.desc}
                  </p>

                  {/* Slide Bullets */}
                  {slide.bullets && (
                    <div className="flex flex-col gap-3 max-w-4xl mb-6">
                      {slide.bullets.map((b, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]"
                        >
                          <span
                            className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                            style={{ backgroundColor: slide.color }}
                          />
                          <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] leading-relaxed">
                            {b}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Slide Cards Grid if present */}
                  {slide.cards && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {slide.cards.map((c, i) => (
                        <div
                          key={i}
                          className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] flex flex-col justify-between"
                        >
                          <h3
                            className="text-sm font-extrabold mb-2"
                            style={{ color: slide.color }}
                          >
                            {c.title}
                          </h3>
                          <p className="text-xs font-semibold text-[var(--text-secondary)] leading-relaxed">
                            {c.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {slide.badge && (
                  <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                    <span className="text-xs font-extrabold text-[var(--accent-sky)]">
                      {slide.badge}
                    </span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Slide Navigation Controls */}
            <div className="mt-8 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="flex items-center gap-1 px-4 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] disabled:opacity-30 text-xs font-extrabold text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Slide
              </button>

              {/* Slide Indicator Dots */}
              <div className="hidden sm:flex items-center gap-1.5">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      currentSlide === i
                        ? "bg-[var(--accent-pink)] w-6"
                        : "bg-[var(--border-medium)] hover:bg-[var(--text-muted)]"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                disabled={currentSlide === SLIDES.length - 1}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[var(--accent-pink)] disabled:opacity-30 text-xs font-extrabold text-white hover:opacity-90 transition-all shadow-md"
              >
                Next Slide
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
