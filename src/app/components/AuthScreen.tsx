import { useState } from "react";
import { supabase } from "../../lib/supabase";
import ioiaLogo from "figma:asset/ioia.png";

type Mode = "login" | "signup";

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) setError(error.message);
      else setSuccess("Check your email to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }

    setLoading(false);
  };

  return (
    <div
      className="flex h-screen w-screen items-center justify-center"
      style={{ background: "#fafafa", fontFamily: "var(--font-sans)" }}
    >
      <div className="flex flex-col items-center w-full" style={{ maxWidth: 360 }}>
        {/* Logo */}
        <img
          src={ioiaLogo}
          alt="ioia"
          style={{ height: 40, width: "auto", borderRadius: 10, marginBottom: 28 }}
        />

        <h1 style={{ fontSize: 20, fontWeight: 400, color: "#0a0a0a", marginBottom: 6, letterSpacing: "-0.02em" }}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p style={{ fontSize: 13, color: "#a3a3a3", fontWeight: 300, marginBottom: 28, textAlign: "center" }}>
          {mode === "login"
            ? "Sign in to your ioia account"
            : "Start finding professors and writing emails"}
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          {mode === "signup" && (
            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 12, color: "#525252", fontWeight: 400 }}>Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Thennarasu"
                required
                className="w-full outline-none rounded-lg border px-3 py-2.5 transition-colors"
                style={{ fontSize: 13, color: "#0a0a0a", fontWeight: 300, borderColor: "#e5e5e5", background: "#fff", fontFamily: "var(--font-sans)" }}
                onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#0a0a0a"; }}
                onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e5e5e5"; }}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: 12, color: "#525252", fontWeight: 400 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              required
              className="w-full outline-none rounded-lg border px-3 py-2.5 transition-colors"
              style={{ fontSize: 13, color: "#0a0a0a", fontWeight: 300, borderColor: "#e5e5e5", background: "#fff", fontFamily: "var(--font-sans)" }}
              onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#0a0a0a"; }}
              onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e5e5e5"; }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: 12, color: "#525252", fontWeight: 400 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full outline-none rounded-lg border px-3 py-2.5 transition-colors"
              style={{ fontSize: 13, color: "#0a0a0a", fontWeight: 300, borderColor: "#e5e5e5", background: "#fff", fontFamily: "var(--font-sans)" }}
              onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#0a0a0a"; }}
              onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e5e5e5"; }}
            />
          </div>

          {error && (
            <p style={{ fontSize: 12, color: "#ef4444", fontWeight: 300 }}>{error}</p>
          )}
          {success && (
            <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 300 }}>{success}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 transition-opacity mt-1"
            style={{
              fontSize: 13,
              fontWeight: 400,
              color: "#fff",
              background: "#0a0a0a",
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p style={{ fontSize: 12.5, color: "#a3a3a3", fontWeight: 300, marginTop: 20 }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setSuccess(null); }}
            style={{ color: "#0a0a0a", fontWeight: 400 }}
            className="hover:underline"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
