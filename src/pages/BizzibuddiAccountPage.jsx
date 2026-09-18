import { useState } from "react";

const RED = "#FF174F";
const BG = "#08090D";
const SURFACE = "#12141B";
const TEXT = "#FFFFFF";
const MUTED = "#B8B0B8";
const BORDER = "rgba(255,255,255,.16)";

const plans = [
  { name: "Free", price: "$0", period: "forever", description: "A simple starting point for independent operators.", features: ["People & contacts", "Basic jobs", "Calendar", "Dashboard"] },
  { name: "Professional", price: "$9", period: "/ month", description: "For established service businesses and solo professionals.", features: ["Everything in Free", "Advanced scheduling", "Payments & invoices", "Automation"] },
  { name: "Team", price: "$19", period: "/ month", description: "For small teams working together in one place.", features: ["Everything in Professional", "Shared workspace", "Team workflow", "Production tracking"], featured: true },
  { name: "Business", price: "$39", period: "/ month", description: "For growing businesses needing deeper control.", features: ["Everything in Team", "Advanced reporting", "Priority features", "Professional controls"] },
];

export default function BizzibuddiAccountPage() {
  const [view, setView] = useState("login");
  const [account, setAccount] = useState(() => readAccount());
  const [message, setMessage] = useState("");

  function selectView(nextView) {
    setView(nextView);
    setMessage("");
  }

  function handleCreateAccount(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextAccount = {
      name: String(form.get("name") || "").trim(),
      email: String(form.get("email") || "").trim(),
      business: String(form.get("business") || "").trim(),
      plan: "Free",
      workspaceReady: false,
    };

    localStorage.setItem("bizzibuddiMockAccount", JSON.stringify(nextAccount));
    setAccount(nextAccount);
    setMessage("Your mock account has been created locally.");
    setView("onboarding");
  }

  function handleLogin(event) {
    event.preventDefault();
    if (!account) {
      setMessage("No mock account exists yet. Create one first.");
      return;
    }
    setMessage(`Welcome back, ${account.name}.`);
    setView("onboarding");
  }

  function completeOnboarding(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextAccount = {
      ...account,
      business: String(form.get("business") || account?.business || "").trim(),
      workspaceReady: true,
    };
    localStorage.setItem("bizzibuddiMockAccount", JSON.stringify(nextAccount));
    setAccount(nextAccount);
    setMessage("Workspace setup complete. This is still local demo data.");
    setView("dashboard");
  }

  function selectPlan(planName) {
    const nextAccount = { ...(account || { name: "Demo User", email: "demo@example.com", business: "" }), plan: planName };
    localStorage.setItem("bizzibuddiMockAccount", JSON.stringify(nextAccount));
    setAccount(nextAccount);
    setMessage(`${planName} selected for this mock account. No payment was made.`);
    setView("dashboard");
  }

  function resetDemo() {
    localStorage.removeItem("bizzibuddiMockAccount");
    setAccount(null);
    setMessage("Local demo data cleared.");
    setView("create");
  }

  return (
    <main style={pageStyle}>
      <div style={ambientGlow} />
      <div style={shellStyle}>
        <header style={headerStyle}>
          <a href="/bizzibuddi" style={brandStyle}>Bizzi<span style={{ color: RED }}>Buddi</span></a>
          <a href="/bizzibuddi" style={backLink}>Back to website ↗</a>
        </header>

        <section style={heroStyle}>
          <div style={eyebrowStyle}>BUSINESS MANAGEMENT, SIMPLIFIED</div>
          <h1 style={heroHeading}>Everything starts<br /><span style={{ color: RED }}>right here.</span></h1>
          <p style={heroCopy}>Explore the BizziBuddi account experience with a local-only registration, onboarding and workspace preview.</p>
          <div style={previewBadge}>✦ Local mock environment · No live data or payments</div>
        </section>

        <nav aria-label="Account preview navigation" style={navStyle}>
          {[["login", "Log in"], ["create", "Create account"], ["plans", "Plans & upgrade"], ["dashboard", "Account preview"]].map(([key, label]) => (
            <button key={key} type="button" onClick={() => selectView(key)} style={tabStyle(view === key)}>{label}</button>
          ))}
        </nav>

        {message && <div role="status" style={messageStyle}>{message}</div>}
        {view === "login" && <AuthPanel mode="login" account={account} onSubmit={handleLogin} onSwitch={() => selectView("create")} />}
        {view === "create" && <AuthPanel mode="create" onSubmit={handleCreateAccount} onSwitch={() => selectView("login")} />}
        {view === "onboarding" && <OnboardingPanel account={account} onSubmit={completeOnboarding} />}
        {view === "plans" && <PlansPanel onSelectPlan={selectPlan} />}
        {view === "dashboard" && <DashboardPanel account={account} onPlans={() => selectView("plans")} onReset={resetDemo} />}

        <footer style={footerStyle}>Mock environment · Data stays in this browser only · <a href="/bizzibuddi" style={{ color: RED }}>Return to BizziBuddi</a></footer>
      </div>
    </main>
  );
}

function readAccount() {
  try {
    const value = localStorage.getItem("bizzibuddiMockAccount");
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function AuthPanel({ mode, account, onSubmit, onSwitch }) {
  const login = mode === "login";
  return <section style={cardStyle(560)}>
    <div style={centerStyle}><div style={{ fontSize: 46, color: RED }}>✦</div><h2 style={sectionHeading}>{login ? "Welcome back." : "Let’s get started."}</h2><p style={copyStyle}>{login ? "This demo checks for a locally stored mock account." : "Create a local test account and begin your workspace setup."}</p></div>
    <form onSubmit={onSubmit} style={{ marginTop: 28 }}>
      {!login && <Field name="name" label="Full name" type="text" placeholder="Your name" />}
      <Field name="email" label="Email address" type="email" placeholder="you@example.com" />
      <Field name="password" label="Password" type="password" placeholder="Demo password" />
      {!login && <Field name="business" label="Business name" type="text" placeholder="Your business name" />}
      <button type="submit" style={primaryButton}>{login ? "Log in · Demo" : "Create account · Demo"}</button>
    </form>
    <p style={switchText}>{login ? "New to BizziBuddi?" : "Already have an account?"} <button type="button" onClick={onSwitch} style={textButton}>{login ? "Create an account" : "Log in"}</button></p>
    {login && account && <p style={smallText}>Local account detected for {account.email}.</p>}
  </section>;
}

function OnboardingPanel({ account, onSubmit }) {
  return <section style={cardStyle(620)}><div style={centerStyle}><div style={{ fontSize: 46, color: RED }}>🦋</div><h2 style={sectionHeading}>Set up your workspace.</h2><p style={copyStyle}>Welcome {account?.name || "there"}. Give your workspace a name to continue.</p></div><form onSubmit={onSubmit} style={{ marginTop: 28 }}><Field name="business" label="Workspace or business name" type="text" placeholder={account?.business || "Your workspace"} defaultValue={account?.business || ""} /><button type="submit" style={primaryButton}>Complete setup · Demo</button></form></section>;
}

function PlansPanel({ onSelectPlan }) {
  return <section><div style={centerStyle}><h2 style={sectionHeading}>Find your fit.</h2><p style={copyStyle}>Choose a plan for the local mock account. No subscription is created.</p></div><div style={plansGrid}>{plans.map((plan) => <article key={plan.name} style={{ ...cardStyle(), border: plan.featured ? `2px solid ${RED}` : `1px solid ${BORDER}`, display: "flex", flexDirection: "column" }}>{plan.featured && <span style={popularBadge}>MOST POPULAR</span>}<h3 style={planTitle}>{plan.name}</h3><div style={priceStyle}>{plan.price}<small style={smallText}>{plan.period}</small></div><p style={copyStyle}>{plan.description}</p><ul style={{ paddingLeft: 20, lineHeight: 2, flex: 1 }}>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul><button type="button" onClick={() => onSelectPlan(plan.name)} style={plan.featured ? primaryButton : secondaryButton}>Choose {plan.name}</button></article>)}</div></section>;
}

function DashboardPanel({ account, onPlans, onReset }) {
  return <section style={cardStyle(940)}><p style={eyebrowStyle}>LOCAL ACCOUNT OVERVIEW</p><h2 style={sectionHeading}>Good morning, {account?.name || "Demo User"}.</h2><p style={copyStyle}>This is a simulated account dashboard.</p><div style={statsGrid}>{[["Account", account ? "Created" : "Demo only"], ["Workspace", account?.workspaceReady ? "Ready" : "Not set up"], ["Plan", account?.plan || "Free"], ["Billing", "Not connected"]].map(([label, value]) => <div key={label} style={statCard}><small style={smallText}>{label}</small><strong style={{ display: "block", marginTop: 8, fontSize: 20 }}>{value}</strong></div>)}</div><div style={callout}><strong>Your next step</strong><p style={copyStyle}>Continue refining the onboarding experience before connecting real authentication, databases or billing.</p><button type="button" onClick={onPlans} style={{ ...primaryButton, width: "auto", padding: "0 22px" }}>Explore plans ↗</button></div><button type="button" onClick={onReset} style={textButton}>Reset local demo</button></section>;
}

function Field({ name, label, type, placeholder, defaultValue }) {
  return <label style={fieldStyle}>{label}<input required name={name} type={type} placeholder={placeholder} defaultValue={defaultValue} style={inputStyle} /></label>;
}

const pageStyle = { minHeight: "100vh", position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${BG} 0%, ${SURFACE} 62%, #16000A 100%)`, color: TEXT, padding: "28px 20px 70px", boxSizing: "border-box", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" };
const shellStyle = { width: "100%", maxWidth: 1120, margin: "0 auto", position: "relative", zIndex: 1 };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" };
const brandStyle = { color: TEXT, textDecoration: "none", fontWeight: 700, fontSize: 28, letterSpacing: "0.02em" };
const backLink = { color: RED, textDecoration: "none", fontWeight: 600, fontSize: 14 };
const heroStyle = { maxWidth: 780, margin: "76px auto 38px", textAlign: "center" };
const eyebrowStyle = { display: "inline-block", color: RED, fontSize: 12, fontWeight: 700, letterSpacing: "0.16em" };
const heroHeading = { margin: "24px 0 18px", fontSize: "clamp(42px, 7vw, 76px)", lineHeight: 0.98, letterSpacing: "-0.055em", fontWeight: 600 };
const heroCopy = { maxWidth: 650, margin: "0 auto", color: MUTED, fontSize: 17, lineHeight: 1.75 };
const previewBadge = { display: "inline-block", marginTop: 24, padding: "10px 15px", border: `1px solid ${RED}`, borderRadius: 999, background: "rgba(255,23,79,.08)", color: RED, fontSize: 12, fontWeight: 600 };
const navStyle = { display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", margin: "34px 0 28px" };
const tabStyle = (active) => ({ border: `1px solid ${active ? RED : BORDER}`, borderRadius: 999, padding: "11px 16px", background: active ? "rgba(255,23,79,.16)" : "rgba(255,255,255,.04)", color: TEXT, fontSize: 13, fontWeight: 700, cursor: "pointer" });
const footerStyle = { textAlign: "center", color: MUTED, fontSize: 12, lineHeight: 1.8, marginTop: 32 };
const ambientGlow = { position: "absolute", width: 520, height: 520, borderRadius: "50%", background: "rgba(255,23,79,.10)", filter: "blur(110px)", top: -260, right: -180, pointerEvents: "none" };
const centerStyle = { textAlign: "center" };
const sectionHeading = { margin: "16px 0 10px", fontSize: "clamp(30px, 5vw, 44px)", letterSpacing: "-0.04em" };
const copyStyle = { color: MUTED, lineHeight: 1.7 };
const cardStyle = (maxWidth = "none") => ({ width: "100%", maxWidth, margin: "0 auto", boxSizing: "border-box", background: "rgba(255,255,255,.045)", border: `1px solid ${RED}`, borderRadius: 20, padding: "clamp(24px, 5vw, 48px)", boxShadow: "0 20px 48px rgba(0,0,0,.42)" });
const primaryButton = { width: "100%", minHeight: 52, marginTop: 20, border: 0, borderRadius: 10, background: RED, color: TEXT, fontWeight: 700, cursor: "pointer", padding: "0 20px", fontSize: 15 };
const secondaryButton = { ...primaryButton, background: "transparent", border: `1px solid ${RED}` };
const textButton = { border: 0, padding: 0, background: "transparent", color: RED, fontWeight: 700, cursor: "pointer" };
const switchText = { textAlign: "center", color: MUTED, fontSize: 14, margin: "26px 0 0" };
const smallText = { color: MUTED, fontSize: 13 };
const fieldStyle = { display: "block", marginTop: 17, fontSize: 13, fontWeight: 700 };
const inputStyle = { display: "block", width: "100%", minHeight: 52, marginTop: 8, padding: "0 15px", boxSizing: "border-box", border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 15, color: TEXT, background: SURFACE };
const messageStyle = { maxWidth: 760, margin: "0 auto 24px", padding: 15, borderRadius: 10, background: "rgba(255,23,79,.12)", border: `1px solid ${RED}`, color: TEXT, textAlign: "center", lineHeight: 1.5 };
const plansGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(225px, 1fr))", gap: 20, alignItems: "stretch" };
const popularBadge = { display: "inline-block", alignSelf: "flex-start", padding: "7px 10px", borderRadius: 999, background: RED, fontSize: 11, fontWeight: 700 };
const planTitle = { fontSize: 27, margin: "18px 0 5px" };
const priceStyle = { fontSize: 42, fontWeight: 700, letterSpacing: "-0.05em" };
const statsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginTop: 30 };
const statCard = { border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18, background: "rgba(255,255,255,.035)" };
const callout = { marginTop: 28, padding: 22, borderRadius: 14, border: `1px solid ${BORDER}`, background: "rgba(255,23,79,.06)" };
