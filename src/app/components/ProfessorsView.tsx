"use client";

import { useState, useMemo, useEffect } from "react";
import { ExternalLink, FileText, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import type { Professor } from "../../../cold_email_workflow/prompts/context";

// Institution color palette — grows dynamically
const INST_COLORS = [
  { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
  { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  { bg: "#fdf2f8", text: "#9d174d", border: "#fbcfe8" },
  { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
  { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe" },
  { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" },
];
const DEFAULT_COLOR = { bg: "#f5f5f5", text: "#525252", border: "#e5e5e5" };

type GroupBy = "institution" | "none";

function MatchBar({ score }: { score: number }) {
  const color = score >= 0.9 ? "#16a34a" : score >= 0.8 ? "#0a0a0a" : "#f59e0b";
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-full overflow-hidden" style={{ width: 40, height: 3, background: "#f0f0f0" }}>
        <div className="h-full rounded-full" style={{ width: `${score * 100}%`, background: color }} />
      </div>
      <span style={{ fontSize: 12, color: "#0a0a0a", fontWeight: 400, fontFamily: "var(--font-display)" }}>
        {(score * 100).toFixed(0)}%
      </span>
    </div>
  );
}

function ProfRow({
  prof, isLast, instColor, expanded, onToggle,
}: {
  prof: Professor;
  isLast: boolean;
  instColor: { bg: string; text: string; border: string };
  expanded: boolean;
  onToggle: () => void;
}) {
  const recentPaper = prof.recentPapers[0];
  return (
    <div style={{ borderBottom: isLast ? "none" : "1px solid #f0f0f0" }}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full grid group hover:bg-gray-50 transition-colors cursor-pointer text-left"
        style={{ gridTemplateColumns: "200px 110px 1fr 200px 110px" }}
      >
        <div className="px-5 py-3 flex flex-col justify-center gap-0.5">
          <span style={{ fontSize: 12.5, fontWeight: 400, color: "#0a0a0a" }}>{prof.name}</span>
          {prof.homepage && (
            <a
              href={prof.homepage}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              homepage ↗
            </a>
          )}
        </div>
        <div className="px-4 py-3 flex items-center">
          <span style={{ fontSize: 12, color: "#525252", fontWeight: 300 }}>{prof.affiliation}</span>
        </div>
        <div className="px-4 py-3 flex items-center gap-1.5 flex-wrap">
          {prof.concepts.slice(0, 3).map((c) => (
            <span
              key={c.name}
              className="rounded-full px-2 py-0.5"
              style={{ fontSize: 10.5, background: instColor.bg, color: instColor.text, border: `1px solid ${instColor.border}`, fontWeight: 300 }}
            >
              {c.name}
            </span>
          ))}
        </div>
        <div className="px-4 py-3 flex items-center gap-1.5 min-w-0">
          {recentPaper ? (
            <>
              <FileText size={11} color="#a3a3a3" style={{ flexShrink: 0 }} />
              <a
                href={recentPaper.url}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 11.5, color: "#525252", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                {recentPaper.title} ({recentPaper.year})
              </a>
            </>
          ) : (
            <span style={{ fontSize: 11.5, color: "#d4d4d4", fontWeight: 300 }}>No recent papers</span>
          )}
        </div>
        <div className="px-4 py-3 flex items-center gap-2 pr-6">
          <MatchBar score={prof.matchScore} />
          <ExternalLink size={11} color="#d4d4d4" className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </button>

      {expanded && (
        <div className="px-5 py-4" style={{ background: "#fff" }}>
          <div className="rounded-lg border" style={{ borderColor: "#f0f0f0", background: "#fafafa" }}>
            <div className="px-4 py-2 border-b" style={{ borderColor: "#f0f0f0" }}>
              <span style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Published Work
              </span>
              <span style={{ marginLeft: 8, fontSize: 11, color: "#d4d4d4", fontWeight: 300 }}>
                (recent)
              </span>
            </div>
            <div className="px-4 py-3 flex flex-col gap-2">
              {(prof.recentPapers ?? []).length === 0 && (
                <span style={{ fontSize: 12, color: "#a3a3a3", fontWeight: 300 }}>No papers available from OpenAlex.</span>
              )}
              {(prof.recentPapers ?? [])
                .slice()
                .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
                .slice(0, 8)
                .map((p) => (
                  <a
                    key={p.url}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2"
                    style={{ fontSize: 12.5, color: "#0a0a0a", fontWeight: 300, lineHeight: 1.5 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FileText size={12} color="#a3a3a3" />
                    <span style={{ color: "#525252" }}>{p.year}</span>
                    <span style={{ color: "#0a0a0a" }}>{p.title}</span>
                  </a>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfGroup({
  label, professors, colorIndex, expandedId, onToggleProf, defaultOpen = true,
}: {
  label: string; professors: Professor[]; colorIndex: number; defaultOpen?: boolean;
  expandedId: string | null;
  onToggleProf: (id: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const c = INST_COLORS[colorIndex % INST_COLORS.length];
  return (
    <div className="rounded-lg border overflow-hidden mb-4" style={{ borderColor: "#e5e5e5", background: "#fff" }}>
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-5 py-3 border-b transition-colors hover:bg-gray-50"
        style={{ borderColor: open ? "#e5e5e5" : "transparent", background: "#fafafa" }}>
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
            <ProfRow
              key={prof.id}
              prof={prof}
              isLast={i === professors.length - 1}
              instColor={c}
              expanded={expandedId === prof.id}
              onToggle={() => onToggleProf(prof.id)}
            />
          ))}
        </>
      )}
    </div>
  );
}

export function ProfessorsView() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>("institution");
  const [institutionFilter, setInstitutionFilter] = useState<string | null>(null);
  const [expandedProfId, setExpandedProfId] = useState<string | null>(null);
  const [source, setSource] = useState<"latest" | "all">("latest");

  useEffect(() => {
    // Load professor matches from the Agent tab (if any).
    // This view is intentionally read-only: no manual OpenAlex searching here.
    try {
      const rawLatest = localStorage.getItem("ioia:last_professors_batch");
      const rawAll = localStorage.getItem("ioia:last_professors");
      const raw = (source === "latest" ? rawLatest : rawAll) ?? rawAll ?? rawLatest;
      if (!raw) return;
      const parsed = JSON.parse(raw) as Professor[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setProfessors(parsed);
        setSearched(true);
      }
    } catch { /* ignore */ }
  }, [source]);

  const institutions = useMemo(() =>
    Array.from(new Set(professors.map((p) => p.affiliation))).sort(),
    [professors]
  );

  const instColorMap = useMemo(() => {
    const map = new Map<string, number>();
    institutions.forEach((inst, i) => map.set(inst, i));
    return map;
  }, [institutions]);

  const filtered = useMemo(() => {
    return professors.filter((p) => !institutionFilter || p.affiliation === institutionFilter);
  }, [professors, institutionFilter]);

  useEffect(() => {
    // Collapse expanded detail if it's not in the filtered list anymore.
    if (!expandedProfId) return;
    if (!filtered.some((p) => p.id === expandedProfId)) setExpandedProfId(null);
  }, [expandedProfId, filtered]);

  const groups = useMemo(() => {
    if (groupBy === "none") return [{ label: "All professors", professors: filtered, colorIndex: 0 }];
    const map = new Map<string, Professor[]>();
    filtered.forEach((p) => {
      if (!map.has(p.affiliation)) map.set(p.affiliation, []);
      map.get(p.affiliation)!.push(p);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, profs]) => ({ label, professors: profs, colorIndex: instColorMap.get(label) ?? 0 }));
  }, [filtered, groupBy, instColorMap]);

  return (
    <main className="flex flex-col flex-1 overflow-hidden" style={{ background: "#fafafa", fontFamily: "var(--font-sans)" }}>
      {/* Header */}
      <div className="bg-white border-b px-6 py-3 flex items-center gap-3" style={{ borderColor: "#e5e5e5", minHeight: 48 }}>
        <span style={{ fontSize: 14, fontWeight: 400, color: "#0a0a0a" }}>Professors</span>
        {professors.length > 0 && (
          <span className="rounded-full px-2 py-0.5" style={{ fontSize: 11, background: "#f5f5f5", color: "#737373", fontWeight: 400 }}>
            {filtered.length}
          </span>
        )}

        {professors.length > 0 && (
          <>
            <div style={{ width: 1, height: 16, background: "#e5e5e5" }} />
            {/* Institution filter pills */}
            <div className="flex items-center gap-1.5">
              <button onClick={() => setInstitutionFilter(null)}
                className="rounded-full px-3 py-1 transition-all"
                style={{ fontSize: 12, fontWeight: institutionFilter === null ? 400 : 300, color: institutionFilter === null ? "#0a0a0a" : "#737373", background: institutionFilter === null ? "#f0f0f0" : "transparent", border: "1px solid", borderColor: institutionFilter === null ? "#0a0a0a" : "#e5e5e5" }}>
                All
              </button>
              {institutions.map((inst) => {
                const active = institutionFilter === inst;
                const c = INST_COLORS[(instColorMap.get(inst) ?? 0) % INST_COLORS.length];
                return (
                  <button key={inst} onClick={() => setInstitutionFilter(active ? null : inst)}
                    className="rounded-full px-3 py-1 transition-all"
                    style={{ fontSize: 12, fontWeight: active ? 400 : 300, color: active ? c.text : "#737373", background: active ? c.bg : "transparent", border: "1px solid", borderColor: active ? c.border : "#e5e5e5" }}>
                    {inst}
                  </button>
                );
              })}
            </div>

            {/* Group toggle */}
            <div className="flex items-center gap-1 rounded-lg p-0.5 ml-auto" style={{ background: "#f5f5f5" }}>
              {([["institution", "By school"], ["none", "Flat"]] as [GroupBy, string][]).map(([val, label]) => (
                <button key={val} onClick={() => setGroupBy(val)} className="rounded-md px-3 py-1 transition-all"
                  style={{ fontSize: 12, fontWeight: groupBy === val ? 400 : 300, color: groupBy === val ? "#0a0a0a" : "#737373", background: groupBy === val ? "#fff" : "transparent", boxShadow: groupBy === val ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {professors.length === 0 && <div className="flex-1" />}
      </div>

      {/* Read-only notice */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between" style={{ borderColor: "#e5e5e5" }}>
        <span style={{ fontSize: 12.5, color: "#737373", fontWeight: 300 }}>
          Showing professors found by the agent.
        </span>
        <div className="flex items-center gap-1 rounded-lg border p-0.5" style={{ borderColor: "#e5e5e5", background: "#fafafa" }}>
          <button
            onClick={() => setSource("latest")}
            className="rounded-md px-3 py-1 transition-all"
            style={{
              fontSize: 12,
              fontWeight: source === "latest" ? 400 : 300,
              color: source === "latest" ? "#0a0a0a" : "#737373",
              background: source === "latest" ? "#fff" : "transparent",
              boxShadow: source === "latest" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            Latest chat
          </button>
          <button
            onClick={() => setSource("all")}
            className="rounded-md px-3 py-1 transition-all"
            style={{
              fontSize: 12,
              fontWeight: source === "all" ? 400 : 300,
              color: source === "all" ? "#0a0a0a" : "#737373",
              background: source === "all" ? "#fff" : "transparent",
              boxShadow: source === "all" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            All results
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading && (
          <div className="flex items-center justify-center h-48 gap-2">
            <Loader2 size={16} style={{ color: "#a3a3a3", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: 13, color: "#a3a3a3", fontWeight: 300 }}>Searching OpenAlex…</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <span style={{ fontSize: 13, color: "#ef4444", fontWeight: 300 }}>{error}</span>
          </div>
        )}

        {!loading && !error && !searched && (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <span style={{ fontSize: 13, color: "#a3a3a3", fontWeight: 300 }}>Ask the agent to find professors to populate this list.</span>
          </div>
        )}

        {!loading && !error && searched && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <span style={{ fontSize: 13, color: "#a3a3a3", fontWeight: 300 }}>No professors found. Try different keywords.</span>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            {groups.map((g, i) => (
              <ProfGroup
                key={g.label}
                label={g.label}
                professors={g.professors}
                colorIndex={g.colorIndex}
                expandedId={expandedProfId}
                onToggleProf={(id) => setExpandedProfId((cur) => (cur === id ? null : id))}
                defaultOpen={i < 3}
              />
            ))}
          </>
        )}
      </div>
    </main>
  );
}
