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
  ChevronDown,
  Search,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="relative z-30 flex items-center justify-between px-5 md:px-8 py-3.5 border-b border-white/6 bg-white/[0.02] backdrop-blur-md flex-shrink-0">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 dark:from-pink-500 dark:to-rose-600 flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.35)] group-hover:scale-105 transition-transform">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight group-hover:text-rose-500 transition-colors">
            Veritas Research
          </span>
        </div>
      </Link>

      {/* Nav Links */}
      <nav className="hidden md:flex items-center gap-1 bg-black/5 dark:bg-white/[0.03] p-1 rounded-xl border border-black/10 dark:border-white/5">
        <Link
          href="/research"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            pathname === "/research"
              ? "bg-rose-500/20 text-rose-600 dark:text-pink-300 border border-rose-500/30"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          Research Dashboard
        </Link>
        <Link
          href="/history"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            pathname === "/history"
              ? "bg-rose-500/20 text-rose-600 dark:text-pink-300 border border-rose-500/30"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          History
        </Link>
      </nav>

      {/* Right Controls: Theme Toggle + Auth */}
      <div className="flex items-center gap-3">
        {/* Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:text-rose-500 dark:hover:text-pink-400 transition-all"
          title={`Switch to ${theme === "dark" ? "Light (White & Red)" : "Dark (Black & Deep Pink)"} Mode`}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Auth Actions */}
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                {user.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-11 w-48 bg-white dark:bg-[#0f1123] border border-slate-200 dark:border-white/10 rounded-2xl p-2 shadow-2xl z-40"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-white/6 mb-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user.email}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 dark:bg-pink-500/20 text-rose-600 dark:text-pink-300 border border-rose-500/20">
                      {user.role}
                    </span>
                  </div>

                  <Link
                    href="/history"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    My Sessions
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-rose-500 text-xs font-semibold transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              onClick={() => openAuthModal("signup")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 dark:from-pink-600 dark:to-rose-600 text-white text-xs font-semibold transition-all shadow-[0_0_14px_rgba(244,63,94,0.3)]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Sign Up
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
