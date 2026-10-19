import { lazy, Suspense, useState } from "react";
import { LoaderCircle } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import AddApplicationModal from "./components/AddApplicationModal";
import { useAuth } from "./context/useAuth";
import { useApplications } from "./context/useApplications";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Applications = lazy(() => import("./pages/Applications"));
const FollowUps = lazy(() => import("./pages/FollowUps"));
const Interviews = lazy(() => import("./pages/Interviews"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));
const Auth = lazy(() => import("./pages/Auth"));

export type Page =
  | "dashboard"
  | "applications"
  | "follow-ups"
  | "interviews"
  | "analytics"
  | "settings";

export default function App() {
  const { session, loading: authLoading, signOut } = useAuth();
  const {
    applications,
    addApplication,
    loading: applicationsLoading,
    error: applicationsError,
  } = useApplications();
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center gap-2 bg-slate-50 text-sm text-slate-500">
        <LoaderCircle size={18} className="animate-spin" />
        Restoring your session...
      </main>
    );
  }
  if (!session) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Auth />
      </Suspense>
    );
  }

  async function handleSignOut() {
    setSignOutError("");
    setSigningOut(true);
    try {
      await signOut();
    } catch (error: unknown) {
      setSignOutError(
        error instanceof Error
          ? error.message
          : "Unable to sign out. Please try again.",
      );
    } finally {
      setSigningOut(false);
    }
  }

  function renderPage() {
    switch (activePage) {
      case "dashboard":
        return (
          <Dashboard
            onAddApplication={() => setIsAddModalOpen(true)}
            onNavigate={setActivePage}
          />
        );
      case "applications":
        return <Applications />;
      case "follow-ups":
        return <FollowUps />;
      case "interviews":
        return <Interviews onNavigate={setActivePage} />;
      case "analytics":
        return <Analytics />;
      case "settings":
        return <Settings onSignOut={() => void handleSignOut()} />;
      default:
        return (
          <Dashboard
            onAddApplication={() => setIsAddModalOpen(true)}
            onNavigate={setActivePage}
          />
        );
    }
  }

  const followUpCount = applications.filter((application) =>
    Boolean(application.followUpDate),
  ).length;
  const email = session.user.email ?? "";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          email={email}
          followUpCount={followUpCount}
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col md:h-screen md:overflow-hidden">
          <Topbar
            page={activePage}
            onAddApplication={() => setIsAddModalOpen(true)}
            onMenuClick={() => setMobileNavOpen(true)}
            email={email}
            onSignOut={() => void handleSignOut()}
            signingOut={signingOut}
          />
          {(signOutError || applicationsError) && (
            <p
              role="alert"
              className="border-b border-rose-200 bg-rose-50 px-5 py-2.5 text-sm text-rose-700"
            >
              {signOutError || applicationsError}
            </p>
          )}
          <main className="min-h-0 flex-1 overflow-y-auto">
            {applicationsLoading ? (
              <PageLoader label="Loading your workspace..." />
            ) : (
              <Suspense fallback={<PageLoader />}>{renderPage()}</Suspense>
            )}
          </main>
        </div>
      </div>
      {isAddModalOpen && (
        <AddApplicationModal
          onClose={() => setIsAddModalOpen(false)}
          onSave={addApplication}
          existingApplications={applications}
        />
      )}
    </div>
  );
}

function PageLoader({ label = "Loading page..." }: { label?: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500">
      <LoaderCircle size={18} className="animate-spin" />
      {label}
    </div>
  );
}
