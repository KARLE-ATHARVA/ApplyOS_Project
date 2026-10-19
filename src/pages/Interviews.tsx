import { CalendarDays, ExternalLink, Info } from "lucide-react";
import type { Page } from "../App";
import CompanyAvatar from "../components/CompanyAvatar";
import StatusBadge from "../components/StatusBadge";
import { useApplications } from "../context/useApplications";

export default function Interviews({
  onNavigate,
}: {
  onNavigate: (page: Page) => void;
}) {
  const { applications } = useApplications();
  const interviewApplications = applications
    .filter((application) => application.status === "interview")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header>
        <h1 className="text-[25px] font-semibold tracking-tight text-slate-900">
          Interviews
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Prepare for conversations and keep interview-stage opportunities in
          view.
        </p>
      </header>
      <div
        role="status"
        className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50/70 px-4 py-3.5 text-sky-800"
      >
        <Info size={18} className="mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold">
            Interview scheduling isn’t connected yet
          </p>
          <p className="mt-1 text-xs leading-5 text-sky-700">
            ApplyOS currently tracks application status only. It does not store
            interview dates, times, durations, or calendar events.
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Interview-stage applications
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            These records are marked as Interview in your application pipeline.
          </p>
        </div>
        {interviewApplications.length ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {interviewApplications.map((app) => (
              <article
                key={app.id}
                className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-4 last:border-0 sm:px-5"
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
                <StatusBadge status={app.status} />
                <span className="hidden text-[11px] text-slate-500 sm:block">
                  Added{" "}
                  {new Intl.DateTimeFormat(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(new Date(app.createdAt))}
                </span>
                <a
                  href={app.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${app.company} job posting`}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                >
                  <ExternalLink size={15} />
                </a>
                <button
                  type="button"
                  onClick={() => onNavigate("applications")}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  View applications
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <CalendarDays size={25} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-800">
              No interview-stage applications
            </p>
            <p className="mt-1 text-xs text-slate-500">
              When you update an application to Interview, it will appear here.
            </p>
            <button
              type="button"
              onClick={() => onNavigate("applications")}
              className="mt-4 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Browse applications
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
