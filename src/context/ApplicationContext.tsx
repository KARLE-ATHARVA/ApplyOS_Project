
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";

import type { Application, ApplicationStatus } from "../types/application";
import { useAuth } from "./useAuth";
import { ApplicationContext, STORAGE_KEY } from "./application-context";
import {
  createApplication,
  fetchApplications,
  removeApplication,
  saveApplication,
} from "../services/supabase-applications";

export function ApplicationProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const user: User | null = session?.user ?? null;

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userIdRef = useRef<string | null>(null);
  const applicationsRef = useRef<Application[]>([]);
  const statusUpdatesRef = useRef<Map<string, Promise<void>>>(new Map());

  useEffect(() => {
    applicationsRef.current = applications;
  }, [applications]);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    const userId = user?.id ?? null;

    userIdRef.current = userId;
    statusUpdatesRef.current.clear();

    void Promise.resolve()
      .then(() => {
        if (cancelled) return null;

        setApplications([]);
        applicationsRef.current = [];
        setError(null);

        if (!userId) {
          setLoading(false);
          return null;
        }

        setLoading(true);
        return fetchApplications();
      })
      .then((records) => {
        if (records && !cancelled && userId && userIdRef.current === userId) {
          applicationsRef.current = records;
          setApplications(records);
        }
      })
      .catch((caughtError: unknown) => {
        if (cancelled || !userId || userIdRef.current !== userId) return;

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load your applications.",
        );
      })
      .finally(() => {
        if (!cancelled && userId && userIdRef.current === userId) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const addApplication = useCallback(async (application: Application) => {
    const userId = userIdRef.current;

    if (!userId) {
      throw new Error("Sign in before saving an application.");
    }

    setError(null);

    try {
      const saved = await createApplication(application, userId);

      if (userIdRef.current === userId) {
        setApplications((current) => {
          const updated = [...current, saved];
          applicationsRef.current = updated;
          return updated;
        });
      }
    } catch (caughtError: unknown) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save the application.";

      setError(message);
      throw caughtError;
    }
  }, []);

  const updateApplication = useCallback(async (application: Application) => {
    const userId = userIdRef.current;

    if (!userId) {
      throw new Error("Sign in before updating an application.");
    }

    setError(null);

    try {
      const saved = await saveApplication(application, userId);

      if (userIdRef.current === userId) {
        setApplications((current) => {
          const updated = current.map((item) =>
            item.id === saved.id ? saved : item,
          );
          applicationsRef.current = updated;
          return updated;
        });
      }
    } catch (caughtError: unknown) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update the application.";

      setError(message);
      throw caughtError;
    }
  }, []);

  const updateApplicationStatus = useCallback(
    async (id: string, status: ApplicationStatus) => {
      const previousUpdate = statusUpdatesRef.current.get(id);

      if (previousUpdate) {
        await previousUpdate.catch(() => undefined);
      }

      const existing = applicationsRef.current.find((item) => item.id === id);
      if (!existing) return;

      const appliedAt =
        status === "applied" && existing.appliedAt === null
          ? new Date().toISOString()
          : existing.appliedAt;

      const update = updateApplication({
        ...existing,
        status,
        appliedAt,
      });

      statusUpdatesRef.current.set(id, update);

      try {
        await update;
      } finally {
        if (statusUpdatesRef.current.get(id) === update) {
          statusUpdatesRef.current.delete(id);
        }
      }
    },
    [updateApplication],
  );

  const markAsApplied = useCallback(
    async (id: string) => {
      await updateApplicationStatus(id, "applied");
    },
    [updateApplicationStatus],
  );

  const deleteApplication = useCallback(async (id: string) => {
    const userId = userIdRef.current;

    if (!userId) {
      throw new Error("Sign in before deleting an application.");
    }

    setError(null);

    try {
      await removeApplication(id, userId);

      if (userIdRef.current === userId) {
        setApplications((current) => {
          const updated = current.filter((item) => item.id !== id);
          applicationsRef.current = updated;
          return updated;
        });
      }
    } catch (caughtError: unknown) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete the application.";

      setError(message);
      throw caughtError;
    }
  }, []);

  // Keep the legacy localStorage key intact; migration is a separate step.
  void STORAGE_KEY;

  return (
    <ApplicationContext.Provider
      value={{
        applications,
        loading: authLoading || loading,
        error,
        clearError,
        addApplication,
        markAsApplied,
        updateApplicationStatus,
        updateApplication,
        deleteApplication,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
}
