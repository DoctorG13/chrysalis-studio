import { useState } from "react";

const RED = "#B52B52";
const DEEP_RED = "#8B1E3F";
const INK = "#202B31";
const MUTED = "#718087";
const CREAM = "#F7F3EF";
const BORDER = "#E9E0DB";
const WHITE = "#FFFFFF";

const plans = [
  { name: "Free", price: "$0", description: "Start organising your business essentials.", features: ["People management", "Basic jobs", "Simple calendar"] },
  { name: "Musician", price: "$12", description: "More tools for your day-to-day work.", features: ["Everything in Free", "Production tracking", "Finance tools"], featured: true },
  { name: "Business", price: "$29", description: "A complete workspace for growing teams.", features: ["Everything in Musician", "Advanced reporting", "Team collaboration"] },
];

export default function BizzibuddiAccountPage() {
  const [view, setView] = useState("login");
  const [submitted, setSubmitted] = useState(false);

  function selectView(nextView) {
    setView(nextView);
    setSubmitted(false);
  }

  return (
    <main style={pageStyle}>
      <div style={ambientGlow("top")}></div>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <a href="/bizzibuddi" style={brandStyle}><span style={brandMark}>🦋</span><span>Bizzi<span style={{ color: RED }}>Buddi</span></span></a>
          <a href="/bizzibuddi" style={backLink}>Back to website ↗</a>
        </header>

        <section style={heroStyle}>
          <div style={eyebrowStyle}>YOUR BUSINESS. YOUR WAY.</div>
          <h1 style={heroHeading}>Everything starts<br /><span style={{ color: RED }}>right here.</span></h1>
          <p style={heroCopy}>Explore the future BizziBuddi account experience — from signing in and creating your account to choosing the plan that fits your business.</p>
          <div style={previewBadge}>✦ Interactive design preview · No live data connected</div>
        </section>

        <nav aria-label="Account preview navigation" style={navStyle}>
          {["login", "create", "upgrade", "dashboard"].map((item) => (
            <button key={item} type="button" onClick={() => selectView(item)} style={tabStyle(view === item)}>{labels[item]}</button>
          ))}
        </nav>

        {view === "login" && <AuthPanel mode="login" onSubmit={() => setSubmitted(true)} submitted={submitted} onSwitch={() => selectView("create")} />}
        {view === "create" && <AuthPanel mode="create" onSubmit={() => setSubmitted(true)} submitted={submitted} onSwitch={() => selectView("login")} />}
        {view === "upgrade" && <UpgradePanel onSelectPlan={() => setSubmitted(true)} submitted={submitted} />}
        {view === "dashboard" && <DashboardPreview onUpgrade={() => selectView("upgrade")} />}

        <footer style={footerStyle}>Mock environment · Nothing is saved or transmitted · <a href="/bizzibuddi" style={{ color: RED }}>Return to BizziBuddi</a></footer>
      </div>
    </main>
  );
}

const labels = { login: "Log in", create: "Create account", upgrade: "Plans & upgrade", dashboard: "Account preview" };
const pageStyle = { minHeight: "100vh", background: `linear-gradient(145deg, ${CREAM} 0%, #FFFDFC 48%, #F5E9EC 100%)`, color: INK, padding: "28px 20px 70px", boxSizing: "border-box", position: "relative", overflow: "hidden", fontFamily: "inherit" };
const shellStyle = { width: "100%", maxWidth: 1120, margin: "0 auto", position: "relative", zIndex: 1 };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" };
const brandStyle = { display: "inline-flex", alignItems: "center", gap: 10, color: INK, textDecoration: "none", fontWeight: 900, fontSize: 25, letterSpacing: "-0.04em" };
const brandMark = { display: "grid", placeItems: "center", width: 43, height: 43, borderRadius: 14, background: INK, color: WHITE, fontSize: 23, boxShadow: "0 8px 20px rgba(32,43,49,.18)" };
const backLink = { color: DEEP_RED, textDecoration: "none", fontWeight: 800, fontSize: 14 };
const heroStyle = { maxWidth: 780, margin: "76px auto 38px", textAlign: "center" };
const eyebrowStyle = { display: "inline-block", padding: "9px 14px", borderRadius: 999, background: INK, color: WHITE, fontSize: 11, fontWeight: 900, letterSpacing: "0.15em" };
const heroHeading = { margin: "24px 0 18px", fontSize: "clamp(42px, 7vw, 76px)", lineHeight: 0.98, letterSpacing: "-0.065em", fontWeight: 950 };
const heroCopy = { maxWidth: 650, margin: "0 auto", color: MUTED, fontSize: 17, lineHeight: 1.75 };
const previewBadge = { display: "inline-block", marginTop: 24, padding: "10px 15px", border: `1px solid ${BORDER}`, borderRadius: 999, background: "rgba(255,255,255,.7)", color: DEEP_RED, fontSize: 12, fontWeight: 800 };
const navStyle = { display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", margin: "34px 0 28px" };
const footerStyle = { textAlign: "center", color: MUTED, fontSize: 12, lineHeight: 1.8, marginTop: 32 };
const ambientGlow = () => ({ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "rgba(181,43,82,.09)", filter: "blur(70px)", top: -220, right: -150 });

function tabStyle(active) { return { border: `1px solid ${active ? RED : BORDER}`, borderRadius: 999, padding: "13px 19px", background: active ? INK : "rgba(255,255,255,.82)", color: active ? WHITE : INK, fontWeight: 850, cursor: "pointer", boxShadow: active ? "0 8px 20px rgba(32,43,49,.16)" : "0 3px 12px rgba(32,43,49,.03)" }; }
function cardStyle(maxWidth = "none") { return { width: "100%", maxWidth, margin: "0 auto", boxSizing: "border-box", background: "rgba(255,255,255,.94)", border: `1px solid ${BORDER}`, borderRadius: 28, padding: "clamp(24px, 5vw, 48px)", boxShadow: "0 24px 70px rgba(32,43,49,.10)" }; }
const primaryButton = { width: "100%", minHeight: 52, marginTop: 20, border: 0, borderRadius: 12, background: RED, color: WHITE, fontWeight: 900, cursor: "pointer", padding: "0 20px", fontSize: 15, boxShadow: "0 10px 24px rgba(181,43,82,.22)" };
const secondaryButton = { ...primaryButton, background: WHITE, color: DEEP_RED, border: `1px solid ${RED}`, boxShadow: "none" };
const textButton = { border: 0, padding: 0, background: "transparent", color: RED, fontWeight: 900, cursor: "pointer" };

function AuthPanel({ mode, onSubmit, submitted, onSwitch }) {
  const isLogin = mode === "login";
  return <section style={cardStyle(560)}>
    <div style={{ textAlign: "center" }}><div style={{ fontSize: 48 }}>🦋</div><h2 style={{ margin: "16px 0 10px", fontSize: 34, letterSpacing: "-0.04em" }}>{isLogin ? "Welcome back." : "Let’s get started."}</h2><p style={{ margin: 0, color: MUTED, lineHeight: 1.7 }}>{isLogin ? "Log in to continue to your BizziBuddi workspace." : "Create your account and bring your business into focus."}</p></div>
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

function UpgradePanel({ onSelectPlan, submitted }) { return <section><div style={{ textAlign: "center", marginBottom: 28 }}><h2 style={{ margin: 0, fontSize: "clamp(30px, 5vw, 42px)", letterSpacing: "-0.04em" }}>Find your fit.</h2><p style={{ color: MUTED, lineHeight: 1.7 }}>Compare the future plan options before connecting real subscriptions.</p></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(225px, 1fr))", gap: 20 }}>{plans.map((plan) => <article key={plan.name} style={{ ...cardStyle(), border: plan.featured ? `3px solid ${RED}` : `1px solid ${BORDER}`, transform: plan.featured ? "translateY(-8px)" : "none" }}>{plan.featured && <span style={{ display: "inline-block", padding: "7px 10px", borderRadius: 999, background: RED, color: WHITE, fontSize: 11, fontWeight: 900 }}>MOST POPULAR PREVIEW</span>}<h3 style={{ fontSize: 27, margin: "18px 0 5px" }}>{plan.name}</h3><div style={{ fontSize: 42, fontWeight: 950, letterSpacing: "-0.05em" }}>{plan.price}<small style={{ fontSize: 14, color: MUTED, letterSpacing: 0 }}>/month</small></div><p style={{ color: MUTED, lineHeight: 1.6, minHeight: 52 }}>{plan.description}</p><ul style={{ paddingLeft: 20, lineHeight: 2, minHeight: 130 }}>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul><button type="button" onClick={onSelectPlan} style={plan.featured ? primaryButton : secondaryButton}>Select {plan.name}</button></article>)}</div>{submitted && <Notice>Demo plan selected. No subscription has been created.</Notice>}</section>; }

function DashboardPreview({ onUpgrade }) { return <section style={cardStyle(940)}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}><div><p style={{ color: RED, fontWeight: 900, fontSize: 12, letterSpacing: "0.12em", margin: 0 }}>ACCOUNT OVERVIEW</p><h2 style={{ margin: "12px 0 6px", fontSize: "clamp(30px, 5vw, 44px)", letterSpacing: "-0.05em" }}>Good morning, Darren.</h2><p style={{ color: MUTED, margin: 0 }}>A preview of your account home.</p></div><button type="button" onClick={onUpgrade} style={{ ...primaryButton, width: "auto" }}>Explore plans ↗</button></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginTop: 34 }}>{["Free plan", "0 team members", "0 active jobs", "No billing activity"].map((item) => <div key={item} style={{ border: `1px solid ${BORDER}`, borderRadius: 18, padding: 24, background: CREAM, fontWeight: 900, fontSize: 16 }}>{item}</div>)}</div><div style={{ marginTop: 24, padding: 24, borderRadius: 18, background: "#FFF1F4", border: "1px solid #F0CBD5" }}><strong style={{ fontSize: 17 }}>Your next step</strong><p style={{ margin: "9px 0 0", color: MUTED, lineHeight: 1.7 }}>Connect your account, choose a plan, and begin setting up your business workspace.</p></div></section>; }

function Field({ label, type, placeholder }) { return <label style={{ display: "block", marginTop: 17, fontSize: 13, fontWeight: 900 }}>{label}<input required type={type} placeholder={placeholder} style={{ display: "block", width: "100%", minHeight: 52, marginTop: 8, padding: "0 15px", boxSizing: "border-box", border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 15, background: "#FFFDFC" }} /></label>; }
function Notice({ children }) { return <p role="status" style={{ padding: 15, borderRadius: 12, background: "#FFF1F4", color: DEEP_RED, lineHeight: 1.5, fontWeight: 700 }}>{children}</p>; }
