import { useState } from "react";

const plans = [
  { name: "Free", price: "$0", period: "forever", description: "Get started with the essentials.", features: ["People & contacts", "Basic jobs", "Calendar", "Dashboard"] },
  { name: "Musician", price: "$9", period: "/ month", description: "For independent professionals.", features: ["Everything in Free", "Advanced scheduling", "Payments & invoices", "Automation"] },
  { name: "Band", price: "$19", period: "/ month", description: "For small teams and bands.", features: ["Everything in Musician", "Shared workspace", "Team workflow", "Production tracking"], popular: true },
  { name: "Pro", price: "$39", period: "/ month", description: "For growing businesses.", features: ["Everything in Band", "Advanced reporting", "Priority features", "Professional controls"] },
];

const features = [
  ["01", "People", "Clients, contacts and history in one place."],
  ["02", "Jobs", "Take work from quote to completion."],
  ["03", "Production", "See what needs doing and what comes next."],
  ["04", "Calendar", "Appointments, fittings and important dates."],
  ["05", "Finance", "Quotes, invoices, payments and balances."],
  ["06", "Reports", "Useful information about your business."],
];

const buttonBase = {
  borderRadius: 9,
  minHeight: 44,
  padding: "0 18px",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
  transition: "transform .18s ease, box-shadow .18s ease, background .18s ease",
};

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Logo({ compact = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: compact ? 28 : 34, height: compact ? 28 : 34, border: "2px solid #FFFFFF", borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: compact ? 13 : 15, fontWeight: 900, transform: "rotate(45deg)" }}>
        <span style={{ transform: "rotate(-45deg)" }}>T</span>
      </span>
      <span style={{ fontSize: compact ? 21 : 24, fontWeight: 900, letterSpacing: 2.5 }}>THRIVE</span>
    </div>
  );
}

function CtaButton({ children, secondary = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...buttonBase,
        border: secondary ? "1px solid rgba(255,255,255,.28)" : "none",
        background: secondary ? "rgba(255,255,255,.06)" : "#C96A83",
        color: "#FFFFFF",
        boxShadow: secondary ? "none" : "0 8px 22px rgba(201,106,131,.25)",
      }}
    >
      {children}
    </button>
  );
}

export default function ThriveLandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const goPricing = () => scrollToId("pricing");

  return (
    <div style={{ minHeight: "100vh", background: "#F5F3F0", color: "#2F3A3F", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(47,58,63,.97)", color: "#FFFFFF", borderBottom: "1px solid rgba(255,255,255,.09)", backdropFilter: "blur(10px)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "12px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
          <Logo compact />
          <nav style={{ display: "flex", alignItems: "center", gap: 18 }} className="thrive-desktop-nav">
            <button type="button" onClick={() => scrollToId("why")} style={navButton}>Why THRIVE</button>
            <button type="button" onClick={() => scrollToId("features")} style={navButton}>Features</button>
            <button type="button" onClick={goPricing} style={navButton}>Pricing</button>
            <CtaButton onClick={goPricing}>Start Free →</CtaButton>
          </nav>
          <button type="button" aria-label="Open navigation" onClick={() => setMobileOpen((value) => !value)} style={{ ...mobileButton, display: "none" }} className="thrive-mobile-button">☰</button>
        </div>
        {mobileOpen && (
          <div style={{ padding: "0 22px 14px", display: "grid", gap: 7 }}>
            <button type="button" onClick={() => { setMobileOpen(false); scrollToId("why"); }} style={mobileNav}>Why THRIVE</button>
            <button type="button" onClick={() => { setMobileOpen(false); scrollToId("features"); }} style={mobileNav}>Features</button>
            <button type="button" onClick={() => { setMobileOpen(false); goPricing(); }} style={mobileNav}>Pricing</button>
            <button type="button" onClick={() => { setMobileOpen(false); goPricing(); }} style={mobileCta}>Start Free →</button>
          </div>
        )}
      </header>

      <main>
        <section style={{ background: "#2F3A3F", color: "#FFFFFF", padding: "72px 22px 54px", textAlign: "center" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <div style={eyebrowDark}>BUSINESS MANAGEMENT, SIMPLIFIED</div>
            <h1 style={{ margin: "15px auto 0", maxWidth: 780, fontSize: "clamp(40px, 6vw, 68px)", lineHeight: 1.02, letterSpacing: -2.5 }}>Run your business.<br /><span style={{ color: "#C96A83" }}>Thrive.</span></h1>
            <p style={{ maxWidth: 650, margin: "18px auto 0", color: "#D6DADC", fontSize: 16, lineHeight: 1.55 }}>One clear workspace for your people, jobs, production, calendar and money.</p>
            <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 9, flexWrap: "wrap" }}>
              <CtaButton onClick={goPricing}>Start with THRIVE Free →</CtaButton>
              <CtaButton secondary onClick={() => scrollToId("features")}>Explore THRIVE</CtaButton>
            </div>

            <div className="thrive-hero-grid" style={{ marginTop: 34, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, textAlign: "left" }}>
              {[
                ["ONE PLACE", "Everything together", "Stop jumping between spreadsheets, notes and messages."],
                ["CLEAR WORKFLOW", "Know what is next", "Keep work moving from first contact to completion."],
                ["LESS ADMIN", "Get time back", "Simple tools designed around everyday business work."],
              ].map(([label, title, text]) => (
                <div key={label} style={heroCard}>
                  <div style={{ color: "#C96A83", fontSize: 10, fontWeight: 900, letterSpacing: 1 }}>{label}</div>
                  <strong style={{ display: "block", marginTop: 7, fontSize: 15 }}>{title}</strong>
                  <p style={{ margin: "5px 0 0", color: "#BFC5C7", fontSize: 12, lineHeight: 1.45 }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="why" style={section}>
          <div style={eyebrow}>WHY THRIVE</div>
          <h2 style={heading}>Everything your business needs.<br />In one place.</h2>
          <p style={lead}>THRIVE is built to make the everyday running of a business clearer, faster and easier to manage.</p>
          <div className="thrive-three-grid" style={{ marginTop: 25, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              ["Clarity", "See the information that matters without digging through systems."],
              ["Control", "Keep jobs, schedules, payments and processes organised."],
              ["Confidence", "Know where your work and business stand at a glance."],
            ].map(([title, text], index) => (
              <article key={title} style={valueCard}>
                <div style={numberBadge}>{index + 1}</div>
                <h3 style={{ margin: "13px 0 5px", fontSize: 18 }}>{title}</h3>
                <p style={{ margin: 0, color: "#687178", fontSize: 13, lineHeight: 1.55 }}>{text}</p>
              </article>
            ))}
          </div>
          <div style={{ marginTop: 18, textAlign: "center" }}><button type="button" onClick={goPricing} style={inlineCta}>See plans & pricing →</button></div>
        </section>

        <section id="features" style={{ ...wideSection, background: "#FFFFFF" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <div style={eyebrow}>YOUR BUSINESS. YOUR WORKSPACE.</div>
            <h2 style={heading}>Six essentials.<br />One simple system.</h2>
            <div className="thrive-feature-grid" style={{ marginTop: 25, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 11 }}>
              {features.map(([number, title, text]) => (
                <article key={title} style={featureCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#8B1E3F", fontSize: 10, fontWeight: 900, letterSpacing: 1 }}>THRIVE</span>
                    <span style={{ color: "#A6ADB0", fontSize: 11, fontWeight: 800 }}>{number}</span>
                  </div>
                  <h3 style={{ margin: "10px 0 5px", fontSize: 17 }}>{title}</h3>
                  <p style={{ margin: 0, color: "#687178", fontSize: 12.5, lineHeight: 1.5 }}>{text}</p>
                </article>
              ))}
            </div>
            <div style={{ marginTop: 20, textAlign: "center" }}><button type="button" onClick={goPricing} style={darkCta}>Choose your THRIVE plan →</button></div>
          </div>
        </section>

        <section id="pricing" style={{ ...wideSection, background: "#ECE8E3" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <div style={{ textAlign: "center" }}>
              <div style={eyebrow}>SIMPLE PRICING</div>
              <h2 style={{ ...heading, marginLeft: "auto", marginRight: "auto" }}>Start free.<br />Grow when you're ready.</h2>
              <p style={{ ...lead, marginLeft: "auto", marginRight: "auto" }}>Choose the workspace that fits the way you work.</p>
            </div>

            <div className="thrive-plan-grid" style={{ marginTop: 25, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 11, alignItems: "stretch" }}>
              {plans.map((plan) => (
                <article key={plan.name} style={{ ...planCard, border: plan.popular ? "2px solid #8B1E3F" : "1px solid #D7D1CB", boxShadow: plan.popular ? "0 12px 28px rgba(139,30,63,.12)" : "0 7px 20px rgba(47,58,63,.06)" }}>
                  {plan.popular && <div style={{ margin: "-2px -2px 14px", padding: "6px 9px", background: "#8B1E3F", color: "#FFFFFF", textAlign: "center", fontSize: 9, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase" }}>Most popular</div>}
                  <h3 style={{ margin: 0, fontSize: 19 }}>{plan.name}</h3>
                  <div style={{ marginTop: 11, display: "flex", alignItems: "baseline", gap: 4 }}><strong style={{ fontSize: 31 }}>{plan.price}</strong><span style={{ color: "#7A8184", fontSize: 10 }}>{plan.period}</span></div>
                  <p style={{ minHeight: 43, margin: "8px 0 13px", color: "#687178", fontSize: 11.5, lineHeight: 1.45 }}>{plan.description}</p>
                  <div style={{ display: "grid", gap: 7 }}>
                    {plan.features.map((feature) => <div key={feature} style={{ display: "flex", gap: 6, fontSize: 11.5, lineHeight: 1.35 }}><span style={{ color: "#8B1E3F", fontWeight: 900 }}>✓</span>{feature}</div>)}
                  </div>
                  <button type="button" onClick={goPricing} style={{ width: "100%", marginTop: 17, minHeight: 40, border: plan.popular ? "none" : "1px solid #CFC8C2", borderRadius: 8, background: plan.popular ? "#8B1E3F" : "#FFFFFF", color: plan.popular ? "#FFFFFF" : "#2F3A3F", fontWeight: 850, fontSize: 11.5, cursor: "pointer" }}>{plan.name === "Free" ? "Start Free →" : `Choose ${plan.name} →`}</button>
                </article>
              ))}
            </div>
            <div style={{ marginTop: 14, textAlign: "center", color: "#7A8184", fontSize: 10.5 }}>Development pricing only — billing and account subscriptions will be connected next.</div>
          </div>
        </section>

        <section style={{ background: "#2F3A3F", color: "#FFFFFF", padding: "54px 22px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
            <div style={eyebrowDark}>READY TO THRIVE?</div>
            <h2 style={{ margin: "10px 0 0", fontSize: "clamp(30px, 5vw, 46px)", lineHeight: 1.08 }}>Less admin.<br />More time for your business.</h2>
            <p style={{ margin: "12px auto 0", maxWidth: 560, color: "#C7CDCF", fontSize: 13.5, lineHeight: 1.55 }}>Start with THRIVE Free and move up when you need more.</p>
            <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 9, flexWrap: "wrap" }}>
              <CtaButton onClick={goPricing}>Start Free →</CtaButton>
              <CtaButton secondary onClick={() => scrollToId("features")}>View Features</CtaButton>
            </div>
          </div>
        </section>
      </main>

      <footer style={{ background: "#232C30", color: "#AEB6B9", padding: "24px 22px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
          <div><Logo compact /><div style={{ marginTop: 7, fontSize: 10.5 }}>Streamline your business. Simplify your work.</div></div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", justifyContent: "flex-end", fontSize: 10.5 }}>
            <button type="button" onClick={goPricing} style={footerLink}>Plans & Subscription</button>
            <span>Terms</span><span>Privacy</span><span>© {new Date().getFullYear()} THRIVE</span>
          </div>
        </div>
      </footer>

      <style>{`
        html { scroll-behavior: smooth; }
        @media (max-width: 900px) {
          .thrive-desktop-nav { display: none !important; }
          .thrive-mobile-button { display: block !important; }
          .thrive-hero-grid, .thrive-three-grid, .thrive-feature-grid { grid-template-columns: 1fr !important; }
          .thrive-plan-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .thrive-plan-grid { grid-template-columns: 1fr !important; }
        }
        button:hover { transform: translateY(-1px); }
        button:focus-visible { outline: 2px solid #C96A83; outline-offset: 2px; }
      `}</style>
    </div>
  );
}

const navButton = { color: "#D6DADC", background: "transparent", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" };
const mobileButton = { border: "1px solid rgba(255,255,255,.22)", borderRadius: 8, padding: "7px 10px", background: "transparent", color: "#FFFFFF", cursor: "pointer" };
const mobileNav = { textAlign: "left", border: "none", borderRadius: 7, background: "rgba(255,255,255,.06)", color: "#FFFFFF", padding: "9px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700 };
const mobileCta = { border: "none", borderRadius: 8, background: "#C96A83", color: "#FFFFFF", padding: "10px", cursor: "pointer", fontWeight: 800 };
const eyebrow = { color: "#8B1E3F", fontSize: 10, fontWeight: 900, letterSpacing: 1.2 };
const eyebrowDark = { color: "#C96A83", fontSize: 10, fontWeight: 900, letterSpacing: 1.2 };
const section = { maxWidth: 1080, margin: "0 auto", padding: "52px 22px" };
const wideSection = { padding: "52px 22px" };
const heading = { margin: "9px 0 0", maxWidth: 720, fontSize: "clamp(28px, 4vw, 42px)", lineHeight: 1.08, letterSpacing: -1.2, color: "#2F3A3F" };
const lead = { maxWidth: 650, margin: "12px 0 0", color: "#687178", fontSize: 13.5, lineHeight: 1.55 };
const heroCard = { padding: "15px 16px", border: "1px solid rgba(255,255,255,.13)", borderRadius: 11, background: "rgba(255,255,255,.065)", boxShadow: "0 8px 24px rgba(0,0,0,.13)" };
const valueCard = { padding: 19, borderRadius: 12, background: "#FFFFFF", border: "1px solid #E0DBD6", boxShadow: "0 8px 22px rgba(47,58,63,.055)" };
const featureCard = { padding: 18, borderRadius: 11, background: "#F8F6F3", border: "1px solid #DDD8D2", boxShadow: "0 7px 18px rgba(47,58,63,.055)" };
const planCard = { position: "relative", overflow: "hidden", borderRadius: 12, background: "#FFFFFF", padding: 17, boxSizing: "border-box" };
const numberBadge = { width: 31, height: 31, borderRadius: 9, background: "#F3DDE4", color: "#8B1E3F", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12 };
const inlineCta = { border: "none", background: "transparent", color: "#8B1E3F", fontWeight: 850, fontSize: 12, cursor: "pointer", padding: "7px 10px" };
const darkCta = { border: "none", borderRadius: 8, minHeight: 40, padding: "0 17px", background: "#8B1E3F", color: "#FFFFFF", fontWeight: 800, fontSize: 11.5, cursor: "pointer" };
const footerLink = { border: "none", background: "transparent", padding: 0, color: "#FFFFFF", fontWeight: 800, fontSize: 10.5, cursor: "pointer" };
