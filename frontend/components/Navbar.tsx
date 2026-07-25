"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  History,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[var(--gradient-brand)] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)] leading-none">
              Veritas <span className="gradient-text">Research</span>
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-mono tracking-wider uppercase mt-0.5">
              Multi-Agent AI
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-1 rounded-2xl">
          <Link
            href="/research"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              pathname === "/research"
                ? "bg-[var(--accent-pink)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <Link
            href="/history"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              pathname === "/history"
                ? "bg-[var(--accent-pink)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            History
          </Link>
        </nav>

        {/* Controls: Theme Toggle & Auth */}
        <div className="flex items-center gap-3">
          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Dark / Light Mode"
            className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] transition-all flex items-center gap-1.5 text-xs font-medium"
            title={`Switch to ${theme === "dark" ? "Light Mode (White & Red)" : "Dark Mode (Black & Pink)"}`}
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span className="hidden sm:inline text-[var(--text-secondary)]">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-rose-600" />
                <span className="hidden sm:inline text-[var(--text-secondary)]">Dark</span>
              </>
            )}
          </button>

          {/* Authentication controls */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-hover)] transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-[var(--gradient-brand)] flex items-center justify-center text-white text-xs font-bold uppercase">
                  {user.name.charAt(0)}
                </div>
                <span className="text-xs font-medium text-[var(--text-primary)] max-w-[100px] truncate hidden sm:inline">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-2 shadow-2xl z-50"
                  >
                    <div className="px-3 py-2 border-b border-[var(--border-subtle)] mb-1">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] truncate">
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal("signin")}
                className="px-3.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                onClick={() => openAuthModal("signup")}
                className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-pink)] hover:opacity-90 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
