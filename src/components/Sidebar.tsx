import {
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  LayoutDashboard,
  Settings2,
  X,
} from "lucide-react";
import type { Page } from "../App";

const NAV_ITEMS: { label: string; icon: typeof LayoutDashboard; page: Page }[] =
  [
    { label: "Dashboard", icon: LayoutDashboard, page: "dashboard" },
    { label: "Applications", icon: BriefcaseBusiness, page: "applications" },
    { label: "Follow-ups", icon: CalendarClock, page: "follow-ups" },
    { label: "Interviews", icon: CalendarDays, page: "interviews" },
    { label: "Analytics", icon: BarChart3, page: "analytics" },
    { label: "Settings", icon: Settings2, page: "settings" },
  ];

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  email: string;
  followUpCount: number;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  activePage,
  onNavigate,
  email,
  followUpCount,
  mobileOpen = false,
  onClose,
}: SidebarProps) {
  const initials = email.slice(0, 2).toUpperCase() || "A";

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/30 md:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-slate-200 bg-white transition-transform md:sticky md:top-0 md:z-auto md:h-screen md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-[68px] items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-indigo-600 text-white shadow-sm shadow-indigo-200">
              <BarChart3 size={18} strokeWidth={2.7} />
            </span>
            <span className="text-[17px] font-bold tracking-tight text-slate-900">
              ApplyOS
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav
          aria-label="Workspace navigation"
          className="flex-1 space-y-2 px-3 py-6"
        >
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Workspace
          </p>
          {NAV_ITEMS.map(({ label, icon: Icon, page }) => {
            const active = activePage === page;
            return (
              <button
                key={page}
                type="button"
                onClick={() => {
                  onNavigate(page);
                  onClose?.();
                }}
                aria-current={active ? "page" : undefined}
                className={`flex h-[38px] w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] font-medium transition ${active ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span className="flex-1">{label}</span>
                {page === "follow-ups" && followUpCount > 0 && (
                  <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                    {followUpCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="flex min-w-0 items-center gap-2.5 rounded-lg px-1.5 py-1.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-slate-800">
                {email.split("@")[0] || "Your account"}
              </span>
              <span className="block truncate text-[10px] text-slate-500">
                {email}
              </span>
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
