import type { Application } from "../types/application";
import { STORAGE_KEY } from "../context/application-context";
import { supabase } from "../lib/supabase";

export interface MigrationPreview {
  applications: Application[];
  error: string | null;
}

export interface MigrationResult {
  imported: number;
  skipped: number;
}

function isApplication(value: unknown): value is Application {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<Application>;

  return (
    typeof item.id === "string" &&
    typeof item.company === "string" &&
    typeof item.role === "string" &&
    typeof item.jobUrl === "string" &&
    typeof item.createdAt === "string" &&
    (item.appliedAt === null || typeof item.appliedAt === "string") &&
    [
      "saved",
      "applied",
      "under_review",
      "assessment",
      "interview",
      "offer",
      "rejected",
    ].includes(item.status ?? "")
  );
}

export function previewLegacyApplications(): MigrationPreview {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return { applications: [], error: null };
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return {
        applications: [],
        error: "The saved local application data is not a valid list.",
      };
    }

    const invalidCount = parsed.filter((item) => !isApplication(item)).length;

    if (invalidCount > 0) {
      return {
        applications: [],
        error: `${invalidCount} record(s) have an unexpected format. No records were imported. Your original data is unchanged.`,
      };
    }

    return {
      applications: parsed as Application[],
      error: null,
    };
  } catch {
    return {
      applications: [],
      error:
        "Unable to read the local application data. No records were imported.",
    };
  }
}

function toDatabaseRow(application: Application, userId: string) {
  return {
    id: application.id,
    user_id: userId,
    company: application.company,
    role: application.role,
    job_url: application.jobUrl,
    status: application.status,
    created_at: application.createdAt,
    applied_at: application.appliedAt,
    location: application.location ?? null,
    description: application.description ?? null,
    employment_type: application.employmentType ?? null,
    follow_up_date: application.followUpDate ?? null,
    next_action: application.nextAction ?? null,
  };
}

export async function migrateLegacyApplications(
  userId: string,
  applications: Application[],
): Promise<MigrationResult> {
  if (applications.length === 0) {
    return { imported: 0, skipped: 0 };
  }

  const { data: existingRows, error: queryError } = await supabase
    .from("applications")
    .select("id")
    .eq("user_id", userId);

  if (queryError) {
    throw new Error(
      `Unable to check existing applications: ${queryError.message}`,
    );
  }

  const existingIds = new Set(
    (existingRows ?? []).map((row) => row.id as string),
  );

  let imported = 0;
  let skipped = 0;

  for (const application of applications) {
    if (existingIds.has(application.id)) {
      skipped += 1;
      continue;
    }

    const row = toDatabaseRow(application, userId);

    const { error: insertError } = await supabase
      .from("applications")
      .insert(row);

    if (!insertError) {
      existingIds.add(application.id);
      imported += 1;
      continue;
    }

    // A primary-key collision can occur if an ID belongs to another
    // account. Never overwrite that account's row; retry with a new ID.
    if (insertError.code === "23505") {
      const replacementRow = {
        ...row,
        id: crypto.randomUUID(),
      };

      const { error: retryError } = await supabase
        .from("applications")
        .insert(replacementRow);

      if (retryError) {
        throw new Error(
          `Import stopped after ${imported} record(s): ${retryError.message}. You can safely retry the migration.`,
        );
      }

      existingIds.add(replacementRow.id);
      imported += 1;
      continue;
    }

    throw new Error(
      `Import stopped after ${imported} record(s): ${insertError.message}. You can safely retry the migration.`,
    );
  }

  return { imported, skipped };
}
