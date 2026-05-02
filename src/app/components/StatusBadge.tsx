import type { OutreachStatus, ConfidenceLevel } from "./mock-data";

const statusConfig: Record<
  OutreachStatus,
  { label: string; bg: string; color: string; dot: string }
> = {
  replied: {
    label: "Replied",
    bg: "#dbeafe",
    color: "#1d4ed8",
    dot: "#3b82f6",
  },
  sent: {
    label: "Sent",
    bg: "#f0fdf4",
    color: "#15803d",
    dot: "#22c55e",
  },
  follow_up: {
    label: "Follow-up",
    bg: "#fef9c3",
    color: "#a16207",
    dot: "#eab308",
  },
  draft: {
    label: "Draft",
    bg: "#f5f5f5",
    color: "#525252",
    dot: "#d4d4d4",
  },
};

const confidenceConfig: Record<
  ConfidenceLevel,
  { label: string; color: string }
> = {
  high: { label: "High", color: "#15803d" },
  medium: { label: "Medium", color: "#a16207" },
  low: { label: "Low", color: "#dc2626" },
};

export function StatusBadge({ status }: { status: OutreachStatus }) {
  const cfg = statusConfig[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5"
      style={{
        fontSize: 11.5,
        fontWeight: 400,
        background: cfg.bg,
        color: cfg.color,
        whiteSpace: "nowrap",
      }}
    >
      <span
        className="rounded-full"
        style={{ width: 5, height: 5, background: cfg.dot, flexShrink: 0, display: "inline-block" }}
      />
      {cfg.label}
    </span>
  );
}

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const cfg = confidenceConfig[level];
  return (
    <span style={{ fontSize: 12, color: cfg.color, fontWeight: 400 }}>
      {cfg.label}
    </span>
  );
}