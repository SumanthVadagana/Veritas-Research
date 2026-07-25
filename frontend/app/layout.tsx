import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthModal } from "@/components/AuthModal";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Veritas Research — Autonomous Multi-Agent Fact-Verification",
  description:
    "An autonomous multi-agent AI system that plans, researches, critiques, fact-checks, and synthesizes verified answers in real time. Built for InnovaHack GenAI PS1.",
  keywords: [
    "AI research",
    "fact verification",
    "multi-agent AI",
    "Google Gemini",
    "Tavily search",
    "autonomous research",
  ],
  openGraph: {
    title: "Veritas Research",
    description: "Autonomous Multi-Agent Research & Fact-Verification System",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <AuthModal />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
