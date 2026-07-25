import Link from "next/link";
import {
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
  BarChart3,
} from "lucide-react";
import { getHistory } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  let sessions: Awaited<ReturnType<typeof getHistory>> = [];
  try {
    sessions = await getHistory(50);
  } catch {
    sessions = [];
  }

  const completed = sessions.filter((s) => s.status === "completed").length;
  const avgConf =
    sessions.length > 0
      ? Math.round(
          (sessions
            .filter((s) => s.confidence_score != null)
            .reduce((a, s) => a + (s.confidence_score ?? 0), 0) /
            Math.max(
              1,
              sessions.filter((s) => s.confidence_score != null).length
            )) *
            100
        )
      : null;

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Ambient */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-sky-500/3 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-5 py-10">
          {/* Page header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Research History
              </h1>
              <p className="text-xs text-slate-400">
                {sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded
              </p>
            </div>
            <Link
              href="/research"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all shadow-[0_0_14px_rgba(14,165,233,0.3)]"
            >
              <Plus className="w-3.5 h-3.5" />
              New Research
            </Link>
          </div>

          {/* Stats row */}
          {sessions.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                {
                  label: "Total Sessions",
                  value: sessions.length,
                  Icon: BarChart3,
                  color: "text-sky-400",
                },
                {
                  label: "Completed",
                  value: completed,
                  Icon: CheckCircle2,
                  color: "text-emerald-400",
                },
                {
                  label: "Avg Confidence",
                  value: avgConf !== null ? `${avgConf}%` : "—",
                  Icon: Shield,
                  color: "text-violet-400",
                },
              ].map(({ label, value, Icon, color }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/7 bg-white/[0.025] p-4 text-center"
                >
                  <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
                  <p className="text-xl font-bold text-white">{value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Session list */}
          {sessions.length === 0 ? (
            <div className="text-center py-24 rounded-3xl border border-white/6 bg-white/[0.015]">
              <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-400 mb-2 font-medium">
                No research sessions recorded yet
              </p>
              <p className="text-xs text-slate-500 mb-6">
                Start your first research query and it will automatically save here
              </p>
              <Link
                href="/research"
                className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 text-xs font-semibold transition-colors"
              >
                Start Researching <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {sessions.map((s) => {
                const StatusIcon =
                  s.status === "completed"
                    ? CheckCircle2
                    : s.status === "failed"
                    ? AlertCircle
                    : Clock;

                const statusColor =
                  s.status === "completed"
                    ? "text-emerald-400"
                    : s.status === "failed"
                    ? "text-rose-400"
                    : "text-amber-400";

                const iconBg =
                  s.status === "completed"
                    ? "bg-emerald-400/10"
                    : s.status === "failed"
                    ? "bg-rose-400/10"
                    : "bg-amber-400/10";

                const confPct =
                  s.confidence_score != null
                    ? Math.round(s.confidence_score * 100)
                    : null;

                return (
                  <Link key={s.id} href={`/research/${s.id}`}>
                    <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-white/7 bg-white/[0.025] hover:bg-white/[0.045] hover:border-white/14 transition-all duration-200 group">
                      {/* Status icon */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
                      >
                        <StatusIcon
                          className={`w-4 h-4 ${statusColor}`}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                          {s.query}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span
                            className={`text-xs font-semibold capitalize ${statusColor}`}
                          >
                            {s.status}
                          </span>
                          {confPct !== null && (
                            <span className="text-xs text-slate-400 font-mono">
                              {confPct}% confidence
                            </span>
                          )}
                          <span className="text-xs text-slate-500">
                            {formatDistanceToNow(new Date(s.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>

                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-200 flex-shrink-0 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
