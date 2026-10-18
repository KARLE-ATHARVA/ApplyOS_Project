
import { useRef, useState } from "react";
import {
  X,
  LoaderCircle,
  Search,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { Application } from "../types/application";
import {
  extractJobFromUrl,
  type ExtractedJob,
} from "../services/job-extraction";

interface AddApplicationModalProps {
  onClose: () => void;
  onSave: (application: Application) => Promise<void>;
  existingApplications: Application[];
  initialApplication?: Application;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeJobUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return value.trim();
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function AddApplicationModal({
  onClose,
  onSave,
  existingApplications,
  initialApplication,
}: AddApplicationModalProps) {
  const isEditing = Boolean(initialApplication);

  const [jobUrl, setJobUrl] = useState(initialApplication?.jobUrl ?? "");
  const [company, setCompany] = useState(initialApplication?.company ?? "");
  const [role, setRole] = useState(initialApplication?.role ?? "");
  const [location, setLocation] = useState(initialApplication?.location ?? "");
  const [employmentType, setEmploymentType] = useState(
    initialApplication?.employmentType ?? "",
  );
  const [description, setDescription] = useState(
    initialApplication?.description ?? "",
  );
  const [followUpDate, setFollowUpDate] = useState(
    initialApplication?.followUpDate ?? "",
  );
  const [nextAction, setNextAction] = useState(
    initialApplication?.nextAction ?? "",
  );

  const [extractedJob, setExtractedJob] = useState<ExtractedJob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractionError, setExtractionError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const saveInProgress = useRef(false);

  async function handleAnalyzeUrl() {
    setExtractionError("");
    setFormError("");

    const trimmedUrl = jobUrl.trim();

    if (!isValidHttpUrl(trimmedUrl)) {
      setExtractionError(
        "Enter a valid job posting URL beginning with http:// or https://.",
      );
      return;
    }

    setIsAnalyzing(true);

    try {
      const result = await extractJobFromUrl(trimmedUrl);

      setExtractedJob(result);
      setRole(result.title ?? "");
      setCompany(result.company ?? "");
      setLocation(result.location ?? "");
      setDescription(result.description ?? "");
      setEmploymentType(result.employment_type ?? "");
      setJobUrl(result.url || trimmedUrl);
    } catch (error: unknown) {
      setExtractionError(
        getErrorMessage(
          error,
          "Unable to analyze this job posting. Please try again.",
        ),
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saveInProgress.current) return;

    setFormError("");

    const trimmedUrl = jobUrl.trim();
    const trimmedCompany = company.trim();
    const trimmedRole = role.trim();

    if (!trimmedCompany || !trimmedRole || !trimmedUrl) {
      setFormError("Company, role, and job URL are required.");
      return;
    }

    if (!isValidHttpUrl(trimmedUrl)) {
      setFormError("Enter a valid HTTP or HTTPS job URL.");
      return;
    }

    const normalizedUrl = normalizeJobUrl(trimmedUrl);

    const duplicate = existingApplications.find(
      (existing) =>
        existing.id !== initialApplication?.id &&
        normalizeJobUrl(existing.jobUrl) === normalizedUrl,
    );

    if (
      duplicate &&
      !window.confirm(
        `This job link is already saved for ${duplicate.role} at ${duplicate.company}. Do you want to add it again anyway?`,
      )
    ) {
      return;
    }

    const application: Application = {
      id: initialApplication?.id ?? crypto.randomUUID(),
      company: trimmedCompany,
      role: trimmedRole,
      jobUrl: trimmedUrl,
      status: initialApplication?.status ?? "saved",
      createdAt: initialApplication?.createdAt ?? new Date().toISOString(),
      appliedAt: initialApplication?.appliedAt ?? null,
      location: location.trim() || null,
      description: description.trim() || null,
      employmentType: employmentType.trim() || null,
      followUpDate: followUpDate || null,
      nextAction: nextAction.trim() || null,
    };

    saveInProgress.current = true;
    setIsSaving(true);

    try {
      await onSave(application);
      onClose();
    } catch (error: unknown) {
      setFormError(
        getErrorMessage(
          error,
          "Unable to save this application. Please check your connection and try again.",
        ),
      );
    } finally {
      saveInProgress.current = false;
      setIsSaving(false);
    }
  }

  const missingFields = extractedJob?.missing_fields ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isAnalyzing &&
          !isSaving
        ) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-modal-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-700">
          <div>
            <h2
              id="application-modal-title"
              className="text-xl font-semibold text-slate-900 dark:text-white"
            >
              {isEditing ? "Edit Application" : "Add Application"}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Analyze a job URL, review the details, and save it.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isAnalyzing || isSaving}
            aria-label="Close modal"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </header>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="flex min-h-0 flex-col"
        >
          <div className="space-y-5 overflow-y-auto px-6 py-5">
            <div>
              <label
                htmlFor="job-url"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Job posting URL <span className="text-red-500">*</span>
              </label>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="job-url"
                  type="url"
                  value={jobUrl}
                  onChange={(event) => {
                    setJobUrl(event.target.value);
                    setExtractionError("");
                    setExtractedJob(null);
                  }}
                  placeholder="https://careers.company.com/jobs/..."
                  required
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />

                <button
                  type="button"
                  onClick={() => void handleAnalyzeUrl()}
                  disabled={isAnalyzing || isSaving || !jobUrl.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAnalyzing ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <Search size={17} />
                  )}
                  {isAnalyzing ? "Analyzing..." : "Analyze URL"}
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                ApplyOS extracts available job details. Review them before
                saving.
              </p>
            </div>

            {extractionError && (
              <div
                role="alert"
                className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{extractionError}</span>
              </div>
            )}

            {extractedJob && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="flex items-start gap-2">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  />
                  <div>
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                      Extraction completed — review the fields below
                    </p>
                    <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                      Source: {extractedJob.extraction_source ?? "Unknown"}
                    </p>

                    {missingFields.length > 0 && (
                      <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
                        Some details were unavailable:{" "}
                        {missingFields.join(", ")}. You can fill them in
                        manually.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="company"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Company <span className="text-red-500">*</span>
                </label>
                <input
                  id="company"
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  placeholder="Company name"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Job title <span className="text-red-500">*</span>
                </label>
                <input
                  id="role"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  placeholder="Software Engineer Intern"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Location
                </label>
                <input
                  id="location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Remote, Seattle, etc."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="employment-type"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Employment type
                </label>
                <input
                  id="employment-type"
                  value={employmentType}
                  onChange={(event) => setEmploymentType(event.target.value)}
                  placeholder="Internship, Full-time, etc."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                Follow-up
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="follow-up-date"
                    className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Follow-up date
                  </label>
                  <input
                    id="follow-up-date"
                    type="date"
                    value={followUpDate}
                    onChange={(event) => setFollowUpDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="next-action"
                    className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Next action
                  </label>
                  <input
                    id="next-action"
                    type="text"
                    value={nextAction}
                    onChange={(event) => setNextAction(event.target.value)}
                    placeholder="e.g. Check application status"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Job description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Extracted job description will appear here. You can edit it."
                rows={5}
                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {formError && (
              <div
                role="alert"
                className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
          </div>

          <footer className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              onClick={onClose}
              disabled={isAnalyzing || isSaving}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isAnalyzing || isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving && <LoaderCircle size={16} className="animate-spin" />}
              {isSaving
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Save Application"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
