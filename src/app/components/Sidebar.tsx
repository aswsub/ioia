import ioiaLogo from "figma:asset/ioia.png";
import {
  LayoutGrid,
  Send,
  Users,
  ChevronDown,
  CircleUser,
  ChevronsUpDown,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../lib/auth";

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
];

const quickAccess: NavItem[] = [];

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  const { user, signOut } = useAuth();
  const displayName = user?.user_metadata?.full_name ?? user?.email ?? "You";
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
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 28, height: 28, borderRadius: 6, background: "#fff" }}
        >
          <img
            src={ioiaLogo}
            alt="ioia"
            style={{
              height: 22,
              width: 22,
              display: "block",
              borderRadius: 5,
              objectFit: "contain",
              objectPosition: "center",
            }}
          />
        </div>
        <span style={{ fontSize: 12, color: "#0a0a0a", fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayName}
        </span>
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

      {/* User */}
      <div style={{ height: 1, background: "#e5e5e5", margin: "0 12px" }} />
      <div className="mx-2 mb-2 mt-1 flex flex-col gap-0.5">
        <div
          className="rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
          style={{ padding: "8px 10px" }}
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
          <span style={{ fontSize: 12, color: "#0a0a0a", fontWeight: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </span>
        </div>
        <button
          onClick={signOut}
          className="rounded-lg flex items-center gap-2 transition-colors w-full text-left"
          style={{ padding: "6px 10px" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#fafafa"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <LogOut size={12} color="#a3a3a3" />
          <span style={{ fontSize: 12, color: "#a3a3a3", fontWeight: 300 }}>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
