"use client";

import Link from "next/link";
import { Shield, ExternalLink, Activity, Github, Lock, FileText } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/6 bg-[#070712] py-8 px-6 md:px-10 text-xs text-slate-400">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand Col */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">Veritas Research</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
            Autonomous Multi-Agent Fact Verification System. Deploys Google Gemini AI & Tavily Search to plan, verify, and synthesize grounded research.
          </p>

          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">
            Platform
          </h4>
          <ul className="flex flex-col gap-2">
            <li>
              <Link href="/research" className="hover:text-sky-300 transition-colors">
                Research Dashboard
              </Link>
            </li>
            <li>
              <Link href="/history" className="hover:text-sky-300 transition-colors">
                Research History
              </Link>
            </li>
            <li>
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="hover:text-sky-300 transition-colors inline-flex items-center gap-1"
              >
                FastAPI Swagger Docs <ExternalLink className="w-3 h-3" />
              </a>
            </li>
          </ul>
        </div>

        {/* Technical */}
        <div>
          <h4 className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">
            Architecture
          </h4>
          <ul className="flex flex-col gap-2">
            <li>Google Gemini 1.5 Pro & Flash</li>
            <li>Tavily AI Search Engine</li>
            <li>Next.js 15 (App Router)</li>
            <li>Server-Sent Events (SSE)</li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} Veritas Research. Built for InnovaHack GenAI Domain PS1.</p>
        <div className="flex items-center gap-4">
          <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
          <span>•</span>
          <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
        </div>
      </div>
    </footer>
  );
}
