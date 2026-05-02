"use client";

import { Search, ExternalLink, FileText } from "lucide-react";

const professors = [
  {
    id: "P001",
    name: "Dr. Sarah Chen",
    institution: "UC Berkeley",
    department: "EECS",
    concepts: ["Distributed Systems", "Consensus Protocols", "Fault Tolerance"],
    recentPaper: "Raft Revisited: Simplifying Consensus (2024)",
    matchScore: 0.94,
    email: "s.chen@berkeley.edu",
  },
  {
    id: "P002",
    name: "Dr. James Liu",
    institution: "UCLA",
    department: "CS",
    concepts: ["Program Synthesis", "Compiler Optimization", "PL Theory"],
    recentPaper: "Type-Directed Program Synthesis with LLMs (2024)",
    matchScore: 0.88,
    email: "j.liu@cs.ucla.edu",
  },
  {
    id: "P003",
    name: "Dr. Priya Nair",
    institution: "Cal Poly SLO",
    department: "CS",
    concepts: ["ML Interpretability", "Model Explanations", "Fairness"],
    recentPaper: "Feature Attribution at Scale (ICML 2023)",
    matchScore: 0.76,
    email: null,
  },
  {
    id: "P004",
    name: "Dr. Marcus Webb",
    institution: "UCLA",
    department: "CS",
    concepts: ["Operating Systems", "Schedulers", "Systems Programming"],
    recentPaper: "NUMA-Aware Scheduling for Heterogeneous Workloads (2024)",
    matchScore: 0.91,
    email: "m.webb@cs.ucla.edu",
  },
  {
    id: "P005",
    name: "Dr. Yuki Tanaka",
    institution: "UC Berkeley",
    department: "EECS",
    concepts: ["Formal Verification", "Property-Based Testing", "Static Analysis"],
    recentPaper: "Beyond Unit Tests: Property Checking in Production (2024)",
    matchScore: 0.89,
    email: "y.tanaka@berkeley.edu",
  },
  {
    id: "P006",
    name: "Dr. Elena Vasquez",
    institution: "Cal Poly SLO",
    department: "CS",
    concepts: ["Networking", "SDN", "Network Virtualization"],
    recentPaper: "Adaptive Flow Routing in SDN Environments (IEEE INFOCOM 2023)",
    matchScore: 0.72,
    email: null,
  },
];

export function ProfessorsView() {
  return (
    <main
      className="flex-1 overflow-y-auto"
      style={{ background: "#fafafa", fontFamily: "var(--font-sans)" }}
    >
      <div
        className="bg-white border-b px-8 py-3 flex items-center justify-between"
        style={{ borderColor: "#e5e5e5", minHeight: 48 }}
      >
        <span style={{ fontSize: 14, fontWeight: 400, color: "#0a0a0a" }}>Professors</span>
        <div
          className="flex items-center gap-2 rounded border px-3 py-1.5"
          style={{ borderColor: "#e5e5e5", background: "#fff", width: 200 }}
        >
          <Search size={12} color="#a3a3a3" />
          <input
            placeholder="Search professors…"
            className="flex-1 outline-none bg-transparent"
            style={{ fontSize: 12, color: "#0a0a0a" }}
          />
        </div>
      </div>

      <div className="px-8 py-6 max-w-5xl mx-auto">
        <div
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: "#e5e5e5", background: "#fff" }}
        >
          <div
            className="grid border-b"
            style={{
              borderColor: "#e5e5e5",
              gridTemplateColumns: "180px 120px 1fr 180px 70px",
              background: "#fafafa",
            }}
          >
            {["Name", "Institution", "Research concepts", "Recent paper", "Match"].map((h) => (
              <div
                key={h}
                className="px-4 py-2.5"
                style={{ fontSize: 11, fontWeight: 400, color: "#a3a3a3", letterSpacing: "0.03em", textTransform: "uppercase" }}
              >
                {h}
              </div>
            ))}
          </div>

          {professors.map((prof, i) => (
            <div
              key={prof.id}
              className="grid border-b group hover:bg-gray-50 transition-colors cursor-pointer"
              style={{
                borderColor: i === professors.length - 1 ? "transparent" : "#e5e5e5",
                gridTemplateColumns: "180px 120px 1fr 180px 70px",
              }}
            >
              <div className="px-4 py-3 flex flex-col justify-center gap-0.5">
                <span style={{ fontSize: 12.5, fontWeight: 400, color: "#0a0a0a" }}>{prof.name}</span>
                <span style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 300 }}>{prof.department}</span>
              </div>
              <div className="px-4 py-3 flex items-center">
                <span style={{ fontSize: 12, color: "#525252", fontWeight: 300 }}>{prof.institution}</span>
              </div>
              <div className="px-4 py-3 flex items-center gap-1.5 flex-wrap">
                {prof.concepts.slice(0, 2).map((c) => (
                  <span
                    key={c}
                    className="rounded-full px-2 py-0.5"
                    style={{ fontSize: 11, background: "#f5f5f5", color: "#525252", fontWeight: 300 }}
                  >
                    {c}
                  </span>
                ))}
              </div>
              <div className="px-4 py-3 flex items-center gap-1.5">
                <FileText size={11} color="#a3a3a3" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: 11.5,
                    color: "#525252",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: 300,
                  }}
                >
                  {prof.recentPaper}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center gap-1.5">
                <span style={{ fontSize: 12, color: "#0a0a0a", fontWeight: 400 }}>
                  {(prof.matchScore * 100).toFixed(0)}%
                </span>
                <ExternalLink size={11} color="#d4d4d4" className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}