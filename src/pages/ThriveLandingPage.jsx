import { useState } from "react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "A simple way to get started with THRIVE.",
    features: ["Clients & contacts", "Basic job management", "Calendar", "Essential business dashboard"],
  },
  {
    name: "Musician",
    price: "$9",
    period: "per month",
    description: "For independent performers and creative professionals.",
    features: ["Everything in Free", "Advanced scheduling", "Payments & invoices", "More automation"],
  },
  {
    name: "Band",
    price: "$19",
    period: "per month",
    description: "For small teams that need to stay coordinated.",
    features: ["Everything in Musician", "Shared workspace", "Team workflow", "Production tracking"],
    popular: true,
  },
  {
    name: "Pro",
    price: "$39",
    period: "per month",
    description: "The complete THRIVE experience for growing businesses.",
    features: ["Everything in Band", "Advanced reporting", "Priority features", "Professional controls"],
  },
];

const features = [
  ["People", "Keep client and contact information organised and easy to find."],
  ["Jobs", "Manage work from the first quote through to completion."],
  ["Production", "See what needs attention and keep work moving through each stage."],
  ["Calendar", "Keep appointments, fittings and important dates together."],
  ["Finance", "Bring quotes, invoices, payments and outstanding balances into one place."],
  ["Reports", "Turn day-to-day business activity into useful information."],
];

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ width: 38, height: 38, border: "2px solid #FFFFFF", borderRadius: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, transform: "rotate(45deg)" }}>
        <span style={{ transform: "rotate(-45deg)" }}>T</span>
      </span>
      <span style={{ fontSize: 25, fontWeight: 850, letterSpacing: 3 }}>THRIVE</span>
    </div>
  );
}

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function ThriveLandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "#F8F6F3", color: "#2F3A3F", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(47,58,63,.96)", backdropFilter: "blur(12px)", color: "#FFFFFF", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
          <Logo />
          <nav style={{ display: "flex", alignItems: "center", gap: 22 }}>
            {["why", "features", "pricing"].map((id) => <button key={id} onClick={() => scrollToId(id)} style={navButton}>{id === "why" ? "Why THRIVE" : id[0].toUpperCase() + id.slice(1)}</button>)}
            <button onClick={() => scrollToId("pricing")} style={topCta}>Start Free</button>
          </nav>
          <button aria-label="Open navigation" onClick={() => setMobileOpen((value) => !value)} style={{ ...mobileButton, display: "none" }}>☰</button>
        </div>
        {mobileOpen && <div style={{ padding: "0 24px 18px", display: "grid", gap: 10 }}>{["why", "features", "pricing"].map((id) => <button key={id} onClick={() => { setMobileOpen(false); scrollToId(id); }} style={mobileNav}>{id === "why" ? "Why THRIVE" : id[0].toUpperCase() + id.slice(1)}</button>)}</div>}
      </header>

      <main>
        <section style={{ background: "#2F3A3F", color: "#FFFFFF", padding: "110px 24px 90px", textAlign: "center" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <div style={{ display: "inline-flex", padding: "7px 13px", borderRadius: 999, background: "rgba(201,106,131,.16)", color: "#F0AFC0", fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>Business management, simplified</div>
            <h1 style={{ margin: "24px auto 0", maxWidth: 850, fontSize: "clamp(42px, 7vw, 78px)", lineHeight: 1.02, letterSpacing: -2.5 }}>Run your business.<br /><span style={{ color: "#C96A83" }}>Thrive.</span></h1>
            <p style={{ maxWidth: 700, margin: "26px auto 0", color: "#D6DADC", fontSize: 19, lineHeight: 1.7 }}>THRIVE brings the everyday parts of your business together, so you can spend less time managing the work and more time doing it.</p>
            <div style={{ marginTop: 34, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => scrollToId("pricing")} style={heroCta}>Start with THRIVE Free →</button>
              <button onClick={() => scrollToId("features")} style={heroSecondary}>See how it works</button>
            </div>
            <div style={{ marginTop: 58, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, textAlign: "left" }}>
              {[['01', 'One place', 'Your people, work and business information together.'], ['02', 'Clear workflow', 'Know what is happening, what is next and what needs attention.'], ['03', 'Less admin', 'Simple tools that help you keep the business moving.']].map(([n, title, text]) => <div key={n} style={heroCard}><span style={{ color: "#C96A83", fontWeight: 800, fontSize: 12 }}>{n}</span><strong style={{ display: "block", marginTop: 13, fontSize: 17 }}>{title}</strong><span style={{ display: "block", marginTop: 7, color: "#BFC5C7", fontSize: 13, lineHeight: 1.55 }}>{text}</span></div>)}
            </div>
          </div>
        </section>

        <section id="why" style={section}>
          <div style={eyebrow}>WHY THRIVE</div>
          <h2 style={heading}>Built around the way<br />small businesses actually work.</h2>
          <p style={lead}>You shouldn't need five different systems to know who your clients are, what you're making, what is due, or whether you've been paid. THRIVE gives you one clear workspace for the whole operation.</p>
          <div style={{ marginTop: 42, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {["Clarity", "Control", "Confidence"].map((title, i) => <div key={title} style={valueCard}><div style={{ width: 42, height: 42, borderRadius: 12, background: "#F3DDE4", color: "#8B1E3F", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>{i + 1}</div><h3 style={{ margin: "18px 0 8px", fontSize: 21 }}>{title}</h3><p style={{ margin: 0, color: "#687178", lineHeight: 1.65 }}>{["See the important information without hunting through spreadsheets, notes and messages.", "Keep jobs, schedules, payments and business processes moving from one organised system.", "Know where your business stands and make decisions with the information in front of you."][i]}</p></div>)}
          </div>
        </section>

        <section id="features" style={{ ...section, background: "#FFFFFF", maxWidth: "none", paddingLeft: "max(24px, calc((100% - 1080px) / 2))", paddingRight: "max(24px, calc((100% - 1080px) / 2))" }}>
          <div style={eyebrow}>EVERYTHING IN ONE WORKSPACE</div>
          <h2 style={heading}>The tools you need.<br />Nothing you don't.</h2>
          <div style={{ marginTop: 42, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {features.map(([title, text]) => <article key={title} style={featureCard}><div style={{ color: "#8B1E3F", fontSize: 13, fontWeight: 850, letterSpacing: .8, textTransform: "uppercase" }}>THRIVE / {title}</div><h3 style={{ margin: "14px 0 8px", fontSize: 21 }}>{title}</h3><p style={{ margin: 0, color: "#687178", lineHeight: 1.65 }}>{text}</p></article>)}
          </div>
        </section>

        <section id="pricing" style={{ ...section, background: "#F2EFEB", maxWidth: "none", paddingLeft: "max(24px, calc((100% - 1080px) / 2))", paddingRight: "max(24px, calc((100% - 1080px) / 2))" }}>
          <div style={{ textAlign: "center" }}><div style={eyebrow}>SIMPLE PRICING</div><h2 style={{ ...heading, marginLeft: "auto", marginRight: "auto" }}>Start free. Grow when you're ready.</h2><p style={{ ...lead, marginLeft: "auto", marginRight: "auto" }}>No complicated setup. No long-term commitment. Choose the level that fits your business.</p></div>
          <div style={{ marginTop: 42, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, alignItems: "stretch" }}>
            {plans.map((plan) => <article key={plan.name} style={{ ...planCard, border: plan.popular ? "2px solid #8B1E3F" : "1px solid #DDD8D3" }}>
              {plan.popular && <div style={{ margin: "-2px -2px 18px", padding: "7px 12px", background: "#8B1E3F", color: "#FFFFFF", textAlign: "center", fontSize: 11, fontWeight: 850, letterSpacing: 1, textTransform: "uppercase" }}>Most popular</div>}
              <h3 style={{ margin: 0, fontSize: 22 }}>{plan.name}</h3><div style={{ marginTop: 18, display: "flex", alignItems: "baseline", gap: 6 }}><strong style={{ fontSize: 38 }}>{plan.price}</strong><span style={{ color: "#7A8184", fontSize: 12 }}>{plan.period}</span></div><p style={{ minHeight: 66, color: "#687178", fontSize: 13, lineHeight: 1.55 }}>{plan.description}</p><div style={{ display: "grid", gap: 10, minHeight: 130 }}>{plan.features.map((feature) => <div key={feature} style={{ display: "flex", gap: 8, fontSize: 13 }}><span style={{ color: "#8B1E3F", fontWeight: 900 }}>✓</span>{feature}</div>)}</div><button onClick={() => alert(`THRIVE ${plan.name} signup will be connected in the account/subscription stage.`)} style={{ width: "100%", marginTop: 22, minHeight: 44, border: plan.popular ? "none" : "1px solid #CFC8C2", borderRadius: 9, background: plan.popular ? "#8B1E3F" : "#FFFFFF", color: plan.popular ? "#FFFFFF" : "#2F3A3F", fontWeight: 800, cursor: "pointer" }}>{plan.name === "Free" ? "Start Free" : `Choose ${plan.name}`}</button>
            </article>)}
          </div>
          <p style={{ textAlign: "center", margin: "22px 0 0", color: "#7A8184", fontSize: 12 }}>Prices shown are mock pricing for the THRIVE development site and are not yet connected to billing.</p>
        </section>

        <section style={{ background: "#2F3A3F", color: "#FFFFFF", padding: "80px 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}><div style={{ color: "#C96A83", fontWeight: 850, letterSpacing: 1, fontSize: 12 }}>READY WHEN YOU ARE</div><h2 style={{ margin: "15px 0 0", fontSize: "clamp(32px, 5vw, 52px)" }}>Your business has enough to manage.<br />THRIVE makes it simpler.</h2><button onClick={() => scrollToId("pricing")} style={{ ...heroCta, marginTop: 30 }}>Start for free →</button></div>
        </section>
      </main>

      <footer style={{ background: "#232C30", color: "#BFC5C7", padding: "34px 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", justifyContent: "space-between", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
          <div><div style={{ color: "#FFFFFF", fontWeight: 850, letterSpacing: 2 }}>THRIVE</div><div style={{ marginTop: 6, fontSize: 12 }}>Streamline your business. Simplify your work.</div></div>
          <div style={{ fontSize: 11, textAlign: "right" }}>Terms & Conditions &nbsp; · &nbsp; Privacy &nbsp; · &nbsp; © {new Date().getFullYear()} THRIVE. All rights reserved.</div>
        </div>
      </footer>

      <style>{`@media (max-width: 900px){header nav{display:none!important}header button[style*="display: none"]{display:block!important}section{padding-top:64px!important;padding-bottom:72px!important}h1{letter-spacing:-1.5px!important}.thrive-grid{grid-template-columns:1fr!important}}@media (max-width: 760px){main section>div>div[style*="repeat(3"]{grid-template-columns:1fr!important}main section>div>div[style*="repeat(4"]{grid-template-columns:1fr!important}}button,a{font:inherit}`}</style>
    </div>
  );
}

const navButton = { color: "#D6DADC", background: "transparent", border: "none", textDecoration: "none", fontSize: 13, fontWeight: 650, cursor: "pointer" };
const topCta = { border: "none", borderRadius: 8, padding: "10px 15px", background: "#C96A83", color: "#FFFFFF", fontWeight: 800, fontSize: 12, cursor: "pointer" };
const mobileButton = { border: "1px solid rgba(255,255,255,.2)", borderRadius: 8, padding: "8px 11px", background: "transparent", color: "#FFFFFF", cursor: "pointer" };
const mobileNav = { textAlign: "left", border: "none", background: "transparent", color: "#FFFFFF", padding: 4, cursor: "pointer" };
const heroCta = { border: "none", borderRadius: 9, padding: "14px 20px", background: "#C96A83", color: "#FFFFFF", fontWeight: 850, cursor: "pointer" };
const heroSecondary = { border: "1px solid rgba(255,255,255,.25)", borderRadius: 9, padding: "14px 20px", background: "transparent", color: "#FFFFFF", fontWeight: 750, cursor: "pointer" };
const heroCard = { padding: 20, borderRadius: 13, background: "rgba(255,255,255,.055)", border: "1px solid rgba(255,255,255,.09)" };
const section = { maxWidth: 1080, margin: "0 auto", padding: "90px 24px" };
const eyebrow = { color: "#8B1E3F", fontSize: 11, fontWeight: 900, letterSpacing: 1.4, textTransform: "uppercase" };
const heading = { margin: "14px 0 0", fontSize: "clamp(32px, 4vw, 48px)", lineHeight: 1.1, letterSpacing: -1.2 };
const lead = { maxWidth: 700, marginTop: 18, color: "#687178", fontSize: 16, lineHeight: 1.7 };
const valueCard = { padding: 26, borderRadius: 15, background: "#FFFFFF", border: "1px solid #E7E2DE" };
const featureCard = { padding: 25, borderRadius: 14, background: "#F8F6F3", border: "1px solid #E7E2DE", minHeight: 155 };
const planCard = { position: "relative", overflow: "hidden", borderRadius: 14, background: "#FFFFFF", padding: 22, boxSizing: "border-box" };
