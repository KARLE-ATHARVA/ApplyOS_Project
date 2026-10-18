import { useState } from "react";
import {
  BriefcaseBusiness,
  ExternalLink,
  CheckCircle2,
  Clock3,
  Search,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import { useApplications } from "../context/useApplications";
import AddApplicationModal from "../components/AddApplicationModal";
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

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  saved: "bg-slate-100 text-slate-700",
  applied: "bg-blue-50 text-blue-700",
  under_review: "bg-violet-50 text-violet-700",
  assessment: "bg-amber-50 text-amber-700",
  interview: "bg-indigo-50 text-indigo-700",
  offer: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

function formatDate(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function ApplicationRow({
  application,
  onMarkApplied,
  onUpdateStatus,
  onEdit,
  onDelete,
}: {
  application: Application;
  onMarkApplied: (id: string) => void;
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
  onEdit: (application: Application) => void;
  onDelete: (application: Application) => void;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <BriefcaseBusiness size={21} />
          </div>

          <div className="min-w-0">
            <h2 className="font-semibold text-slate-900">{application.role}</h2>

            <p className="mt-1 text-sm text-slate-600">{application.company}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={14} />
                Added {formatDate(application.createdAt)}
              </span>

              {application.appliedAt && (
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  Applied {formatDate(application.appliedAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        <span
          className={`inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[application.status]}`}
        >
          {STATUS_LABELS[application.status]}
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <a
            href={application.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            View job posting
            <ExternalLink size={15} />
          </a>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Status</span>

            <select
              value={application.status}
              onChange={(event) =>
                onUpdateStatus(
                  application.id,
                  event.target.value as ApplicationStatus,
                )
              }
              aria-label={`Status for ${application.company} - ${application.role}`}
              className="max-w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {application.status === "saved" && (
            <button
              type="button"
              onClick={() => onMarkApplied(application.id)}
              className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Mark as applied
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(application)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Pencil size={15} />
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(application)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Applications() {
  const {
    applications,
    markAsApplied,
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
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredApplications = applications.filter((application) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      application.company.toLowerCase().includes(query) ||
      application.role.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all" || application.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedApplications = [...filteredApplications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const submittedCount = applications.filter(
    (application) => application.appliedAt !== null,
  ).length;

  function openDeleteDialog(application: Application) {
    setDeleteError(null);
    setApplicationToDelete(application);
  }

  function closeDeleteDialog() {
    if (isDeleting) return;

    setDeleteError(null);
    setApplicationToDelete(null);
  }

  async function confirmDelete() {
    if (!applicationToDelete || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteApplication(applicationToDelete.id);
      setApplicationToDelete(null);
    } catch (error: unknown) {
      setDeleteError(
        getErrorMessage(
          error,
          "Unable to delete this opportunity. Please try again.",
        ),
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 p-5 sm:p-8">
      <section>
        <p className="text-sm text-slate-500">
          Your opportunities, all in one place.
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Applications
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Review, edit, and manage your job opportunities.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total opportunities</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {applications.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Saved to apply</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {applications.filter((app) => app.status === "saved").length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Submitted</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {submittedCount}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search company or job title..."
            aria-label="Search applications"
            className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter applications by status"
          className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="all">All statuses</option>

          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </section>

      <section className="space-y-4">
        {sortedApplications.length > 0 ? (
          sortedApplications.map((application) => (
            <ApplicationRow
              key={application.id}
              application={application}
              onMarkApplied={markAsApplied}
              onUpdateStatus={updateApplicationStatus}
              onEdit={setEditingApplication}
              onDelete={openDeleteDialog}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <BriefcaseBusiness size={23} />
            </div>

            <h2 className="mt-4 font-semibold text-slate-900">
              {applications.length === 0
                ? "No applications yet"
                : "No matching applications"}
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              {applications.length === 0
                ? "Add a job posting from your dashboard to start building your application queue."
                : "Try another search term or change the status filter."}
            </p>
          </div>
        )}
      </section>

      <p className="text-xs text-slate-400">
        Showing {sortedApplications.length} of {applications.length}{" "}
        opportunities.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-application-title"
            aria-describedby="delete-application-description"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 size={20} />
              </div>

              <div>
                <h2
                  id="delete-application-title"
                  className="font-semibold text-slate-900"
                >
                  Delete this opportunity?
                </h2>

                <p
                  id="delete-application-description"
                  className="mt-2 text-sm leading-6 text-slate-500"
                >
                  This will permanently remove{" "}
                  <span className="font-medium text-slate-700">
                    {applicationToDelete.role} at {applicationToDelete.company}
                  </span>{" "}
                  from your ApplyOS tracker. This action cannot be undone.
                </p>
              </div>
            </div>

            {deleteError && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
              >
                <p className="font-semibold">Deletion failed</p>
                <p className="mt-1 break-words">{deleteError}</p>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={16} />
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete opportunity"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
