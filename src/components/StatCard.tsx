import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
};

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: StatCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-slate-500">{title}</p>

        <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-3 text-[26px] font-semibold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1.5 text-[11px] text-slate-500">{description}</p>
    </article>
  );
}
