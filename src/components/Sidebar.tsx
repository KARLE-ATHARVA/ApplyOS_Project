
import {
  LayoutDashboard,
  BriefcaseBusiness,
  CalendarClock,
  ChartNoAxesCombined,
  Settings,
  Zap,
} from "lucide-react";

import type { Page } from "../App";

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const navigation: {
  label: string;
  icon: typeof LayoutDashboard;
  page: Page;
}[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    page: "dashboard",
  },
  {
    label: "Applications",
    icon: BriefcaseBusiness,
    page: "applications",
  },
];

const secondaryNavigation: {
  label: string;
  icon: typeof CalendarClock;
  page: Page;
}[] = [
  {
    label: "Follow-ups",
    icon: CalendarClock,
    page: "follow-ups",
  },
  {
    label: "Analytics",
    icon: ChartNoAxesCombined,
    page: "analytics",
  },
  {
    label: "Settings",
    icon: Settings,
    page: "settings",
  },
];

export default function Sidebar({
  activePage,
  onNavigate,
}: SidebarProps) {
  function renderNavigationItem({
    label,
    icon: Icon,
    page,
  }: {
    label: string;
    icon: typeof LayoutDashboard;
    page: Page;
  }) {
    const isActive = activePage === page;

    return (
      <button
        key={page}
        type="button"
        onClick={() => onNavigate(page)}
        aria-current={isActive ? "page" : undefined}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
          isActive
            ? "bg-indigo-50 text-indigo-700"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <Icon size={19} />
        {label}
      </button>
    );
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Zap size={22} />
        </div>

        <div>
          <p className="text-lg font-bold tracking-tight text-slate-900">
            ApplyOS
          </p>
          <p className="text-xs text-slate-500">
            Job search workspace
          </p>
        </div>
      </div>

      <nav
        aria-label="Main navigation"
        className="flex-1 space-y-7 px-4 py-6"
      >
        <div>
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          <div className="space-y-1">
            {navigation.map(renderNavigationItem)}
          </div>
        </div>

        <div>
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Manage
          </p>

          <div className="space-y-1">
            {secondaryNavigation.map(renderNavigationItem)}
          </div>
        </div>
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">
            Stay consistent
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Small daily steps move your job search forward.
          </p>
        </div>
      </div>
    </aside>
  );
}
