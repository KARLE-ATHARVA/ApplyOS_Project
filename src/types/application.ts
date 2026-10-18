export type ApplicationStatus =
  | "saved"
  | "applied"
  | "under_review"
  | "assessment"
  | "interview"
  | "offer"
  | "rejected";

export interface Application {
  id: string;
  company: string;
  role: string;
  jobUrl: string;
  status: ApplicationStatus;
  createdAt: string;
  appliedAt: string | null;

  // Details extracted from the job posting.
  location?: string | null;
  description?: string | null;
  employmentType?: string | null;

  // Follow-up tracking.
  followUpDate?: string | null;
  nextAction?: string | null;
}