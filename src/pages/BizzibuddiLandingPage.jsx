import { useState } from "react";
import BizzibuddiTermsPage from "./BizzibuddiTermsPage";
import BizzibuddiPrivacyPage from "./BizzibuddiPrivacyPage";

const RED = "#FF174F";
const RED_DARK = "#C4003D";
const BG = "#08090D";
const SURFACE = "#12141B";
const TEXT = "#FFFFFF";
const MUTED = "#B8B0B8";

const plans = [
  { name: "Free", price: "$0", period: "forever", description: "A simple starting point for independent operators.", features: ["People & contacts", "Basic jobs", "Calendar", "Dashboard"] },
  { name: "Professional", price: "$9", period: "/ month", description: "For established service businesses and solo professionals.", features: ["Everything in Free", "Advanced scheduling", "Payments & invoices", "Automation"] },
  { name: "Team", price: "$19", period: "/ month", description: "For small teams working together in one place.", features: ["Everything in Professional", "Shared workspace", "Team workflow", "Production tracking"], popular: true },
  { name: "Business", price: "$39", period: "/ month", description: "For growing businesses needing deeper control.", features: ["Everything in Team", "Advanced reporting", "Priority features", "Professional controls"] },
];

const features = [
  ["01", "People", "Keep every client, contact detail and piece of history organised in one accessible workspace."],
  ["02", "Jobs", "Manage every job from the first enquiry and quote through to delivery and completion."],
  ["03", "Production", "Track tasks, stages and deadlines so you always know what needs attention next."],
  ["04", "Calendar", "Bring appointments, bookings, deadlines and important dates together in one clear view."],
  ["05", "Finance", "Stay on top of quotes, invoices, payments and outstanding balances without the guesswork."],
  ["06", "Reports", "Turn everyday business activity into clear information that helps you plan and make decisions."],
];

const buttonBase = {
  borderRadius: 10,
  minHeight: 44,
  padding: "0 18px",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  transition: "transform .18s ease, box-shadow .18s ease, background .18s ease, border-color .18s ease",
};

const eyebrow = { color: RED, fontSize: 10, fontWeight: 600, letterSpacing: 1.5 };
const sectionEyebrow = { ...eyebrow, fontSize: 15, fontWeight: 600, letterSpacing: 2.2 };
const heading = { margin: "10px 0 0", fontSize: "clamp(30px, 4vw, 46px)", lineHeight: 1.08, letterSpacing: -1.2, color: TEXT };
const lead = { maxWidth: 650, margin: "12px 0 0", color: MUTED, fontSize: 14, lineHeight: 1.6 };
const panel = { background: SURFACE, border: `1px solid ${RED}`, borderRadius: 20, boxShadow: "0 20px 48px rgba(0,0,0,.42)", position: "relative", overflow: "hidden", color: TEXT };
const footerLink = { color: RED, textDecoration: "none", fontWeight: 400 };
const footerButton = { border: "none", background: "transparent", color: RED, padding: 0, textAlign: "left", font: "inherit", fontWeight: 400, cursor: "pointer" };

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
      <span style={{ width: 30, height: 30, border: "2px solid #FFF", borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, transform: "rotate(45deg)", background: RED_DARK }}>
        <span style={{ transform: "rotate(-45deg)" }}>B</span>
      </span>
      <span style={{ fontSize: 21, fontWeight: 600, letterSpacing: 1.8 }}>BizziBuddi</span>
    </div>
  );
}

function CtaButton({ children, secondary = false, onClick }) {
  return (
    <button type="button" onClick={onClick} className={secondary ? "bizzibuddi-cta bizzibuddi-cta-secondary" : "bizzibuddi-cta"} style={{ ...buttonBase, border: `2px solid ${RED}`, background: secondary ? "transparent" : RED, color: "#FFF", boxShadow: secondary ? "none" : `0 10px 28px rgba(255,23,79,.34)` }}>
      {children}
    </button>
  );
}

function Footer() {
  return (
    <footer style={{ background: "#050609", color: "#FFFFFF", padding: "64px 22px 34px", borderTop: `4px solid ${RED}` }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div className="bizzibuddi-footer-grid" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 34, alignItems: "start" }}>
          <div>
            <Logo />
            <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.7, color: "#FFFFFF" }}>Streamline your business.<br />Simplify your work.</div>
            <div style={{ marginTop: 18, color: RED, fontSize: 12, fontWeight: 600, letterSpacing: 1.1 }}>BUSINESS MANAGEMENT, ALL IN ONE PLACE.</div>
          </div>
          <div>
            <div style={{ color: "#FFFFFF", fontSize: 12, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 16 }}>Quick Links</div>
            <div style={{ display: "grid", gap: 12, fontSize: 14 }}>
              <a href="/bizzibuddi" style={footerLink} className="bizzibuddi-footer-link">Home</a>
              <button type="button" onClick={() => scrollToId("why")} style={footerButton} className="bizzibuddi-footer-link">Why BizziBuddi</button>
              <button type="button" onClick={() => scrollToId("features")} style={footerButton} className="bizzibuddi-footer-link">Features</button>
              <button type="button" onClick={() => scrollToId("pricing")} style={footerButton} className="bizzibuddi-footer-link">Pricing</button>
            </div>
          </div>
          <div>
            <div style={{ color: "#FFFFFF", fontSize: 12, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 16 }}>Account</div>
            <div style={{ display: "grid", gap: 12, fontSize: 14 }}>
              <a href="/login" style={footerLink} className="bizzibuddi-footer-link">Log in</a>
              <a href="#pricing" style={footerLink} className="bizzibuddi-footer-link">Start Free</a>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 42, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.3)", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", fontSize: 12 }}>
          <a href="/bizzibuddi/terms" style={footerLink} className="bizzibuddi-footer-link">Terms &amp; Conditions</a>
          <a href="/bizzibuddi/privacy" style={footerLink} className="bizzibuddi-footer-link">Privacy Policy</a>
          <span style={{ color: "#FFFFFF" }}>© {new Date().getFullYear()} BizziBuddi. All rights reserved.</span>
        </div>
        <div style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: "#FFFFFF" }}>Development site — pricing, billing and account subscriptions will be connected next.</div>
      </div>
    </footer>
  );
}

export default function BizzibuddiLandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = window.location.pathname.replace(/\/$/, "");
  if (pathname === "/bizzibuddi/terms") return <BizzibuddiTermsPage />;
  if (pathname === "/bizzibuddi/privacy") return <BizzibuddiPrivacyPage />;

  const goPricing = () => scrollToId("pricing");
  const nav = { border: "none", background: "transparent", color: "#FFFFFF", fontWeight: 500, fontSize: 13, cursor: "pointer", padding: "10px 4px" };
  const pillars = [["ONE PLACE", "Everything together", "Stop jumping between spreadsheets, notes and messages."], ["CLEAR WORKFLOW", "Know what is next", "Keep work moving from first contact to completion."], ["LESS ADMIN", "Get time back", "Simple tools designed around everyday business work."]];
  const reasons = [["Clarity", "See the information that matters without digging through systems."], ["Control", "Keep jobs, schedules, payments and processes organised."], ["Confidence", "Know where your work and business stand at a glance."]];

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        button:hover,.bizzibuddi-footer-link:hover,.bizzibuddi-nav-link:hover{transform:translateY(-2px);filter:brightness(1.18)}
        button:focus-visible,a:focus-visible{outline:3px solid ${RED};outline-offset:4px}
        .bizzibuddi-cta:hover{background:${RED_DARK}!important;box-shadow:0 12px 34px rgba(255,23,79,.5)!important}
        .bizzibuddi-cta-secondary:hover{background:${RED}!important;color:#FFF!important}
        .bizzibuddi-nav-link{transition:color .18s ease,transform .18s ease}
        .bizzibuddi-footer-link{transition:filter .18s ease,transform .18s ease;color:${RED}!important}
        .bizzibuddi-card{transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
        .bizzibuddi-card:hover{transform:translateY(-4px);border-color:${RED}!important;box-shadow:0 18px 42px rgba(255,23,79,.22)!important}
        @media(max-width:850px){.bizzibuddi-desktop-nav{display:none!important}.bizzibuddi-mobile-button{display:block!important}.bizzibuddi-hero-grid,.bizzibuddi-three-grid,.bizzibuddi-feature-grid{grid-template-columns:1fr!important}.bizzibuddi-plan-grid{grid-template-columns:1fr 1fr!important}.bizzibuddi-footer-grid{grid-template-columns:1fr 1fr!important}}
        @media(max-width:520px){.bizzibuddi-plan-grid{grid-template-columns:1fr!important}.bizzibuddi-footer-grid{grid-template-columns:1fr!important}.bizzibuddi-section-pad{padding-left:16px!important;padding-right:16px!important}}
      `}</style>
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(8,9,13,.98)", color: "#FFF", borderBottom: `4px solid ${RED}`, backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "12px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
          <a href="/bizzibuddi" style={{ color: "inherit", textDecoration: "none" }}><Logo /></a>
          <nav className="bizzibuddi-desktop-nav" style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <button type="button" onClick={() => scrollToId("why")} className="bizzibuddi-nav-link" style={nav}>Why BizziBuddi</button>
            <button type="button" onClick={() => scrollToId("features")} className="bizzibuddi-nav-link" style={nav}>Features</button>
            <button type="button" onClick={goPricing} className="bizzibuddi-nav-link" style={nav}>Pricing</button>
            <a href="/login" className="bizzibuddi-nav-link" style={{ ...nav, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Log in</a>
            <CtaButton onClick={goPricing}>Start Free →</CtaButton>
          </nav>
          <button type="button" aria-label="Open navigation" onClick={() => setMobileOpen((value) => !value)} style={{ ...buttonBase, border: `2px solid ${RED}`, background: RED_DARK, color: "#FFF", display: "none" }} className="bizzibuddi-mobile-button">☰</button>
        </div>
        {mobileOpen && <div style={{ padding: "0 22px 18px", display: "grid", gap: 9 }}><button type="button" onClick={() => { setMobileOpen(false); scrollToId("why"); }} style={nav}>Why BizziBuddi</button><button type="button" onClick={() => { setMobileOpen(false); scrollToId("features"); }} style={nav}>Features</button><button type="button" onClick={() => { setMobileOpen(false); goPricing(); }} style={nav}>Pricing</button><a href="/login" onClick={() => setMobileOpen(false)} style={{ ...nav, textDecoration: "none", textAlign: "center" }}>Log in</a><CtaButton onClick={() => { setMobileOpen(false); goPricing(); }}>Start Free →</CtaButton></div>}
      </header>
      <main>
        <section style={{ background: `linear-gradient(135deg, ${BG} 0%, ${SURFACE} 62%, #16000A 100%)`, color: "#FFF", padding: "76px 22px 64px" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto", textAlign: "center" }}>
            <div style={sectionEyebrow}>BUSINESS MANAGEMENT, SIMPLIFIED</div>
            <div style={{ margin: "18px auto 0", color: MUTED, fontSize: "clamp(18px, 2.4vw, 28px)", fontWeight: 400, letterSpacing: -.4 }}>Run your business. With BizziBuddi.</div>
            <h1 style={{ margin: "18px auto 0", maxWidth: 980, fontSize: "clamp(34px, 5.5vw, 60px)", fontWeight: 600, lineHeight: 1.06, letterSpacing: -1.9 }}>One clear workspace for your people, jobs, production, calendar and money.</h1>
            <div style={{ marginTop: 25, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}><CtaButton onClick={goPricing}>Start with BizziBuddi Free →</CtaButton><CtaButton secondary onClick={() => scrollToId("features")}>Explore BizziBuddi</CtaButton></div>
            <div className="bizzibuddi-hero-grid" style={{ marginTop: 42, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, textAlign: "left" }}>{pillars.map(([label, title, text]) => <article key={label} className="bizzibuddi-card" style={{ background: "rgba(255,255,255,.045)", border: `1px solid ${RED}`, borderRadius: 16, padding: 20, minHeight: 125 }}><div style={{ ...eyebrow, fontSize: 12, letterSpacing: 1.6 }}>{label}</div><strong style={{ display: "block", marginTop: 10, fontSize: 19, fontWeight: 600 }}>{title}</strong><p style={{ margin: "9px 0 0", color: "#FFFFFF", fontSize: 14.5, lineHeight: 1.6 }}>{text}</p></article>)}</div>
          </div>
        </section>
        <section id="why" style={{ maxWidth: 1080, margin: "0 auto", padding: "70px 22px" }} className="bizzibuddi-section-pad"><div style={sectionEyebrow}>WHY BizziBuddi</div><h2 style={heading}>Everything your business needs.<br />In one place.</h2><p style={lead}>BizziBuddi is built to make the everyday running of a business clearer, faster and easier to manage.</p><div className="bizzibuddi-three-grid" style={{ marginTop: 28, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>{reasons.map(([title, text], index) => <article key={title} className="bizzibuddi-card" style={{ ...panel, padding: 28, minHeight: 205 }}><div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 5, background: RED }} /><div style={{ width: 54, height: 54, borderRadius: 15, background: RED_DARK, color: "#FFFFFF", display: "grid", placeItems: "center", fontWeight: 600, fontSize: 17 }}>{index + 1}</div><h3 style={{ margin: "19px 0 8px", fontSize: 22 }}>{title}</h3><p style={{ margin: 0, color: "#FFFFFF", fontSize: 14, lineHeight: 1.65 }}>{text}</p></article>)}</div></section>
        <section id="features" style={{ background: "#0E1016", borderTop: `2px solid ${RED}`, borderBottom: `2px solid ${RED}`, padding: "70px 22px" }} className="bizzibuddi-section-pad"><div style={{ maxWidth: 1080, margin: "0 auto" }}><div style={sectionEyebrow}>YOUR BUSINESS. YOUR WORKSPACE.</div><h2 style={heading}>Six essentials.<br />One powerful BizziBuddi workspace.</h2><div className="bizzibuddi-feature-grid" style={{ marginTop: 28, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>{features.map(([number, title, text]) => <article key={title} className="bizzibuddi-card" style={{ ...panel, padding: 22, minHeight: 155 }}><div style={{ color: RED, fontSize: 11, fontWeight: 600, letterSpacing: 1.2 }}>{number}</div><h3 style={{ margin: "16px 0 8px", fontSize: 21 }}>{title}</h3><p style={{ margin: 0, color: "#FFFFFF", fontSize: 13.5, lineHeight: 1.65 }}>{text}</p></article>)}</div></div></section>
        <section id="pricing" style={{ background: "#0A0B10", padding: "70px 22px" }} className="bizzibuddi-section-pad"><div style={{ maxWidth: 1080, margin: "0 auto" }}><div style={{ textAlign: "center" }}><div style={sectionEyebrow}>SIMPLE PRICING</div><h2 style={{ ...heading, marginLeft: "auto", marginRight: "auto" }}>Start free. Grow when you're ready.</h2><p style={{ ...lead, maxWidth: 1200, marginLeft: "auto", marginRight: "auto", fontSize: "clamp(18px, 2.2vw, 26px)", lineHeight: 1.4 }}>No complicated setup. No long-term commitment. Choose the level that fits your business.</p></div><div className="bizzibuddi-plan-grid" style={{ marginTop: 42, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, alignItems: "stretch" }}>{plans.map((plan) => <article key={plan.name} className="bizzibuddi-card" style={{ ...panel, border: `2px solid ${plan.popular ? RED : "#34303A"}`, borderRadius: 14, padding: 22, display: "flex", flexDirection: "column" }}>{plan.popular && <div style={{ margin: "-22px -22px 18px", padding: "8px 12px", background: RED, color: "#FFF", textAlign: "center", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Most popular</div>}<h3 style={{ margin: 0, fontSize: 20 }}>{plan.name}</h3><div style={{ marginTop: 18, display: "flex", alignItems: "baseline", gap: 6 }}><strong style={{ fontSize: 38 }}>{plan.price}</strong><span style={{ color: "#FFFFFF", fontSize: 12 }}>{plan.period}</span></div><p style={{ minHeight: 66, color: "#FFFFFF", fontSize: 13, lineHeight: 1.55 }}>{plan.description}</p><div style={{ display: "grid", gap: 10, minHeight: 130, flex: 1 }}>{plan.features.map((feature) => <div key={feature} style={{ display: "flex", gap: 8, fontSize: 13 }}><span style={{ color: RED, fontWeight: 600 }}>✓</span>{feature}</div>)}</div><button type="button" onClick={() => alert(`BizziBuddi ${plan.name} signup will be connected in the account/subscription stage.`)} className="bizzibuddi-cta" style={{ width: "100%", marginTop: 22, minHeight: 44, border: `2px solid ${RED}`, borderRadius: 9, background: plan.popular ? RED : "transparent", color: "#FFF", fontWeight: 600, cursor: "pointer", transition: "background .18s ease,transform .18s ease,box-shadow .18s ease" }}>{plan.name === "Free" ? "Start Free" : `Choose ${plan.name}`}</button></article>)}</div><p style={{ textAlign: "center", margin: "22px 0 0", color: "#FFFFFF", fontSize: 12 }}>Prices shown are mock pricing for the BizziBuddi development site and are not yet connected to billing.</p></div></section>
        <section style={{ background: `linear-gradient(135deg, ${BG} 0%, #16000A 100%)`, padding: "70px 22px" }} className="bizzibuddi-section-pad"><div style={{ maxWidth: 1080, margin: "0 auto", textAlign: "center" }}><div style={sectionEyebrow}>READY WHEN YOU ARE</div><h2 style={heading}>A clearer way to run your business.</h2><p style={{ ...lead, marginLeft: "auto", marginRight: "auto", fontSize: "clamp(18px, 2.2vw, 26px)", lineHeight: 1.4 }}>Start with the essentials. Build from there.</p><div style={{ marginTop: 24 }}><CtaButton onClick={goPricing}>Get started with BizziBuddi →</CtaButton></div></div></section>
      </main>
      <Footer />
    </div>
  );
}
