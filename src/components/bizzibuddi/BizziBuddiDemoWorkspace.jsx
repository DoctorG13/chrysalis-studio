import { useMemo, useState } from "react";
import { bizzibuddiDemoData, getDemoSummary } from "../data/bizzibuddiDemoData";

const BLUE = "#2563EB";
const CYAN = "#00B4DB";
const BG = "#061A2B";
const TEXT = "#FFFFFF";
const MUTED = "#B8C6D6";
const BORDER = "rgba(255,255,255,.14)";

export default function BizziBuddiDemoWorkspace({ onExit, onCreateAccount }) {
  const [module, setModule] = useState("overview");
  const summary = useMemo(() => getDemoSummary(), []);

  const modules = [
    ["overview", "Overview"],
    ["people", "People"],
    ["jobs", "Jobs"],
    ["calendar", "Calendar"],
    ["finance", "Finance"],
    ["production", "Production"],
    ["automation", "Automation"],
    ["custom", "Custom fields"],
    ["buddi", "Ask Buddi"],
  ];

  function renderModule() {
    if (module === "people") return <RecordList title="People" rows={bizzibuddiDemoData.people} fields={["name", "email", "phone"]} />;
    if (module === "jobs") return <RecordList title="Jobs" rows={bizzibuddiDemoData.jobs} fields={["title", "clientName", "status", "dueDate"]} />;
    if (module === "calendar") return <RecordList title="Calendar" rows={bizzibuddiDemoData.appointments} fields={["title", "personName", "date", "time", "status"]} />;
    if (module === "finance") return <FinanceDemo />;
    if (module === "production") return <RecordList title="Production" rows={bizzibuddiDemoData.production} fields={["jobTitle", "stage", "dueDate"]} />;
    if (module === "automation") return <RecordList title="Automation & activity" rows={bizzibuddiDemoData.automationEvents} fields={["title", "detail", "createdAt"]} />;
    if (module === "custom") return <CustomDemo />;
    if (module === "buddi") return <BuddiDemo />;
    return <Overview summary={summary} />;
  }

  return (
    <section style={shell}>
      <div style={banner}>
        <div><strong>DEMO WORKSPACE</strong><span> Explore BizziBuddi with realistic sample business data. Nothing here is connected to a real account.</span></div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button type="button" onClick={onExit} style={secondary}>Exit demo</button>
          <button type="button" onClick={onCreateAccount} style={primary}>Create real account →</button>
        </div>
      </div>
      <div style={header}>
        <div><small style={eyebrow}>HARBOUR & THREAD STUDIO · DRESSMAKER TEMPLATE</small><h2 style={heading}>See how BizziBuddi works.</h2><p style={copy}>Browse the major business areas, sample records, financial activity, production workflow and configurable fields before creating an account.</p></div>
      </div>
      <nav style={nav}>{modules.map(([key,label])=><button key={key} type="button" onClick={()=>setModule(key)} style={tab(module===key)}>{label}</button>)}</nav>
      {renderModule()}
    </section>
  );
}

function Overview({summary}) {
  return <div style={grid}>
    {[
      ["PEOPLE", summary.people, "contacts"],
      ["OPEN JOBS", summary.openJobs, "jobs in progress"],
      ["APPOINTMENTS", summary.appointments, "scheduled"],
      ["OUTSTANDING", money(summary.outstanding), "to collect"],
      ["PRODUCTION", summary.productionActive, "active records"],
    ].map(([label,value,detail])=><article key={label} style={card}><small style={muted}>{label}</small><strong style={metric}>{value}</strong><span style={muted}>{detail}</span></article>)}
    <article style={{...card,gridColumn:"1 / -1"}}><small style={muted}>BUSINESS OPERATING SYSTEM</small><h3 style={{margin:"8px 0",fontSize:22}}>People → Work → Calendar → Money → Production → Intelligence</h3><p style={copy}>BizziBuddi keeps the core workflow consistent while business-specific terminology and fields can be configured around it.</p></article>
  </div>;
}

function RecordList({title,rows,fields}) {
  return <article style={card}><div style={sectionHeader}><div><small style={muted}>SAMPLE DATA</small><h3 style={{margin:"6px 0 0",fontSize:22}}>{title}</h3></div><span style={badge}>{rows.length} records</span></div><div style={{display:"grid",gap:8,marginTop:16}}>{rows.map(row=><div key={row.id} style={rowStyle}>{fields.map(field=><div key={field} style={{minWidth:0}}><small style={muted}>{label(field)}</small><strong style={{display:"block",marginTop:3,fontSize:13}}>{String(row[field] ?? "—")}</strong></div>)}</div>)}</div></article>;
}

function FinanceDemo() {
  const paid = bizzibuddiDemoData.invoices.reduce((sum,item)=>sum+Number(item.amountPaid||0),0);
  const invoiced = bizzibuddiDemoData.invoices.reduce((sum,item)=>sum+Number(item.amount||0),0);
  return <article style={card}><div style={sectionHeader}><div><small style={muted}>SAMPLE FINANCE</small><h3 style={{margin:"6px 0 0",fontSize:22}}>Invoices, payments and balances</h3></div><span style={badge}>{money(paid)} paid</span></div><div style={grid}>{bizzibuddiDemoData.invoices.map(invoice=><div key={invoice.id} style={rowStyle}><div><strong>{invoice.number}</strong><small style={{display:"block",...muted}}>{invoice.personName} · {invoice.description}</small></div><div style={{textAlign:"right"}}><strong>{money(invoice.amount)}</strong><small style={{display:"block",...muted}}>{invoice.status} · {money(invoice.balance)} balance</small></div></div>)}</div><p style={copy}>Collection rate: {invoiced ? Math.round((paid/invoiced)*100) : 0}%. Payment activity and transaction history are separate concepts in the real workspace.</p></article>;
}

function CustomDemo() {
  return <article style={card}><small style={muted}>CUSTOM FIELDS</small><h3 style={{margin:"6px 0",fontSize:22}}>Industry-specific information</h3><p style={copy}>This dressmaker template adds measurement fields without changing the underlying People / Jobs model.</p><div style={grid}>{bizzibuddiDemoData.customFields.map(([name,value])=><div key={name} style={rowStyle}><strong>{name}</strong><span>{value}</span></div>)}</div></article>;
}

function BuddiDemo() {
  return <article style={card}><small style={muted}>ASK BUDDI</small><h3 style={{margin:"6px 0",fontSize:22}}>Your business assistant</h3><p style={copy}>Try the kinds of questions Buddi is designed to answer once your real business is connected.</p><div style={promptBox}>“What needs attention today?”<br/><strong style={{display:"block",marginTop:8}}>3 priorities: Sophie’s fitting, Emily’s outstanding invoice, and the wedding gown production deadline.</strong></div><div style={{display:"grid",gap:8,marginTop:12}}>{["Who currently owes me money?","What is due this week?","Which jobs need attention?","Show me production workload"].map(item=><div key={item} style={rowStyle}><span>{item}</span><span style={{color:CYAN}}>Ask Buddi →</span></div>)}</div></article>;
}

function label(value) { return String(value).replace(/([A-Z])/g," $1").replace(/^./,m=>m.toUpperCase()); }
function money(value) { return new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD"}).format(Number(value)||0); }

const shell={width:"100%",maxWidth:940,margin:"0 auto",padding:"0 0 40px"};
const banner={display:"flex",justifyContent:"space-between",alignItems:"center",gap:14,flexWrap:"wrap",padding:16,borderRadius:14,border:"1px solid rgba(245,196,83,.48)",background:"rgba(245,196,83,.08)",color:TEXT};
const header={marginTop:24};
const eyebrow={color:CYAN,fontSize:11,fontWeight:800,letterSpacing:".12em"};
const heading={margin:"8px 0",fontSize:"clamp(32px,5vw,48px)",letterSpacing:"-.04em"};
const copy={color:MUTED,lineHeight:1.65};
const nav={display:"flex",gap:7,flexWrap:"wrap",margin:"24px 0 16px"};
const tab=(active)=>({border:"1px solid "+(active?CYAN:BORDER),borderRadius:999,padding:"8px 11px",background:active?"rgba(0,180,219,.12)":"rgba(255,255,255,.035)",color:TEXT,fontSize:11,fontWeight:800,cursor:"pointer"});
const grid={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10};
const card={padding:18,borderRadius:14,border:"1px solid "+BORDER,background:"rgba(255,255,255,.035)"};
const rowStyle={display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:14,padding:12,borderRadius:10,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.025)"};
const metric={display:"block",marginTop:7,fontSize:28};
const muted={color:MUTED,fontSize:11};
const badge={padding:"5px 8px",borderRadius:999,background:"rgba(0,180,219,.10)",color:CYAN,fontSize:10,fontWeight:800};
const sectionHeader={display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start"};
const promptBox={marginTop:16,padding:16,borderRadius:12,border:"1px solid rgba(0,180,219,.35)",background:"rgba(0,180,219,.07)",color:TEXT,lineHeight:1.5};
const primary={border:0,borderRadius:9,padding:"10px 13px",background:BLUE,color:TEXT,fontWeight:800,cursor:"pointer"};
const secondary={border:"1px solid "+BORDER,borderRadius:9,padding:"10px 13px",background:"transparent",color:TEXT,fontWeight:800,cursor:"pointer"};
