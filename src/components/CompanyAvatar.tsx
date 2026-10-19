const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-indigo-100 text-indigo-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-800",
];

export default function CompanyAvatar({
  company,
  size = "md",
}: {
  company: string;
  size?: "sm" | "md";
}) {
  const initials =
    company
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?";
  const colorIndex =
    [...company].reduce((total, char) => total + char.charCodeAt(0), 0) %
    AVATAR_COLORS.length;

  return (
    <span
      aria-label={`${company} initials`}
      className={`inline-flex shrink-0 items-center justify-center rounded-xl font-semibold ${size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm"} ${AVATAR_COLORS[colorIndex]}`}
    >
      {initials}
    </span>
  );
}
