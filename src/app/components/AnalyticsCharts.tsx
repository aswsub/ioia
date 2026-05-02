"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import { analyticsData, statusBreakdown } from "./mock-data";

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded border bg-white shadow-sm px-3 py-2"
        style={{ fontSize: 12, borderColor: "#e5e5e5" }}
      >
        <p style={{ color: "#525252", marginBottom: 2 }}>{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color, fontWeight: 500 }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function OutreachChart() {
  return (
    <div
      className="rounded-lg border p-5"
      style={{ borderColor: "#e5e5e5", background: "#fff" }}
    >
      <p style={{ fontSize: 13, fontWeight: 400, color: "#0a0a0a", marginBottom: 2 }}>
        Outreach Activity
      </p>
      <p style={{ fontSize: 12, color: "#a3a3a3", marginBottom: 20, fontWeight: 300 }}>
        Emails sent over time.
      </p>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={analyticsData} barSize={6} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#a3a3a3", fontFamily: "var(--font-sans)" }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#a3a3a3", fontFamily: "var(--font-sans)" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f5f5" }} />
          <Bar dataKey="sent" name="Sent" fill="#0a0a0a" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-1.5 mt-3">
        <span className="rounded-full" style={{ width: 8, height: 8, background: "#0a0a0a", display: "inline-block" }} />
        <span style={{ fontSize: 11, color: "#a3a3a3" }}>Emails sent</span>
      </div>
    </div>
  );
}

export function StatusChart() {
  return (
    <div
      className="rounded-lg border p-5"
      style={{ borderColor: "#e5e5e5", background: "#fff" }}
    >
      <p style={{ fontSize: 13, fontWeight: 400, color: "#0a0a0a", marginBottom: 2 }}>
        Status Breakdown
      </p>
      <p style={{ fontSize: 12, color: "#a3a3a3", marginBottom: 20, fontWeight: 300 }}>
        Outreach broken down by response status.
      </p>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart
          data={statusBreakdown}
          layout="vertical"
          barSize={10}
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "#a3a3a3", fontFamily: "var(--font-sans)" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 11, fill: "#525252", fontFamily: "var(--font-sans)" }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f5f5" }} />
          <Bar dataKey="value" name="Count" radius={[0, 2, 2, 0]}>
            {statusBreakdown.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReplyRateChart() {
  return (
    <div
      className="rounded-lg border p-5"
      style={{ borderColor: "#e5e5e5", background: "#fff" }}
    >
      <p style={{ fontSize: 13, fontWeight: 400, color: "#0a0a0a", marginBottom: 2 }}>
        Reply Rate
      </p>
      <p style={{ fontSize: 12, color: "#a3a3a3", marginBottom: 20, fontWeight: 300 }}>
        Replies received over time.
      </p>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={analyticsData} barSize={6} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#a3a3a3", fontFamily: "var(--font-sans)" }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#a3a3a3", fontFamily: "var(--font-sans)" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f5f5" }} />
          <Bar dataKey="replies" name="Replies" fill="#3b82f6" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-1.5 mt-3">
        <span className="rounded-full" style={{ width: 8, height: 8, background: "#3b82f6", display: "inline-block" }} />
        <span style={{ fontSize: 11, color: "#a3a3a3" }}>Replies received</span>
      </div>
    </div>
  );
}