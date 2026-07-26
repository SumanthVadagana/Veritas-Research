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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col justify-between transition-colors duration-300">
      <div>
        <Navbar />

        <div className="relative z-10 max-w-4xl mx-auto px-5 py-10">
          {/* Page header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                Research History
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                {sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded
              </p>
            </div>
            <Link
              href="/research"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent-pink)] hover:opacity-90 text-white text-xs font-semibold transition-all shadow-md"
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
                  color: "text-[var(--accent-sky)]",
                },
                {
                  label: "Completed",
                  value: completed,
                  Icon: CheckCircle2,
                  color: "text-[var(--accent-emerald)]",
                },
                {
                  label: "Avg Confidence",
                  value: avgConf !== null ? `${avgConf}%` : "—",
                  Icon: Shield,
                  color: "text-[var(--accent-pink)]",
                },
              ].map(({ label, value, Icon, color }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 text-center"
                >
                  <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
                  <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Session list */}
          {sessions.length === 0 ? (
            <div className="text-center py-24 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-4 text-[var(--text-muted)]">
                <Clock className="w-8 h-8" />
              </div>
              <p className="text-[var(--text-secondary)] mb-2 font-medium">
                No research sessions recorded yet
              </p>
              <p className="text-xs text-[var(--text-muted)] mb-6">
                Start your first research query and it will automatically save here
              </p>
              <Link
                href="/research"
                className="inline-flex items-center gap-1.5 text-[var(--accent-pink)] hover:underline text-xs font-semibold transition-colors"
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
                    ? "text-emerald-500"
                    : s.status === "failed"
                    ? "text-rose-500"
                    : "text-amber-500";

                const confPct =
                  s.confidence_score != null
                    ? Math.round(s.confidence_score * 100)
                    : null;

                const confBadgeColor =
                  confPct !== null && confPct >= 75
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
                    : confPct !== null && confPct >= 40
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/25"
                    : "bg-rose-500/10 text-rose-500 border-rose-500/25";

                return (
                  <Link key={s.id} href={`/research?session_id=${s.id}`}>
                    <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--accent-pink)]/40 transition-all duration-200 group shadow-sm">

                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                        <StatusIcon className={`w-5 h-5 ${statusColor}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-pink)] transition-colors">
                          {s.query}
                        </p>
                        <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                          <span className={`text-xs font-extrabold capitalize ${statusColor}`}>
                            {s.status}
                          </span>

                          {confPct !== null && (
                            <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full border ${confBadgeColor}`}>
                              {confPct}% Confidence
                            </span>
                          )}

                          <span className="text-xs text-[var(--text-muted)]">
                            {formatDistanceToNow(new Date(s.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent-pink)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <span>View Report</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
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
