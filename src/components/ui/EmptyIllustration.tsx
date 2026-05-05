import type { JSX } from "react";

export type IllustrationVariant = "tasks" | "search" | "upcoming" | "stats";

// ── SVG illustrations ─────────────────────────────────────────────────────

function TasksSVG() {
  return (
    <svg
      width="96"
      height="96"
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Clipboard body */}
      <rect
        x="14"
        y="22"
        width="60"
        height="62"
        rx="8"
        fill="var(--bg-elevated)"
        stroke="var(--border-default)"
        strokeWidth="2"
      />
      {/* Clip tab */}
      <rect
        x="32"
        y="14"
        width="28"
        height="14"
        rx="5"
        fill="var(--bg-elevated)"
        stroke="var(--border-default)"
        strokeWidth="2"
      />
      {/* Row 1 — checked */}
      <rect
        x="22"
        y="42"
        width="14"
        height="14"
        rx="4"
        fill="var(--accent)"
        fillOpacity="0.15"
        stroke="var(--accent)"
        strokeWidth="1.5"
      />
      <path
        d="M25.5 49 l3 3 6-6"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="42"
        y1="49"
        x2="62"
        y2="49"
        stroke="var(--border-default)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Row 2 — empty */}
      <rect
        x="22"
        y="60"
        width="14"
        height="14"
        rx="4"
        fill="var(--bg-surface)"
        stroke="var(--border-default)"
        strokeWidth="1.5"
      />
      <line
        x1="42"
        y1="67"
        x2="62"
        y2="67"
        stroke="var(--border-default)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Row 3 — empty short */}
      <rect
        x="22"
        y="78"
        width="14"
        height="2"
        rx="1"
        fill="var(--border-default)"
      />
      <line
        x1="42"
        y1="79"
        x2="54"
        y2="79"
        stroke="var(--border-default)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchSVG() {
  return (
    <svg
      width="96"
      height="96"
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Lens */}
      <circle
        cx="40"
        cy="40"
        r="24"
        fill="var(--bg-elevated)"
        stroke="var(--border-default)"
        strokeWidth="2"
      />
      {/* Handle */}
      <line
        x1="57"
        y1="57"
        x2="74"
        y2="74"
        stroke="var(--border-default)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Empty result dots */}
      <circle cx="32" cy="40" r="3.5" fill="var(--text-placeholder)" />
      <circle cx="40" cy="40" r="3.5" fill="var(--text-placeholder)" />
      <circle cx="48" cy="40" r="3.5" fill="var(--text-placeholder)" />
      {/* Small arc — "thinking" */}
      <path
        d="M34 52 Q40 56 46 52"
        stroke="var(--text-placeholder)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function UpcomingSVG() {
  return (
    <svg
      width="96"
      height="96"
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Calendar body */}
      <rect
        x="8"
        y="24"
        width="80"
        height="64"
        rx="8"
        fill="var(--bg-elevated)"
        stroke="var(--border-default)"
        strokeWidth="2"
      />
      {/* Header fill */}
      <path
        d="M8 32 L8 24 Q8 16 16 16 L80 16 Q88 16 88 24 L88 32 Z"
        fill="var(--accent)"
        fillOpacity="0.15"
      />
      <rect x="8" y="32" width="80" height="8" fill="var(--bg-elevated)" />
      {/* Mounting pins */}
      <line
        x1="30"
        y1="14"
        x2="30"
        y2="30"
        stroke="var(--border-default)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="66"
        y1="14"
        x2="66"
        y2="30"
        stroke="var(--border-default)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Date grid — 3×2 dots */}
      <circle cx="26" cy="56" r="4" fill="var(--border-default)" />
      <circle cx="48" cy="56" r="4" fill="var(--border-default)" />
      <circle cx="70" cy="56" r="4" fill="var(--border-default)" />
      <circle cx="26" cy="72" r="4" fill="var(--border-default)" />
      <circle cx="48" cy="72" r="4" fill="var(--border-default)" />
      <circle cx="70" cy="72" r="4" fill="var(--border-default)" />
    </svg>
  );
}

function StatsSVG() {
  return (
    <svg
      width="96"
      height="96"
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Baseline */}
      <line
        x1="10"
        y1="76"
        x2="86"
        y2="76"
        stroke="var(--border-default)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Bar 1 — short */}
      <rect
        x="14"
        y="62"
        width="18"
        height="14"
        rx="4"
        fill="var(--bg-elevated)"
        stroke="var(--border-default)"
        strokeWidth="1.5"
      />
      {/* Bar 2 — tall, accent */}
      <rect
        x="39"
        y="42"
        width="18"
        height="34"
        rx="4"
        fill="var(--accent)"
        fillOpacity="0.2"
        stroke="var(--accent)"
        strokeWidth="1.5"
      />
      {/* Bar 3 — medium */}
      <rect
        x="64"
        y="52"
        width="18"
        height="24"
        rx="4"
        fill="var(--bg-elevated)"
        stroke="var(--border-default)"
        strokeWidth="1.5"
      />
      {/* Sparkle above bar 2 */}
      <line
        x1="48"
        y1="26"
        x2="48"
        y2="34"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.7"
      />
      <line
        x1="44"
        y1="30"
        x2="52"
        y2="30"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.7"
      />
      <line
        x1="45.5"
        y1="27.5"
        x2="50.5"
        y2="32.5"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.4"
      />
      <line
        x1="50.5"
        y1="27.5"
        x2="45.5"
        y2="32.5"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.4"
      />
    </svg>
  );
}

// ── Export ────────────────────────────────────────────────────────────────

const svgs: Record<IllustrationVariant, () => JSX.Element> = {
  tasks: TasksSVG,
  search: SearchSVG,
  upcoming: UpcomingSVG,
  stats: StatsSVG,
};

export function EmptyIllustration({
  variant,
}: {
  variant: IllustrationVariant;
}) {
  const SVG = svgs[variant];
  return (
    <div className="empty-float">
      <SVG />
    </div>
  );
}
