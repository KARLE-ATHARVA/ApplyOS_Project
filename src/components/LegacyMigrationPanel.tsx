import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  LoaderCircle,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import {
  migrateLegacyApplications,
  previewLegacyApplications,
} from "../services/legacy-migration";
import { useApplications } from "../context/useApplications";

export default function LegacyMigrationPanel() {
  const { session } = useAuth();
  const { clearError } = useApplications();

  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);

  function handlePreview() {
    setLoadingPreview(true);
    setPreviewError(null);
    setResultMessage(null);
    setOperationError(null);

    try {
      const result = previewLegacyApplications();

      if (result.error) {
        setPreviewCount(null);
        setPreviewError(result.error);
      } else {
        setPreviewCount(result.applications.length);
      }
    } catch {
      setPreviewCount(null);
      setPreviewError("Unable to preview your local application data.");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleImport() {
    const userId = session?.user.id;

    if (!userId) {
      setOperationError("Please sign in before importing applications.");
      return;
    }

    // Re-read the source immediately before importing, rather than relying
    // on a potentially stale preview.
    const preview = previewLegacyApplications();

    if (preview.error) {
      setOperationError(preview.error);
      return;
    }

    if (preview.applications.length === 0) {
      setResultMessage("There are no local applications to import.");
      return;
    }

    const confirmed = window.confirm(
      `Import ${preview.applications.length} local application(s) into your signed-in ApplyOS account? Existing records will be preserved.`,
    );

    if (!confirmed) return;

    setImporting(true);
    setOperationError(null);
    setResultMessage(null);
    clearError();

    try {
      const result = await migrateLegacyApplications(
        userId,
        preview.applications,
      );

      setResultMessage(
        `Import complete: ${result.imported} imported, ${result.skipped} already present. Your original local data has been preserved. Refresh the page to load the imported records.`,
      );
      setPreviewCount(preview.applications.length);
    } catch (error: unknown) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "The import failed. Your original local data has been preserved.",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Database size={22} aria-hidden="true" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Import existing applications
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Move applications from this browser's local storage into your
            signed-in Supabase account. The original local records will not be
            deleted.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handlePreview}
          disabled={loadingPreview || importing}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingPreview ? "Checking..." : "Preview local records"}
        </button>

        <button
          type="button"
          onClick={handleImport}
          disabled={
            importing ||
            loadingPreview ||
            previewCount === null ||
            previewCount === 0 ||
            Boolean(previewError)
          }
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {importing && (
            <LoaderCircle
              size={16}
              className="animate-spin"
              aria-hidden="true"
            />
          )}
          {importing ? "Importing..." : "Import into Supabase"}
        </button>
      </div>

      {previewCount !== null && !previewError && (
        <p className="mt-4 text-sm text-slate-600">
          Found <strong>{previewCount}</strong> local application(s).
        </p>
      )}

      {previewError && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{previewError}</span>
        </div>
      )}

      {operationError && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{operationError}</span>
        </div>
      )}

      {resultMessage && (
        <div
          role="status"
          className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{resultMessage}</span>
        </div>
      )}

      <p className="mt-4 text-xs leading-5 text-slate-400">
        Only import into the account where you want these records to live.
        Review the preview before importing. Do not clear browser storage after
        migration until you have verified your records in Supabase.
      </p>
    </section>
  );
}
