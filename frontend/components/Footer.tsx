"use client";

import Link from "next/link";
import { Shield, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] py-8 px-6 md:px-10 text-xs text-[var(--text-muted)] transition-colors duration-300">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand Col */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-[var(--gradient-brand)] flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-[var(--text-primary)] text-sm">Veritas Research</span>
          </div>
          <p className="text-[var(--text-secondary)] text-xs leading-relaxed max-w-sm">
            Autonomous Multi-Agent Fact Verification System. Deploys Google Gemini AI & Tavily Search to plan, verify, and synthesize grounded research.
          </p>

          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-[var(--text-primary)] mb-3 text-xs uppercase tracking-wider">
            Platform
          </h4>
          <ul className="flex flex-col gap-2 text-[var(--text-secondary)]">
            <li>
              <Link href="/research" className="hover:text-[var(--accent-pink)] transition-colors">
                Research Dashboard
              </Link>
            </li>
            <li>
              <Link href="/history" className="hover:text-[var(--accent-pink)] transition-colors">
                Research History
              </Link>
            </li>
            <li>
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[var(--accent-pink)] transition-colors inline-flex items-center gap-1"
              >
                FastAPI Swagger Docs <ExternalLink className="w-3 h-3" />
              </a>
            </li>
          </ul>
        </div>

        {/* Technical */}
        <div>
          <h4 className="font-bold text-[var(--text-primary)] mb-3 text-xs uppercase tracking-wider">
            Architecture
          </h4>
          <ul className="flex flex-col gap-2 text-[var(--text-secondary)]">
            <li>Google Gemini 2.0 Flash</li>
            <li>Tavily AI Search Engine</li>
            <li>Next.js 15 (App Router)</li>
            <li>Server-Sent Events (SSE)</li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-6 border-t border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-[var(--text-muted)]">© {new Date().getFullYear()} Veritas Research. Built for InnovaHack GenAI Domain PS1.</p>
        <div className="flex items-center gap-4 text-[var(--text-muted)]">
          <span className="hover:text-[var(--text-primary)] cursor-pointer">Privacy Policy</span>
          <span>•</span>
          <span className="hover:text-[var(--text-primary)] cursor-pointer">Terms of Service</span>
        </div>
      </div>
    </footer>
  );
}
