import { useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Pencil,
} from "lucide-react";

import AddApplicationModal from "../components/AddApplicationModal";
import { useApplications } from "../context/useApplications";
import type { Application } from "../types/application";

type FollowUpGroup = "overdue" | "today" | "upcoming";

function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getGroup(
  followUpDate: string | null | undefined,
  today: string,
): FollowUpGroup | null {
  if (!followUpDate) return null;

  if (followUpDate < today) return "overdue";
  if (followUpDate === today) return "today";

  return "upcoming";
}

const GROUP_CONFIG: Record<
  FollowUpGroup,
  {
    title: string;
    description: string;
    icon: typeof CalendarClock;
    color: string;
  }
> = {
  overdue: {
    title: "Overdue",
    description: "Follow-ups that need your attention",
    icon: Clock3,
    color: "text-red-600",
  },
  today: {
    title: "Due today",
    description: "Actions planned for today",
    icon: CalendarClock,
    color: "text-amber-600",
  },
  upcoming: {
    title: "Upcoming",
    description: "Follow-ups scheduled for later",
    icon: CheckCircle2,
    color: "text-indigo-600",
  },
};

function FollowUpCard({
  application,
  group,
  onEdit,
}: {
  application: Application;
  group: FollowUpGroup;
  onEdit: (application: Application) => void;
}) {
  const config = GROUP_CONFIG[group];
  const Icon = config.icon;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Icon size={21} />
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900">{application.role}</h3>

            <p className="mt-1 text-sm text-slate-600">{application.company}</p>

            <p className={`mt-2 text-sm font-medium ${config.color}`}>
              {application.followUpDate
                ? formatDate(application.followUpDate)
                : "No date set"}
            </p>

            {application.nextAction && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Next action
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {application.nextAction}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <a
            href={application.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Job posting
            <ExternalLink size={14} />
          </a>

          <button
            type="button"
            onClick={() => onEdit(application)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Pencil size={15} />
            Edit
          </button>
        </div>
      </div>
    </article>
  );
}

export default function FollowUps() {
  const { applications, updateApplication } = useApplications();

  const [editingApplication, setEditingApplication] =
    useState<Application | null>(null);

  const today = getLocalDateString();

  const scheduledApplications = applications
    .filter((application) => Boolean(application.followUpDate))
    .sort((a, b) => (a.followUpDate ?? "").localeCompare(b.followUpDate ?? ""));

  const overdue = scheduledApplications.filter(
    (application) => getGroup(application.followUpDate, today) === "overdue",
  );

  const dueToday = scheduledApplications.filter(
    (application) => getGroup(application.followUpDate, today) === "today",
  );

  const upcoming = scheduledApplications.filter(
    (application) => getGroup(application.followUpDate, today) === "upcoming",
  );

  const unscheduledCount = applications.filter(
    (application) => !application.followUpDate,
  ).length;

  const groups: FollowUpGroup[] = ["overdue", "today", "upcoming"];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 p-5 sm:p-8">
      <section>
        <p className="text-sm text-slate-500">
          Stay on top of the next step in your job search.
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Follow-ups
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Review overdue tasks, handle today's actions, and plan ahead.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Overdue</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {overdue.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Due today</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {dueToday.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Upcoming</p>
          <p className="mt-2 text-2xl font-bold text-indigo-600">
            {upcoming.length}
          </p>
        </div>
      </section>

      {applications.length === 0 ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <CalendarClock size={28} className="mx-auto text-slate-400" />
          <h2 className="mt-4 font-semibold text-slate-900">
            No applications to follow up on yet
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Add an application and set a follow-up date to see it here.
          </p>
        </section>
      ) : (
        <>
          {groups.map((group) => {
            const config = GROUP_CONFIG[group];
            const items =
              group === "overdue"
                ? overdue
                : group === "today"
                  ? dueToday
                  : upcoming;

            return (
              <section key={group} className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {config.title}
                    <span className="ml-2 text-sm font-medium text-slate-400">
                      {items.length}
                    </span>
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {config.description}
                  </p>
                </div>

                {items.length > 0 ? (
                  <div className="space-y-3">
                    {items.map((application) => (
                      <FollowUpCard
                        key={application.id}
                        application={application}
                        group={group}
                        onEdit={setEditingApplication}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-6 text-sm text-slate-500">
                    Nothing in this category.
                  </div>
                )}
              </section>
            );
          })}

          {unscheduledCount > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">
                Applications without a follow-up date
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {unscheduledCount}{" "}
                {unscheduledCount === 1
                  ? "application has"
                  : "applications have"}{" "}
                no follow-up date. Edit an application to schedule its next
                action.
              </p>
            </section>
          )}
        </>
      )}

      {editingApplication && (
        <AddApplicationModal
          key={editingApplication.id}
          initialApplication={editingApplication}
          onClose={() => setEditingApplication(null)}
          existingApplications={applications}
          onSave={async (application) => {
            await updateApplication(application);
            setEditingApplication(null);
          }}
        />
      )}
    </div>
  );
}
