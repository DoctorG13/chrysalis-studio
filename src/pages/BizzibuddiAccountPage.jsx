import { useState } from "react";

const RED = "#FF174F";
const DEEP_RED = "#C4003D";
const BG = "#08090D";
const SURFACE = "#12141B";
const TEXT = "#FFFFFF";
const WHITE = "#FFFFFF";
const MUTED = "#B8B0B8";
const BORDER = "rgba(255,255,255,.16)";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "A simple starting point for independent operators.",
    features: ["People & contacts", "Basic jobs", "Calendar", "Dashboard"],
  },
  {
    name: "Professional",
    price: "$9",
    period: "/ month",
    description: "For established service businesses and solo professionals.",
    features: ["Everything in Free", "Advanced scheduling", "Payments & invoices", "Automation"],
  },
  {
    name: "Team",
    price: "$19",
    period: "/ month",
    description: "For small teams working together in one place.",
    features: ["Everything in Professional", "Shared workspace", "Team workflow", "Production tracking"],
    featured: true,
  },
  {
    name: "Business",
    price: "$39",
    period: "/ month",
    description: "For growing businesses needing deeper control.",
    features: ["Everything in Team", "Advanced reporting", "Priority features", "Professional controls"],
  },
];

const labels = { login: "Log in", create: "Create account", upgrade: "Plans & upgrade", dashboard: "Account preview" };

export default function BizzibuddiAccountPage() {
  const [view, setView] = useState("login");
  const [submitted, setSubmitted] = useState(false);
  const selectView = (nextView) => { setView(nextView); setSubmitted(false); };

  return (
    <main style={pageStyle}>
      <div style={ambientGlow}></div>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <a href="/bizzibuddi" style={brandStyle}>
            <span style={brandMark}><span style={{ transform: "rotate(-45deg)" }}>B</span></span>
            <span>Bizzi<span style={{ color: RED }}>Buddi</span></span>
          </a>
          <a href="/bizzibuddi" style={backLink}>Back to website ↗</a>
        </header>

        <section style={heroStyle}>
          <div style={eyebrowStyle}>BUSINESS MANAGEMENT, SIMPLIFIED</div>
          <h1 style={heroHeading}>Everything starts<br /><span style={{ color: RED }}>right here.</span></h1>
          <p style={heroCopy}>Explore the future BizziBuddi account experience — from signing in and creating your account to choosing the plan that fits your business.</p>
          <div style={previewBadge}>✦ Interactive design preview · No live data connected</div>
        </section>

        <nav aria-label="Account preview navigation" style={navStyle}>
          {Object.keys(labels).map((item) => <button key={item} type="button" onClick={() => selectView(item)} style={tabStyle(view === item)}>{labels[item]}</button>)}
        </nav>

        {view === "login" && <AuthPanel mode="login" submitted={submitted} onSubmit={() => setSubmitted(true)} onSwitch={() => selectView("create")} />}
        {view === "create" && <AuthPanel mode="create" submitted={submitted} onSubmit={() => setSubmitted(true)} onSwitch={() => selectView("login")} />}
        {view === "upgrade" && <UpgradePanel submitted={submitted} onSelectPlan={() => setSubmitted(true)} />}
        {view === "dashboard" && <DashboardPreview onUpgrade={() => selectView("upgrade")} />}

        <footer style={footerStyle}>Mock environment · Nothing is saved or transmitted · <a href="/bizzibuddi" style={{ color: RED }}>Return to BizziBuddi</a></footer>
      </div>
    </main>
  );
}

const pageStyle = { minHeight: "100vh", background: `linear-gradient(135deg, ${BG} 0%, ${SURFACE} 62%, #16000A 100%)`, color: TEXT, padding: "28px 20px 70px", boxSizing: "border-box", position: "relative", overflow: "hidden", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" };
const shellStyle = { width: "100%", maxWidth: 1120, margin: "0 auto", position: "relative", zIndex: 1 };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" };
const brandStyle = { display: "inline-flex", alignItems: "center", gap: 10, color: TEXT, textDecoration: "none", fontWeight: 600, fontSize: 25, letterSpacing: "0.04em" };
const brandMark = { display: "grid", placeItems: "center", width: 43, height: 43, border: "2px solid #FFF", borderRadius: 12, transform: "rotate(45deg)", background: DEEP_RED, color: WHITE, fontSize: 17, fontWeight: 600, boxShadow: "0 8px 24px rgba(255,23,79,.25)" };
const backLink = { color: RED, textDecoration: "none", fontWeight: 600, fontSize: 14 };
const heroStyle = { maxWidth: 780, margin: "76px auto 38px", textAlign: "center" };
const eyebrowStyle = { display: "inline-block", color: RED, fontSize: 12, fontWeight: 600, letterSpacing: "0.18em" };
const heroHeading = { margin: "24px 0 18px", fontSize: "clamp(42px, 7vw, 76px)", lineHeight: 0.98, letterSpacing: "-0.055em", fontWeight: 600 };
const heroCopy = { maxWidth: 650, margin: "0 auto", color: MUTED, fontSize: 17, lineHeight: 1.75 };
const previewBadge = { display: "inline-block", marginTop: 24, padding: "10px 15px", border: `1px solid ${RED}`, borderRadius: 999, background: "rgba(255,23,79,.08)", color: RED, fontSize: 12, fontWeight: 600 };
const navStyle = { display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", margin: "34px 0 28px" };
const footerStyle = { textAlign: "center", color: MUTED, fontSize: 12, lineHeight: 1.8, marginTop: 32 };
const ambientGlow = { position: "absolute", width: 520, height: 520, borderRadius: "50%", background: "rgba(255,23,79,.10)", filter: "blur(110px)", top: -260, right: -180, pointerEvents: "none" };

function tabStyle(active) { return { border: `1px solid ${active ? RED : BORDER}`, borderRadius: 10, padding: "13px 19px", background: active ? RED : "rgba(255,255,255,.045)", color: TEXT, fontWeight: 600, cursor: "pointer", boxShadow: active ? "0 10px 28px rgba(255,23,79,.25)" : "none" }; }
function cardStyle(maxWidth = "none") { return { width: "100%", maxWidth, margin: "0 auto", boxSizing: "border-box", background: "rgba(255,255,255,.045)", border: `1px solid ${RED}`, borderRadius: 20, padding: "clamp(24px, 5vw, 48px)", boxShadow: "0 20px 48px rgba(0,0,0,.42)", color: TEXT }; }
const primaryButton = { width: "100%", minHeight: 52, marginTop: 20, border: 0, borderRadius: 10, background: RED, color: TEXT, fontWeight: 600, cursor: "pointer", padding: "0 20px", fontSize: 15, boxShadow: "0 10px 24px rgba(255,23,79,.25)" };
const secondaryButton = { ...primaryButton, background: "transparent", color: TEXT, border: `1px solid ${RED}`, boxShadow: "none" };
const textButton = { border: 0, padding: 0, background: "transparent", color: RED, fontWeight: 600, cursor: "pointer" };

function AuthPanel({ mode, submitted, onSubmit, onSwitch }) {
  const isLogin = mode === "login";
  return <section style={cardStyle(560)}>
    <div style={{ textAlign: "center" }}><div style={{ fontSize: 48, color: RED }}>✦</div><h2 style={{ margin: "16px 0 10px", fontSize: 34, letterSpacing: "-0.04em" }}>{isLogin ? "Welcome back." : "Let’s get started."}</h2><p style={{ margin: 0, color: MUTED, lineHeight: 1.7 }}>{isLogin ? "Log in to continue to your BizziBuddi workspace." : "Create your account and bring your business into focus."}</p></div>
    <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }} style={{ marginTop: 28 }}>
      {!isLogin && <Field label="Full name" type="text" placeholder="Your name" />}
      <Field label="Email address" type="email" placeholder="you@example.com" />
      <Field label="Password" type="password" placeholder="Enter your password" />
      {!isLogin && <Field label="Business name" type="text" placeholder="Your business name" />}
      {submitted && <Notice>Demo action complete. This is a visual preview only.</Notice>}
      <button type="submit" style={primaryButton}>{isLogin ? "Log in · Demo" : "Create account · Demo"}</button>
    </form>
    <p style={{ textAlign: "center", color: MUTED, fontSize: 14, margin: "26px 0 0" }}>{isLogin ? "New to BizziBuddi?" : "Already have an account?"}{" "}<button type="button" onClick={onSwitch} style={textButton}>{isLogin ? "Create an account" : "Log in"}</button></p>
  </section>;
}

function UpgradePanel({ submitted, onSelectPlan }) {
  return <section>
    <div style={{ textAlign: "center", marginBottom: 28 }}><h2 style={{ margin: 0, fontSize: "clamp(30px, 5vw, 42px)", letterSpacing: "-0.04em" }}>Find your fit.</h2><p style={{ color: MUTED, lineHeight: 1.7 }}>Compare the future plan options before connecting real subscriptions.</p></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(225px, 1fr))", gap: 20, alignItems: "stretch" }}>
      {plans.map((plan) => <article key={plan.name} style={{ ...cardStyle(), border: plan.featured ? `2px solid ${RED}` : `1px solid ${BORDER}`, transform: plan.featured ? "translateY(-8px)" : "none", display: "flex", flexDirection: "column" }}>
        {plan.featured && <span style={{ display: "inline-block", padding: "7px 10px", borderRadius: 999, background: RED, color: TEXT, fontSize: 11, fontWeight: 600 }}>MOST POPULAR</span>}
        <h3 style={{ fontSize: 27, margin: "18px 0 5px" }}>{plan.name}</h3>
        <div style={{ fontSize: 42, fontWeight: 600, letterSpacing: "-0.05em" }}>{plan.price}<small style={{ fontSize: 14, color: MUTED }}>{plan.period}</small></div>
        <p style={{ color: MUTED, lineHeight: 1.6, minHeight: 78 }}>{plan.description}</p>
        <ul style={{ paddingLeft: 20, lineHeight: 2, minHeight: 150, flex: 1 }}>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
        <button type="button" onClick={onSelectPlan} style={plan.featured ? primaryButton : secondaryButton}>{plan.name === "Free" ? "Start Free" : `Choose ${plan.name}`}</button>
      </article>)}
    </div>
    {submitted && <Notice>Demo plan selected. No subscription has been created.</Notice>}
  </section>;
}

function DashboardPreview({ onUpgrade }) {
  return <section style={cardStyle(940)}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}><div><p style={{ color: RED, fontWeight: 600, fontSize: 12, letterSpacing: "0.12em", margin: 0 }}>ACCOUNT OVERVIEW</p><h2 style={{ margin: "12px 0 6px", fontSize: "clamp(30px, 5vw, 44px)", letterSpacing: "-0.05em" }}>Good morning, Darren.</h2><p style={{ color: MUTED, margin: 0 }}>A preview of your account home.</p></div><button type="button" onClick={onUpgrade} style={{ ...primaryButton, width: "auto" }}>Explore plans ↗</button></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginTop: 34 }}>{["Free plan", "0 team members", "0 active jobs", "No billing activity"].map((item) => <div key={item} style={{ border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, background: SURFACE, fontWeight: 600, fontSize: 16 }}>{item}</div>)}</div>
    <div style={{ marginTop: 24, padding: 24, borderRadius: 16, background: "rgba(255,23,79,.08)", border: `1px solid ${RED}` }}><strong style={{ fontSize: 17 }}>Your next step</strong><p style={{ margin: "9px 0 0", color: MUTED, lineHeight: 1.7 }}>Connect your account, choose a plan, and begin setting up your business workspace.</p></div>
  </section>;
}

function Field({ label, type, placeholder }) { return <label style={{ display: "block", marginTop: 17, fontSize: 13, fontWeight: 600, color: TEXT }}>{label}<input required type={type} placeholder={placeholder} style={{ display: "block", width: "100%", minHeight: 52, marginTop: 8, padding: "0 15px", boxSizing: "border-box", border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 15, color: TEXT, background: SURFACE }} /></label>; }
function Notice({ children }) { return <p role="status" style={{ padding: 15, borderRadius: 10, background: "rgba(255,23,79,.10)", border: `1px solid ${RED}`, color: TEXT, lineHeight: 1.5, fontWeight: 600 }}>{children}</p>; }
