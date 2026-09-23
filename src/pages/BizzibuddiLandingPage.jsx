import { useState } from "react";
import BizziBuddiLogo from "../components/common/BizziBuddiLogo";
import BizzibuddiTermsPage from "./BizzibuddiTermsPage";
import BizzibuddiPrivacyPage from "./BizzibuddiPrivacyPage";

const RED = "#2563EB";
const RED_DARK = "#0F2D4A";
const CYAN = "#00B4DB";
const BG = "#061A2B";
const SURFACE = "#0F2D4A";
const TEXT = "#FFFFFF";
const MUTED = "#B8C6D6";

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
  return <BizziBuddiLogo size={34} dark showWordmark />;
}

function CtaButton({ children, secondary = false, onClick }) {
  return (
    <button type="button" onClick={onClick} className={secondary ? "bizzibuddi-cta bizzibuddi-cta-secondary" : "bizzibuddi-cta"} style={{ ...buttonBase, border: `2px solid ${RED}`, background: secondary ? "transparent" : RED, color: "#FFF", boxShadow: secondary ? "none" : `0 10px 28px rgba(37,99,235,.34)` }}>
      {children}
    </button>
  );
}

function Footer() {
  return (
    <footer className="bizzibuddi-footer" style={{ background: "#050609", color: "#FFFFFF", padding: "38px 22px 22px", borderTop: `4px solid ${CYAN}` }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div className="bizzibuddi-footer-grid" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 26, alignItems: "start" }}>
          <div>
            <Logo />
            <div style={{ marginTop: 9, fontSize: 13, lineHeight: 1.5, color: "#FFFFFF" }}>Your personal assistant for business.<br />Gives you time.</div>
            <div style={{ marginTop: 11, color: RED, fontSize: 11, fontWeight: 600, letterSpacing: 1.1 }}>ORGANISE  ·  PLAN  ·  DO  ·  GROW</div>
          </div>
          <div>
            <div style={{ color: "#FFFFFF", fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>Quick Links</div>
            <div style={{ display: "grid", gap: 7, fontSize: 13 }}>
              <a href="/bizzibuddi" style={footerLink} className="bizzibuddi-footer-link">Home</a>
              <button type="button" onClick={() => scrollToId("why")} style={footerButton} className="bizzibuddi-footer-link">Why BizziBuddi</button>
              <button type="button" onClick={() => scrollToId("features")} style={footerButton} className="bizzibuddi-footer-link">Features</button>
              <button type="button" onClick={() => scrollToId("pricing")} style={footerButton} className="bizzibuddi-footer-link">Pricing</button>
            </div>
          </div>
          <div>
            <div className="bizzibuddi-footer-account-heading" style={{ color: "#FFFFFF", fontSize: 12, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 16 }}>Account</div>
            <div className="bizzibuddi-footer-account-links" style={{ display: "grid", gap: 12, fontSize: 14 }}>
              <a href="/login" style={footerLink} className="bizzibuddi-footer-link">Log in</a>
              <a href="#pricing" style={footerLink} className="bizzibuddi-footer-link">Start Free</a>
            </div>
          </div>
        </div>
        <div className="bizzibuddi-footer-legal" style={{ marginTop: 24, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.3)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", fontSize: 11 }}>
          <a href="/bizzibuddi/terms" style={footerLink} className="bizzibuddi-footer-link">Terms &amp; Conditions</a>
          <a href="/bizzibuddi/privacy" style={footerLink} className="bizzibuddi-footer-link">Privacy Policy</a>
          <span style={{ color: "#FFFFFF" }}>© {new Date().getFullYear()} BizziBuddi. All rights reserved.</span>
        </div>
        <div className="bizzibuddi-footer-note" style={{ marginTop: 12, textAlign: "center", fontSize: 11, color: "#FFFFFF" }}>Development site — pricing, billing and account subscriptions will be connected next.</div>
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
  const nav = { border: "none", background: "transparent", color: "#FFFFFF", fontWeight: 500, fontSize: 13, cursor: "pointer", padding: "7px 4px" };
  const pillars = [["ONE PLACE", "Everything together", "Stop jumping between spreadsheets, notes and messages."], ["CLEAR WORKFLOW", "Know what is next", "Keep work moving from first contact to completion."], ["LESS ADMIN", "Get time back", "Simple tools designed around everyday business work."]];
  const reasons = [["Clarity", "See the information that matters without digging through systems."], ["Control", "Keep jobs, schedules, payments and processes organised."], ["Confidence", "Know where your work and business stand at a glance."]];

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        button:hover,.bizzibuddi-footer-link:hover,.bizzibuddi-nav-link:hover{transform:translateY(-2px);filter:brightness(1.18)}
        button:focus-visible,a:focus-visible{outline:3px solid ${RED};outline-offset:4px}
        .bizzibuddi-cta:hover{background:${RED_DARK}!important;box-shadow:0 12px 34px rgba(37,99,235,.5)!important}
        .bizzibuddi-cta-secondary:hover{background:${RED}!important;color:#FFF!important}
        .bizzibuddi-nav-link{transition:color .18s ease,transform .18s ease}
        .bizzibuddi-footer-link{transition:filter .18s ease,transform .18s ease;color:${RED}!important}
        .bizzibuddi-card{transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
        .bizzibuddi-card:hover{transform:translateY(-4px);border-color:${RED}!important;box-shadow:0 18px 42px rgba(37,99,235,.22)!important}
        @media(max-width:850px){.bizzibuddi-desktop-nav{display:none!important}.bizzibuddi-mobile-button{display:block!important}.bizzibuddi-hero-grid,.bizzibuddi-three-grid,.bizzibuddi-feature-grid{grid-template-columns:1fr!important}.bizzibuddi-plan-grid{grid-template-columns:1fr 1fr!important}.bizzibuddi-footer-grid{grid-template-columns:1fr 1fr!important}}
        @media(max-width:520px){.bizzibuddi-plan-grid{grid-template-columns:1fr!important}.bizzibuddi-footer-grid{grid-template-columns:1fr!important}.bizzibuddi-section-pad{padding-left:16px!important;padding-right:16px!important}.bizzibuddi-hero{padding:28px 16px 30px!important}.bizzibuddi-hero-logo{transform:scale(.86)}.bizzibuddi-hero-title{margin-top:12px!important;font-size:clamp(29px,8vw,38px)!important}.bizzibuddi-hero-promise{margin-top:6px!important;font-size:20px!important}.bizzibuddi-hero-copy{margin-top:8px!important;font-size:15px!important}.bizzibuddi-hero-actions{margin-top:14px!important;gap:8px!important}.bizzibuddi-hero-actions button{min-height:42px!important;padding-left:14px!important;padding-right:14px!important}.bizzibuddi-footer{padding:28px 16px 18px!important}.bizzibuddi-footer-grid{gap:18px!important}.bizzibuddi-footer-account-heading{margin-bottom:9px!important}.bizzibuddi-footer-account-links{gap:7px!important}.bizzibuddi-footer-legal{margin-top:18px!important;padding-top:11px!important;gap:9px!important}.bizzibuddi-footer-note{margin-top:10px!important}}
      `}</style>
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(6,26,43,.98)", color: "#FFF", borderBottom: `4px solid ${RED}`, backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "8px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <a href="/bizzibuddi" style={{ color: "inherit", textDecoration: "none" }}><Logo /></a>
          <nav className="bizzibuddi-desktop-nav" style={{ display: "flex", alignItems: "center", gap: 15 }}>
            <button type="button" onClick={() => scrollToId("why")} className="bizzibuddi-nav-link" style={nav}>Why BizziBuddi</button>
            <button type="button" onClick={() => scrollToId("features")} className="bizzibuddi-nav-link" style={nav}>Features</button>
            <button type="button" onClick={goPricing} className="bizzibuddi-nav-link" style={nav}>Pricing</button>
            <a href="/login" className="bizzibuddi-nav-link" style={{ ...nav, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Log in</a>
            <CtaButton onClick={goPricing}>Start Free →</CtaButton>
          </nav>
          <button type="button" aria-label="Open navigation" onClick={() => setMobileOpen((value) => !value)} style={{ ...buttonBase, minHeight: 40, padding: "0 14px", border: `2px solid ${RED}`, background: RED_DARK, color: "#FFF", display: "none" }} className="bizzibuddi-mobile-button">☰</button>
        </div>
        {mobileOpen && <div style={{ padding: "0 22px 12px", display: "grid", gap: 6 }}><button type="button" onClick={() => { setMobileOpen(false); scrollToId("why"); }} style={nav}>Why BizziBuddi</button><button type="button" onClick={() => { setMobileOpen(false); scrollToId("features"); }} style={nav}>Features</button><button type="button" onClick={() => { setMobileOpen(false); goPricing(); }} style={nav}>Pricing</button><a href="/login" onClick={() => setMobileOpen(false)} style={{ ...nav, textDecoration: "none", textAlign: "center" }}>Log in</a><CtaButton onClick={() => { setMobileOpen(false); goPricing(); }}>Start Free →</CtaButton></div>}
      </header>
      <main>
        <section className="bizzibuddi-hero" style={{ background: `linear-gradient(135deg, ${BG} 0%, ${SURFACE} 62%, #08233A 100%)`, color: "#FFF", padding: "42px 22px 38px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
            <div className="bizzibuddi-hero-logo" style={{ display: "flex", justifyContent: "center" }}><BizziBuddiLogo size={96} dark showWordmark tagline="Business support, simplified." featureLine /></div>
            <h1 className="bizzibuddi-hero-title" style={{ margin: "18px auto 0", maxWidth: 820, fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 700, lineHeight: 1.06, letterSpacing: -1.6 }}>Your personal assistant for business.</h1>
            <div className="bizzibuddi-hero-promise" style={{ margin: "8px auto 0", color: CYAN, fontSize: "clamp(20px, 2.4vw, 28px)", fontWeight: 700, letterSpacing: -.4 }}>Gives you time.</div>
            <p className="bizzibuddi-hero-copy" style={{ margin: "10px auto 0", maxWidth: 720, color: "#FFFFFF", fontSize: "clamp(16px, 1.8vw, 20px)", fontWeight: 500, lineHeight: 1.35, letterSpacing: -.15 }}>Helping you organise, plan and grow.</p>
            <div className="bizzibuddi-hero-actions" style={{ marginTop: 18, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}><CtaButton onClick={goPricing}>Start with BizziBuddi Free →</CtaButton><CtaButton secondary onClick={() => scrollToId("features")}>Explore BizziBuddi</CtaButton></div>
          </div>
        </section>
        <section id="why" style={{ maxWidth: 1080, margin: "0 auto", padding: "44px 22px" }} className="bizzibuddi-section-pad"><div style={sectionEyebrow}>WHY BizziBuddi</div><h2 style={heading}>Everything your business needs.<br />In one place.</h2><p style={lead}>BizziBuddi is built to make the everyday running of a business clearer, faster and easier to manage.</p><div className="bizzibuddi-three-grid" style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>{reasons.map(([title, text], index) => <article key={title} className="bizzibuddi-card" style={{ ...panel, padding: 20, minHeight: 150 }}><div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 5, background: RED }} /><div style={{ width: 42, height: 42, borderRadius: 12, background: RED_DARK, color: "#FFFFFF", display: "grid", placeItems: "center", fontWeight: 600, fontSize: 14 }}>{index + 1}</div><h3 style={{ margin: "13px 0 6px", fontSize: 19 }}>{title}</h3><p style={{ margin: 0, color: "#FFFFFF", fontSize: 13, lineHeight: 1.5 }}>{text}</p></article>)}</div></section>
        <section id="features" style={{ background: "#0E1016", borderTop: `2px solid ${RED}`, borderBottom: `2px solid ${RED}`, padding: "44px 22px" }} className="bizzibuddi-section-pad"><div style={{ maxWidth: 1080, margin: "0 auto" }}><div style={sectionEyebrow}>YOUR BUSINESS. YOUR WORKSPACE.</div><h2 style={heading}>Six essentials.<br />One powerful BizziBuddi workspace.</h2><div className="bizzibuddi-feature-grid" style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>{features.map(([number, title, text]) => <article key={title} className="bizzibuddi-card" style={{ ...panel, padding: 18, minHeight: 125 }}><div style={{ color: RED, fontSize: 11, fontWeight: 600, letterSpacing: 1.2 }}>{number}</div><h3 style={{ margin: "11px 0 6px", fontSize: 19 }}>{title}</h3><p style={{ margin: 0, color: "#FFFFFF", fontSize: 13, lineHeight: 1.5 }}>{text}</p></article>)}</div></div></section>
        <section id="pricing" style={{ background: "#0A0B10", padding: "44px 22px" }} className="bizzibuddi-section-pad"><div style={{ maxWidth: 1080, margin: "0 auto" }}><div style={{ textAlign: "center" }}><div style={sectionEyebrow}>SIMPLE PRICING</div><h2 style={{ ...heading, marginLeft: "auto", marginRight: "auto" }}>Start free. Grow when you're ready.</h2><p style={{ ...lead, maxWidth: 760, margin: "10px auto 0", fontSize: "clamp(16px, 1.8vw, 21px)", lineHeight: 1.35 }}>No complicated setup. No long-term commitment. Choose the level that fits your business.</p></div><div className="bizzibuddi-plan-grid" style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, alignItems: "stretch" }}>{plans.map((plan) => <article key={plan.name} className="bizzibuddi-card" style={{ ...panel, border: `2px solid ${plan.popular ? RED : "#34303A"}`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column" }}>{plan.popular && <div style={{ margin: "-18px -18px 13px", padding: "7px 10px", background: RED, color: "#FFF", textAlign: "center", fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Most popular</div>}<h3 style={{ margin: 0, fontSize: 19 }}>{plan.name}</h3><div style={{ marginTop: 11, display: "flex", alignItems: "baseline", gap: 5 }}><strong style={{ fontSize: 32 }}>{plan.price}</strong><span style={{ color: "#FFFFFF", fontSize: 11 }}>{plan.period}</span></div><p style={{ minHeight: 54, margin: "8px 0 0", color: "#FFFFFF", fontSize: 12.5, lineHeight: 1.45 }}>{plan.description}</p><div style={{ display: "grid", gap: 7, minHeight: 108, flex: 1, marginTop: 10 }}>{plan.features.map((feature) => <div key={feature} style={{ display: "flex", gap: 7, fontSize: 12.5, lineHeight: 1.35 }}><span style={{ color: RED, fontWeight: 600 }}>✓</span>{feature}</div>)}</div><button type="button" onClick={() => alert(`BizziBuddi ${plan.name} signup will be connected in the account/subscription stage.`)} className="bizzibuddi-cta" style={{ width: "100%", marginTop: 15, minHeight: 40, border: `2px solid ${RED}`, borderRadius: 9, background: plan.popular ? RED : "transparent", color: "#FFF", fontWeight: 600, fontSize: 12.5, cursor: "pointer", transition: "background .18s ease,transform .18s ease,box-shadow .18s ease" }}>{plan.name === "Free" ? "Start Free" : `Choose ${plan.name}`}</button></article>)}</div><p style={{ textAlign: "center", margin: "14px 0 0", color: "#FFFFFF", fontSize: 11 }}>Prices shown are mock pricing for the BizziBuddi development site and are not yet connected to billing.</p></div></section>
        <section style={{ background: `linear-gradient(135deg, ${BG} 0%, #16000A 100%)`, padding: "44px 22px" }} className="bizzibuddi-section-pad"><div style={{ maxWidth: 1080, margin: "0 auto", textAlign: "center" }}><div style={sectionEyebrow}>READY WHEN YOU ARE</div><h2 style={heading}>A clearer way to run your business.</h2><p style={{ ...lead, marginLeft: "auto", marginRight: "auto", fontSize: "clamp(16px, 1.8vw, 21px)", lineHeight: 1.35 }}>Start with the essentials. Build from there.</p><div style={{ marginTop: 18 }}><CtaButton onClick={goPricing}>Get started with BizziBuddi →</CtaButton></div></div></section>
      </main>
      <Footer />
    </div>
  );
}
