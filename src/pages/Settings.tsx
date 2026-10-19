import { useState } from "react";
import { LogOut, SlidersHorizontal, UserRound } from "lucide-react";
import LegacyMigrationPanel from "../components/LegacyMigrationPanel";
import { useAuth } from "../context/useAuth";

const DAILY_TARGET_KEY = "applyos-daily-target";
function readTarget() {
  try {
    const value = Number(localStorage.getItem(DAILY_TARGET_KEY) ?? 5);
    return Number.isInteger(value) && value >= 1 && value <= 100 ? value : 5;
  } catch {
    return 5;
  }
}

export default function Settings({ onSignOut }: { onSignOut: () => void }) {
  const { session } = useAuth();
  const [target, setTarget] = useState(readTarget);
  const [saved, setSaved] = useState(false);
  const email = session?.user.email ?? "";
  const name =
    typeof session?.user.user_metadata?.full_name === "string"
      ? session.user.user_metadata.full_name
      : "";

  function updateTarget(value: number) {
    if (!Number.isInteger(value) || value < 1 || value > 100) return;
    setTarget(value);
    setSaved(false);
    try {
      localStorage.setItem(DAILY_TARGET_KEY, String(value));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header>
        <h1 className="text-[25px] font-semibold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Manage your profile and application preferences.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[170px_minmax(0,1fr)]">
        <nav
          aria-label="Settings sections"
          className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible"
        >
          {[
            { id: "profile", label: "Profile" },
            { id: "preferences", label: "Preferences" },
            { id: "account", label: "Account" },
            { id: "migration", label: "Data import" },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="space-y-4">
          <section
            id="profile"
            className="scroll-mt-20 overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            <header className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
              <p className="mt-1 text-xs text-slate-500">
                Your authenticated account information.
              </p>
            </header>
            <div className="flex items-center gap-3 px-5 py-5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <UserRound size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {name || "ApplyOS member"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{email}</p>
              </div>
            </div>
            <div className="grid gap-4 border-t border-slate-100 px-5 py-4 sm:grid-cols-2">
              <label className="text-xs font-medium text-slate-600">
                Full name
                <input
                  readOnly
                  value={name || "Not provided"}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700"
                />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Email address
                <input
                  readOnly
                  value={email}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700"
                />
              </label>
            </div>
            <p className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
              Profile editing is not available yet. These details are read from
              Supabase Auth.
            </p>
          </section>
          <section
            id="preferences"
            className="scroll-mt-20 overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                <SlidersHorizontal size={17} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Application preferences
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Customize your daily workflow.
                </p>
              </div>
            </header>
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Daily application goal
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Set the target shown in your Apply Sprint.
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={target}
                  onChange={(event) =>
                    updateTarget(event.currentTarget.valueAsNumber)
                  }
                  aria-label="Daily application goal"
                  className="h-9 w-16 rounded-lg border border-slate-200 px-2 text-sm text-slate-800"
                />
                per day
                {saved && (
                  <span role="status" className="text-emerald-700">
                    Saved
                  </span>
                )}
              </label>
            </div>
          </section>
          <section
            id="account"
            className="scroll-mt-20 overflow-hidden rounded-xl border border-rose-100 bg-white"
          >
            <header className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Account</h2>
              <p className="mt-1 text-xs text-slate-500">
                Manage your current session.
              </p>
            </header>
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Sign out of ApplyOS
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  You’ll need to sign in again to access your workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </section>
          <div id="migration" className="scroll-mt-20">
            <LegacyMigrationPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
