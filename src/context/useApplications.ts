import { useContext } from "react";
import { ApplicationContext } from "./application-context";

export function useApplications() {
  const context = useContext(ApplicationContext);

  if (!context) {
    throw new Error("useApplications must be used inside ApplicationProvider");
  }

  return context;
}
