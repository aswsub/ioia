"use client";

import { useState } from "react";
import { Copy, RefreshCw, CalendarDays, ArrowRight, ExternalLink } from "lucide-react";
import { recentOutreach } from "./mock-data";
import { StatusBadge, ConfidenceBadge } from "./StatusBadge";
import { OutreachChart, StatusChart, ReplyRateChart } from "./AnalyticsCharts";

function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div
      className="flex flex-col gap-1 rounded-lg border px-5 py-4"
      style={{ borderColor: "#e5e5e5", background: "#fff", minWidth: 0 }}
    >
      <span style={{ fontSize: 12, color: "#a3a3a3", fontWeight: 300 }}>{label}</span>
      <span style={{ fontSize: 22, fontWeight: 300, color: "#0a0a0a", letterSpacing: "-0.02em" }}>
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: 11.5, color: "#a3a3a3", fontWeight: 300 }}>{sub}</span>
      )}
    </div>
  );
}

export function DashboardOverview() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const sentCount = recentOutreach.filter((e) => e.status !== "draft").length;
  const repliedCount = recentOutreach.filter((e) => e.status === "replied").length;
  const followUpCount = recentOutreach.filter((e) => e.status === "follow_up").length;
  const avgMatch = (
    recentOutreach.reduce((acc, e) => acc + e.matchScore, 0) / recentOutreach.length
  ).toFixed(2);

  return (
    <main
      className="flex-1 overflow-y-auto"
      style={{ background: "#fafafa", fontFamily: "var(--font-sans)" }}
    >
      {/* Page header */}
      <div
        className="bg-white border-b px-8 py-3 flex items-center"
        style={{ borderColor: "#e5e5e5", minHeight: 48 }}
      >
        <span style={{ fontSize: 14, fontWeight: 400, color: "#0a0a0a" }}>Overview</span>
      </div>

      <div className="px-8 py-6 max-w-6xl mx-auto">
        {/* Recent Outreach */}
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: 16, fontWeight: 400, color: "#0a0a0a", letterSpacing: "-0.01em" }}>
            Recent outreach
          </h2>
          <button
            className="flex items-center gap-1 hover:opacity-70 transition-opacity"
            style={{ fontSize: 12.5, color: "#525252", fontWeight: 300 }}
          >
            View all
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Table */}
        <div
          className="rounded-lg border overflow-hidden mb-8"
          style={{ borderColor: "#e5e5e5", background: "#fff" }}
        >
          {/* Table header */}
          <div
            className="grid border-b"
            style={{
              borderColor: "#e5e5e5",
              gridTemplateColumns: "140px 1fr 140px 100px 80px",
              background: "#fafafa",
            }}
          >
            {["Status", "Professor / Subject", "Sent", "Institution", "Match"].map((h) => (
              <div
                key={h}
                className="px-4 py-2.5"
                style={{ fontSize: 11, fontWeight: 400, color: "#a3a3a3", letterSpacing: "0.03em", textTransform: "uppercase" }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {recentOutreach.map((email, i) => (
            <div
              key={email.id}
              className="grid border-b group hover:bg-gray-50 transition-colors"
              style={{
                borderColor: i === recentOutreach.length - 1 ? "transparent" : "#e5e5e5",
                gridTemplateColumns: "140px 1fr 140px 100px 80px",
                cursor: "pointer",
              }}
            >
              {/* Status */}
              <div className="px-4 py-3 flex items-center">
                <StatusBadge status={email.status} />
              </div>

              {/* Professor / Subject */}
              <div className="px-4 py-3 flex flex-col justify-center gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 400,
                      color: "#0a0a0a",
                      fontFamily: "var(--font-mono)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {email.id.slice(0, 14)}…
                  </span>
                  <button
                    onClick={() => handleCopy(email.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ flexShrink: 0 }}
                  >
                    <Copy size={11} color={copiedId === email.id ? "#22c55e" : "#a3a3a3"} />
                  </button>
                </div>
                <span style={{ fontSize: 12, color: "#737373", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {email.professor} · {truncate(email.subject, 58)}
                </span>
              </div>

              {/* Sent */}
              <div className="px-4 py-3 flex items-center">
                <span style={{ fontSize: 12, color: "#525252", fontWeight: 300 }}>{email.sent}</span>
              </div>

              {/* Institution */}
              <div className="px-4 py-3 flex items-center">
                <span style={{ fontSize: 12, color: "#525252", fontWeight: 300 }}>{email.institution}</span>
              </div>

              {/* Match */}
              <div className="px-4 py-3 flex items-center gap-2">
                <span style={{ fontSize: 12, color: "#0a0a0a", fontWeight: 400 }}>
                  {(email.matchScore * 100).toFixed(0)}%
                </span>
                <ExternalLink size={11} color="#d4d4d4" className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>

        {/* Analytics header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 style={{ fontSize: 16, fontWeight: 400, color: "#0a0a0a", letterSpacing: "-0.01em" }}>
              Analytics
            </h2>
            <span style={{ fontSize: 12, color: "#a3a3a3", fontWeight: 300 }}>Apr 18 – May 2</span>
            <span style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 300 }}>· Last updated May 2, 9:58 AM</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 rounded border px-3 py-1.5 hover:bg-gray-50 transition-colors"
              style={{ fontSize: 12, color: "#525252", borderColor: "#e5e5e5", background: "#fff", fontWeight: 300 }}
            >
              <RefreshCw size={12} />
              Refresh
            </button>
            <button
              className="flex items-center gap-1.5 rounded border px-3 py-1.5 hover:bg-gray-50 transition-colors"
              style={{ fontSize: 12, color: "#525252", borderColor: "#e5e5e5", background: "#fff", fontWeight: 300 }}
            >
              <CalendarDays size={12} />
              Free period
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          <StatCard label="Total Sent" value={sentCount} sub="emails" />
          <StatCard label="Replies" value={repliedCount} sub="received" />
          <StatCard label="Follow-ups" value={followUpCount} sub="pending" />
          <StatCard label="Avg. Match Score" value={avgMatch} sub="out of 1.0" />
          <StatCard label="Draft Saved" value={1} sub="in queue" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-3 gap-4">
          <OutreachChart />
          <ReplyRateChart />
          <StatusChart />
        </div>
      </div>
    </main>
  );
}