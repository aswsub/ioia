"use client";

import { useState } from "react";
import { Sparkles, Send, ChevronDown } from "lucide-react";

const draftEmail = {
  professor: "Dr. Robert Kim",
  institution: "UCLA",
  subject: "Database query optimization — your recent B+ tree paper",
  body: `Hi Dr. Kim,

Your recent work on adaptive B+ tree indexing for mixed OLAP/OLTP workloads caught my attention — specifically the approach of using query frequency histograms to guide split decisions.

I've been working on a similar problem from a different angle: using learned cost models to predict when re-indexing pays off. My undergraduate research at Cal Poly SLO used PostgreSQL's internal statistics to train a simple regressor, and it matched the hand-tuned thresholds within 8% on TPC-H benchmarks.

I'd welcome the chance to hear how you're thinking about the learned vs. rule-based tradeoff in your current work.

Best,
Rahul`,
  confidence: "medium" as const,
  warnings: ["Email address guessed from university pattern — verify before sending."],
};

export function ComposeView() {
  const [body, setBody] = useState(draftEmail.body);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 1800);
  };

  return (
    <main
      className="flex-1 overflow-y-auto"
      style={{ background: "#fafafa", fontFamily: "var(--font-sans)" }}
    >
      <div
        className="bg-white border-b px-8 py-3 flex items-center justify-between"
        style={{ borderColor: "#e5e5e5", minHeight: 48 }}
      >
        <span style={{ fontSize: 14, fontWeight: 400, color: "#0a0a0a" }}>Compose</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            className="flex items-center gap-1.5 rounded border px-3 py-1.5 hover:bg-gray-50 transition-colors"
            style={{ fontSize: 12, color: "#525252", borderColor: "#e5e5e5", background: "#fff", fontWeight: 300 }}
          >
            <Sparkles size={12} />
            {generating ? "Drafting…" : "Re-draft with AI"}
          </button>
          <button
            className="flex items-center gap-1.5 rounded px-3 py-1.5 transition-colors"
            style={{ fontSize: 12, color: "#fff", background: "#0a0a0a", fontWeight: 400 }}
          >
            <Send size={11} />
            Send via Gmail
          </button>
        </div>
      </div>

      <div className="px-8 py-6 max-w-3xl mx-auto">
        {/* Warning */}
        {draftEmail.warnings.map((w) => (
          <div
            key={w}
            className="flex items-start gap-2 rounded-lg border px-4 py-3 mb-5"
            style={{ borderColor: "#fde68a", background: "#fefce8" }}
          >
            <span style={{ fontSize: 12, color: "#92400e" }}>⚠ {w}</span>
          </div>
        ))}

        {/* Compose card */}
        <div
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: "#e5e5e5", background: "#fff" }}
        >
          {/* Metadata rows */}
          <div className="border-b px-5 py-3 flex items-center gap-4" style={{ borderColor: "#e5e5e5" }}>
            <span style={{ fontSize: 12, color: "#a3a3a3", width: 60, flexShrink: 0, fontWeight: 300 }}>To</span>
            <div className="flex items-center gap-2 flex-1">
              <span
                className="rounded-full px-2.5 py-0.5"
                style={{ fontSize: 12, background: "#f5f5f5", color: "#0a0a0a", fontWeight: 400 }}
              >
                {draftEmail.professor}
              </span>
              <span style={{ fontSize: 12, color: "#a3a3a3" }}>{draftEmail.institution}</span>
            </div>
          </div>
          <div className="border-b px-5 py-3 flex items-center gap-4" style={{ borderColor: "#e5e5e5" }}>
            <span style={{ fontSize: 12, color: "#a3a3a3", width: 60, flexShrink: 0, fontWeight: 300 }}>Subject</span>
            <input
              defaultValue={draftEmail.subject}
              className="flex-1 outline-none bg-transparent"
              style={{ fontSize: 13, color: "#0a0a0a", fontWeight: 400 }}
            />
          </div>

          {/* Body */}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full outline-none resize-none p-5"
            style={{
              fontSize: 13,
              color: "#0a0a0a",
              lineHeight: 1.7,
              minHeight: 280,
              fontFamily: "var(--font-sans)",
              fontWeight: 300,
            }}
          />

          {/* Footer */}
          <div
            className="border-t px-5 py-3 flex items-center justify-between"
            style={{ borderColor: "#e5e5e5", background: "#fafafa" }}
          >
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 11.5, color: "#a3a3a3" }}>
                {body.split(/\s+/).filter(Boolean).length} words
              </span>
              <span
                className="rounded-full px-2 py-0.5"
                style={{
                  fontSize: 11,
                  background: draftEmail.confidence === "high" ? "#f0fdf4" : "#fef9c3",
                  color: draftEmail.confidence === "high" ? "#15803d" : "#a16207",
                  fontWeight: 500,
                }}
              >
                {draftEmail.confidence} confidence
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 11.5, color: "#a3a3a3", fontWeight: 300 }}>Tone: neutral · medium sentences</span>
            </div>
          </div>
        </div>

        {/* Citations */}
        <div className="mt-5">
          <p style={{ fontSize: 12, color: "#a3a3a3", fontWeight: 400, marginBottom: 10 }}>Citations used</p>
          <div className="flex flex-col gap-2">
            {[
              { claim: "B+ tree indexing for mixed workloads", source: "paper" as const, ref: "Kim et al., 2024" },
              { claim: "Query frequency histograms for split decisions", source: "paper" as const, ref: "Kim et al., 2024" },
              { claim: "Cal Poly SLO research on cost models", source: "profile" as const, ref: "User resume" },
            ].map((c) => (
              <div
                key={c.claim}
                className="flex items-center gap-3 rounded border px-4 py-2.5"
                style={{ borderColor: "#e5e5e5", background: "#fff" }}
              >
                <span
                  className="rounded px-1.5 py-0.5"
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: "0.03em",
                    textTransform: "uppercase",
                    background: c.source === "paper" ? "#dbeafe" : "#f0fdf4",
                    color: c.source === "paper" ? "#1d4ed8" : "#15803d",
                    flexShrink: 0,
                  }}
                >
                  {c.source}
                </span>
                <span style={{ fontSize: 12, color: "#525252", flex: 1, fontWeight: 300 }}>{c.claim}</span>
                <span style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 300 }}>{c.ref}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}