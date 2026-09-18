import { useState } from "react";

const RED = "#8B1E3F";
const TEXT = "#2F3A3F";
const MUTED = "#6B7478";
const BG = "#F7F5F2";
const BORDER = "#E7E3DF";

const plans = [
  { name: "Free", price: "$0", description: "Start organising your business essentials.", features: ["People management", "Basic jobs", "Simple calendar"] },
  { name: "Musician", price: "$12", description: "More tools for your day-to-day work.", features: ["Everything in Free", "Production tracking", "Finance tools"] },
  { name: "Business", price: "$29", description: "A complete workspace for growing teams.", features: ["Everything in Musician", "Advanced reporting", "Team collaboration"] },
];

export default function BizzibuddiAccountPage() {
  const [view, setView] = useState("login");
  const [submitted, setSubmitted] = useState(false);

  function selectView(nextView) {
    setView(nextView);
    setSubmitted(false);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main style={{ minHeight: "100vh", background: BG, color: TEXT, padding: "32px 20px 64px", boxSizing: "border-box", fontFamily: "inherit" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <a href="/bizzibuddi" style={{ color: TEXT, textDecoration: "none", fontWeight: 800, fontSize: 22 }}>🦋 BizziBuddi</a>
          <a href="/bizzibuddi" style={{ color: RED, textDecoration: "none", fontWeight: 700 }}>← Back to website</a>
        </header>

        <section style={{ marginTop: 42, textAlign: "center" }}>
          <p style={{ margin: 0, color: RED, fontWeight: 800, letterSpacing: "0.12em", fontSize: 12 }}>ACCOUNT AREA PREVIEW</p>
          <h1 style={{ margin: "12px 0 10px", fontSize: "clamp(30px, 5vw, 48px)", lineHeight: 1.1 }}>Your business, your way.</h1>
          <p style={{ maxWidth: 620, margin: "0 auto", color: MUTED, lineHeight: 1.7 }}>A preview of the future BizziBuddi account area. These screens are visual mock-ups only and are not connected to live authentication or billing.</p>
        </section>

        <nav aria-label="Account preview navigation" style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", margin: "30px 0" }}>
          {["login", "create", "upgrade", "dashboard"].map((item) => (
            <button key={item} type="button" onClick={() => selectView(item)} style={tabStyle(view === item)}>
              {labels[item]}
            </button>
          ))}
        </nav>

        {view === "login" && <AuthPanel mode="login" onSubmit={handleSubmit} submitted={submitted} onSwitch={() => selectView("create")} />}
        {view === "create" && <AuthPanel mode="create" onSubmit={handleSubmit} submitted={submitted} onSwitch={() => selectView("login")} />}
        {view === "upgrade" && <UpgradePanel onSelectPlan={() => setSubmitted(true)} submitted={submitted} />}
        {view === "dashboard" && <DashboardPreview onUpgrade={() => selectView("upgrade")} />}

        <p style={{ textAlign: "center", color: MUTED, fontSize: 12, marginTop: 28 }}>Mock environment · No information is saved or transmitted.</p>
      </div>
    </main>
  );
}

const labels = { login: "Log in", create: "Create account", upgrade: "Plans & upgrade", dashboard: "Account preview" };

function tabStyle(active) {
  return { border: `1px solid ${active ? RED : BORDER}`, borderRadius: 999, padding: "11px 18px", background: active ? RED : "#FFFFFF", color: active ? "#FFFFFF" : TEXT, fontWeight: 800, cursor: "pointer" };
}

function AuthPanel({ mode, onSubmit, submitted, onSwitch }) {
  const isLogin = mode === "login";
  return (
    <section style={cardStyle(520)}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 42 }}>🦋</div>
        <h2 style={{ margin: "12px 0 8px", fontSize: 30 }}>{isLogin ? "Welcome back" : "Create your account"}</h2>
        <p style={{ margin: 0, color: MUTED, lineHeight: 1.6 }}>{isLogin ? "Log in to continue to your BizziBuddi workspace." : "Set up your account and start simplifying your business."}</p>
      </div>
      <form onSubmit={onSubmit} style={{ marginTop: 26 }}>
        {!isLogin && <Field label="Full name" type="text" placeholder="Your name" />}
        <Field label="Email address" type="email" placeholder="you@example.com" />
        <Field label="Password" type="password" placeholder="Enter your password" />
        {!isLogin && <Field label="Business name" type="text" placeholder="Your business name" />}
        {submitted && <Notice>Demo action complete. This is a visual preview only.</Notice>}
        <button type="submit" style={primaryButton}>{isLogin ? "Log in (demo)" : "Create account (demo)"}</button>
      </form>
      <p style={{ textAlign: "center", color: MUTED, fontSize: 14, margin: "24px 0 0" }}>
        {isLogin ? "New to BizziBuddi?" : "Already have an account?"}{" "}
        <button type="button" onClick={onSwitch} style={textButton}>{isLogin ? "Create an account" : "Log in"}</button>
      </p>
    </section>
  );
}

function UpgradePanel({ onSelectPlan, submitted }) {
  return (
    <section>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 32 }}>Choose your plan</h2>
        <p style={{ color: MUTED, lineHeight: 1.6 }}>Compare the future plan options before connecting real subscriptions.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
        {plans.map((plan, index) => <article key={plan.name} style={{ ...cardStyle(), border: index === 1 ? `2px solid ${RED}` : `1px solid ${BORDER}` }}>
          {index === 1 && <span style={{ color: RED, fontSize: 12, fontWeight: 800 }}>POPULAR PREVIEW</span>}
          <h3 style={{ fontSize: 24, margin: "12px 0 4px" }}>{plan.name}</h3>
          <div style={{ fontSize: 34, fontWeight: 900 }}>{plan.price}<small style={{ fontSize: 14, color: MUTED }}>/month</small></div>
          <p style={{ color: MUTED, lineHeight: 1.5, minHeight: 48 }}>{plan.description}</p>
          <ul style={{ paddingLeft: 20, lineHeight: 1.9, minHeight: 125 }}>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          <button type="button" onClick={onSelectPlan} style={index === 1 ? primaryButton : secondaryButton}>Select {plan.name}</button>
        </article>)}
      </div>
      {submitted && <Notice>Demo plan selected. No subscription has been created.</Notice>}
    </section>
  );
}

function DashboardPreview({ onUpgrade }) {
  return <section style={cardStyle(900)}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <div><p style={{ color: RED, fontWeight: 800, fontSize: 12, letterSpacing: "0.1em", margin: 0 }}>ACCOUNT OVERVIEW</p><h2 style={{ margin: "8px 0 4px", fontSize: 32 }}>Good morning, Darren</h2><p style={{ color: MUTED, margin: 0 }}>Here is a preview of your account home.</p></div>
      <button type="button" onClick={onUpgrade} style={primaryButton}>Explore plans</button>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 28 }}>
      {["Free plan", "0 team members", "0 active jobs", "No billing activity"].map((item) => <div key={item} style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20, background: BG, fontWeight: 800 }}>{item}</div>)}
    </div>
    <div style={{ marginTop: 24, padding: 20, borderRadius: 14, background: "#FFF8F8", border: "1px solid #F0DDE3" }}><strong>Next step</strong><p style={{ margin: "8px 0 0", color: MUTED, lineHeight: 1.6 }}>Connect your account, choose a plan, and begin setting up your business workspace.</p></div>
  </section>;
}

function Field({ label, type, placeholder }) { return <label style={{ display: "block", marginTop: 16, fontSize: 13, fontWeight: 800 }}>{label}<input required type={type} placeholder={placeholder} style={{ display: "block", width: "100%", minHeight: 48, marginTop: 7, padding: "0 13px", boxSizing: "border-box", border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 15 }} /></label>; }
function Notice({ children }) { return <p role="status" style={{ padding: 14, borderRadius: 10, background: "#FFF8F8", color: RED, lineHeight: 1.5 }}>{children}</p>; }
const cardStyle = (maxWidth = "none") => ({ width: "100%", maxWidth, margin: "0 auto", boxSizing: "border-box", background: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: 20, padding: "clamp(22px, 4vw, 36px)", boxShadow: "0 18px 50px rgba(47,58,63,.07)" });
const primaryButton = { width: "100%", minHeight: 48, marginTop: 18, border: 0, borderRadius: 10, background: RED, color: "#FFFFFF", fontWeight: 800, cursor: "pointer", padding: "0 18px" };
const secondaryButton = { ...primaryButton, background: "#FFFFFF", color: RED, border: `1px solid ${RED}` };
const textButton = { border: 0, padding: 0, background: "transparent", color: RED, fontWeight: 800, cursor: "pointer" };
