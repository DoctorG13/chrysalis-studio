import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_SETTINGS = {
  business: { businessName: "Chrysalis Studio", ownerName: "Donna", slogan: "", address: "", phone: "", email: "", website: "", abn: "", logo: "", primaryColour: "#8B1E3F", secondaryColour: "#2F3A3F", accentColour: "#C96A83" },
  financial: { gstRate: 10, depositPercent: 25, paymentTerms: 14, currency: "AUD" },
  quotesInvoices: { quoteValidityDays: 30, invoicePrefix: "INV", quotePrefix: "QUO", paymentInstructions: "", terms: "" },
  jobs: { referencePrefix: "CHR", defaultStatus: "Quote", defaultPriority: "Normal", workflowStages: "Quote, Cutting, Sewing, Fitting, Finishing, Completed, Collected" },
  calendar: { workingDays: "Monday, Tuesday, Wednesday, Thursday, Friday", openingTime: "09:00", closingTime: "17:00", defaultAppointmentDuration: 60 },
  production: { garmentCategories: "Wedding Dress, Formal Dress, Alteration, Other", productionStages: "Quote, Cutting, Sewing, Fitting, Finishing, Completed", measurementUnit: "cm" },
};

const SECTIONS = [["business", "Business", "Business details"], ["branding", "Branding", "Logo and colours"], ["financial", "Financial", "GST and payments"], ["quotesInvoices", "Quotes & Invoices", "Document defaults"], ["jobs", "Jobs & Workflow", "References and stages"], ["calendar", "Calendar", "Working hours"], ["production", "Production", "Garments and stages"], ["data", "Workspace & Data", "Backup and settings"], ["about", "About", "System information"]];

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function mergeSettings(saved) {
  const result = clone(DEFAULT_SETTINGS);
  if (!saved || typeof saved !== "object") return result;
  for (const key of Object.keys(DEFAULT_SETTINGS)) if (saved[key] && typeof saved[key] === "object") result[key] = { ...result[key], ...saved[key] };
  return result;
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("business");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [backupLoading, setBackupLoading] = useState(false);
  const fileInputRef = useRef(null);
  const dirty = useMemo(() => JSON.stringify(settings) !== JSON.stringify(savedSettings), [settings, savedSettings]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((response) => { if (!response.ok) throw new Error(`Settings request failed (${response.status})`); return response.json(); })
      .then((payload) => { if (cancelled) return; const loaded = mergeSettings(payload?.settings); setSettings(loaded); setSavedSettings(loaded); })
      .catch((loadError) => { console.error(loadError); if (!cancelled) setError("Unable to load settings from the Chrysalis database."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function update(section, field, value) { setSettings((current) => ({ ...current, [section]: { ...current[section], [field]: value } })); setMessage(""); setError(""); }

  async function saveSettings() {
    try {
      setMessage(""); setError("");
      const response = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings }) });
      if (!response.ok) throw new Error(`Settings save failed (${response.status})`);
      const payload = await response.json(); const saved = mergeSettings(payload?.settings || settings);
      setSettings(saved); setSavedSettings(saved); setMessage("Settings saved.");
    } catch (saveError) { console.error(saveError); setError("Unable to save settings to the Chrysalis database."); }
  }

  async function resetSettings() {
    if (!window.confirm("Reset all Chrysalis settings to their defaults?")) return;
    try {
      const response = await fetch("/api/settings/reset", { method: "POST" });
      if (!response.ok) throw new Error(`Settings reset failed (${response.status})`);
      const payload = await response.json(); const reset = mergeSettings(payload?.settings);
      setSettings(reset); setSavedSettings(reset); setMessage("Settings reset to defaults."); setError("");
    } catch (resetError) { console.error(resetError); setError("Unable to reset settings."); }
  }

  async function backupDatabase() {
    try {
      setBackupLoading(true); setMessage(""); setError("");
      const response = await fetch("/api/database/backup", { method: "POST" });
      if (!response.ok) throw new Error(`Database backup failed (${response.status})`);
      setMessage("Backup created.");
    } catch (backupError) { console.error(backupError); setError("Unable to create the database backup."); }
    finally { setBackupLoading(false); }
  }

  function exportSettings() {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "chrysalis-settings.json"; anchor.click(); URL.revokeObjectURL(url);
  }

  function selectLogo(event) {
    const file = event.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file for the studio logo."); event.target.value = ""; return; }
    const reader = new FileReader(); reader.onload = () => update("business", "logo", reader.result); reader.onerror = () => setError("Unable to read the selected logo."); reader.readAsDataURL(file); event.target.value = "";
  }

  function renderSection() {
    switch (activeSection) {
      case "business": return <Section title="Business" description="The business identity used throughout Chrysalis."><Grid><Field label="Business Name"><Input value={settings.business.businessName} onChange={(v) => update("business", "businessName", v)} /></Field><Field label="Owner / Contact Name"><Input value={settings.business.ownerName} onChange={(v) => update("business", "ownerName", v)} /></Field><Field label="Phone"><Input value={settings.business.phone} onChange={(v) => update("business", "phone", v)} /></Field><Field label="Email"><Input type="email" value={settings.business.email} onChange={(v) => update("business", "email", v)} /></Field><Field label="Website"><Input value={settings.business.website} onChange={(v) => update("business", "website", v)} /></Field><Field label="ABN"><Input value={settings.business.abn} onChange={(v) => update("business", "abn", v)} /></Field></Grid><Field label="Business Address"><TextArea value={settings.business.address} onChange={(v) => update("business", "address", v)} rows={3} /></Field><Field label="Slogan"><Input value={settings.business.slogan} onChange={(v) => update("business", "slogan", v)} placeholder="Optional" /></Field></Section>;
      case "branding": return <Section title="Branding" description="Set the visual identity for Chrysalis Studio."><div style={logoRow}><div style={logoPreview}>{settings.business.logo ? <img src={settings.business.logo} alt="Studio logo" style={logoImage} /> : <span>No logo</span>}</div><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button type="button" style={button} onClick={() => fileInputRef.current?.click()}>{settings.business.logo ? "Replace Logo" : "Upload Logo"}</button>{settings.business.logo && <button type="button" style={dangerButton} onClick={() => update("business", "logo", "")}>Remove</button>}<input ref={fileInputRef} type="file" accept="image/*" onChange={selectLogo} style={{ display: "none" }} /></div></div><Grid><ColourField label="Primary Colour" value={settings.business.primaryColour} onChange={(v) => update("business", "primaryColour", v)} /><ColourField label="Secondary Colour" value={settings.business.secondaryColour} onChange={(v) => update("business", "secondaryColour", v)} /><ColourField label="Accent Colour" value={settings.business.accentColour} onChange={(v) => update("business", "accentColour", v)} /></Grid></Section>;
      case "financial": return <Section title="Financial" description="Defaults used by Finance, quotes and payments."><Grid><Field label="GST Rate (%)"><Input type="number" min="0" step="0.1" value={settings.financial.gstRate} onChange={(v) => update("financial", "gstRate", v)} /></Field><Field label="Default Deposit (%)"><Input type="number" min="0" max="100" value={settings.financial.depositPercent} onChange={(v) => update("financial", "depositPercent", v)} /></Field><Field label="Payment Terms (days)"><Input type="number" min="0" value={settings.financial.paymentTerms} onChange={(v) => update("financial", "paymentTerms", v)} /></Field><Field label="Currency"><Select value={settings.financial.currency} onChange={(v) => update("financial", "currency", v)} options={[["AUD", "AUD — Australian Dollar"], ["NZD", "NZD — New Zealand Dollar"], ["USD", "USD — US Dollar"]]} /></Field></Grid></Section>;
      case "quotesInvoices": return <Section title="Quotes & Invoices" description="Client-facing document defaults."><Grid><Field label="Quote Validity (days)"><Input type="number" min="0" value={settings.quotesInvoices.quoteValidityDays} onChange={(v) => update("quotesInvoices", "quoteValidityDays", v)} /></Field><Field label="Quote Prefix"><Input value={settings.quotesInvoices.quotePrefix} onChange={(v) => update("quotesInvoices", "quotePrefix", v)} /></Field><Field label="Invoice Prefix"><Input value={settings.quotesInvoices.invoicePrefix} onChange={(v) => update("quotesInvoices", "invoicePrefix", v)} /></Field></Grid><Field label="Payment Instructions"><TextArea value={settings.quotesInvoices.paymentInstructions} onChange={(v) => update("quotesInvoices", "paymentInstructions", v)} rows={3} /></Field><Field label="Terms & Conditions"><TextArea value={settings.quotesInvoices.terms} onChange={(v) => update("quotesInvoices", "terms", v)} rows={5} /></Field></Section>;
      case "jobs": return <Section title="Jobs & Workflow" description="Defaults for new jobs and production workflow."><Grid><Field label="Job Reference Prefix"><Input value={settings.jobs.referencePrefix} onChange={(v) => update("jobs", "referencePrefix", v)} /></Field><Field label="Default Status"><Select value={settings.jobs.defaultStatus} onChange={(v) => update("jobs", "defaultStatus", v)} options={[["Quote", "Quote"], ["In Progress", "In Progress"], ["Completed", "Completed"]]} /></Field><Field label="Default Priority"><Select value={settings.jobs.defaultPriority} onChange={(v) => update("jobs", "defaultPriority", v)} options={[["Normal", "Normal"], ["High", "High"], ["Urgent", "Urgent"]]} /></Field></Grid><Field label="Workflow Stages"><TextArea value={settings.jobs.workflowStages} onChange={(v) => update("jobs", "workflowStages", v)} rows={3} /></Field></Section>;
      case "calendar": return <Section title="Calendar" description="Working hours and appointment defaults."><Grid><Field label="Working Days"><TextArea value={settings.calendar.workingDays} onChange={(v) => update("calendar", "workingDays", v)} rows={3} /></Field><Field label="Default Appointment Duration (minutes)"><Input type="number" min="15" step="15" value={settings.calendar.defaultAppointmentDuration} onChange={(v) => update("calendar", "defaultAppointmentDuration", v)} /></Field><Field label="Opening Time"><Input type="time" value={settings.calendar.openingTime} onChange={(v) => update("calendar", "openingTime", v)} /></Field><Field label="Closing Time"><Input type="time" value={settings.calendar.closingTime} onChange={(v) => update("calendar", "closingTime", v)} /></Field></Grid></Section>;
      case "production": return <Section title="Production" description="Garment categories and production stages."><Field label="Garment Categories"><TextArea value={settings.production.garmentCategories} onChange={(v) => update("production", "garmentCategories", v)} rows={3} /></Field><Field label="Production Stages"><TextArea value={settings.production.productionStages} onChange={(v) => update("production", "productionStages", v)} rows={3} /></Field><Field label="Measurement Unit"><Select value={settings.production.measurementUnit} onChange={(v) => update("production", "measurementUnit", v)} options={[["cm", "Centimetres (cm)"], ["in", "Inches (in)"]]} /></Field></Section>;
      case "data": return <Section title="Workspace & Data" description="Keep the workspace safe and manage configuration."><Action title="Database Backup" text="Create a complete copy of the current Chrysalis database." action={backupDatabase} button={backupLoading ? "Creating..." : "Create Backup"} disabled={backupLoading} /><Action title="Export Settings" text="Save the current configuration as a JSON file." action={exportSettings} button="Export" /><Action title="Reset Settings" text="Return settings to their original defaults. Business data is not removed." action={resetSettings} button="Reset" danger /></Section>;
      case "about": return <Section title="About" description="Information about this Chrysalis Studio build."><div style={infoGrid}><Info label="Application" value="Chrysalis Studio" /><Info label="Version" value="2.1" /><Info label="Architecture" value="React / Vite" /><Info label="Database" value="SQLite" /><Info label="Settings" value="SQLite-backed" /><Info label="Node" value="24.15+" /></div></Section>;
      default: return null;
    }
  }

  return <div style={page}><div style={topbar}><div><div style={eyebrow}>CHRYSALIS STUDIO</div><h1 style={title}>Settings</h1><p style={subtitle}>Configure how your studio operates.</p></div><button type="button" style={{ ...button, opacity: dirty ? 1 : 0.55 }} onClick={saveSettings} disabled={!dirty || loading}>Save Changes</button></div>{(message || error) && <div style={error ? alertError : alertSuccess}>{error || message}</div>}<div style={layout}><nav style={nav} aria-label="Settings sections">{SECTIONS.map(([id, label, description]) => <button key={id} type="button" onClick={() => setActiveSection(id)} style={{ ...navButton, ...(activeSection === id ? navActive : {}) }}><span style={{ fontWeight: 700 }}>{label}</span><span style={navDescription}>{description}</span></button>)}</nav><main style={content}>{loading ? <div style={loadingStyle}>Loading settings...</div> : renderSection()}</main></div></div>;
}

function Section({ title, description, children }) { return <section><div style={sectionHeader}><h2 style={sectionTitle}>{title}</h2><p style={sectionDescription}>{description}</p></div><div style={card}>{children}</div></section>; }
function Grid({ children }) { return <div style={grid}>{children}</div>; }
function Field({ label, children }) { return <label style={field}><span style={labelStyle}>{label}</span>{children}</label>; }
function Input({ value, onChange, type = "text", ...props }) { return <input {...props} type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={input} />; }
function TextArea({ value, onChange, rows = 3 }) { return <textarea value={value ?? ""} rows={rows} onChange={(e) => onChange(e.target.value)} style={{ ...input, resize: "vertical", minHeight: rows * 22 }} />; }
function Select({ value, onChange, options }) { return <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={input}>{options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select>; }
function ColourField({ label, value, onChange }) { return <Field label={label}><div style={colourRow}><input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={colourPicker} /><Input value={value} onChange={onChange} /></div></Field>; }
function Action({ title, text, action, button, disabled, danger }) { return <div style={actionRow}><div><div style={actionTitle}>{title}</div><div style={actionText}>{text}</div></div><button type="button" style={danger ? dangerButton : buttonStyle} onClick={action} disabled={disabled}>{button}</button></div>; }
function Info({ label, value }) { return <div style={infoItem}><span style={labelStyle}>{label}</span><strong>{value}</strong></div>; }

const page = { padding: "30px 34px 50px", minHeight: "100%", background: "#F7F5F2", color: "#2F3A3F" };
const topbar = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, marginBottom: 22 };
const eyebrow = { fontSize: 11, fontWeight: 800, letterSpacing: 1.6, color: "#8B1E3F", marginBottom: 5 };
const title = { margin: 0, fontSize: 30, lineHeight: 1.1 };
const subtitle = { margin: "7px 0 0", color: "#697276", fontSize: 14 };
const layout = { display: "grid", gridTemplateColumns: "230px minmax(0, 1fr)", gap: 24, alignItems: "start" };
const nav = { background: "#FFFFFF", border: "1px solid #E1DEDA", borderRadius: 14, padding: 8, position: "sticky", top: 20 };
const navButton = { width: "100%", border: 0, background: "transparent", borderRadius: 9, padding: "11px 12px", textAlign: "left", cursor: "pointer", color: "#3E484C", display: "flex", flexDirection: "column", gap: 3, marginBottom: 2 };
const navActive = { background: "#8B1E3F", color: "#FFFFFF" };
const navDescription = { fontSize: 11, opacity: 0.68, fontWeight: 500 };
const content = { minWidth: 0 };
const sectionHeader = { marginBottom: 13 };
const sectionTitle = { margin: 0, fontSize: 22 };
const sectionDescription = { margin: "5px 0 0", color: "#697276", fontSize: 13 };
const card = { background: "#FFFFFF", border: "1px solid #E1DEDA", borderRadius: 14, padding: 22, boxShadow: "0 4px 16px rgba(47,58,63,0.04)" };
const grid = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 };
const field = { display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 };
const labelStyle = { fontSize: 11, fontWeight: 800, color: "#697276", textTransform: "uppercase", letterSpacing: 0.5 };
const input = { width: "100%", boxSizing: "border-box", border: "1px solid #D7D3CF", borderRadius: 8, background: "#FCFBFA", padding: "10px 11px", fontSize: 14, color: "#2F3A3F", outline: "none" };
const button = { border: 0, borderRadius: 8, background: "#8B1E3F", color: "#FFFFFF", padding: "10px 15px", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const buttonStyle = { ...button, background: "#2F3A3F" };
const dangerButton = { ...button, background: "#A33A4F" };
const alertSuccess = { background: "#E8F3EC", color: "#28613B", border: "1px solid #C9E2D1", borderRadius: 9, padding: "9px 12px", marginBottom: 18, fontSize: 13, fontWeight: 700 };
const alertError = { background: "#F9E9EC", color: "#8B1E3F", border: "1px solid #EBCBD2", borderRadius: 9, padding: "9px 12px", marginBottom: 18, fontSize: 13, fontWeight: 700 };
const logoRow = { display: "flex", alignItems: "center", gap: 18, marginBottom: 22, paddingBottom: 20, borderBottom: "1px solid #E7E3DF" };
const logoPreview = { width: 110, height: 70, border: "1px dashed #C9C4BF", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", color: "#8A8F91", fontSize: 12 };
const logoImage = { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" };
const colourRow = { display: "grid", gridTemplateColumns: "48px 1fr", gap: 8, alignItems: "center" };
const colourPicker = { width: 48, height: 40, padding: 2, border: "1px solid #D7D3CF", borderRadius: 8, background: "#FFFFFF" };
const actionRow = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, padding: "15px 0", borderBottom: "1px solid #E7E3DF" };
const actionTitle = { fontWeight: 800, fontSize: 14, marginBottom: 3 };
const actionText = { color: "#697276", fontSize: 13, lineHeight: 1.45 };
const infoGrid = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 };
const infoItem = { border: "1px solid #E7E3DF", borderRadius: 9, padding: 13, display: "flex", flexDirection: "column", gap: 6 };
const loadingStyle = { padding: 30, textAlign: "center", color: "#697276" };
