import { useState } from "react";

const RED = "#8B1E3F";
const TEXT = "#2F3A3F";
const MUTED = "#6B7478";
const BG = "#F7F5F2";

export default function BizzibuddiAccountPage() {
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setMessage(
      mode === "login"
        ? "Your secure sign-in form is ready to connect to the account service."
        : "Your account-creation form is ready to connect to the account service."
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: BG, color: TEXT, padding: "48px 24px", boxSizing: "border-box" }}>
      <div style={{ width: "100%", maxWidth: 520, margin: "0 auto" }}>
        <a href="/bizzibuddi" style={{ color: RED, fontWeight: 700, textDecoration: "none" }}>← Back to BizziBuddi</a>

        <section style={{ marginTop: 28, background: "#FFFFFF", border: "1px solid #E8E8E8", borderRadius: 20, padding: 34, boxShadow: "0 18px 50px rgba(47,58,63,.08)" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 44 }}>🦋</div>
            <h1 style={{ margin: "12px 0 8px", fontSize: 32 }}>Your BizziBuddi account</h1>
            <p style={{ margin: 0, color: MUTED, lineHeight: 1.6 }}>Sign in, create your account, or get ready to manage your plan.</p>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 28, padding: 5, background: BG, borderRadius: 12 }}>
            {["login", "create"].map((item) => (
              <button key={item} type="button" onClick={() => { setMode(item); setMessage(""); }} style={{ flex: 1, minHeight: 42, border: 0, borderRadius: 9, background: mode === item ? RED : "transparent", color: mode === item ? "#FFFFFF" : TEXT, fontWeight: 700, cursor: "pointer" }}>
                {item === "login" ? "Log in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: 26 }}>
            {mode === "create" && <Field label="Your name" type="text" placeholder="Your name" />}
            <Field label="Email address" type="email" placeholder="you@example.com" />
            <Field label="Password" type="password" placeholder="Enter your password" />
            {message && <p role="status" style={{ color: RED, fontSize: 14, lineHeight: 1.5 }}>{message}</p>}
            <button type="submit" style={{ width: "100%", minHeight: 48, marginTop: 8, border: 0, borderRadius: 11, background: RED, color: "#FFFFFF", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              {mode === "login" ? "Continue to login" : "Create my account"}
            </button>
          </form>

          <div style={{ marginTop: 28, paddingTop: 22, borderTop: "1px solid #E8E8E8", textAlign: "center" }}>
            <p style={{ margin: 0, color: MUTED, fontSize: 14 }}>Already have a plan?</p>
            <a href="#upgrade" style={{ display: "inline-block", marginTop: 8, color: RED, fontWeight: 700 }}>Manage or upgrade your plan →</a>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, type, placeholder }) {
  return (
    <label style={{ display: "block", marginTop: 16, color: TEXT, fontSize: 13, fontWeight: 700 }}>
      {label}
      <input required type={type} placeholder={placeholder} style={{ display: "block", width: "100%", minHeight: 46, marginTop: 7, padding: "0 13px", boxSizing: "border-box", border: "1px solid #D9D9D9", borderRadius: 10, fontSize: 15 }} />
    </label>
  );
}
