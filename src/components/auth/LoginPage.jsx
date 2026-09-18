import { useState } from "react";

const BRIGHT_RED = "#FF174F";

export default function LoginPage({ onAuthenticated }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ username, password }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Unable to sign in.");
      setPassword("");
      onAuthenticated?.(payload?.user || { username });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, boxSizing: "border-box", background: "linear-gradient(135deg, #08090D 0%, #12141B 62%, #26000F 100%)", color: "#FFFFFF", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <section style={{ width: "100%", maxWidth: 430, background: "#12141B", border: `1px solid ${BRIGHT_RED}`, borderRadius: 18, padding: 34, boxSizing: "border-box", boxShadow: "0 20px 55px rgba(0,0,0,.45)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div aria-hidden="true" style={{ fontSize: 42, lineHeight: 1, marginBottom: 12 }}>🦋</div>
          <h1 style={{ margin: 0, color: "#FFFFFF", fontSize: 28, fontWeight: 700 }}>Chrysalis Studio</h1>
          <p style={{ margin: "8px 0 0", color: "#B8B0B8", fontSize: 14, lineHeight: 1.5 }}>Sign in to access your studio workspace.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="chrysalis-username" style={labelStyle}>Username</label>
          <input id="chrysalis-username" type="text" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" autoFocus required style={inputStyle} />
          <label htmlFor="chrysalis-password" style={{ ...labelStyle, marginTop: 18 }}>Password</label>
          <input id="chrysalis-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required style={inputStyle} />
          {error && <div role="alert" style={{ marginTop: 16, padding: "11px 13px", borderRadius: 10, border: "1px solid #FF5478", background: "#310914", color: "#FFB8C7", fontSize: 13, lineHeight: 1.45 }}>{error}</div>}
          <button type="submit" disabled={isSubmitting} style={{ width: "100%", marginTop: 22, minHeight: 46, border: "none", borderRadius: 11, background: BRIGHT_RED, color: "#FFFFFF", fontSize: 15, fontWeight: 700, cursor: isSubmitting ? "wait" : "pointer", opacity: isSubmitting ? 0.75 : 1 }}>{isSubmitting ? "Signing in..." : "Sign In"}</button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.14)", textAlign: "center", fontSize: 13, lineHeight: 1.6 }}>
          <div style={{ color: "#B8B0B8" }}>Looking for plans or account options?</div>
          <a href="/bizzibuddi/account" style={{ display: "inline-block", marginTop: 6, color: BRIGHT_RED, fontWeight: 700, textDecoration: "none" }}>View BizziBuddi plans &amp; upgrade →</a>
        </div>
      </section>
    </main>
  );
}

const labelStyle = { display: "block", marginBottom: 7, color: "#FFFFFF", fontSize: 13, fontWeight: 700 };
const inputStyle = { width: "100%", minHeight: 46, border: "1px solid #4A3A43", borderRadius: 10, padding: "0 13px", boxSizing: "border-box", background: "#08090D", color: "#FFFFFF", fontSize: 15, outline: "none" };
