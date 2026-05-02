import { useState, useRef, useEffect } from "react";
import { ArrowUp, Paperclip, Loader2, Search, Mail, CheckCircle2, ArrowRight } from "lucide-react";
import { OutreachDraft, MOCK_DRAFTS } from "./mock-data";
import ioiaLogo from "figma:asset/ioia.png";
import { loadChatMessages, saveChatMessage } from "../../lib/db";

type ToolStep = {
  icon: "search" | "mail" | "check";
  label: string;
};

type Message = {
  id: string;
  role: "user" | "agent";
  content: string;
  steps?: ToolStep[];
  timestamp: string;
};

const SUGGESTIONS = [
  "Find ML professors at MIT and Stanford researching LLMs",
  "Draft outreach for NLP research at top-10 CS schools",
  "Who works on reinforcement learning at CMU or Berkeley?",
  "Show my pending replies from this week",
];

const MOCK_RESPONSES: Record<string, { content: string; steps: ToolStep[] }> = {
  default: {
    steps: [
      { icon: "search", label: "Searching professor database" },
      { icon: "search", label: "Filtering by research keywords" },
      { icon: "check", label: "Found 14 matching profiles" },
    ],
    content:
      "I found 14 professors matching your criteria across MIT, Stanford, and CMU. They're primarily working on large language models, attention mechanisms, and transformer architectures. I've added them to your Professors list — want me to draft personalized outreach emails for the top 5 by h-index?",
  },
};

function ToolStepRow({ step, delay }: { step: ToolStep; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const Icon = step.icon === "search" ? Search : step.icon === "mail" ? Mail : CheckCircle2;
  if (!visible) return null;
  return (
    <div
      className="flex items-center gap-2"
      style={{
        fontSize: 12,
        color: "#737373",
        fontWeight: 300,
        animation: "fadeSlideIn 0.25s ease",
      }}
    >
      <Icon size={12} style={{ color: step.icon === "check" ? "#16a34a" : "#a3a3a3", flexShrink: 0 }} />
      {step.label}
    </div>
  );
}

function AgentMessage({ msg, isNew }: { msg: Message; isNew?: boolean }) {
  const [showContent, setShowContent] = useState(false);
  const [thinkingDone, setThinkingDone] = useState(!isNew);

  useEffect(() => {
    if (!isNew) {
      setShowContent(true);
      setThinkingDone(true);
      return;
    }
    const stepsTotal = (msg.steps?.length ?? 0) * 600 + 400;
    const t1 = setTimeout(() => setThinkingDone(true), stepsTotal);
    const t2 = setTimeout(() => setShowContent(true), stepsTotal + 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isNew, msg.steps]);

  return (
    <div className="flex gap-3" style={{ animation: isNew ? "fadeSlideIn 0.3s ease" : "none" }}>
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5" style={{ width: 22, height: 22 }}>
        <img src={ioiaLogo} alt="ioia" style={{ width: 22, height: 22, borderRadius: 6, display: "block" }} />
      </div>

      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {/* Tool steps */}
        {isNew && msg.steps && (
          <div className="flex flex-col gap-1.5" style={{ paddingTop: 2 }}>
            {msg.steps.map((s, i) => (
              <ToolStepRow key={i} step={s} delay={i * 600 + 200} />
            ))}
          </div>
        )}

        {/* Thinking spinner */}
        {isNew && !thinkingDone && (
          <Loader2
            size={13}
            style={{ color: "#a3a3a3", animation: "spin 1s linear infinite" }}
          />
        )}

        {/* Response content */}
        {showContent && (
          <p
            style={{
              fontSize: 13.5,
              color: "#0a0a0a",
              lineHeight: 1.7,
              fontWeight: 300,
              animation: "fadeSlideIn 0.3s ease",
            }}
          >
            {msg.content}
          </p>
        )}

        <span style={{ fontSize: 11, color: "#d4d4d4", fontWeight: 300 }}>{msg.timestamp}</span>
      </div>
    </div>
  );
}

export function AgentView({
  onDraftsReady,
  onNavigateToOutreach,
}: {
  onDraftsReady?: (drafts: OutreachDraft[]) => void;
  onNavigateToOutreach?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  // Load persisted chat history on mount
  useEffect(() => {
    loadChatMessages().then((rows) => {
      if (rows.length === 0) return;
      const loaded: Message[] = rows.map((r) => ({
        id: r.id,
        role: r.role,
        content: r.content,
        steps: r.steps ?? undefined,
        timestamp: new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }));
      setMessages(loaded);
    });
  }, []);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const send = (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || isThinking) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: value,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsThinking(true);

    // Persist user message
    saveChatMessage({ id: userMsg.id, role: "user", content: userMsg.content, steps: null });

    const resp = MOCK_RESPONSES.default;
    const totalDelay = (resp.steps.length * 600) + 800;

    setTimeout(() => {
      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: resp.content,
        steps: resp.steps,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, agentMsg]);
      setIsThinking(false);
      onDraftsReady?.(MOCK_DRAFTS);
      // Persist agent message
      saveChatMessage({ id: agentMsg.id, role: "agent", content: agentMsg.content, steps: agentMsg.steps ?? null });
    }, totalDelay);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div
      className="flex flex-col flex-1 min-w-0 h-full relative"
      style={{ background: "#fafafa", fontFamily: "var(--font-sans)" }}
    >
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* ── Empty hero state ── */}
      {!hasMessages && (
        <div className="flex flex-col items-center justify-center flex-1 px-6" style={{ paddingBottom: 120 }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 300,
              color: "#0a0a0a",
              letterSpacing: "-0.03em",
              textAlign: "center",
              lineHeight: 1.2,
              maxWidth: 560,
              marginBottom: 10,
            }}
          >
            Find professors. Write emails.{" "}
            <span style={{ color: "#a3a3a3" }}>Get responses.</span>
          </h1>

          <p
            style={{
              fontSize: 14,
              color: "#a3a3a3",
              fontWeight: 300,
              textAlign: "center",
              marginBottom: 32,
              maxWidth: 400,
              lineHeight: 1.6,
            }}
          >
            Describe your research interests and ioia handles discovery, personalization, and outreach.
          </p>

          {/* Input card */}
          <InputCard
            value={input}
            onChange={(v) => { setInput(v); autoResize(); }}
            onSend={() => send()}
            onKeyDown={handleKey}
            textareaRef={textareaRef}
            disabled={isThinking}
            maxWidth={600}
          />

          {/* Suggestions */}
          <div className="flex flex-wrap gap-2 justify-center mt-5" style={{ maxWidth: 600 }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border px-3 py-1.5 transition-colors"
                style={{
                  fontSize: 12,
                  color: "#525252",
                  borderColor: "#e5e5e5",
                  background: "#fff",
                  fontWeight: 300,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Chat thread ── */}
      {hasMessages && (
        <div
          className="flex-1 overflow-y-auto px-6"
          style={{ paddingTop: 40, paddingBottom: 160 }}
        >
          <div className="mx-auto flex flex-col gap-6" style={{ maxWidth: 640 }}>
            {messages.map((msg, i) =>
              msg.role === "user" ? (
                <div key={msg.id} className="flex justify-end">
                  <div
                    className="rounded-2xl px-4 py-2.5"
                    style={{
                      background: "#fff",
                      border: "1px solid #e5e5e5",
                      fontSize: 13.5,
                      color: "#0a0a0a",
                      fontWeight: 300,
                      maxWidth: "80%",
                      lineHeight: 1.6,
                      animation: "fadeSlideIn 0.25s ease",
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div key={msg.id}>
                  <AgentMessage
                    msg={msg}
                    isNew={i === messages.length - 1}
                  />
                  {i === messages.length - 1 && onNavigateToOutreach && (
                    <button
                      onClick={onNavigateToOutreach}
                      className="flex items-center gap-2 mt-3 ml-8 rounded-lg px-4 py-2 border transition-colors"
                      style={{
                        fontSize: 12.5,
                        color: "#0a0a0a",
                        borderColor: "#e5e5e5",
                        background: "#fff",
                        fontWeight: 400,
                        animation: "fadeSlideIn 0.4s ease 0.3s both",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}
                    >
                      Review drafts in Outreach
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              )
            )}

            {/* Thinking state */}
            {isThinking && (
              <div className="flex gap-3 items-center" style={{ animation: "fadeSlideIn 0.25s ease" }}>
              <div className="flex-shrink-0" style={{ width: 22, height: 22 }}>
                <img src={ioiaLogo} alt="ioia" style={{ width: 22, height: 22, borderRadius: 6, display: "block" }} />
              </div>
                <Loader2 size={13} style={{ color: "#a3a3a3", animation: "spin 1s linear infinite" }} />
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>
      )}

      {/* ── Pinned input (chat mode) ── */}
      {hasMessages && (
        <div
          className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-4"
          style={{
            background: "linear-gradient(to top, #fafafa 70%, transparent)",
          }}
        >
          <div className="mx-auto" style={{ maxWidth: 640 }}>
            <InputCard
              value={input}
              onChange={(v) => { setInput(v); autoResize(); }}
              onSend={() => send()}
              onKeyDown={handleKey}
              textareaRef={textareaRef}
              disabled={isThinking}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Reusable input card ── */
function InputCard({
  value,
  onChange,
  onSend,
  onKeyDown,
  textareaRef,
  disabled,
  maxWidth,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  disabled?: boolean;
  maxWidth?: number;
}) {
  return (
    <div
      className="w-full rounded-2xl border flex flex-col"
      style={{
        maxWidth,
        background: "#fff",
        borderColor: "#e5e5e5",
        boxShadow: "0 2px 12px 0 rgba(0,0,0,0.05)",
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Describe who you're looking for — research area, school, keywords…"
        rows={2}
        disabled={disabled}
        className="w-full resize-none outline-none bg-transparent px-4 pt-4 pb-2"
        style={{
          fontSize: 14,
          color: "#0a0a0a",
          fontWeight: 300,
          lineHeight: 1.6,
          fontFamily: "var(--font-sans)",
          minHeight: 56,
          caretColor: "#0a0a0a",
        }}
      />

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-3 pb-3 pt-1">
        <button
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors"
          style={{ fontSize: 12.5, color: "#a3a3a3", fontWeight: 300 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#525252"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#a3a3a3"; }}
        >
          <Paperclip size={13} />
          Attach
        </button>

        <button
          onClick={onSend}
          disabled={!value.trim() || disabled}
          className="flex items-center justify-center rounded-lg transition-opacity"
          style={{
            width: 32,
            height: 32,
            background: !value.trim() || disabled ? "#e5e5e5" : "#0a0a0a",
            cursor: !value.trim() || disabled ? "default" : "pointer",
            transition: "background 0.15s",
          }}
        >
          <ArrowUp size={15} color={!value.trim() || disabled ? "#a3a3a3" : "#fff"} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}