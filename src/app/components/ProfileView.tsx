"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileText,
  Trash2,
  Check,
  User,
  BookOpen,
  Sliders,
  GraduationCap,
  ArrowLeft,
} from "lucide-react";

type Tab = "profile" | "resume" | "writing" | "style";

type UploadedFile = {
  id: string;
  name: string;
  size: string;
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
  onFiles,
  accept,
  label,
  sublabel,
}: {
  onFiles: (files: UploadedFile[]) => void;
  accept: string;
  label: string;
  sublabel: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (fileList: FileList) => {
    const uploaded: UploadedFile[] = Array.from(fileList).map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      size: formatSize(f.size),
    }));
    onFiles(uploaded);
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    },
    []
  );

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all"
      style={{
        borderColor: dragging ? "#0a0a0a" : "#e5e5e5",
        background: dragging ? "#f5f5f5" : "#fafafa",
        padding: "36px 24px",
        gap: 8,
      }}
    >
      <Upload size={18} style={{ color: dragging ? "#0a0a0a" : "#d4d4d4" }} />
      <span style={{ fontSize: 13, color: "#0a0a0a", fontWeight: 400 }}>{label}</span>
      <span style={{ fontSize: 12, color: "#a3a3a3", fontWeight: 300 }}>{sublabel}</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
    </div>
  );
}

function FileRow({
  file,
  onRemove,
}: {
  file: UploadedFile;
  onRemove: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg px-4 py-3 group border"
      style={{ background: "#fff", borderColor: "#f0f0f0" }}
    >
      <FileText size={14} style={{ color: "#a3a3a3", flexShrink: 0 }} />
      <div className="flex flex-col flex-1 min-w-0">
        <span
          style={{
            fontSize: 13,
            color: "#0a0a0a",
            fontWeight: 400,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {file.name}
        </span>
        <span style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 300 }}>
          {file.size}
        </span>
      </div>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: "#a3a3a3" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = "#ef4444";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = "#a3a3a3";
        }}
      >
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
    <label
      style={{
        fontSize: 11,
        color: "#a3a3a3",
        fontWeight: 400,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        display: "block",
        marginBottom: 6,
      }}
    >
      {children}
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full outline-none rounded-lg border px-3 py-2.5 transition-colors"
        style={{
          fontSize: 13,
          color: "#0a0a0a",
          fontWeight: 300,
          borderColor: "#e5e5e5",
          background: "#fff",
          fontFamily: "var(--font-sans)",
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "#0a0a0a";
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "#e5e5e5";
        }}
      />
    </div>
  );
}

interface ProfileViewProps {
  onBack: () => void;
}

export function ProfileView({ onBack }: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    name: "Rahul Thennarasu",
    university: "",
    year: "",
    major: "",
    gpa: "",
    researchInterests: "",
    bio: "",
  });

  const [resumeFiles, setResumeFiles] = useState<UploadedFile[]>([]);
  const [writingFiles, setWritingFiles] = useState<UploadedFile[]>([]);
  const [writingPaste, setWritingPaste] = useState("");

  const [style, setStyle] = useState<StylePrefs>({
    tone: "Conversational",
    length: "Moderate (2–3 paragraphs)",
    traits: ["Mentions specific papers", "Asks a genuine question"],
  });

  const toggleTrait = (t: string) =>
    setStyle((s) => ({
      ...s,
      traits: s.traits.includes(t)
        ? s.traits.filter((x) => x !== t)
        : [...s.traits, t],
    }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div
      className="flex flex-col flex-1 h-full overflow-hidden"
      style={{ background: "#fafafa", fontFamily: "var(--font-sans)" }}
    >
      {/* Top header */}
      <div
        className="flex items-center justify-between px-8 border-b flex-shrink-0"
        style={{ borderColor: "#e5e5e5", background: "#fff", height: 52 }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors"
            style={{ color: "#737373", fontSize: 12.5, fontWeight: 300 }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#f5f5f5";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <ArrowLeft size={13} />
            Back
          </button>
          <div style={{ width: 1, height: 16, background: "#e5e5e5" }} />
          <span style={{ fontSize: 13.5, fontWeight: 400, color: "#0a0a0a" }}>
            Your profile
          </span>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 transition-all"
          style={{
            fontSize: 13,
            fontWeight: 400,
            color: "#fff",
            background: saved ? "#16a34a" : "#0a0a0a",
            transition: "background 0.3s ease",
            minWidth: 72,
            justifyContent: "center",
          }}
        >
          {saved ? (
            <>
              <Check size={12} /> Saved
            </>
          ) : (
            "Save"
          )}
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left tab rail */}
        <div
          className="flex flex-col gap-0.5 p-3 border-r flex-shrink-0 overflow-y-auto"
          style={{ width: 200, borderColor: "#e5e5e5", background: "#fff" }}
        >
          <p
            style={{
              fontSize: 11,
              color: "#a3a3a3",
              fontWeight: 400,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "6px 10px 10px",
            }}
          >
            Sections
          </p>
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-left transition-colors"
                style={{
                  fontSize: 13,
                  color: isActive ? "#0a0a0a" : "#737373",
                  fontWeight: isActive ? 400 : 300,
                  background: isActive ? "#f5f5f5" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.background =
                      "#fafafa";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                }}
              >
                <span style={{ color: isActive ? "#0a0a0a" : "#b0b0b0" }}>
                  {tab.icon}
                </span>
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
                  <h2
                    style={{
                      fontSize: 16,
                      fontWeight: 400,
                      color: "#0a0a0a",
                      marginBottom: 4,
                    }}
                  >
                    Profile
                  </h2>
                  <p
                    style={{ fontSize: 13, color: "#a3a3a3", fontWeight: 300 }}
                  >
                    Basic info the agent uses to introduce you accurately.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <TextInput
                      label="Full name"
                      value={profile.name}
                      onChange={(v) =>
                        setProfile((p) => ({ ...p, name: v }))
                      }
                      placeholder="Your name"
                    />
                  </div>
                  <div className="flex-1">
                    <TextInput
                      label="Year"
                      value={profile.year}
                      onChange={(v) =>
                        setProfile((p) => ({ ...p, year: v }))
                      }
                      placeholder="e.g. Junior"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <TextInput
                      label="University"
                      value={profile.university}
                      onChange={(v) =>
                        setProfile((p) => ({ ...p, university: v }))
                      }
                      placeholder="e.g. MIT"
                    />
                  </div>
                  <div className="flex-1">
                    <TextInput
                      label="Major"
                      value={profile.major}
                      onChange={(v) =>
                        setProfile((p) => ({ ...p, major: v }))
                      }
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                </div>
                <TextInput
                  label="GPA (optional)"
                  value={profile.gpa}
                  onChange={(v) => setProfile((p) => ({ ...p, gpa: v }))}
                  placeholder="e.g. 3.9 / 4.0"
                />
                <div>
                  <SectionLabel>Research interests</SectionLabel>
                  <input
                    value={profile.researchInterests}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        researchInterests: e.target.value,
                      }))
                    }
                    placeholder="e.g. LLMs, RLHF, multimodal reasoning, embodied AI"
                    className="w-full outline-none rounded-lg border px-3 py-2.5 transition-colors"
                    style={{
                      fontSize: 13,
                      color: "#0a0a0a",
                      fontWeight: 300,
                      borderColor: "#e5e5e5",
                      fontFamily: "var(--font-sans)",
                    }}
                    onFocus={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "#0a0a0a";
                    }}
                    onBlur={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "#e5e5e5";
                    }}
                  />
                </div>
                <div>
                  <SectionLabel>Short bio</SectionLabel>
                  <textarea
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, bio: e.target.value }))
                    }
                    placeholder="A few sentences about yourself, your background, what you're looking for in research, and what makes you a strong candidate..."
                    rows={5}
                    className="w-full outline-none rounded-lg border px-3 py-2.5 resize-none transition-colors"
                    style={{
                      fontSize: 13,
                      color: "#0a0a0a",
                      fontWeight: 300,
                      lineHeight: 1.7,
                      borderColor: "#e5e5e5",
                      fontFamily: "var(--font-sans)",
                    }}
                    onFocus={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "#0a0a0a";
                    }}
                    onBlur={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "#e5e5e5";
                    }}
                  />
                </div>
              </div>
            )}

            {/* RESUME */}
            {activeTab === "resume" && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2
                    style={{
                      fontSize: 16,
                      fontWeight: 400,
                      color: "#0a0a0a",
                      marginBottom: 4,
                    }}
                  >
                    Resume
                  </h2>
                  <p
                    style={{ fontSize: 13, color: "#a3a3a3", fontWeight: 300 }}
                  >
                    The agent reads your resume to reference your experience,
                    projects, and skills — naturally, never copy-pasted.
                  </p>
                </div>
                <DropZone
                  onFiles={(f) => setResumeFiles((prev) => [...prev, ...f])}
                  accept=".pdf,.doc,.docx"
                  label="Drop your resume here"
                  sublabel="PDF, DOC, or DOCX · max 10 MB"
                />
                {resumeFiles.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <SectionLabel>Uploaded</SectionLabel>
                    {resumeFiles.map((f) => (
                      <FileRow
                        key={f.id}
                        file={f}
                        onRemove={() =>
                          setResumeFiles((prev) =>
                            prev.filter((x) => x.id !== f.id)
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* WRITING */}
            {activeTab === "writing" && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2
                    style={{
                      fontSize: 16,
                      fontWeight: 400,
                      color: "#0a0a0a",
                      marginBottom: 4,
                    }}
                  >
                    Writing samples
                  </h2>
                  <p
                    style={{ fontSize: 13, color: "#a3a3a3", fontWeight: 300 }}
                  >
                    Upload anything you've written — emails, essays, cover
                    letters, papers. The more you give, the better the agent
                    mirrors your actual voice.
                  </p>
                </div>
                <DropZone
                  onFiles={(f) => setWritingFiles((prev) => [...prev, ...f])}
                  accept=".pdf,.doc,.docx,.txt,.md"
                  label="Drop writing samples here"
                  sublabel="Emails, essays, cover letters, papers, anything"
                />
                {writingFiles.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <SectionLabel>Uploaded</SectionLabel>
                    {writingFiles.map((f) => (
                      <FileRow
                        key={f.id}
                        file={f}
                        onRemove={() =>
                          setWritingFiles((prev) =>
                            prev.filter((x) => x.id !== f.id)
                          )
                        }
                      />
                    ))}
                  </div>
                )}
                <div>
                  <SectionLabel>Or paste a sample directly</SectionLabel>
                  <textarea
                    value={writingPaste}
                    onChange={(e) => setWritingPaste(e.target.value)}
                    placeholder="Paste an email you've sent, a paragraph from an essay, or any writing that captures how you naturally communicate..."
                    rows={9}
                    className="w-full outline-none rounded-lg border px-3 py-3 resize-none transition-colors"
                    style={{
                      fontSize: 13,
                      color: "#0a0a0a",
                      fontWeight: 300,
                      lineHeight: 1.75,
                      borderColor: "#e5e5e5",
                      fontFamily: "var(--font-sans)",
                    }}
                    onFocus={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "#0a0a0a";
                    }}
                    onBlur={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "#e5e5e5";
                    }}
                  />
                </div>
              </div>
            )}

            {/* STYLE */}
            {activeTab === "style" && (
              <div className="flex flex-col gap-7">
                <div>
                  <h2
                    style={{
                      fontSize: 16,
                      fontWeight: 400,
                      color: "#0a0a0a",
                      marginBottom: 4,
                    }}
                  >
                    Style & tone
                  </h2>
                  <p
                    style={{ fontSize: 13, color: "#a3a3a3", fontWeight: 300 }}
                  >
                    Tell the agent how you want every email to feel.
                  </p>
                </div>

                {/* Tone */}
                <div>
                  <SectionLabel>Tone</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {TONE_OPTIONS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setStyle((s) => ({ ...s, tone: t }))}
                        className="rounded-lg px-4 py-2 border transition-all"
                        style={{
                          fontSize: 13,
                          color: style.tone === t ? "#fff" : "#525252",
                          background:
                            style.tone === t ? "#0a0a0a" : "#fff",
                          borderColor:
                            style.tone === t ? "#0a0a0a" : "#e5e5e5",
                          fontWeight: style.tone === t ? 400 : 300,
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Length */}
                <div>
                  <SectionLabel>Email length</SectionLabel>
                  <div className="flex flex-col gap-2">
                    {LENGTH_OPTIONS.map((l) => (
                      <button
                        key={l}
                        onClick={() => setStyle((s) => ({ ...s, length: l }))}
                        className="flex items-center gap-3 rounded-xl px-4 py-3.5 border text-left transition-all"
                        style={{
                          fontSize: 13,
                          color: style.length === l ? "#0a0a0a" : "#525252",
                          background:
                            style.length === l ? "#f5f5f5" : "#fff",
                          borderColor:
                            style.length === l ? "#0a0a0a" : "#e5e5e5",
                          fontWeight: style.length === l ? 400 : 300,
                        }}
                      >
                        <div
                          className="flex items-center justify-center rounded-full flex-shrink-0"
                          style={{
                            width: 16,
                            height: 16,
                            border: `1.5px solid ${
                              style.length === l ? "#0a0a0a" : "#d4d4d4"
                            }`,
                            background:
                              style.length === l ? "#0a0a0a" : "transparent",
                            transition: "all 0.15s",
                          }}
                        >
                          {style.length === l && (
                            <div
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "#fff",
                              }}
                            />
                          )}
                        </div>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Traits */}
                <div>
                  <SectionLabel>Writing traits</SectionLabel>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#a3a3a3",
                      fontWeight: 300,
                      marginBottom: 12,
                    }}
                  >
                    Select everything that should consistently appear in your
                    emails.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TRAIT_OPTIONS.map((t) => {
                      const on = style.traits.includes(t);
                      return (
                        <button
                          key={t}
                          onClick={() => toggleTrait(t)}
                          className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 border transition-all"
                          style={{
                            fontSize: 12.5,
                            color: on ? "#0a0a0a" : "#737373",
                            background: on ? "#f0f0f0" : "#fff",
                            borderColor: on ? "#0a0a0a" : "#e5e5e5",
                            fontWeight: on ? 400 : 300,
                          }}
                        >
                          {on && (
                            <Check
                              size={10}
                              style={{ flexShrink: 0, color: "#0a0a0a" }}
                            />
                          )}
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
