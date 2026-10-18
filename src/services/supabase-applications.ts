import type { Application } from "../types/application";
import { supabase } from "../lib/supabase";

interface DatabaseApplication {
  id: string;
  user_id: string;
  company: string;
  role: string;
  job_url: string;
  status: Application["status"];
  created_at: string;
  applied_at: string | null;
  location: string | null;
  description: string | null;
  employment_type: string | null;
  follow_up_date: string | null;
  next_action: string | null;
}

function toApplication(row: DatabaseApplication): Application {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    jobUrl: row.job_url,
    status: row.status,
    createdAt: row.created_at,
    appliedAt: row.applied_at,
    location: row.location,
    description: row.description,
    employmentType: row.employment_type,
    followUpDate: row.follow_up_date,
    nextAction: row.next_action,
  };
}

function toDatabaseRow(
  application: Application,
  userId: string,
): DatabaseApplication {
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

export async function fetchApplications(): Promise<Application[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load applications: ${error.message}`);
  }

  return ((data ?? []) as DatabaseApplication[]).map(toApplication);
}

export async function createApplication(
  application: Application,
  userId: string,
): Promise<Application> {
  const row = toDatabaseRow(application, userId);

  const { data, error } = await supabase
    .from("applications")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Unable to save application: ${error.message}`);
  }

  return toApplication(data as DatabaseApplication);
}

export async function saveApplication(
  application: Application,
  userId: string,
): Promise<Application> {
  const { data, error } = await supabase
    .from("applications")
    .update({
      company: application.company,
      role: application.role,
      job_url: application.jobUrl,
      status: application.status,
      applied_at: application.appliedAt,
      location: application.location ?? null,
      description: application.description ?? null,
      employment_type: application.employmentType ?? null,
      follow_up_date: application.followUpDate ?? null,
      next_action: application.nextAction ?? null,
    })
    .eq("id", application.id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Unable to update application: ${error.message}`);
  }

  return toApplication(data as DatabaseApplication);
}

export async function removeApplication(
  id: string,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("applications")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to delete application: ${error.message}`);
  }

  if (!data) {
    throw new Error(
      "Application not found or you do not have permission to delete it.",
    );
  }
}
