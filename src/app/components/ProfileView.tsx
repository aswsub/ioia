"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload, FileText, Trash2, Check, User, BookOpen,
  Sliders, GraduationCap, ArrowLeft, Loader2,
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { loadUserProfile, saveUserProfile } from "../../lib/db";
import { extractTextFromFile } from "../../lib/ocr";
import { extractToneFromSample } from "../../lib/claude";

type Tab = "profile" | "resume" | "writing" | "style";

type UploadedFile = {
  id: string;
  name: string;
  size: string;
  text: string; // extracted text
};

type ProfileData = {
  name: string;
  university: string;
  year: string;
  major: string;
  gpa: string;
  researchInterests: string;
  bio: string;
};

type StylePrefs = {
  tone: string;
  length: string;
  traits: string[];
  signaturePhrases: string[];
  avoidPhrases: string[];
  confidence: string;
};

const TONE_OPTIONS = ["Conversational", "Formal", "Direct", "Enthusiastic", "Humble"];
const LENGTH_OPTIONS = [
  "Concise (3–4 sentences)",
  "Moderate (2–3 paragraphs)",
  "Detailed (4+ paragraphs)",
];
const TRAIT_OPTIONS = [
  "Mentions specific papers",
  "Asks a genuine question",
  "References shared interests",
  "Avoids buzzwords",
  "Uses first name",
  "Mentions career goals",
  "Keeps it personal",
  "Data-driven language",
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DropZone({
  onFiles, accept, label, sublabel, loading,
}: {
  onFiles: (files: UploadedFile[]) => void;
  accept: string;
  label: string;
  sublabel: string;
  loading?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = async (fileList: FileList) => {
    const results: UploadedFile[] = [];
    for (const f of Array.from(fileList)) {
      const text = await extractTextFromFile(f);
      results.push({ id: Math.random().toString(36).slice(2), name: f.name, size: formatSize(f.size), text });
    }
    onFiles(results);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, []);

  return (
    <div
      onClick={() => !loading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all"
      style={{
        borderColor: dragging ? "#0a0a0a" : "#e5e5e5",
        background: dragging ? "#f5f5f5" : "#fafafa",
        padding: "36px 24px",
        gap: 8,
        cursor: loading ? "default" : "pointer",
      }}
    >
      {loading
        ? <Loader2 size={18} style={{ color: "#a3a3a3", animation: "spin 1s linear infinite" }} />
        : <Upload size={18} style={{ color: dragging ? "#0a0a0a" : "#d4d4d4" }} />}
      <span style={{ fontSize: 13, color: "#0a0a0a", fontWeight: 400 }}>
        {loading ? "Extracting text…" : label}
      </span>
      <span style={{ fontSize: 12, color: "#a3a3a3", fontWeight: 300 }}>{sublabel}</span>
      <input ref={inputRef} type="file" accept={accept} multiple className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)} />
    </div>
  );
}

function FileRow({ file, onRemove }: { file: UploadedFile; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-4 py-3 group border" style={{ background: "#fff", borderColor: "#f0f0f0" }}>
      <FileText size={14} style={{ color: "#a3a3a3", flexShrink: 0 }} />
      <div className="flex flex-col flex-1 min-w-0">
        <span style={{ fontSize: 13, color: "#0a0a0a", fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {file.name}
        </span>
        <span style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 300 }}>{file.size}</span>
      </div>
      <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#a3a3a3" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#a3a3a3"; }}>
        <Trash2 size={13} />
      </button>
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <User size={13} /> },
  { id: "resume", label: "Resume", icon: <GraduationCap size={13} /> },
  { id: "writing", label: "Writing samples", icon: <BookOpen size={13} /> },
  { id: "style", label: "Style & tone", icon: <Sliders size={13} /> },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 400, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
      {children}
    </label>
  );
}

function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full outline-none rounded-lg border px-3 py-2.5 transition-colors"
        style={{ fontSize: 13, color: "#0a0a0a", fontWeight: 300, borderColor: "#e5e5e5", background: "#fff", fontFamily: "var(--font-sans)" }}
        onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#0a0a0a"; }}
        onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e5e5e5"; }} />
    </div>
  );
}

interface ProfileViewProps {
  onBack: () => void;
}

export function ProfileView({ onBack }: ProfileViewProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extractingTone, setExtractingTone] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingWriting, setUploadingWriting] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    name: user?.user_metadata?.full_name ?? "",
    university: "", year: "", major: "", gpa: "", researchInterests: "", bio: "",
  });

  const [resumeFiles, setResumeFiles] = useState<UploadedFile[]>([]);
  const [writingFiles, setWritingFiles] = useState<UploadedFile[]>([]);
  const [writingPaste, setWritingPaste] = useState("");

  const [style, setStyle] = useState<StylePrefs>({
    tone: "Conversational",
    length: "Moderate (2–3 paragraphs)",
    traits: ["Mentions specific papers", "Asks a genuine question"],
    signaturePhrases: [],
    avoidPhrases: [],
    confidence: "low",
  });

  // Load saved profile on mount
  useEffect(() => {
    if (!user) return;
    loadUserProfile(user.id).then((p) => {
      if (!p) return;
      setProfile({
        name: p.full_name,
        university: p.university,
        year: p.year,
        major: p.major,
        gpa: p.gpa?.toString() ?? "",
        researchInterests: p.research_interests.join(", "),
        bio: p.short_bio,
      });
      setStyle((s) => ({
        ...s,
        tone: p.tone_voice || s.tone,
        length: p.tone_length || s.length,
        traits: p.tone_traits.length ? p.tone_traits : s.traits,
        signaturePhrases: p.tone_signature_phrases,
        avoidPhrases: p.tone_avoid_phrases,
        confidence: p.tone_confidence,
      }));
      // Restore file placeholders so the user sees what was previously saved
      if (p.resume_text) {
        setResumeFiles([{ id: "saved_resume", name: "Saved resume", size: `${(p.resume_text.length / 1024).toFixed(1)} KB`, text: p.resume_text }]);
      }
      if (p.writing_sample_text) {
        setWritingFiles([{ id: "saved_writing", name: "Saved writing sample", size: `${(p.writing_sample_text.length / 1024).toFixed(1)} KB`, text: p.writing_sample_text }]);
      }
    });
  }, [user]);

  // Helper: persist current state to Supabase immediately
  const autosave = async (overrides: {
    resumeFiles?: UploadedFile[];
    writingFiles?: UploadedFile[];
    writingPaste?: string;
    style?: StylePrefs;
    profile?: ProfileData;
  } = {}) => {
    if (!user) return;
    const rf = overrides.resumeFiles ?? resumeFiles;
    const wf = overrides.writingFiles ?? writingFiles;
    const wp = overrides.writingPaste ?? writingPaste;
    const st = overrides.style ?? style;
    const pr = overrides.profile ?? profile;

    await saveUserProfile({
      id: user.id,
      full_name: pr.name,
      university: pr.university,
      major: pr.major,
      year: pr.year,
      gpa: pr.gpa ? parseFloat(pr.gpa) : null,
      research_interests: pr.researchInterests.split(",").map((s) => s.trim()).filter(Boolean),
      short_bio: pr.bio,
      resume_text: rf.map((f) => f.text).join("\n\n") || null,
      writing_sample_text: wf.map((f) => f.text).join("\n\n") || wp || null,
      tone_voice: st.tone.toLowerCase(),
      tone_length: st.length.split(" ")[0].toLowerCase(),
      tone_traits: st.traits,
      tone_signature_phrases: st.signaturePhrases,
      tone_avoid_phrases: st.avoidPhrases,
      tone_confidence: st.confidence,
    });
  };

  // Auto-extract tone when writing files or paste changes
  const runToneExtraction = async (text: string, currentWritingFiles: UploadedFile[], currentPaste: string) => {
    if (!text.trim() || text.trim().length < 50) return;
    setExtractingTone(true);
    try {
      const extracted = await extractToneFromSample(text);
      const newStyle = (s: StylePrefs) => ({
        ...s,
        signaturePhrases: extracted.signaturePhrases,
        avoidPhrases: extracted.avoidPhrases,
        confidence: extracted.confidence,
      });
      setStyle((s) => {
        const updated = newStyle(s);
        // Autosave with updated tone
        autosave({ style: updated, writingFiles: currentWritingFiles, writingPaste: currentPaste });
        return updated;
      });
    } catch (e) {
      console.error("Tone extraction failed:", e);
    } finally {
      setExtractingTone(false);
    }
  };

  const handleResumeFiles = async (files: UploadedFile[]) => {
    setUploadingResume(false);
    const updated = [...resumeFiles, ...files];
    setResumeFiles(updated);
    // Autosave immediately after upload
    await autosave({ resumeFiles: updated });
  };

  const handleWritingFiles = async (files: UploadedFile[]) => {
    setUploadingWriting(false);
    const updated = [...writingFiles, ...files];
    setWritingFiles(updated);
    // Autosave immediately after upload
    await autosave({ writingFiles: updated });
    const combined = files.map((f) => f.text).join("\n\n");
    if (combined.trim()) runToneExtraction(combined, updated, writingPaste);
  };

  const handlePasteBlur = () => {
    if (writingPaste.trim().length >= 50) {
      autosave({ writingPaste });
      runToneExtraction(writingPaste, writingFiles, writingPaste);
    }
  };

  const toggleTrait = (t: string) =>
    setStyle((s) => ({ ...s, traits: s.traits.includes(t) ? s.traits.filter((x) => x !== t) : [...s.traits, t] }));

  // Autosave style changes 800ms after the user stops interacting
  const styleRef = useRef(style);
  styleRef.current = style;
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      autosave({ style: styleRef.current });
    }, 800);
    return () => clearTimeout(timer);
  }, [style.tone, style.length, style.traits.join(","), user]);

  // Autosave profile fields 1s after the user stops typing
  const profileRef = useRef(profile);
  profileRef.current = profile;
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      autosave({ profile: profileRef.current });
    }, 1000);
    return () => clearTimeout(timer);
  }, [profile.name, profile.university, profile.major, profile.year, profile.gpa, profile.researchInterests, profile.bio, user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const resumeText = resumeFiles.map((f) => f.text).join("\n\n") || null;
    const writingText = writingFiles.map((f) => f.text).join("\n\n") || writingPaste || null;

    await saveUserProfile({
      id: user.id,
      full_name: profile.name,
      university: profile.university,
      major: profile.major,
      year: profile.year,
      gpa: profile.gpa ? parseFloat(profile.gpa) : null,
      research_interests: profile.researchInterests.split(",").map((s) => s.trim()).filter(Boolean),
      short_bio: profile.bio,
      resume_text: resumeText,
      writing_sample_text: writingText,
      tone_voice: style.tone.toLowerCase(),
      tone_length: style.length.split(" ")[0].toLowerCase(),
      tone_traits: style.traits,
      tone_signature_phrases: style.signaturePhrases,
      tone_avoid_phrases: style.avoidPhrases,
      tone_confidence: style.confidence,
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden" style={{ background: "#fafafa", fontFamily: "var(--font-sans)" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Top header */}
      <div className="flex items-center justify-between px-8 border-b flex-shrink-0" style={{ borderColor: "#e5e5e5", background: "#fff", height: 52 }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors"
            style={{ color: "#737373", fontSize: 12.5, fontWeight: 300 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            <ArrowLeft size={13} /> Back
          </button>
          <div style={{ width: 1, height: 16, background: "#e5e5e5" }} />
          <span style={{ fontSize: 13.5, fontWeight: 400, color: "#0a0a0a" }}>Your profile</span>
          {extractingTone && (
            <div className="flex items-center gap-1.5" style={{ fontSize: 11.5, color: "#a3a3a3", fontWeight: 300 }}>
              <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
              Extracting tone…
            </div>
          )}
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 transition-all"
          style={{ fontSize: 13, fontWeight: 400, color: "#fff", background: saved ? "#16a34a" : "#0a0a0a", minWidth: 72, justifyContent: "center", opacity: saving ? 0.6 : 1 }}>
          {saved ? <><Check size={12} /> Saved</> : saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left tab rail */}
        <div className="flex flex-col gap-0.5 p-3 border-r flex-shrink-0 overflow-y-auto" style={{ width: 200, borderColor: "#e5e5e5", background: "#fff" }}>
          <p style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 400, letterSpacing: "0.06em", textTransform: "uppercase", padding: "6px 10px 10px" }}>Sections</p>
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-left transition-colors"
                style={{ fontSize: 13, color: isActive ? "#0a0a0a" : "#737373", fontWeight: isActive ? 400 : 300, background: isActive ? "#f5f5f5" : "transparent" }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#fafafa"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <span style={{ color: isActive ? "#0a0a0a" : "#b0b0b0" }}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          <div style={{ maxWidth: 600, padding: "36px 48px" }}>

            {/* PROFILE */}
            {activeTab === "profile" && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 400, color: "#0a0a0a", marginBottom: 4 }}>Profile</h2>
                  <p style={{ fontSize: 13, color: "#a3a3a3", fontWeight: 300 }}>Basic info the agent uses to introduce you accurately.</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1"><TextInput label="Full name" value={profile.name} onChange={(v) => setProfile((p) => ({ ...p, name: v }))} placeholder="Your name" /></div>
                  <div className="flex-1"><TextInput label="Year" value={profile.year} onChange={(v) => setProfile((p) => ({ ...p, year: v }))} placeholder="e.g. Junior" /></div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1"><TextInput label="University" value={profile.university} onChange={(v) => setProfile((p) => ({ ...p, university: v }))} placeholder="e.g. MIT" /></div>
                  <div className="flex-1"><TextInput label="Major" value={profile.major} onChange={(v) => setProfile((p) => ({ ...p, major: v }))} placeholder="e.g. Computer Science" /></div>
                </div>
                <TextInput label="GPA (optional)" value={profile.gpa} onChange={(v) => setProfile((p) => ({ ...p, gpa: v }))} placeholder="e.g. 3.9 / 4.0" />
                <div>
                  <SectionLabel>Research interests</SectionLabel>
                  <input value={profile.researchInterests} onChange={(e) => setProfile((p) => ({ ...p, researchInterests: e.target.value }))}
                    placeholder="e.g. LLMs, RLHF, multimodal reasoning, embodied AI"
                    className="w-full outline-none rounded-lg border px-3 py-2.5 transition-colors"
                    style={{ fontSize: 13, color: "#0a0a0a", fontWeight: 300, borderColor: "#e5e5e5", fontFamily: "var(--font-sans)" }}
                    onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#0a0a0a"; }}
                    onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e5e5e5"; }} />
                </div>
                <div>
                  <SectionLabel>Short bio</SectionLabel>
                  <textarea value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="A few sentences about yourself, your background, what you're looking for in research..."
                    rows={5} className="w-full outline-none rounded-lg border px-3 py-2.5 resize-none transition-colors"
                    style={{ fontSize: 13, color: "#0a0a0a", fontWeight: 300, lineHeight: 1.7, borderColor: "#e5e5e5", fontFamily: "var(--font-sans)" }}
                    onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#0a0a0a"; }}
                    onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e5e5e5"; }} />
                </div>
              </div>
            )}

            {/* RESUME */}
            {activeTab === "resume" && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 400, color: "#0a0a0a", marginBottom: 4 }}>Resume</h2>
                  <p style={{ fontSize: 13, color: "#a3a3a3", fontWeight: 300 }}>The agent reads your resume to reference your experience, projects, and skills — naturally, never copy-pasted.</p>
                </div>
                <DropZone onFiles={handleResumeFiles} accept=".pdf,.doc,.docx,.txt"
                  label="Drop your resume here" sublabel="PDF, DOC, DOCX, or TXT · max 10 MB" loading={uploadingResume} />
                {resumeFiles.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <SectionLabel>Uploaded</SectionLabel>
                    {resumeFiles.map((f) => (
                      <div key={f.id}>
                        <FileRow file={f} onRemove={() => setResumeFiles((prev) => prev.filter((x) => x.id !== f.id))} />
                        {f.text ? (
                          <p style={{ fontSize: 11, color: "#16a34a", fontWeight: 300, marginTop: 4, marginLeft: 4 }}>
                            ✓ {f.text.length.toLocaleString()} characters extracted
                          </p>
                        ) : (
                          <p style={{ fontSize: 11, color: "#f59e0b", fontWeight: 300, marginTop: 4, marginLeft: 4 }}>
                            ⚠ No text extracted — try a text-based PDF
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* WRITING */}
            {activeTab === "writing" && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 400, color: "#0a0a0a", marginBottom: 4 }}>Writing samples</h2>
                  <p style={{ fontSize: 13, color: "#a3a3a3", fontWeight: 300 }}>Upload anything you've written. The agent extracts your voice automatically and uses it to personalize every email.</p>
                </div>
                <DropZone onFiles={handleWritingFiles} accept=".pdf,.doc,.docx,.txt,.md"
                  label="Drop writing samples here" sublabel="Emails, essays, cover letters, papers" loading={uploadingWriting} />
                {writingFiles.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <SectionLabel>Uploaded</SectionLabel>
                    {writingFiles.map((f) => (
                      <div key={f.id}>
                        <FileRow file={f} onRemove={() => setWritingFiles((prev) => prev.filter((x) => x.id !== f.id))} />
                        {f.text ? (
                          <p style={{ fontSize: 11, color: "#16a34a", fontWeight: 300, marginTop: 4, marginLeft: 4 }}>
                            ✓ {f.text.length.toLocaleString()} characters extracted
                          </p>
                        ) : (
                          <p style={{ fontSize: 11, color: "#f59e0b", fontWeight: 300, marginTop: 4, marginLeft: 4 }}>
                            ⚠ No text extracted — try a text-based PDF or paste directly below
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <SectionLabel>Or paste a sample directly</SectionLabel>
                  <textarea value={writingPaste} onChange={(e) => setWritingPaste(e.target.value)} onBlur={handlePasteBlur}
                    placeholder="Paste an email you've sent, a paragraph from an essay, or any writing that captures how you naturally communicate..."
                    rows={9} className="w-full outline-none rounded-lg border px-3 py-3 resize-none transition-colors"
                    style={{ fontSize: 13, color: "#0a0a0a", fontWeight: 300, lineHeight: 1.75, borderColor: "#e5e5e5", fontFamily: "var(--font-sans)" }}
                    onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#0a0a0a"; }} />
                </div>
                {style.signaturePhrases.length > 0 && (
                  <div className="rounded-lg border px-4 py-3" style={{ borderColor: "#f0f0f0", background: "#fafafa" }}>
                    <p style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 400, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>
                      Extracted tone · {style.confidence} confidence
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {style.signaturePhrases.map((p) => (
                        <span key={p} className="rounded-full px-2.5 py-1" style={{ fontSize: 11.5, background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", fontWeight: 300 }}>{p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STYLE */}
            {activeTab === "style" && (
              <div className="flex flex-col gap-7">
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 400, color: "#0a0a0a", marginBottom: 4 }}>Style & tone</h2>
                  <p style={{ fontSize: 13, color: "#a3a3a3", fontWeight: 300 }}>Tell the agent how you want every email to feel.</p>
                </div>
                <div>
                  <SectionLabel>Tone</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {TONE_OPTIONS.map((t) => (
                      <button key={t} onClick={() => setStyle((s) => ({ ...s, tone: t }))}
                        className="rounded-lg px-4 py-2 border transition-all"
                        style={{ fontSize: 13, color: style.tone === t ? "#fff" : "#525252", background: style.tone === t ? "#0a0a0a" : "#fff", borderColor: style.tone === t ? "#0a0a0a" : "#e5e5e5", fontWeight: style.tone === t ? 400 : 300 }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <SectionLabel>Email length</SectionLabel>
                  <div className="flex flex-col gap-2">
                    {LENGTH_OPTIONS.map((l) => (
                      <button key={l} onClick={() => setStyle((s) => ({ ...s, length: l }))}
                        className="flex items-center gap-3 rounded-xl px-4 py-3.5 border text-left transition-all"
                        style={{ fontSize: 13, color: style.length === l ? "#0a0a0a" : "#525252", background: style.length === l ? "#f5f5f5" : "#fff", borderColor: style.length === l ? "#0a0a0a" : "#e5e5e5", fontWeight: style.length === l ? 400 : 300 }}>
                        <div className="flex items-center justify-center rounded-full flex-shrink-0"
                          style={{ width: 16, height: 16, border: `1.5px solid ${style.length === l ? "#0a0a0a" : "#d4d4d4"}`, background: style.length === l ? "#0a0a0a" : "transparent", transition: "all 0.15s" }}>
                          {style.length === l && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                        </div>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <SectionLabel>Writing traits</SectionLabel>
                  <p style={{ fontSize: 12, color: "#a3a3a3", fontWeight: 300, marginBottom: 12 }}>Select everything that should consistently appear in your emails.</p>
                  <div className="flex flex-wrap gap-2">
                    {TRAIT_OPTIONS.map((t) => {
                      const on = style.traits.includes(t);
                      return (
                        <button key={t} onClick={() => toggleTrait(t)}
                          className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 border transition-all"
                          style={{ fontSize: 12.5, color: on ? "#0a0a0a" : "#737373", background: on ? "#f0f0f0" : "#fff", borderColor: on ? "#0a0a0a" : "#e5e5e5", fontWeight: on ? 400 : 300 }}>
                          {on && <Check size={10} style={{ flexShrink: 0, color: "#0a0a0a" }} />}
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
