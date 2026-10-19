import type { ApplicationStatus } from "../types/application";

const LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  under_review: "Under review",
  assessment: "Assessment",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

const COLORS: Record<ApplicationStatus, string> = {
  saved: "bg-slate-100 text-slate-700",
  applied: "bg-blue-50 text-blue-700",
  under_review: "bg-violet-50 text-violet-700",
  assessment: "bg-amber-50 text-amber-800",
  interview: "bg-cyan-50 text-cyan-800",
  offer: "bg-emerald-50 text-emerald-800",
  rejected: "bg-rose-50 text-rose-800",
};

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${COLORS[status]}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-current"
        aria-hidden="true"
      />
      {LABELS[status]}
    </span>
  );
}
