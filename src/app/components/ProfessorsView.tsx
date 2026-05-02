"use client";

import { useState, useMemo } from "react";
import { Search, ExternalLink, FileText, ChevronDown, ChevronRight, X } from "lucide-react";

type Professor = {
  id: string;
  name: string;
  institution: string;
  department: string;
  concepts: string[];
  recentPaper: string;
  matchScore: number;
  email: string | null;
};

const ALL_PROFESSORS: Professor[] = [
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

const ALL_INSTITUTIONS = Array.from(new Set(ALL_PROFESSORS.map((p) => p.institution))).sort();

// Soft tinted palette per institution — background + text + border
const INSTITUTION_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  "Cal Poly SLO": { bg: "#fdf2f8", text: "#9d174d", border: "#fbcfe8", dot: "#ec4899" },
  "UC Berkeley":  { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0", dot: "#22c55e" },
  "UCLA":         { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", dot: "#3b82f6" },
};
const DEFAULT_COLOR = { bg: "#f5f5f5", text: "#525252", border: "#e5e5e5", dot: "#a3a3a3" };

function getInstColor(inst: string) {
  return INSTITUTION_COLORS[inst] ?? DEFAULT_COLOR;
}

type GroupBy = "institution" | "none";

function MatchBar({ score }: { score: number }) {
  const color = score >= 0.9 ? "#16a34a" : score >= 0.8 ? "#0a0a0a" : "#f59e0b";
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-full overflow-hidden" style={{ width: 40, height: 3, background: "#f0f0f0" }}>
        <div className="h-full rounded-full" style={{ width: `${score * 100}%`, background: color }} />
      </div>
      <span style={{ fontSize: 12, color: "#0a0a0a", fontWeight: 400, fontFamily: "var(--font-display)" }}>{(score * 100).toFixed(0)}%</span>
    </div>
  );
}

function ProfRow({ prof, isLast, instColor }: { prof: Professor; isLast: boolean; instColor?: { bg: string; text: string; border: string; dot: string } }) {
  const c = instColor ?? DEFAULT_COLOR;
  return (
    <div
      className="grid group hover:bg-gray-50 transition-colors cursor-pointer"
      style={{
        gridTemplateColumns: "200px 110px 1fr 200px 110px",
        borderBottom: isLast ? "none" : "1px solid #f0f0f0",
      }}
    >
      <div className="px-5 py-3 flex flex-col justify-center gap-0.5">
        <span style={{ fontSize: 12.5, fontWeight: 400, color: "#0a0a0a" }}>{prof.name}</span>
        <span style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 300 }}>{prof.department}</span>
      </div>
      <div className="px-4 py-3 flex items-center">
        <span style={{ fontSize: 12, color: "#525252", fontWeight: 300 }}>{prof.institution}</span>
      </div>
      <div className="px-4 py-3 flex items-center gap-1.5 flex-wrap">
        {prof.concepts.map((concept) => (
          <span key={concept} className="rounded-full px-2 py-0.5" style={{ fontSize: 10.5, background: c.bg, color: c.text, border: `1px solid ${c.border}`, fontWeight: 300 }}>
            {concept}
          </span>
        ))}
      </div>
      <div className="px-4 py-3 flex items-center gap-1.5 min-w-0">
        <FileText size={11} color="#a3a3a3" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 11.5, color: "#525252", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 300 }}>
          {prof.recentPaper}
        </span>
      </div>
      <div className="px-4 py-3 flex items-center gap-2 pr-6">
        <MatchBar score={prof.matchScore} />
        {prof.email && (
          <ExternalLink size={11} color="#d4d4d4" className="opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </div>
  );
}

function ProfGroup({ label, professors, defaultOpen = true }: { label: string; professors: Professor[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const c = getInstColor(label);
  return (
    <div className="rounded-lg border overflow-hidden mb-4" style={{ borderColor: "#e5e5e5", background: "#fff" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-5 py-3 border-b transition-colors hover:bg-gray-50"
        style={{ borderColor: open ? "#e5e5e5" : "transparent", background: "#fafafa" }}
      >
        {open ? <ChevronDown size={13} color="#a3a3a3" /> : <ChevronRight size={13} color="#a3a3a3" />}
        <span style={{ fontSize: 13, fontWeight: 500, color: "#0a0a0a" }}>{label}</span>
        <span className="ml-auto rounded-full px-2 py-0.5" style={{ fontSize: 11, background: "#f0f0f0", color: "#a3a3a3", fontWeight: 400 }}>
          {professors.length}
        </span>
      </button>
      {open && (
        <>
          <div className="grid border-b" style={{ gridTemplateColumns: "200px 110px 1fr 200px 110px", borderColor: "#f5f5f5", background: "#fafafa" }}>
            {["Name", "Institution", "Research concepts", "Recent paper", "Match"].map((h) => (
              <div key={h} className="px-4 py-2" style={{ fontSize: 10.5, fontWeight: 400, color: "#b0b0b0", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                {h}
              </div>
            ))}
          </div>
          {professors.map((prof, i) => (
            <ProfRow key={prof.id} prof={prof} isLast={i === professors.length - 1} instColor={c} />
          ))}
        </>
      )}
    </div>
  );
}

export function ProfessorsView() {
  const [query, setQuery] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("institution");
  const [institutionFilter, setInstitutionFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return ALL_PROFESSORS.filter((p) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.institution.toLowerCase().includes(q) ||
        p.concepts.some((c) => c.toLowerCase().includes(q)) ||
        p.recentPaper.toLowerCase().includes(q);
      const matchesInst = !institutionFilter || p.institution === institutionFilter;
      return matchesQuery && matchesInst;
    });
  }, [query, institutionFilter]);

  const groups = useMemo(() => {
    if (groupBy === "none") return [{ label: "All professors", professors: filtered }];
    const map = new Map<string, Professor[]>();
    filtered.forEach((p) => {
      if (!map.has(p.institution)) map.set(p.institution, []);
      map.get(p.institution)!.push(p);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, professors]) => ({ label, professors }));
  }, [filtered, groupBy]);

  return (
    <main className="flex flex-col flex-1 overflow-hidden" style={{ background: "#fafafa", fontFamily: "var(--font-sans)" }}>
      {/* Header */}
      <div
        className="bg-white border-b px-6 py-3 flex items-center gap-3"
        style={{ borderColor: "#e5e5e5", minHeight: 48 }}
      >
        <span style={{ fontSize: 14, fontWeight: 400, color: "#0a0a0a" }}>Professors</span>
        <span className="rounded-full px-2 py-0.5" style={{ fontSize: 11, background: "#f5f5f5", color: "#737373", fontWeight: 400 }}>
          {filtered.length}
        </span>

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: "#e5e5e5" }} />

        {/* Institution filter pills */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setInstitutionFilter(null)}
            className="rounded-full px-3 py-1 transition-all"
            style={{
              fontSize: 12,
              fontWeight: institutionFilter === null ? 400 : 300,
              color: institutionFilter === null ? "#0a0a0a" : "#737373",
              background: institutionFilter === null ? "#f0f0f0" : "transparent",
              border: "1px solid",
              borderColor: institutionFilter === null ? "#0a0a0a" : "#e5e5e5",
            }}
          >
            All
          </button>
          {ALL_INSTITUTIONS.map((inst) => {
            const active = institutionFilter === inst;
            const c = getInstColor(inst);
            return (
              <button
                key={inst}
                onClick={() => setInstitutionFilter(active ? null : inst)}
                className="rounded-full px-3 py-1 transition-all"
                style={{
                  fontSize: 12,
                  fontWeight: active ? 400 : 300,
                  color: active ? c.text : "#737373",
                  background: active ? c.bg : "transparent",
                  border: "1px solid",
                  borderColor: active ? c.border : "#e5e5e5",
                }}
              >
                {inst}
              </button>
            );
          })}
        </div>

        {/* Group toggle */}
        <div className="flex items-center gap-1 rounded-lg p-0.5 ml-auto" style={{ background: "#f5f5f5" }}>
          {([["institution", "By school"], ["none", "Flat"]] as [GroupBy, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setGroupBy(val)}
              className="rounded-md px-3 py-1 transition-all"
              style={{
                fontSize: 12,
                fontWeight: groupBy === val ? 400 : 300,
                color: groupBy === val ? "#0a0a0a" : "#737373",
                background: groupBy === val ? "#fff" : "transparent",
                boxShadow: groupBy === val ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 rounded border px-3 py-1.5"
          style={{ borderColor: "#e5e5e5", background: "#fff", width: 200 }}
        >
          <Search size={12} color="#a3a3a3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="flex-1 outline-none bg-transparent"
            style={{ fontSize: 12, color: "#0a0a0a", fontFamily: "var(--font-sans)" }}
          />
          {query && (
            <button onClick={() => setQuery("")}>
              <X size={11} color="#a3a3a3" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <span style={{ fontSize: 13, color: "#a3a3a3", fontWeight: 300 }}>No professors match.</span>
            <button
              onClick={() => { setQuery(""); setInstitutionFilter(null); }}
              style={{ fontSize: 12.5, color: "#0a0a0a", fontWeight: 400 }}
              className="hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          groups.map((g, i) => (
            <ProfGroup key={g.label} label={g.label} professors={g.professors} defaultOpen={i < 3} />
          ))
        )}
      </div>
    </main>
  );
}
