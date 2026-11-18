import { statusDisplayLabel } from "../utils/statusLabels";

const STATUS_BADGE_STYLES = {
  Active: {
    pill: "bg-[#eef4e8] text-[#4d6b2a]",
    dot: "bg-[#5f7d37]",
  },
  InProgress: {
    pill: "bg-[#fdf3e7] text-[#c2570c]",
    dot: "bg-[#d97724]",
  },
  Completed: {
    pill: "bg-[#eef4e8] text-[#4d6b2a]",
    dot: "bg-[#5f7d37]",
  },
  Cancelled: {
    pill: "bg-[#fbeae8] text-[#b3473f]",
    dot: "bg-[#c25048]",
  },
  Draft: {
    pill: "bg-[#f3efe8] text-[#6b6055]",
    dot: "bg-[#8a7f6e]",
  },
  Planned: {
    pill: "bg-[#f3efe8] text-[#6b6055]",
    dot: "bg-[#8a7f6e]",
  },
  Scheduled: {
    pill: "bg-[#f5efe6] text-[#4a3f33]",
    dot: "bg-[#8a7f6e]",
  },
};

const DEFAULT_BADGE = {
  pill: "bg-[#f3efe8] text-[#6b6055]",
  dot: "bg-[#8a7f6e]",
};

export default function StatusText({ code, children }) {
  const style = STATUS_BADGE_STYLES[code] ?? DEFAULT_BADGE;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${style.pill}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
      {statusDisplayLabel(code, children)}
    </span>
  );
}
