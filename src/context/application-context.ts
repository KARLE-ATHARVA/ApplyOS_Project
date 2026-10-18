
import { createContext } from "react";
import type {
  Application,
  ApplicationStatus,
} from "../types/application";

export interface ApplicationContextValue {
  applications: Application[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  addApplication: (application: Application) => Promise<void>;
  markAsApplied: (id: string) => Promise<void>;
  updateApplicationStatus: (
    id: string,
    status: ApplicationStatus,
  ) => Promise<void>;
  updateApplication: (application: Application) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
}

export const STORAGE_KEY = "applyos-applications";

export const ApplicationContext = createContext<
  ApplicationContextValue | undefined
>(undefined);
