import { useState } from "react";

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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ username, password }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload?.error || "Unable to sign in."
        );
      }

      setPassword("");
      onAuthenticated?.(payload?.user || { username });
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to sign in."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        boxSizing: "border-box",
        background: "#F7F5F2",
        color: "#2F3A3F",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 430,
          background: "#FFFFFF",
          border: "1px solid #E8E8E8",
          borderRadius: 18,
          padding: 34,
          boxSizing: "border-box",
          boxShadow: "0 18px 50px rgba(47,58,63,.10)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              fontSize: 42,
              lineHeight: 1,
              marginBottom: 12,
            }}
          >
            🦋
          </div>

          <h1
            style={{
              margin: 0,
              color: "#2F3A3F",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            Chrysalis Studio
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              color: "#6B7478",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            Sign in to access your studio workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="chrysalis-username"
            style={labelStyle}
          >
            Username
          </label>

          <input
            id="chrysalis-username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            autoFocus
            required
            style={inputStyle}
          />

          <label
            htmlFor="chrysalis-password"
            style={{ ...labelStyle, marginTop: 18 }}
          >
            Password
          </label>

          <input
            id="chrysalis-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            style={inputStyle}
          />

          {error && (
            <div
              role="alert"
              style={{
                marginTop: 16,
                padding: "11px 13px",
                borderRadius: 10,
                border: "1px solid #E5B5B5",
                background: "#FFF4F4",
                color: "#8B2E2E",
                fontSize: 13,
                lineHeight: 1.45,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              marginTop: 22,
              minHeight: 46,
              border: "none",
              borderRadius: 11,
              background: "#8B1E3F",
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 700,
              cursor: isSubmitting ? "wait" : "pointer",
              opacity: isSubmitting ? 0.75 : 1,
            }}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </section>
    </main>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: 7,
  color: "#2F3A3F",
  fontSize: 13,
  fontWeight: 700,
};

const inputStyle = {
  width: "100%",
  minHeight: 46,
  border: "1px solid #D9D9D9",
  borderRadius: 10,
  padding: "0 13px",
  boxSizing: "border-box",
  background: "#FFFFFF",
  color: "#2F3A3F",
  fontSize: 15,
  outline: "none",
};
