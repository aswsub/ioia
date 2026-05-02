"use client";

import { useState } from "react";
import { Play, Sparkles } from "lucide-react";

const defaultPrompt = `You are helping a student write a cold email to a professor.

Student interests: distributed systems, consensus protocols
Target professor: Dr. Sarah Chen (UC Berkeley)
Recent paper: "Raft Revisited: Simplifying Consensus" (2024)
Student experience: Built a simplified Raft implementation in Rust as part of a senior project.

Write a cold email under 150 words.`;

export function PlaygroundView() {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [output, setOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const handleRun = () => {
    setRunning(true);
    setOutput(null);
    const result = `Subject: Raft implementation questions — your 2024 consensus paper

Hi Dr. Chen,

Your Raft Revisited paper raised something I've been wondering about since building a simplified Raft implementation in Rust last semester: your note on linearizable reads without a round trip implies a subtle invariant about leader lease expiry. I found I needed to add a conservative padding constant to keep tests green.

I'd love to hear whether your team ran into similar edge cases, and whether there's a more principled fix. I'm also curious about your ongoing work on consensus in geo-distributed settings.

Happy to share my code if useful.

Best,
Rahul`;

    let i = 0;
    const interval = setInterval(() => {
      i += 8;
      setOutput(result.slice(0, i));
      if (i >= result.length) {
        clearInterval(interval);
        setRunning(false);
      }
    }, 16);
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
        <span style={{ fontSize: 14, fontWeight: 400, color: "#0a0a0a" }}>Playground</span>
        <div className="flex items-center gap-2">
          <span
            className="rounded px-2 py-0.5"
            style={{ fontSize: 11, background: "#f5f5f5", color: "#525252", fontWeight: 300 }}
          >
            claude-sonnet-4-5
          </span>
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-1.5 rounded px-3 py-1.5 transition-all"
            style={{
              fontSize: 12,
              color: "#fff",
              background: running ? "#525252" : "#0a0a0a",
              fontWeight: 400,
            }}
          >
            <Play size={11} />
            {running ? "Running…" : "Run"}
          </button>
        </div>
      </div>

      <div className="px-8 py-6 max-w-4xl mx-auto grid grid-cols-2 gap-5 h-[calc(100vh-100px)]">
        {/* Input */}
        <div className="flex flex-col gap-2">
          <p style={{ fontSize: 12, color: "#a3a3a3", fontWeight: 400 }}>Prompt</p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 rounded-lg border p-4 outline-none resize-none"
            style={{
              fontSize: 12.5,
              color: "#0a0a0a",
              borderColor: "#e5e5e5",
              background: "#fff",
              fontFamily: "var(--font-mono)",
              lineHeight: 1.7,
              fontWeight: 300,
            }}
          />
        </div>

        {/* Output */}
        <div className="flex flex-col gap-2">
          <p style={{ fontSize: 12, color: "#a3a3a3", fontWeight: 400 }}>Output</p>
          <div
            className="flex-1 rounded-lg border p-4 overflow-y-auto"
            style={{
              fontSize: 12.5,
              color: output ? "#0a0a0a" : "#d4d4d4",
              borderColor: "#e5e5e5",
              background: "#fff",
              fontFamily: "var(--font-sans)",
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
              fontWeight: 300,
            }}
          >
            {output || "Output will appear here…"}
            {running && (
              <span
                className="inline-block"
                style={{
                  width: 2,
                  height: 14,
                  background: "#0a0a0a",
                  marginLeft: 2,
                  verticalAlign: "text-bottom",
                  animation: "blink 1s step-end infinite",
                }}
              />
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </main>
  );
}