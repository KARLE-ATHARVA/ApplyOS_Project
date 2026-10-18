import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Applications from "./pages/Applications";
import FollowUps from "./pages/FollowUps";
import Auth from "./pages/Auth";
import LegacyMigrationPanel from "./components/LegacyMigrationPanel";
import { useAuth } from "./context/useAuth";

export type Page =
  | "dashboard"
  | "applications"
  | "follow-ups"
  | "analytics"
  | "settings";

export default function App() {
  const { session, loading, signOut } = useAuth();
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [signOutError, setSignOutError] = useState("");

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <LoaderCircle size={20} className="animate-spin" aria-hidden="true" />
          Restoring your session...
        </div>
      </main>
    );
  }

  if (!session) {
    return <Auth />;
  }

  async function handleSignOut() {
    setSignOutError("");

    try {
      await signOut();
    } catch (error: unknown) {
      setSignOutError(
        error instanceof Error
          ? error.message
          : "Unable to sign out. Please try again.",
      );
    }
  }

  function renderPage() {
    switch (activePage) {
      case "dashboard":
        return <Dashboard />;

      case "applications":
        return <Applications />;

      case "follow-ups":
        return <FollowUps />;

      case "analytics":
        return (
          <ComingSoonPage
            title="Analytics"
            description="Application trends and job-search insights will be available here."
          />
        );

      case "settings":
        return <SettingsPage />;

      default:
        return <Dashboard />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <div className="hidden md:block">
          <Sidebar activePage={activePage} onNavigate={setActivePage} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />

          <div className="flex items-center justify-end gap-3 border-b border-slate-200 bg-white px-5 py-2">
            <span className="max-w-56 truncate text-xs text-slate-500">
              {session.user.email}
            </span>

            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>

          {signOutError && (
            <p
              role="alert"
              className="bg-red-50 px-5 py-2 text-sm text-red-700"
            >
              {signOutError}
            </p>
          )}

          <main className="flex-1">{renderPage()}</main>
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-5 sm:p-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your ApplyOS data and preferences.
        </p>
      </section>

      <LegacyMigrationPanel />
    </div>
  );
}

function ComingSoonPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-3 p-5 sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        {title}
      </h1>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}
