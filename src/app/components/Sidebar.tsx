import ioiaLogo from "figma:asset/ioia.png";
import {
  LayoutGrid,
  Send,
  Users,
  PenLine,
  Settings,
  ChevronDown,
  CircleUser,
  ChevronsUpDown,
} from "lucide-react";

type NavItem = {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: string;
};

const navItems: NavItem[] = [
  { label: "Overview", icon: <LayoutGrid size={14} />, active: true },
  { label: "Outreach", icon: <Send size={14} /> },
  { label: "Professors", icon: <Users size={14} /> },
  { label: "Compose", icon: <PenLine size={14} /> },
];

const quickAccess: NavItem[] = [
  { label: "Settings", icon: <Settings size={14} /> },
];

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  return (
    <aside
      className="flex flex-col h-full bg-white border-r"
      style={{ width: 176, borderColor: "#e5e5e5", fontFamily: "var(--font-sans)" }}
    >
      {/* Top brand */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: "#e5e5e5", minHeight: 48 }}
      >
        <img
          src={ioiaLogo}
          alt="ioia"
          style={{ height: 18, width: "auto", display: "block" }}
        />
        <ChevronsUpDown size={12} color="#999" style={{ marginLeft: "auto", flexShrink: 0 }} />
      </div>

      {/* Project */}
      <div className="px-3 pt-3 pb-1">
        <button
          className="flex items-center gap-1.5 w-full rounded px-2 py-1.5 hover:bg-gray-50 transition-colors"
          style={{ fontSize: 12, color: "#0a0a0a", fontWeight: 500 }}
        >
          <span
            className="flex items-center justify-center rounded-sm"
            style={{ width: 14, height: 14, background: "#e5e5e5", fontSize: 8, color: "#666", flexShrink: 0 }}
          >
            P
          </span>
          My Outreach
          <ChevronDown size={11} color="#999" style={{ marginLeft: "auto" }} />
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex flex-col gap-0.5 px-2 pt-1">
        {navItems.map((item) => {
          const isActive = item.label === activeView;
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.label)}
              className="flex items-center gap-2 w-full rounded px-2 py-1.5 transition-colors text-left"
              style={{
                fontSize: 12.5,
                color: isActive ? "#0a0a0a" : "#525252",
                fontWeight: isActive ? 400 : 300,
                background: isActive ? "#f5f5f5" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "#fafafa";
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <span style={{ color: isActive ? "#0a0a0a" : "#a3a3a3", flexShrink: 0 }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Quick access */}
      <div className="px-3 pb-1">
        <nav className="flex flex-col gap-0.5">
          {quickAccess.map((item) => (
            <button
              key={item.label}
              className="flex items-center gap-2 w-full rounded px-2 py-1.5 transition-colors text-left"
              style={{ fontSize: 12.5, color: "#525252", fontWeight: 400 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#fafafa"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span style={{ color: "#a3a3a3", flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Usage */}
      <div
        className="px-3 py-2 border-t"
        style={{ borderColor: "#e5e5e5" }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span style={{ fontSize: 11.5, color: "#525252", fontWeight: 400 }}>Usage</span>
          <span
            className="rounded px-1.5 py-0.5 cursor-pointer"
            style={{ fontSize: 10.5, color: "#0a0a0a", background: "#f0f0f0", fontWeight: 400 }}
          >
            Free
          </span>
        </div>
        <div className="rounded-full overflow-hidden" style={{ height: 3, background: "#e5e5e5" }}>
          <div className="h-full rounded-full" style={{ width: "43%", background: "#0a0a0a" }} />
        </div>
        <p style={{ fontSize: 10.5, color: "#a3a3a3", marginTop: 5 }}>3 / 7 emails drafted</p>
      </div>

      {/* User */}
      <div
        className="px-3 py-2.5 border-t flex items-center gap-2 cursor-pointer transition-colors"
        style={{ borderColor: "#e5e5e5" }}
        onClick={() => onNavigate("Profile")}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 22, height: 22, background: "#e5e5e5", flexShrink: 0 }}
        >
          <CircleUser size={13} color="#666" />
        </div>
        <span style={{ fontSize: 12, color: "#0a0a0a", fontWeight: 300 }}>Rahul Thennarasu</span>
      </div>
    </aside>
  );
}