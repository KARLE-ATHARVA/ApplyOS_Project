export interface ExtractedJob {
  url: string;
  title: string | null;
  company: string | null;
  location: string | null;
  description: string | null;
  employment_type: string | null;
  missing_fields: string[];
  extraction_source: string | null;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function extractJobFromUrl(url: string): Promise<ExtractedJob> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/v1/jobs/extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Cannot reach the ApplyOS API at ${API_BASE_URL}. Start it with "npm run dev:api" and try again.`,
        { cause: error },
      );
    }

    throw error;
  }

  if (!response.ok) {
    let message = `Job extraction failed (${response.status}).`;

    try {
      const body: { detail?: string } = await response.json();

      if (body.detail) {
        message = body.detail;
      }
    } catch {
      // Keep the default error message if the response isn't JSON.
    }

    throw new Error(message);
  }

  return (await response.json()) as ExtractedJob;
}
