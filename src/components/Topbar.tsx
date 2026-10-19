import { useState } from "react";
import { LoaderCircle, Menu, Plus, LogOut } from "lucide-react";
import type { Page } from "../App";

const PAGE_NAMES: Record<Page, string> = {
  dashboard: "Dashboard",
  applications: "Applications",
  "follow-ups": "Follow-ups",
  interviews: "Interviews",
  analytics: "Analytics",
  settings: "Settings",
};

export default function Topbar({
  page,
  onAddApplication,
  onMenuClick,
  email,
  onSignOut,
  signingOut,
}: {
  page: Page;
  onAddApplication: () => void;
  onMenuClick: () => void;
  email: string;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const initials = email.slice(0, 2).toUpperCase() || "A";

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
        >
          <Menu size={19} />
        </button>
        <p className="truncate text-[13px] font-semibold text-slate-800">
          {PAGE_NAMES[page]}
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onAddApplication}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:px-4"
        >
          <Plus size={16} strokeWidth={2.2} />
          <span className="hidden sm:inline">Add application</span>
          <span className="sm:hidden">Add</span>
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setAccountOpen((open) => !open)}
            aria-label="Account menu"
            aria-expanded={accountOpen}
            className="grid h-8 w-8 place-items-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 ring-1 ring-blue-200 hover:ring-indigo-300"
          >
            {initials}
          </button>
          {accountOpen && (
            <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <p className="truncate px-2 py-2 text-xs text-slate-500">
                {email}
              </p>
              <button
                type="button"
                onClick={() => {
                  setAccountOpen(false);
                  onSignOut();
                }}
                disabled={signingOut}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {signingOut ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <LogOut size={16} />
                )}{" "}
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
