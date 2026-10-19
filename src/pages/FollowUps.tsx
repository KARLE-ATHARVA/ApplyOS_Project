import { useMemo, useState } from "react";
import { ArrowRight, CalendarClock, Clock3, Pencil } from "lucide-react";
import AddApplicationModal from "../components/AddApplicationModal";
import CompanyAvatar from "../components/CompanyAvatar";
import { useApplications } from "../context/useApplications";
import type { Application } from "../types/application";

function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

export default function FollowUps() {
  const { applications, updateApplication } = useApplications();
  const [editing, setEditing] = useState<Application | null>(null);
  const today = localToday();
  const lastUpcomingDay = new Date();
  lastUpcomingDay.setDate(lastUpcomingDay.getDate() + 7);
  const lastUpcoming = `${lastUpcomingDay.getFullYear()}-${String(lastUpcomingDay.getMonth() + 1).padStart(2, "0")}-${String(lastUpcomingDay.getDate()).padStart(2, "0")}`;

  const scheduled = useMemo(
    () =>
      applications
        .filter((application) => Boolean(application.followUpDate))
        .sort((a, b) =>
          (a.followUpDate ?? "").localeCompare(b.followUpDate ?? ""),
        ),
    [applications],
  );
  const overdue = scheduled.filter(
    (application) => (application.followUpDate ?? "") < today,
  );
  const dueToday = scheduled.filter(
    (application) => application.followUpDate === today,
  );
  const upcoming = scheduled.filter(
    (application) =>
      (application.followUpDate ?? "") > today &&
      (application.followUpDate ?? "") <= lastUpcoming,
  );

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header>
        <h1 className="text-[25px] font-semibold tracking-tight text-slate-900">
          Follow-ups
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Stay timely and keep promising conversations moving.
        </p>
      </header>

      <section className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-3">
        <Summary
          label="Overdue"
          description="Needs your attention"
          value={overdue.length}
          tone="rose"
        />
        <Summary
          label="Due today"
          description="Actions planned for today"
          value={dueToday.length}
          tone="amber"
        />
        <Summary
          label="Upcoming"
          description="Within the next 7 days"
          value={upcoming.length}
          tone="indigo"
          last
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Needs attention
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Your scheduled next steps, ordered by due date
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
            {scheduled.length} {scheduled.length === 1 ? "item" : "items"}
          </span>
        </div>

        {scheduled.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {scheduled.map((application) => {
              const followUpDate = application.followUpDate ?? "";
              const isOverdue = followUpDate < today;
              const isToday = followUpDate === today;
              return (
                <article
                  key={application.id}
                  className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 last:border-0 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${isOverdue ? "bg-rose-50 text-rose-600" : isToday ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-600"}`}
                  >
                    <Clock3 size={16} />
                  </span>
                  <CompanyAvatar company={application.company} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <p className="text-xs font-semibold text-slate-800">
                        {application.company}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {application.role}
                      </p>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-600">
                      {application.nextAction || "Follow up on application"}
                    </p>
                  </div>
                  <div className="shrink-0 sm:w-28">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Due
                    </p>
                    <p
                      className={`mt-0.5 text-xs font-semibold ${isOverdue ? "text-rose-600" : isToday ? "text-amber-700" : "text-slate-700"}`}
                    >
                      {isOverdue
                        ? `Overdue · ${formatDate(followUpDate)}`
                        : isToday
                          ? "Today"
                          : formatDate(followUpDate)}
                    </p>
                  </div>
                  <a
                    href={application.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View posting <ArrowRight size={14} />
                  </a>
                  <button
                    type="button"
                    onClick={() => setEditing(application)}
                    aria-label={`Edit follow-up for ${application.company}`}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <CalendarClock size={25} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-800">
              No follow-ups scheduled
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Set a follow-up date and next action while adding or editing an
              application.
            </p>
          </div>
        )}
      </section>

      {editing && (
        <AddApplicationModal
          key={editing.id}
          initialApplication={editing}
          onClose={() => setEditing(null)}
          onSave={async (updatedApplication) => {
            await updateApplication(updatedApplication);
            setEditing(null);
          }}
          existingApplications={applications}
        />
      )}
    </div>
  );
}

function Summary({
  label,
  description,
  value,
  tone,
  last = false,
}: {
  label: string;
  description: string;
  value: number;
  tone: "rose" | "amber" | "indigo";
  last?: boolean;
}) {
  const dot: Record<typeof tone, string> = {
    rose: "bg-rose-500",
    amber: "bg-amber-500",
    indigo: "bg-indigo-500",
  };
  return (
    <div
      className={`flex items-center gap-3 px-5 py-4 ${last ? "" : "border-b border-slate-200 sm:border-b-0 sm:border-r"}`}
    >
      <span className={`h-2 w-2 rounded-full ${dot[tone]}`} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-800">
          {value} {label.toLowerCase()}
        </p>
        <p className="mt-0.5 text-[10px] text-slate-500">{description}</p>
      </div>
    </div>
  );
}
