import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { useApplications } from "../context/useApplications";
import AddApplicationModal from "../components/AddApplicationModal";
import CompanyAvatar from "../components/CompanyAvatar";
import StatusBadge from "../components/StatusBadge";
import type { Application, ApplicationStatus } from "../types/application";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  under_review: "Under review",
  assessment: "Assessment",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};
function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
}

export default function Applications() {
  const {
    applications,
    updateApplicationStatus,
    updateApplication,
    deleteApplication,
  } = useApplications();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingApplication, setEditingApplication] =
    useState<Application | null>(null);
  const [applicationToDelete, setApplicationToDelete] =
    useState<Application | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [actionError, setActionError] = useState("");

  const filtered = useMemo(
    () =>
      applications
        .filter((app) => {
          const term = search.trim().toLowerCase();
          const matchesTerm =
            !term ||
            [
              app.company,
              app.role,
              app.location ?? "",
              app.nextAction ?? "",
            ].some((value) => value.toLowerCase().includes(term));
          return (
            matchesTerm &&
            (statusFilter === "all" || app.status === statusFilter)
          );
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [applications, search, statusFilter],
  );

  async function changeStatus(id: string, status: ApplicationStatus) {
    setActionError("");
    try {
      await updateApplicationStatus(id, status);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not update status.",
      );
    }
  }
  async function confirmDelete() {
    if (!applicationToDelete || isDeleting) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      await deleteApplication(applicationToDelete.id);
      setApplicationToDelete(null);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Could not delete this application.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[25px] font-semibold tracking-tight text-slate-900">
            Applications
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Review and manage your opportunities in one place.
          </p>
        </div>
        <span className="text-xs font-medium text-slate-500">
          {applications.length}{" "}
          {applications.length === 1 ? "application" : "applications"}
        </span>
      </header>

      <section className="flex flex-col gap-3 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search company, role, location..."
            aria-label="Search applications"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter applications by status"
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="all">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </section>
      {actionError && (
        <p
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {actionError}
        </p>
      )}

      {filtered.length === 0 ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <BriefcaseBusiness size={25} className="mx-auto text-slate-300" />
          <h2 className="mt-3 text-sm font-semibold text-slate-800">
            {applications.length
              ? "No matching applications"
              : "No applications yet"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {applications.length
              ? "Try changing your search or status filter."
              : "Use Add application to save your first opportunity."}
          </p>
        </section>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead className="bg-slate-50/80">
                  <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                    <th className="px-5 py-3">Company & role</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date added</th>
                    <th className="px-4 py-3">Next action</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((app) => (
                    <tr
                      key={app.id}
                      className="transition hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <CompanyAvatar company={app.company} size="sm" />
                          <div className="min-w-0">
                            <p className="max-w-64 truncate text-xs font-semibold text-slate-800">
                              {app.company}
                            </p>
                            <p className="mt-0.5 max-w-64 truncate text-[11px] text-slate-500">
                              {app.role}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-40 truncate px-4 py-3.5 text-xs text-slate-600">
                        {app.location || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <select
                          value={app.status}
                          onChange={(event) =>
                            void changeStatus(
                              app.id,
                              event.target.value as ApplicationStatus,
                            )
                          }
                          aria-label={`Status for ${app.company}, ${app.role}`}
                          className="sr-only"
                        />
                        <StatusBadge status={app.status} />
                        <button
                          type="button"
                          onClick={() => setEditingApplication(app)}
                          className="ml-2 text-[10px] font-medium text-indigo-600 hover:underline"
                        >
                          Change
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500">
                        {formatDate(app.createdAt)}
                      </td>
                      <td className="max-w-48 truncate px-4 py-3.5 text-xs text-slate-500">
                        {app.nextAction || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-1">
                          <a
                            href={app.jobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${app.company} job posting`}
                            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                          >
                            <ExternalLink size={15} />
                          </a>
                          <button
                            type="button"
                            onClick={() => setEditingApplication(app)}
                            aria-label={`Edit ${app.company} application`}
                            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError("");
                              setApplicationToDelete(app);
                            }}
                            aria-label={`Delete ${app.company} application`}
                            className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <MoreHorizontal size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="space-y-3 md:hidden">
            {filtered.map((app) => (
              <article
                key={app.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <CompanyAvatar company={app.company} size="sm" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold text-slate-800">
                      {app.company}
                    </h2>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {app.role}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge status={app.status} />
                      <span className="text-[11px] text-slate-500">
                        {formatDate(app.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
                  <p className="truncate text-slate-500">
                    {app.location || "Location not set"}
                  </p>
                  <p className="truncate text-right text-slate-500">
                    {app.nextAction || "No next action"}
                  </p>
                </div>
                <div className="mt-3 flex gap-2">
                  <select
                    value={app.status}
                    onChange={(event) =>
                      void changeStatus(
                        app.id,
                        event.target.value as ApplicationStatus,
                      )
                    }
                    aria-label={`Status for ${app.company}, ${app.role}`}
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs"
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setEditingApplication(app)}
                    className="rounded-lg border border-slate-200 px-3 text-slate-600"
                    aria-label="Edit application"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError("");
                      setApplicationToDelete(app);
                    }}
                    className="rounded-lg border border-rose-100 px-3 text-rose-600"
                    aria-label="Delete application"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      <p className="text-[11px] text-slate-400">
        Showing {filtered.length} of {applications.length} applications
      </p>

      {editingApplication && (
        <AddApplicationModal
          key={editingApplication.id}
          initialApplication={editingApplication}
          onClose={() => setEditingApplication(null)}
          onSave={updateApplication}
          existingApplications={applications}
        />
      )}
      {applicationToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/35 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <h2 id="delete-title" className="font-semibold text-slate-900">
              Delete this application?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              This will permanently remove{" "}
              <strong>
                {applicationToDelete.role} at {applicationToDelete.company}
              </strong>
              .
            </p>
            {deleteError && (
              <p
                role="alert"
                className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
              >
                {deleteError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setApplicationToDelete(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void confirmDelete()}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting…" : "Delete application"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
