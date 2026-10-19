import { useMemo, useState } from "react";
import { BarChart3, BriefcaseBusiness, Gift, TrendingUp } from "lucide-react";
import StatCard from "../components/StatCard";
import { useApplications } from "../context/useApplications";
import type { ApplicationStatus } from "../types/application";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  under_review: "Under review",
  assessment: "Assessment",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};
const COLORS: Record<ApplicationStatus, string> = {
  saved: "bg-slate-400",
  applied: "bg-blue-500",
  under_review: "bg-violet-500",
  assessment: "bg-amber-500",
  interview: "bg-cyan-500",
  offer: "bg-emerald-500",
  rejected: "bg-rose-500",
};
const DAYS: Record<string, number> = { "30": 30, "90": 90, all: Infinity };

export default function Analytics() {
  const { applications } = useApplications();
  const [period, setPeriod] = useState("30");
  const [now] = useState(() => Date.now());
  const cutoff = Number.isFinite(DAYS[period])
    ? now - DAYS[period] * 86_400_000
    : 0;
  const periodApplications = applications.filter(
    (app) => new Date(app.createdAt).getTime() >= cutoff,
  );
  const active = applications.filter((app) =>
    ["saved", "applied", "under_review", "assessment"].includes(app.status),
  ).length;
  const interviews = applications.filter(
    (app) => app.status === "interview",
  ).length;
  const offers = applications.filter((app) => app.status === "offer").length;

  const weekly = useMemo(() => {
    const now = new Date();
    const currentMonday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    currentMonday.setDate(
      currentMonday.getDate() - ((currentMonday.getDay() + 6) % 7),
    );
    return Array.from({ length: 6 }, (_, index) => {
      const start = new Date(currentMonday);
      start.setDate(start.getDate() - (5 - index) * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const count = applications.filter((app) => {
        const created = new Date(app.createdAt);
        return created >= start && created < end;
      }).length;
      return {
        label: new Intl.DateTimeFormat(undefined, {
          month: "short",
          day: "numeric",
        }).format(start),
        count,
      };
    });
  }, [applications]);
  const maxCount = Math.max(1, ...weekly.map((item) => item.count));
  const byStatus = (Object.keys(STATUS_LABELS) as ApplicationStatus[])
    .map((status) => ({
      status,
      count: applications.filter((app) => app.status === status).length,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[25px] font-semibold tracking-tight text-slate-900">
            Analytics
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Understand your activity and the shape of your application pipeline.
          </p>
        </div>
        <label className="text-xs text-slate-500">
          Date range{" "}
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="ml-2 h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700"
          >
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </label>
      </header>
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Applications added"
          value={periodApplications.length}
          description={
            period === "all"
              ? "All recorded applications"
              : `In the last ${DAYS[period]} days`
          }
          icon={BriefcaseBusiness}
        />
        <StatCard
          title="Active pipeline"
          value={active}
          description="Saved through assessment"
          icon={TrendingUp}
        />
        <StatCard
          title="Interviews"
          value={interviews}
          description="Marked Interview"
          icon={BarChart3}
        />
        <StatCard
          title="Offers"
          value={offers}
          description="Marked Offer"
          icon={Gift}
        />
      </section>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.9fr)]">
        <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <header className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Application activity
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Applications added by week over the last six weeks
            </p>
          </header>
          {applications.length ? (
            <div className="px-5 py-6">
              <div
                className="flex h-52 items-end justify-around gap-3 border-b border-l border-slate-200 px-2 pb-0 pt-3"
                role="img"
                aria-label={`Weekly application counts: ${weekly.map((item) => `${item.label}, ${item.count}`).join("; ")}`}
              >
                <div
                  className="pointer-events-none absolute"
                  aria-hidden="true"
                />
                {weekly.map((item) => (
                  <div
                    key={item.label}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-[10px] text-slate-500">
                      {item.count || ""}
                    </span>
                    <div
                      className="w-full max-w-12 rounded-t-md bg-indigo-500 transition-all"
                      style={{
                        height: `${Math.max(item.count ? 8 : 2, (item.count / maxCount) * 72)}%`,
                      }}
                    />
                    <span className="-mb-5 mt-2 text-[9px] text-slate-500">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="h-6" />
            </div>
          ) : (
            <EmptyState />
          )}
        </article>
        <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <header className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Applications by status
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Current pipeline distribution
            </p>
          </header>
          {byStatus.length ? (
            <div className="space-y-4 p-5">
              {byStatus.map(({ status, count }) => (
                <div key={status}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-600">
                      <i className={`h-2 w-2 rounded-full ${COLORS[status]}`} />
                      {STATUS_LABELS[status]}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {count}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${COLORS[status]}`}
                      style={{
                        width: `${applications.length ? (count / applications.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </article>
      </section>
      <p className="text-[11px] text-slate-400">
        Analytics use only the application records currently stored in your
        ApplyOS account.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-5 py-14 text-center">
      <BarChart3 size={24} className="mx-auto text-slate-300" />
      <p className="mt-3 text-sm font-semibold text-slate-800">
        Not enough data yet
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Add applications to see your pipeline trends.
      </p>
    </div>
  );
}
