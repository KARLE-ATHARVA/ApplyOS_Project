import { useState } from "react";
import { BriefcaseBusiness, CheckCircle2, Clock3, Target } from "lucide-react";

import StatCard from "../components/StatCard";
import AddApplicationModal from "../components/AddApplicationModal";
import { useApplications } from "../context/useApplications";

const DAILY_TARGET_KEY = "applyos-daily-target";

function readDailyTarget(): number {
  try {
    const saved = localStorage.getItem(DAILY_TARGET_KEY);
    const target = saved === null ? 5 : Number(saved);

    return Number.isInteger(target) && target >= 1 && target <= 100
      ? target
      : 5;
  } catch {
    return 5;
  }
}

export default function Dashboard() {
  const { applications, addApplication } = useApplications();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [dailyTarget, setDailyTarget] = useState(readDailyTarget);

  const appliedToday = applications.filter((application) => {
    if (!application.appliedAt) {
      return false;
    }

    const appliedDate = new Date(application.appliedAt);
    const now = new Date();

    return (
      !Number.isNaN(appliedDate.getTime()) &&
      appliedDate.getFullYear() === now.getFullYear() &&
      appliedDate.getMonth() === now.getMonth() &&
      appliedDate.getDate() === now.getDate()
    );
  }).length;

  const interviewCount = applications.filter(
    (application) => application.status === "interview",
  ).length;

  const progress = Math.min((appliedToday / dailyTarget) * 100, 100);

  function updateDailyTarget(value: number) {
    if (!Number.isInteger(value) || value < 1 || value > 100) {
      return;
    }

    setDailyTarget(value);

    try {
      localStorage.setItem(DAILY_TARGET_KEY, String(value));
    } catch (error) {
      console.error("Unable to save daily target:", error);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-5 sm:p-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-500">Your job search, simplified.</p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Welcome to ApplyOS
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Spend less time tracking and more time applying.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          + Add application
        </button>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Applications"
          value={applications.length}
          description="Total tracked opportunities"
          icon={BriefcaseBusiness}
        />

        <StatCard
          title="Applied today"
          value={`${appliedToday} / ${dailyTarget}`}
          description="Your daily application goal"
          icon={Target}
        />

        <StatCard
          title="Interviews"
          value={interviewCount}
          description="Applications at interview stage"
          icon={CheckCircle2}
        />

        <StatCard
          title="Follow-ups"
          value={0}
          description="No follow-up records configured yet"
          icon={Clock3}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-6 xl:col-span-2">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Apply Sprint
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Build momentum, one application at a time.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Daily target</span>

              <input
                type="number"
                min={1}
                max={100}
                step={1}
                value={dailyTarget}
                aria-label="Daily application target"
                onChange={(event) => {
                  updateDailyTarget(event.currentTarget.valueAsNumber);
                }}
                className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          </div>

          <div className="mt-8">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-bold text-slate-900">
                  {appliedToday}
                  <span className="text-lg font-medium text-slate-400">
                    {" "}
                    / {dailyTarget}
                  </span>
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Applications submitted today
                </p>
              </div>

              <p className="text-sm font-semibold text-indigo-600">
                {Math.round(progress)}%
              </p>
            </div>

            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-label="Daily application goal progress"
              aria-valuemin={0}
              aria-valuemax={dailyTarget}
              aria-valuenow={Math.min(appliedToday, dailyTarget)}
            >
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="mt-3 text-sm text-slate-500" aria-live="polite">
              {appliedToday >= dailyTarget
                ? "Daily target reached. Great work!"
                : `${dailyTarget - appliedToday} more ${
                    dailyTarget - appliedToday === 1
                      ? "application"
                      : "applications"
                  } to reach your target.`}
            </p>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Quick actions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Keep your job search moving.
          </p>

          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="w-full rounded-lg bg-slate-50 p-4 text-left transition hover:bg-indigo-50"
            >
              <p className="text-sm font-medium text-slate-800">
                Find your next opportunity
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Save a job posting to your queue.
              </p>
            </button>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-800">
                Review your applications
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Keep statuses up to date with minimal effort.
              </p>
            </div>
          </div>
        </article>
      </section>

      {isAddModalOpen && (
        <AddApplicationModal
          onClose={() => setIsAddModalOpen(false)}
          onSave={addApplication}
          existingApplications={applications}
        />
      )}
    </div>
  );
}
