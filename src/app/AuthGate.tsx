import { useAuth } from "../lib/auth";
import App from "./App";
import { AuthScreen } from "./components/AuthScreen";

export function AuthGate() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="flex h-screen w-screen items-center justify-center"
        style={{ background: "#fafafa", fontFamily: "var(--font-sans)" }}
      >
        <div
          className="rounded-full"
          style={{
            width: 6, height: 6, background: "#d4d4d4",
            animation: "pulse 1.2s ease-in-out infinite",
          }}
        />
      </div>
    );
  }

  if (!session) return <AuthScreen />;
  return <App />;
}
