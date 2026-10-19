import { useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Gift,
  Target,
} from "lucide-react";
import type { Page } from "../App";
import { useAuth } from "../context/useAuth";
import { useApplications } from "../context/useApplications";
import CompanyAvatar from "../components/CompanyAvatar";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";

const DAILY_TARGET_KEY = "applyos-daily-target";
function readDailyTarget(): number {
  try {
    const value = Number(localStorage.getItem(DAILY_TARGET_KEY) ?? 5);
    return Number.isInteger(value) && value >= 1 && value <= 100 ? value : 5;
  } catch {
    return 5;
  }
}
function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
      }).format(date);
}
function dateInputToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function Dashboard({
  onAddApplication,
  onNavigate,
}: {
  onAddApplication: () => void;
  onNavigate: (page: Page) => void;
}) {
  const { applications } = useApplications();
  const { session } = useAuth();
  const [dailyTarget, setDailyTarget] = useState(readDailyTarget);
  const today = dateInputToday();
  const appliedToday = applications.filter(
    (app) => app.appliedAt?.slice(0, 10) === today,
  ).length;
  const inProgress = applications.filter((app) =>
    ["saved", "applied", "under_review", "assessment"].includes(app.status),
  ).length;
  const interviewCount = applications.filter(
    (app) => app.status === "interview",
  ).length;
  const offerCount = applications.filter(
    (app) => app.status === "offer",
  ).length;
  const progress = Math.min((appliedToday / dailyTarget) * 100, 100);
  const firstName =
    typeof session?.user.user_metadata?.full_name === "string"
      ? session.user.user_metadata.full_name.split(" ")[0]
      : "";
  const greeting = firstName ? `Good to see you, ${firstName}` : "Welcome back";
  const recent = [...applications]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  const upcoming = [...applications]
    .filter((app) => app.followUpDate && app.followUpDate >= today)
    .sort((a, b) => (a.followUpDate ?? "").localeCompare(b.followUpDate ?? ""))
    .slice(0, 4);

  function saveTarget(value: number) {
    if (!Number.isInteger(value) || value < 1 || value > 100) return;
    setDailyTarget(value);
    try {
      localStorage.setItem(DAILY_TARGET_KEY, String(value));
    } catch (error) {
      console.error("Unable to save daily target:", error);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[25px] font-semibold tracking-tight text-slate-900">
            {greeting}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Here’s what needs your attention in your job search.
          </p>
        </div>
        <p className="pb-1 text-xs font-medium text-slate-500">
          {new Intl.DateTimeFormat(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          }).format(new Date())}
        </p>
      </section>

      <section
        aria-label="Application summary"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          title="Total applications"
          value={applications.length}
          description="Across your job search"
          icon={BriefcaseBusiness}
        />
        <StatCard
          title="In progress"
          value={inProgress}
          description="Active pipeline"
          icon={Clock3}
        />
        <StatCard
          title="Interviews"
          value={interviewCount}
          description="Applications at interview stage"
          icon={CalendarClock}
        />
        <StatCard
          title="Offers"
          value={offerCount}
          description="Offers recorded"
          icon={Gift}
        />
      </section>

      <section className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 to-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-600">
            <Target size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-indigo-600">
                  Today’s Apply Sprint
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {appliedToday} of {dailyTarget} applications marked as applied
                  today
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  Daily goal
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={dailyTarget}
                    onChange={(event) =>
                      saveTarget(event.currentTarget.valueAsNumber)
                    }
                    aria-label="Daily application goal"
                    className="w-16 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <span className="text-sm font-bold text-indigo-600">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Progress counts applications recorded as applied today.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,0.9fr)]">
        <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Recent applications
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Your latest application activity
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("applications")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View all <ArrowRight size={14} />
            </button>
          </header>
          {recent.length ? (
            <div className="divide-y divide-slate-100">
              {recent.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center gap-3 px-5 py-3.5"
                >
                  <CompanyAvatar company={app.company} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {app.company}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {app.role}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <StatusBadge status={app.status} />
                  </div>
                  <span className="w-14 text-right text-[11px] text-slate-500">
                    {formatDate(app.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <BriefcaseBusiness className="mx-auto text-slate-300" size={24} />
              <p className="mt-3 text-sm font-medium text-slate-700">
                No applications yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Add a job posting to start your tracker.
              </p>
              <button
                type="button"
                onClick={onAddApplication}
                className="mt-4 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Add application
              </button>
            </div>
          )}
        </article>
        <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Upcoming follow-ups
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Based on your scheduled next steps
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("follow-ups")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View all <ArrowRight size={14} />
            </button>
          </header>
          {upcoming.length ? (
            <div className="divide-y divide-slate-100">
              {upcoming.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center gap-3 px-5 py-3.5"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${app.followUpDate === today ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-600"}`}
                  >
                    <CalendarClock size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {app.company}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {app.nextAction || app.role}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-semibold ${app.followUpDate === today ? "text-rose-600" : "text-slate-500"}`}
                  >
                    {app.followUpDate === today
                      ? "Today"
                      : formatDate(app.followUpDate ?? "")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <CheckCircle2 className="mx-auto text-slate-300" size={24} />
              <p className="mt-3 text-sm font-medium text-slate-700">
                Nothing scheduled
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Add follow-up dates to applications to see them here.
              </p>
            </div>
          )}
        </article>
      </section>
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Keep your search moving
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Save a posting and keep your pipeline up to date.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddApplication}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <BriefcaseBusiness size={15} />
          Add an opportunity
        </button>
      </section>
    </div>
  );
}
