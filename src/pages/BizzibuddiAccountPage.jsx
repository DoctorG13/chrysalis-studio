import { useState } from "react";
import BizziBuddiLogo from "../components/common/BizziBuddiLogo";
import { bizzibuddiPlans, getBizzibuddiPlan, hasBizzibuddiFeature } from "../data/bizzibuddiPlans";

const RED = "#2563EB";
const CYAN = "#00B4DB";
const BG = "#061A2B";
const SURFACE = "#0F2D4A";
const TEXT = "#FFFFFF";
const MUTED = "#B8C6D6";
const BORDER = "rgba(255,255,255,.16)";

const plans = bizzibuddiPlans;

export default function BizzibuddiAccountPage() {
  const initialView = new URLSearchParams(window.location.search).get("view");
  const [view, setView] = useState(initialView === "create" ? "create" : "login");
  const [account, setAccount] = useState(() => readAccount());
  const [message, setMessage] = useState("");
  const [people, setPeople] = useState(() => readPeople());
  const [jobs, setJobs] = useState(() => readJobs());
  const [appointments, setAppointments] = useState(() => readAppointments());
  const [invoices, setInvoices] = useState(() => readInvoices());
  const [automationEvents, setAutomationEvents] = useState(() => readAutomationEvents());
  const [productionRecords, setProductionRecords] = useState(() => readProductionRecords());

  function selectView(nextView) {
    setView(nextView);
    setMessage("");
  }

  function handleCreateAccount(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextAccount = {
      name: String(form.get("name") || "").trim(),
      username: String(form.get("username") || "").trim().toLowerCase(),
      email: String(form.get("email") || "").trim().toLowerCase(),
      business: "",
      plan: "Free",
    };

    localStorage.setItem("bizzibuddiMockAccount", JSON.stringify(nextAccount));
    setAccount(nextAccount);
    setMessage("Your mock account has been created locally.");
    setView("onboarding");
  }

  function handleLogin(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const identifier = String(form.get("identifier") || "").trim().toLowerCase();

    if (!account) {
      setMessage("No mock account exists yet. Create one first.");
      return;
    }

    const email = String(account.email || "").trim().toLowerCase();
    const username = String(account.username || deriveUsername(account)).trim().toLowerCase();

    if (identifier !== email && identifier !== username) {
      setMessage("Enter the email address or username used for this mock account.");
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
    };
    localStorage.setItem("bizzibuddiMockAccount", JSON.stringify(nextAccount));
    setAccount(nextAccount);
    setMessage("Business setup complete. This is still local demo data.");
    setView("dashboard");
  }

  function selectPlan(planName) {
    const selectedPlan = getBizzibuddiPlan(planName);
    const nextAccount = { ...(account || { name: "Demo User", username: "demo", email: "demo@example.com", business: "" }), plan: selectedPlan.name };
    localStorage.setItem("bizzibuddiMockAccount", JSON.stringify(nextAccount));
    setAccount(nextAccount);
    setMessage(`${planName} selected for this mock account. No payment was made.`);
    setView("dashboard");
  }

  function addAutomationEvent(event) {
    if (!hasBizzibuddiFeature(account?.plan, "automation")) return;
    setAutomationEvents((current) => {
      const nextEvents = [event, ...current].slice(0, 50);
      localStorage.setItem("bizzibuddiMockAutomationEvents", JSON.stringify(nextEvents));
      return nextEvents;
    });
  }

  function runAutomationChecks() {
    if (!hasBizzibuddiFeature(account?.plan, "automation")) return;
    const today = new Date().toISOString().slice(0, 10);
    const overdueInvoices = invoices.filter((invoice) => invoice.status !== "Paid" && invoice.dueDate && invoice.dueDate < today);
    if (overdueInvoices.length === 0) {
      addAutomationEvent({
        id: `automation-${Date.now()}`,
        type: "check-complete",
        title: "Automation check complete",
        detail: "No overdue invoices were found.",
        createdAt: new Date().toISOString(),
      });
      return;
    }
    overdueInvoices.forEach((invoice, index) => {
      addAutomationEvent({
        id: `automation-${Date.now()}-${index}`,
        type: "invoice-overdue",
        title: "Overdue invoice flagged",
        detail: `${invoice.number} for ${invoice.clientName || "a client"} is overdue.`,
        createdAt: new Date().toISOString(),
      });
    });
  }

  function resetDemo() {
    localStorage.removeItem("bizzibuddiMockAccount");
    localStorage.removeItem("bizzibuddiMockPeople");
    localStorage.removeItem("bizzibuddiMockJobs");
    localStorage.removeItem("bizzibuddiMockAppointments");
    localStorage.removeItem("bizzibuddiMockInvoices");
    localStorage.removeItem("bizzibuddiMockAutomationEvents");
    localStorage.removeItem("bizzibuddiMockProductionRecords");
    setAccount(null);
    setMessage("Local demo data cleared.");
    setView("create");
  }

  return (
    <main style={pageStyle}>
      <div style={ambientGlow} />
      <div style={shellStyle}>
        <header style={headerStyle}>
          <a href="/bizzibuddi" style={{ color: TEXT, textDecoration: "none", display: "inline-flex", alignItems: "center" }}><BizziBuddiLogo size={42} dark showWordmark /></a>
          <a href="/bizzibuddi" style={backLink}>Back to website ↗</a>
        </header>

        <section style={heroStyle}>
          <div style={eyebrowStyle}>BUSINESS SUPPORT, SIMPLIFIED</div>
          <h1 style={heroHeading}>Your business.<br /><span style={{ color: CYAN }}>Better organised.</span></h1>
          <p style={heroCopy}>Explore the BizziBuddi account experience with local-only registration, business setup and membership tiers.</p>
          <div style={previewBadge}>BizziBuddi gives you time · Local mock environment · No live data or payments</div>
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
        {view === "dashboard" && <DashboardPanel account={account} onPlans={() => selectView("plans")} onPeople={() => selectView("people")} onJobs={() => selectView("jobs")} onCalendar={() => selectView("calendar")} onFinance={() => selectView("finance")} onAutomation={() => selectView("automation")} onProduction={() => selectView("production")} onReset={resetDemo} peopleCount={people.length} jobsCount={jobs.length} appointmentsCount={appointments.length} invoicesCount={invoices.length} automationCount={automationEvents.length} productionCount={productionRecords.length} />}
        {view === "finance" && <FinancePanel account={account} invoices={invoices} people={people} onPlans={() => selectView("plans")} onAddInvoice={(invoice) => { const nextInvoices = [...invoices, invoice].sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || "")); setInvoices(nextInvoices); localStorage.setItem("bizzibuddiMockInvoices", JSON.stringify(nextInvoices)); }} onMarkPaid={(invoiceId) => { const nextInvoices = invoices.map((invoice) => invoice.id === invoiceId ? { ...invoice, status: "Paid", amountPaid: invoice.amount } : invoice); setInvoices(nextInvoices); localStorage.setItem("bizzibuddiMockInvoices", JSON.stringify(nextInvoices)); }} onBack={() => selectView("dashboard")} />}
        {view === "calendar" && <CalendarPanel appointments={appointments} people={people} account={account} onAddAppointment={(appointment) => { const nextAppointments = [...appointments, appointment].sort((a, b) => (a.date + "T" + a.time).localeCompare(b.date + "T" + b.time)); setAppointments(nextAppointments); localStorage.setItem("bizzibuddiMockAppointments", JSON.stringify(nextAppointments)); addAutomationEvent({ id: `automation-${Date.now()}`, type: "appointment-created", title: "Appointment reminder prepared", detail: `Reminder prepared for ${appointment.title || "appointment"} on ${appointment.date}.`, createdAt: new Date().toISOString() }); }} onPlans={() => selectView("plans")} onBack={() => selectView("dashboard")} />}
        {view === "people" && <PeoplePanel people={people} onAddPerson={(person) => { const nextPeople = [...people, person]; setPeople(nextPeople); localStorage.setItem("bizzibuddiMockPeople", JSON.stringify(nextPeople)); }} onBack={() => selectView("dashboard")} />}
        {view === "jobs" && <JobsPanel jobs={jobs} people={people} onAddJob={(job) => { const nextJobs = [...jobs, job]; setJobs(nextJobs); localStorage.setItem("bizzibuddiMockJobs", JSON.stringify(nextJobs)); }} onBack={() => selectView("dashboard")} />}
        {view === "automation" && <AutomationPanel account={account} events={automationEvents} invoices={invoices} onPlans={() => selectView("plans")} onRunChecks={runAutomationChecks} onBack={() => selectView("dashboard")} />}
        {view === "production" && <ProductionPanel account={account} jobs={jobs} records={productionRecords} onPlans={() => selectView("plans")} onSave={(record) => { const nextRecords = [...productionRecords.filter((item) => item.jobId !== record.jobId), record]; setProductionRecords(nextRecords); localStorage.setItem("bizzibuddiMockProductionRecords", JSON.stringify(nextRecords)); }} onBack={() => selectView("dashboard")} />}

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

function readPeople() {
  try {
    const value = localStorage.getItem("bizzibuddiMockPeople");
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function readJobs() {
  try {
    const value = localStorage.getItem("bizzibuddiMockJobs");
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function readAppointments() {
  try {
    const value = localStorage.getItem("bizzibuddiMockAppointments");
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function readInvoices() {
  try {
    const value = localStorage.getItem("bizzibuddiMockInvoices");
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function readAutomationEvents() {
  try {
    const value = localStorage.getItem("bizzibuddiMockAutomationEvents");
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function readProductionRecords() {
  try {
    const value = localStorage.getItem("bizzibuddiMockProductionRecords");
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function deriveUsername(account) {
  return String(account?.email || "").split("@")[0];
}

function AuthPanel({ mode, account, onSubmit, onSwitch }) {
  const login = mode === "login";
  return <section style={cardStyle(560)}>
    <div style={centerStyle}><div style={stepBadge}>{login ? "SIGN IN" : "STEP 1 OF 2 · ACCOUNT"}</div><BizziBuddiLogo size={78} dark showWordmark={false} /><h2 style={sectionHeading}>{login ? "Welcome back." : "Let’s get started."}</h2><p style={copyStyle}>{login ? "Use your email address or username to continue." : "Create a local test account and begin your business setup."}</p></div>
    <form onSubmit={onSubmit} style={{ marginTop: 28 }}>
      {!login && <Field name="name" label="Full name" type="text" placeholder="Your name" />}
      {!login && <Field name="username" label="Username" type="text" placeholder="Choose a username" />}
      {!login && <Field name="email" label="Email address" type="email" placeholder="you@example.com" />}
      {login && <Field name="identifier" label="Email address or username" type="text" placeholder="you@example.com or username" />}
      <Field name="password" label="Password" type="password" placeholder="Demo password" />
      <button type="submit" style={primaryButton}>{login ? "Log in · Demo" : "Continue to business setup →"}</button>
    </form>
    <p style={switchText}>{login ? "New to BizziBuddi?" : "Already have an account?"} <button type="button" onClick={onSwitch} style={textButton}>{login ? "Create an account" : "Log in"}</button></p>
    {login && account && <p style={smallText}>Local account detected for {account.email}{account.username ? ` · @${account.username}` : ""}.</p>}
  </section>;
}

function OnboardingPanel({ account, onSubmit }) {
  return <section style={cardStyle(620)}><div style={centerStyle}><div style={stepBadge}>STEP 2 OF 2 · BUSINESS SETUP</div><BizziBuddiLogo size={78} dark showWordmark={false} /><h2 style={sectionHeading}>Set up your business.</h2><p style={copyStyle}>Welcome {account?.name || "there"}. Give your business a name to continue.</p></div><form onSubmit={onSubmit} style={{ marginTop: 28 }}><Field name="business" label="Business name" type="text" placeholder={account?.business || "Your business"} defaultValue={account?.business || ""} /><button type="submit" style={primaryButton}>Finish setup →</button></form></section>;
}

function PeoplePanel({ people, onAddPerson, onBack }) {
  const [showForm, setShowForm] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onAddPerson({
      id: `person-${Date.now()}`,
      name: String(form.get("name") || "").trim(),
      email: String(form.get("email") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
    });
    event.currentTarget.reset();
    setShowForm(false);
  }

  return <section style={cardStyle(940)}>
    <button type="button" onClick={onBack} style={textButton}>← Back to business</button>
    <div style={{ marginTop: 22 }}>
      <p style={eyebrowStyle}>PEOPLE</p>
      <h2 style={sectionHeading}>Your people.</h2>
      <p style={copyStyle}>Keep your clients and contacts organised in one simple place.</p>
    </div>

    {people.length > 0 ? (
      <div style={{ display: "grid", gap: 12, marginTop: 28 }}>
        {people.map((person) => (
          <article key={person.id} style={personCard}>
            <div>
              <strong style={{ display: "block", fontSize: 17 }}>{person.name}</strong>
              <span style={smallText}>{person.email || "No email"}{person.phone ? ` · ${person.phone}` : ""}</span>
            </div>
          </article>
        ))}
      </div>
    ) : (
      <div style={emptyPeople}>
        <strong>No people added yet.</strong>
        <p style={copyStyle}>Add your first client or contact to start building your business.</p>
      </div>
    )}

    {!showForm ? (
      <button type="button" onClick={() => setShowForm(true)} style={{ ...primaryButton, maxWidth: 240 }}>+ Add a person</button>
    ) : (
      <form onSubmit={handleSubmit} style={personForm}>
        <strong style={{ fontSize: 18 }}>Add a person</strong>
        <Field name="name" label="Name" type="text" placeholder="Client or contact name" />
        <Field name="email" label="Email address" type="email" placeholder="you@example.com" />
        <Field name="phone" label="Phone" type="tel" placeholder="Phone number" />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
          <button type="submit" style={{ ...primaryButton, width: "auto", marginTop: 0 }}>Save person</button>
          <button type="button" onClick={() => setShowForm(false)} style={{ ...secondaryButton, width: "auto", marginTop: 0 }}>Cancel</button>
        </div>
      </form>
    )}
  </section>;
}

function JobsPanel({ jobs, people, onAddJob, onBack }) {
  const [showForm, setShowForm] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const personId = String(form.get("personId") || "");
    const person = people.find((item) => item.id === personId);

    onAddJob({
      id: `job-${Date.now()}`,
      title: String(form.get("title") || "").trim(),
      clientName: person?.name || "Unassigned",
      status: String(form.get("status") || "New"),
    });

    event.currentTarget.reset();
    setShowForm(false);
  }

  return <section style={cardStyle(940)}>
    <button type="button" onClick={onBack} style={textButton}>← Back to business</button>
    <div style={{ marginTop: 22 }}>
      <p style={eyebrowStyle}>JOBS</p>
      <h2 style={sectionHeading}>Your jobs.</h2>
      <p style={copyStyle}>Track the work that moves through your business from enquiry to completion.</p>
    </div>

    {jobs.length > 0 ? (
      <div style={{ display: "grid", gap: 12, marginTop: 28 }}>
        {jobs.map((job) => (
          <article key={job.id} style={jobCard}>
            <div>
              <strong style={{ display: "block", fontSize: 17 }}>{job.title}</strong>
              <span style={smallText}>{job.clientName}</span>
            </div>
            <span style={jobStatus}>{job.status}</span>
          </article>
        ))}
      </div>
    ) : (
      <div style={emptyPeople}>
        <strong>No jobs created yet.</strong>
        <p style={copyStyle}>Create your first job to start tracking work in your business.</p>
      </div>
    )}

    {!showForm ? (
      <button type="button" onClick={() => setShowForm(true)} style={{ ...primaryButton, maxWidth: 240 }}>+ Create a job</button>
    ) : (
      <form onSubmit={handleSubmit} style={personForm}>
        <strong style={{ fontSize: 18 }}>Create a job</strong>
        <Field name="title" label="Job name" type="text" placeholder="e.g. Wedding dress alteration" />
        <label style={fieldStyle}>Client<select required name="personId" defaultValue="" style={inputStyle}>
          <option value="" disabled>Select a person</option>
          {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          {people.length === 0 && <option value="" disabled>Add a person first</option>}
        </select></label>
        <label style={fieldStyle}>Status<select name="status" defaultValue="New" style={inputStyle}>
          <option>New</option>
          <option>In progress</option>
          <option>Waiting</option>
          <option>Complete</option>
        </select></label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
          <button type="submit" disabled={people.length === 0} style={{ ...primaryButton, width: "auto", marginTop: 0, opacity: people.length === 0 ? 0.5 : 1 }}>Save job</button>
          <button type="button" onClick={() => setShowForm(false)} style={{ ...secondaryButton, width: "auto", marginTop: 0 }}>Cancel</button>
        </div>
        {people.length === 0 && <p style={{ ...smallText, marginBottom: 0 }}>Add a person first, then you can assign the job.</p>}
      </form>
    )}
  </section>;
}

function PlansPanel({ onSelectPlan }) {
  return <section><div style={centerStyle}><h2 style={sectionHeading}>Get more time back.</h2><p style={copyStyle}>Choose the level of BizziBuddi that fits your business. No subscription is created in this preview.</p></div><div style={plansGrid}>{plans.map((plan) => <article key={plan.id} style={{ ...cardStyle(), border: plan.featured ? `2px solid ${RED}` : `1px solid ${BORDER}`, display: "flex", flexDirection: "column" }}>{plan.featured && <span style={popularBadge}>MOST POPULAR</span>}<h3 style={planTitle}>{plan.name}</h3><div style={priceStyle}>{plan.price}<small style={smallText}>{plan.period}</small></div><p style={copyStyle}>{plan.description}</p><ul style={{ paddingLeft: 20, lineHeight: 2, flex: 1 }}>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul><button type="button" onClick={() => onSelectPlan(plan.name)} style={plan.featured ? primaryButton : secondaryButton}>{plan.name === "Free" ? "Start Free" : `Choose ${plan.name}`}</button></article>)}</div></section>;
}

function DashboardPanel({ account, onPlans, onPeople, onJobs, onCalendar, onFinance, onAutomation, onProduction, onReset, peopleCount, jobsCount, appointmentsCount, invoicesCount, automationCount, productionCount }) {
    return <section style={cardStyle(940)}>
    <p style={eyebrowStyle}>YOUR BIZZIBUDDI BUSINESS</p>
    <h2 style={sectionHeading}>Welcome to {account?.business || "your business"}.</h2>
    <p style={copyStyle}>Your business is ready. This is the beginning of the BizziBuddi experience — one place to organise, plan and grow.</p>

    <div style={statsGrid}>
      {[
        ["Business", account?.business ? "Ready" : "Not set up"],
        ["Plan", account?.plan || "Free"],
        ["People", peopleCount ? `${peopleCount} added` : "Ready to add"],
        ["Jobs", jobsCount ? `${jobsCount} created` : "Ready to add"],
        ["Calendar", appointmentsCount ? `${appointmentsCount} booked` : "Ready to use"],
        ["Finance", invoicesCount ? `${invoicesCount} invoices` : "Ready to use"],
        ["Automation", hasBizzibuddiFeature(account?.plan, "automation") ? (automationCount ? `${automationCount} events` : "Ready to use") : "Professional"],
         ["Production", hasBizzibuddiFeature(account?.plan, "production") ? (productionCount ? `${productionCount} tracked` : "Ready to use") : "Business"],
      ].map(([label, value]) => (
        <div key={label} style={statCard}>
          <small style={smallText}>{label}</small>
          <strong style={{ display: "block", marginTop: 8, fontSize: 20 }}>{value}</strong>
        </div>
      ))}
    </div>

    <div style={businessActions}>
      <div>
        <strong style={{ fontSize: 20 }}>What would you like to do first?</strong>
        <p style={{ ...copyStyle, marginBottom: 0 }}>Start building your business with the people, jobs and information that matter.</p>
      </div>
      <div style={planSummary}>
        <div>
          <small style={smallText}>CURRENT MEMBERSHIP</small>
          <strong style={{ display: "block", marginTop: 5, fontSize: 22 }}>{getBizzibuddiPlan(account?.plan).name}</strong>
        </div>
        <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.5 }}>{getBizzibuddiPlan(account?.plan).features.join(" · ")}</div>
      </div>
      <div style={actionGrid}>
        <button type="button" onClick={onPeople} style={actionCard}>
          <span style={actionIcon}>👥</span>
          <span><strong>Add your people</strong><small>Keep clients and contacts organised.</small></span>
        </button>
        <button type="button" onClick={onJobs} style={actionCard}>
          <span style={actionIcon}>📋</span>
          <span><strong>Create a job</strong><small>Start tracking work from enquiry to completion.</small></span>
        </button>
        <button type="button" onClick={onCalendar} style={actionCard}>
          <span style={actionIcon}>📅</span>
          <span><strong>Open your calendar</strong><small>Keep appointments and business dates organised.</small></span>
        </button>
        <button type="button" onClick={onFinance} style={actionCard}>
          <span style={actionIcon}>💳</span>
          <span><strong>Open finance</strong><small>Manage invoices and payment status.</small></span>
        </button>
        <button type="button" onClick={onAutomation} style={actionCard}>
          <span style={actionIcon}>⚙️</span>
          <span><strong>Open automation</strong><small>Turn routine business events into useful follow-up.</small></span>
        </button>
        <button type="button" onClick={onProduction} style={actionCard}>
          <span style={actionIcon}>🏭</span>
          <span><strong>Open production</strong><small>Track work stages, tasks and production progress.</small></span>
        </button>
        <button type="button" onClick={onPlans} style={actionCard}>
          <span style={actionIcon}>⚡</span>
          <span><strong>Explore plans</strong><small>See what is available as BizziBuddi grows.</small></span>
        </button>
      </div>
    </div>

    <MembershipAccessPanel planName={account?.plan} />

    <div style={businessNote}>
      <strong>Development preview</strong>
      <p style={copyStyle}>This business preview is still running on local demo data. Real authentication, databases and billing are not connected yet.</p>
    </div>

    <button type="button" onClick={onReset} style={textButton}>Reset local demo</button>
  </section>;
}

function AutomationPanel({ account, events, invoices, onPlans, onRunChecks, onBack }) {
  const available = hasBizzibuddiFeature(account?.plan, "automation");

  if (!available) {
    return <section style={cardStyle(720)}>
      <button type="button" onClick={onBack} style={textButton}>← Back to business</button>
      <div style={{ ...centerStyle, marginTop: 24 }}>
        <p style={eyebrowStyle}>AUTOMATION</p>
        <h2 style={sectionHeading}>Let BizziBuddi handle the routine.</h2>
        <p style={copyStyle}>Automation is included with Professional and Business membership. Upgrade to turn common business events into follow-up actions.</p>
        <div style={lockedFeatureCard}>
          <span style={{ fontSize: 26 }}>🔒</span>
          <div>
            <strong style={{ display: "block", fontSize: 18 }}>Professional automation</strong>
            <p style={{ ...copyStyle, marginBottom: 0 }}>Appointment reminders and overdue-invoice checks are available from Professional.</p>
          </div>
        </div>
        <button type="button" onClick={onPlans} style={primaryButton}>View membership plans</button>
      </div>
    </section>;
  }

  return <section style={cardStyle(940)}>
    <button type="button" onClick={onBack} style={textButton}>← Back to business</button>
    <div style={{ marginTop: 22 }}>
      <p style={eyebrowStyle}>AUTOMATION</p>
      <h2 style={sectionHeading}>Let BizziBuddi handle the routine.</h2>
      <p style={copyStyle}>Automation keeps useful follow-up moving without requiring an external notification service.</p>
    </div>

    <div style={automationRuleGrid}>
      <article style={automationRuleCard}>
        <span style={actionIcon}>📅</span>
        <div>
          <strong style={{ display: "block", fontSize: 17 }}>Appointment reminder</strong>
          <p style={{ ...copyStyle, margin: "6px 0 0" }}>Creating an appointment automatically prepares a local reminder event.</p>
        </div>
      </article>
      <article style={automationRuleCard}>
        <span style={actionIcon}>💳</span>
        <div>
          <strong style={{ display: "block", fontSize: 17 }}>Overdue invoice check</strong>
          <p style={{ ...copyStyle, margin: "6px 0 0" }}>Run a local check to flag unpaid invoices whose due date has passed.</p>
        </div>
      </article>
    </div>

    <div style={automationSummary}>
      <div>
        <small style={smallText}>AUTOMATION EVENTS</small>
        <strong style={{ display: "block", marginTop: 5, fontSize: 28 }}>{events.length}</strong>
      </div>
      <div>
        <small style={smallText}>OPEN INVOICES</small>
        <strong style={{ display: "block", marginTop: 5, fontSize: 28 }}>{invoices.filter((invoice) => invoice.status !== "Paid").length}</strong>
      </div>
      <button type="button" onClick={onRunChecks} style={{ ...primaryButton, width: "auto", marginTop: 0 }}>Run automation checks</button>
    </div>

    {events.length > 0 ? (
      <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
        {events.map((event) => (
          <article key={event.id} style={automationEventCard}>
            <div>
              <strong style={{ display: "block", fontSize: 16 }}>{event.title}</strong>
              <span style={smallText}>{event.detail}</span>
            </div>
            <span style={automationEventBadge}>{event.type === "invoice-overdue" ? "FLAGGED" : "READY"}</span>
          </article>
        ))}
      </div>
    ) : (
      <div style={emptyPeople}>
        <strong>No automation events yet.</strong>
        <p style={copyStyle}>Create an appointment or run an automation check to see BizziBuddi respond.</p>
      </div>
    )}

    <div style={businessNote}>
      <strong>Local preview</strong>
      <p style={copyStyle}>These automations only create local browser events. They do not send emails, messages or external notifications.</p>
    </div>
  </section>;
}

function ProductionPanel({ account, jobs, records, onPlans, onSave, onBack }) {
  const available = hasBizzibuddiFeature(account?.plan, "production");
  const stages = ["Not started", "In production", "Quality check", "Ready", "Complete"];
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id || "");
  const selectedJob = jobs.find((job) => job.id === selectedJobId);
  const existing = records.find((record) => record.jobId === selectedJobId);

  if (!available) {
    return <section style={cardStyle(720)}>
      <button type="button" onClick={onBack} style={textButton}>← Back to business</button>
      <div style={{ ...centerStyle, marginTop: 24 }}>
        <p style={eyebrowStyle}>PRODUCTION</p>
        <h2 style={sectionHeading}>Know what is happening next.</h2>
        <p style={copyStyle}>Production tracking is included with Business membership. Track the stages and tasks that move work from job creation to completion.</p>
        <div style={lockedFeatureCard}>
          <span style={{ fontSize: 26 }}>🔒</span>
          <div>
            <strong style={{ display: "block", fontSize: 18 }}>Business production tracking</strong>
            <p style={{ ...copyStyle, marginBottom: 0 }}>Stage tracking, production tasks and progress visibility are available on Business.</p>
          </div>
        </div>
        <button type="button" onClick={onPlans} style={primaryButton}>View membership plans</button>
      </div>
    </section>;
  }

  function handleSave(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const taskText = String(form.get("tasks") || "").trim();
    const tasks = taskText ? taskText.split("\n").map((task) => task.trim()).filter(Boolean).map((title, index) => ({
      id: `task-${Date.now()}-${index}`,
      title,
      complete: false,
    })) : [];

    onSave({
      id: existing?.id || `production-${Date.now()}`,
      jobId: selectedJobId,
      jobTitle: selectedJob?.title || "Untitled job",
      stage: String(form.get("stage") || "Not started"),
      dueDate: String(form.get("dueDate") || ""),
      notes: String(form.get("notes") || "").trim(),
      tasks,
      updatedAt: new Date().toISOString(),
    });
  }

  return <section style={cardStyle(940)}>
    <button type="button" onClick={onBack} style={textButton}>← Back to business</button>
    <div style={{ marginTop: 22 }}>
      <p style={eyebrowStyle}>PRODUCTION</p>
      <h2 style={sectionHeading}>Production tracking.</h2>
      <p style={copyStyle}>See where each job is, what needs doing and when the work needs to be ready.</p>
    </div>

    {jobs.length === 0 ? (
      <div style={emptyPeople}>
        <strong>Create a job first.</strong>
        <p style={copyStyle}>Production tracking works from your BizziBuddi jobs.</p>
      </div>
    ) : (
      <>
        <label style={fieldStyle}>Job<select value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)} style={inputStyle}>
          {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
        </select></label>

        <div style={productionProgress}>
          {stages.map((stage, index) => {
            const currentStage = existing?.stage || "Not started";
            const currentIndex = stages.indexOf(currentStage);
            return <div key={stage} style={productionStage(stage === currentStage, index <= currentIndex)}>
              <span>{index + 1}</span>
              <small>{stage}</small>
            </div>;
          })}
        </div>

        <form onSubmit={handleSave} style={personForm}>
          <strong style={{ fontSize: 18 }}>Update production</strong>
          <label style={fieldStyle}>Production stage<select required name="stage" defaultValue={existing?.stage || "Not started"} style={inputStyle}>
            {stages.map((stage) => <option key={stage}>{stage}</option>)}
          </select></label>
          <Field name="dueDate" label="Ready by" type="date" defaultValue={existing?.dueDate || ""} />
          <label style={fieldStyle}>Production tasks<small style={{ display: "block", color: MUTED, marginTop: 5, fontWeight: 400 }}>One task per line.</small><textarea name="tasks" defaultValue={(existing?.tasks || []).map((task) => task.title).join("\n")} placeholder={"Cut fabric\nSew panels\nFinal fitting"} rows="5" style={{ ...inputStyle, padding: 15, resize: "vertical" }} /></label>
          <Field name="notes" label="Production notes" type="text" placeholder="Optional production notes" defaultValue={existing?.notes || ""} />
          <button type="submit" style={{ ...primaryButton, maxWidth: 260 }}>Save production progress</button>
        </form>
      </>
    )}

    {records.length > 0 && <div style={{ marginTop: 28 }}>
      <small style={smallText}>TRACKED JOBS</small>
      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {records.map((record) => (
          <article key={record.id} style={productionRecordCard}>
            <div>
              <strong style={{ display: "block", fontSize: 16 }}>{record.jobTitle}</strong>
              <span style={smallText}>{record.stage}{record.dueDate ? ` · Ready ${formatProductionDate(record.dueDate)}` : ""}</span>
              {record.tasks?.length > 0 && <span style={{ ...smallText, display: "block", marginTop: 5 }}>{record.tasks.length} production task{record.tasks.length === 1 ? "" : "s"}</span>}
            </div>
            <span style={productionBadge}>{record.stage.toUpperCase()}</span>
          </article>
        ))}
      </div>
    </div>
  </section>;
}

function formatProductionDate(date) {
  if (!date) return "";
  const value = new Date(date + "T00:00");
  if (Number.isNaN(value.getTime())) return date;
  return value.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function FinancePanel({ account, invoices, people, onPlans, onAddInvoice, onMarkPaid, onBack }) {
  const [showForm, setShowForm] = useState(false);
  const available = hasBizzibuddiFeature(account?.plan, "finance");

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const personId = String(form.get("personId") || "");
    const person = people.find((item) => item.id === personId);
    const amount = Number(form.get("amount") || 0);

    onAddInvoice({
      id: "invoice-" + Date.now(),
      number: "INV-" + String(Date.now()).slice(-6),
      personName: person?.name || "No client linked",
      amount: Number.isFinite(amount) ? amount : 0,
      amountPaid: 0,
      dueDate: String(form.get("dueDate") || ""),
      status: "Issued",
    });

    event.currentTarget.reset();
    setShowForm(false);
  }

  if (!available) {
    return <section style={cardStyle(760)}>
      <button type="button" onClick={onBack} style={textButton}>← Back to business</button>
      <div style={{ ...centerStyle, marginTop: 34 }}>
        <div style={stepBadge}>PROFESSIONAL FEATURE</div>
        <h2 style={sectionHeading}>Finance & invoices.</h2>
        <p style={copyStyle}>Payments and invoices are included with Professional and Business membership.</p>
        <div style={lockedFeatureCard}>
          <span style={{ fontSize: 28 }}>🔒</span>
          <div>
            <strong style={{ display: "block", fontSize: 18 }}>Available on Professional</strong>
            <p style={{ ...copyStyle, marginBottom: 0 }}>Upgrade your local preview to explore invoice and payment management.</p>
          </div>
        </div>
        <button type="button" onClick={onPlans} style={{ ...primaryButton, maxWidth: 260 }}>View membership plans</button>
      </div>
    </section>;
  }

  return <section style={cardStyle(940)}>
    <button type="button" onClick={onBack} style={textButton}>← Back to business</button>
    <div style={{ marginTop: 22 }}>
      <p style={eyebrowStyle}>FINANCE</p>
      <h2 style={sectionHeading}>Your finances.</h2>
      <p style={copyStyle}>Create invoices and keep track of what has been paid. This Professional preview is local-only.</p>
    </div>

    <div style={financeSummary}>
      <div><small style={smallText}>OUTSTANDING</small><strong style={{ display: "block", marginTop: 7, fontSize: 24 }}>{formatCurrency(invoices.reduce((sum, invoice) => sum + Math.max(0, invoice.amount - (invoice.amountPaid || 0)), 0))}</strong></div>
      <div><small style={smallText}>INVOICES</small><strong style={{ display: "block", marginTop: 7, fontSize: 24 }}>{invoices.length}</strong></div>
      <div><small style={smallText}>PAID</small><strong style={{ display: "block", marginTop: 7, fontSize: 24 }}>{invoices.filter((invoice) => invoice.status === "Paid").length}</strong></div>
    </div>

    {invoices.length > 0 ? (
      <div style={{ display: "grid", gap: 12, marginTop: 28 }}>
        {invoices.map((invoice) => {
          const balance = Math.max(0, invoice.amount - (invoice.amountPaid || 0));
          return <article key={invoice.id} style={invoiceCard}>
            <div>
              <strong style={{ display: "block", fontSize: 17 }}>{invoice.number}</strong>
              <span style={smallText}>{invoice.personName} · Due {formatInvoiceDate(invoice.dueDate)}</span>
            </div>
            <div style={invoiceMeta}>
              <strong>{formatCurrency(invoice.amount)}</strong>
              <span style={invoiceStatus(invoice.status)}>{invoice.status}</span>
              {invoice.status !== "Paid" && <button type="button" onClick={() => onMarkPaid(invoice.id)} style={smallActionButton}>Mark paid</button>}
              {invoice.status !== "Paid" && <small style={smallText}>Balance {formatCurrency(balance)}</small>}
            </div>
          </article>;
        })}
      </div>
    ) : (
      <div style={emptyPeople}>
        <strong>No invoices yet.</strong>
        <p style={copyStyle}>Create your first invoice to start tracking money coming into your business.</p>
      </div>
    )}

    {!showForm ? (
      <button type="button" onClick={() => setShowForm(true)} style={{ ...primaryButton, maxWidth: 240 }}>+ Create an invoice</button>
    ) : (
      <form onSubmit={handleSubmit} style={personForm}>
        <strong style={{ fontSize: 18 }}>Create an invoice</strong>
        <label style={fieldStyle}>Client<select required name="personId" defaultValue="" style={inputStyle}>
          <option value="" disabled>Select a person</option>
          {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          {people.length === 0 && <option value="" disabled>Add a person first</option>}
        </select></label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <Field name="amount" label="Amount" type="number" placeholder="0.00" required />
          <Field name="dueDate" label="Due date" type="date" required />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
          <button type="submit" disabled={people.length === 0} style={{ ...primaryButton, width: "auto", marginTop: 0, opacity: people.length === 0 ? 0.5 : 1 }}>Save invoice</button>
          <button type="button" onClick={() => setShowForm(false)} style={{ ...secondaryButton, width: "auto", marginTop: 0 }}>Cancel</button>
        </div>
        {people.length === 0 && <p style={{ ...smallText, marginBottom: 0 }}>Add a person first, then you can create an invoice for them.</p>}
      </form>
    )}
  </section>;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(amount) || 0);
}

function formatInvoiceDate(date) {
  if (!date) return "Not set";
  const value = new Date(date + "T00:00");
  if (Number.isNaN(value.getTime())) return date;
  return value.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function CalendarPanel({ appointments, people, account, onAddAppointment, onBack, onPlans }) {
  const [showForm, setShowForm] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const personId = String(form.get("personId") || "");
    const person = people.find((item) => item.id === personId);

    const advancedScheduling = hasBizzibuddiFeature(account?.plan, "advancedScheduling");

    onAddAppointment({
      id: "appointment-" + Date.now(),
      title: String(form.get("title") || "").trim(),
      date: String(form.get("date") || ""),
      time: String(form.get("time") || ""),
      personName: person?.name || "",
      notes: String(form.get("notes") || "").trim(),
      duration: advancedScheduling ? Number(form.get("duration") || 60) : 60,
      buffer: advancedScheduling ? Number(form.get("buffer") || 0) : 0,
      status: advancedScheduling ? String(form.get("status") || "Booked") : "Booked",
    });

    event.currentTarget.reset();
    setShowForm(false);
  }

  return <section style={cardStyle(940)}>
    <button type="button" onClick={onBack} style={textButton}>← Back to business</button>
    <div style={{ marginTop: 22 }}>
      <p style={eyebrowStyle}>CALENDAR</p>
      <h2 style={sectionHeading}>Your calendar.</h2>
      <p style={copyStyle}>Keep appointments, fittings, meetings and important business dates organised.</p>
      {hasBizzibuddiFeature(account?.plan, "advancedScheduling") && <div style={schedulingSummary}><span><strong>Advanced scheduling</strong><small>Duration, buffer time and appointment status are enabled.</small></span><span style={advancedBadge}>PROFESSIONAL</span></div>}
    </div>

    {appointments.length > 0 ? (
      <div style={{ display: "grid", gap: 12, marginTop: 28 }}>
        {appointments.map((appointment) => (
          <article key={appointment.id} style={appointmentCard}>
            <div>
              <strong style={{ display: "block", fontSize: 17 }}>{appointment.title}</strong>
              <span style={smallText}>{formatAppointmentDate(appointment.date, appointment.time)}{appointment.personName ? " · " + appointment.personName : ""}</span>
              {appointment.notes && <span style={{ ...smallText, display: "block", marginTop: 5 }}>{appointment.notes}</span>}
              {hasBizzibuddiFeature(account?.plan, "advancedScheduling") && <span style={{ ...smallText, display: "block", marginTop: 5 }}>{appointment.duration || 60} min{appointment.buffer ? ` · ${appointment.buffer} min buffer` : ""} · {appointment.status || "Booked"}</span>}
            </div>
          </article>
        ))}
      </div>
    ) : (
      <div style={emptyPeople}>
        <strong>No appointments yet.</strong>
        <p style={copyStyle}>Add your first appointment to start using the BizziBuddi calendar.</p>
      </div>
    )}

    {!showForm ? (
      <button type="button" onClick={() => setShowForm(true)} style={{ ...primaryButton, maxWidth: 260 }}>+ Add an appointment</button>
    ) : (
      <form onSubmit={handleSubmit} style={personForm}>
        <strong style={{ fontSize: 18 }}>Add an appointment</strong>
        <Field name="title" label="Appointment" type="text" placeholder="e.g. Client fitting" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <Field name="date" label="Date" type="date" required />
          <Field name="time" label="Time" type="time" required />
        </div>
        <label style={fieldStyle}>Person<select name="personId" defaultValue="" style={inputStyle}>
          <option value="">No person linked</option>
          {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
        </select></label>
        {hasBizzibuddiFeature(account?.plan, "advancedScheduling") && <div style={advancedScheduleFields}>
          <Field name="duration" label="Duration (minutes)" type="number" placeholder="60" defaultValue="60" />
          <Field name="buffer" label="Buffer after (minutes)" type="number" placeholder="0" defaultValue="0" />
          <label style={fieldStyle}>Status<select name="status" defaultValue="Booked" style={inputStyle}>
            <option>Booked</option>
            <option>Confirmed</option>
            <option>Pending</option>
            <option>Cancelled</option>
          </select></label>
        </div>}
        <Field name="notes" label="Notes" type="text" placeholder="Optional notes" />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
          <button type="submit" style={{ ...primaryButton, width: "auto", marginTop: 0 }}>Save appointment</button>
          <button type="button" onClick={() => setShowForm(false)} style={{ ...secondaryButton, width: "auto", marginTop: 0 }}>Cancel</button>
        </div>
      </form>
    )}
  </section>;
}

function formatAppointmentDate(date, time) {
  if (!date) return "Date not set";
  const value = new Date(date + "T" + (time || "00:00"));
  if (Number.isNaN(value.getTime())) return date + " · " + (time || "Time not set");
  return value.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}
function MembershipAccessPanel({ planName }) {
  const plan = getBizzibuddiPlan(planName);
  const featureGroups = [
    { feature: "people", label: "People & contacts", tier: "Free" },
    { feature: "jobs", label: "Basic jobs", tier: "Free" },
    { feature: "calendar", label: "Calendar", tier: "Free" },
    { feature: "advancedScheduling", label: "Advanced scheduling", tier: "Professional" },
    { feature: "finance", label: "Payments & invoices", tier: "Professional" },
    { feature: "automation", label: "Automation", tier: "Professional" },
    { feature: "production", label: "Production tracking", tier: "Business" },
    { feature: "reports", label: "Advanced reporting", tier: "Business" },
  ];

  return <div style={membershipAccess}>
    <div>
      <small style={smallText}>MEMBERSHIP ACCESS</small>
      <strong style={{ display: "block", marginTop: 5, fontSize: 20 }}>{plan.name} features</strong>
      <p style={{ ...copyStyle, marginBottom: 0 }}>Your membership determines which BizziBuddi capabilities are available as the product expands.</p>
    </div>
    <div style={membershipFeatureGrid}>
      {featureGroups.map(({ feature, label, tier }) => {
        const available = hasBizzibuddiFeature(plan.name, feature);
        return <div key={feature} style={membershipFeature(available)}>
          <span style={{ fontSize: 16 }}>{available ? "✓" : "🔒"}</span>
          <span>
            <strong style={{ display: "block", fontSize: 13 }}>{label}</strong>
            {!available && <small style={{ color: MUTED }}>Available on {tier}</small>}
          </span>
        </div>;
      })}
    </div>
  </div>;
}

const membershipAccess = { marginTop: 20, padding: 20, borderRadius: 14, border: "1px solid " + BORDER, background: "rgba(37,99,235,.06)" };
const membershipFeatureGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10, marginTop: 16 };
const membershipFeature = (available) => ({ display: "flex", alignItems: "flex-start", gap: 9, padding: 12, borderRadius: 10, border: "1px solid " + (available ? "rgba(0,180,219,.28)" : BORDER), background: available ? "rgba(0,180,219,.08)" : "rgba(255,255,255,.025)", color: available ? TEXT : MUTED });

const businessActions = { marginTop: 28, padding: 24, borderRadius: 14, border: `1px solid ${BORDER}`, background: "rgba(0,180,219,.05)" };
const planSummary = { marginTop: 18, display: "grid", gap: 8, padding: 16, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)" };
const actionGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginTop: 20 };
const actionCard = { display: "flex", alignItems: "flex-start", gap: 12, textAlign: "left", minHeight: 92, padding: 16, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)", color: TEXT, cursor: "pointer" };
const actionIcon = { fontSize: 22, lineHeight: 1 };
const productionProgress = { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginTop: 24, padding: 16, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)" };
const productionStage = (current, reached) => ({ display: "grid", justifyItems: "center", gap: 7, textAlign: "center", color: current ? TEXT : reached ? CYAN : MUTED, fontWeight: current ? 800 : 600, fontSize: 12 });
const productionRecordCard = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: 16, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)", flexWrap: "wrap" };
const productionBadge = { padding: "6px 9px", borderRadius: 999, background: "rgba(0,180,219,.12)", color: CYAN, fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", whiteSpace: "nowrap" };
const automationRuleGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginTop: 24 };
const automationRuleCard = { display: "flex", alignItems: "flex-start", gap: 12, padding: 18, borderRadius: 12, border: `1px solid rgba(0,180,219,.28)`, background: "rgba(0,180,219,.07)" };
const automationSummary = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", alignItems: "center", gap: 16, marginTop: 24, padding: 18, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)" };
const automationEventCard = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: 16, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)", flexWrap: "wrap" };
const automationEventBadge = { padding: "6px 9px", borderRadius: 999, background: "rgba(0,180,219,.12)", color: CYAN, fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", whiteSpace: "nowrap" };
const appointmentCard = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: 18, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)" };
const schedulingSummary = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, marginTop: 20, padding: 16, borderRadius: 12, border: `1px solid rgba(0,180,219,.28)`, background: "rgba(0,180,219,.07)", flexWrap: "wrap" };
const advancedScheduleFields = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 6 };
const advancedBadge = { padding: "6px 9px", borderRadius: 999, background: "rgba(37,99,235,.16)", color: RED, fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", whiteSpace: "nowrap" };
const financeSummary = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 28 };
const invoiceCard = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, padding: 18, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)", flexWrap: "wrap" };
const invoiceMeta = { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" };
const invoiceStatus = (status) => ({ padding: "6px 9px", borderRadius: 999, background: status === "Paid" ? "rgba(0,180,219,.12)" : "rgba(37,99,235,.12)", color: status === "Paid" ? CYAN : RED, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" });
const smallActionButton = { border: `1px solid ${RED}`, borderRadius: 8, padding: "7px 10px", background: "transparent", color: TEXT, fontSize: 12, fontWeight: 700, cursor: "pointer" };
const lockedFeatureCard = { display: "flex", alignItems: "flex-start", gap: 14, maxWidth: 520, margin: "24px auto 0", padding: 18, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)", textAlign: "left" };
const jobCard = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: 18, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)" };
const jobStatus = { padding: "6px 9px", borderRadius: 999, background: "rgba(0,180,219,.12)", color: CYAN, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" };
const personCard = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: 18, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)" };
const emptyPeople = { marginTop: 28, padding: 28, borderRadius: 14, border: `1px dashed ${BORDER}`, background: "rgba(255,255,255,.025)", textAlign: "center" };
const personForm = { marginTop: 24, padding: 22, borderRadius: 14, border: `1px solid ${BORDER}`, background: "rgba(0,180,219,.05)" };
const businessNote = { marginTop: 22, padding: 18, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.025)" };

function Field({ name, label, type, placeholder, defaultValue }) {
  return <label style={fieldStyle}>{label}<input required name={name} type={type} placeholder={placeholder} defaultValue={defaultValue} style={inputStyle} /></label>;
}

const pageStyle = { minHeight: "100vh", position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${BG} 0%, ${SURFACE} 62%, #08233A 100%)`, color: TEXT, padding: "28px 20px 70px", boxSizing: "border-box", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" };
const shellStyle = { width: "100%", maxWidth: 1120, margin: "0 auto", position: "relative", zIndex: 1 };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" };
const brandStyle = { color: TEXT, textDecoration: "none", fontWeight: 700, fontSize: 28, letterSpacing: "0.02em" };
const backLink = { color: RED, textDecoration: "none", fontWeight: 600, fontSize: 14 };
const heroStyle = { maxWidth: 780, margin: "76px auto 38px", textAlign: "center" };
const eyebrowStyle = { display: "inline-block", color: RED, fontSize: 12, fontWeight: 700, letterSpacing: "0.16em" };
const heroHeading = { margin: "24px 0 18px", fontSize: "clamp(42px, 7vw, 76px)", lineHeight: 0.98, letterSpacing: "-0.055em", fontWeight: 600 };
const heroCopy = { maxWidth: 650, margin: "0 auto", color: MUTED, fontSize: 17, lineHeight: 1.75 };
const previewBadge = { display: "inline-block", marginTop: 24, padding: "10px 15px", border: `1px solid ${RED}`, borderRadius: 999, background: "rgba(0,180,219,.08)", color: RED, fontSize: 12, fontWeight: 600 };
const navStyle = { display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", margin: "34px 0 28px" };
const tabStyle = (active) => ({ border: `1px solid ${active ? RED : BORDER}`, borderRadius: 999, padding: "11px 16px", background: active ? "rgba(255,23,79,.16)" : "rgba(255,255,255,.04)", color: TEXT, fontSize: 13, fontWeight: 700, cursor: "pointer" });
const footerStyle = { textAlign: "center", color: MUTED, fontSize: 12, lineHeight: 1.8, marginTop: 32 };
const ambientGlow = { position: "absolute", width: 520, height: 520, borderRadius: "50%", background: "rgba(0,180,219,.10)", filter: "blur(110px)", top: -260, right: -180, pointerEvents: "none" };
const centerStyle = { textAlign: "center" };
const stepBadge = { display: "inline-block", marginBottom: 14, color: RED, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em" };
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
const messageStyle = { maxWidth: 760, margin: "0 auto 24px", padding: 15, borderRadius: 10, background: "rgba(37,99,235,.12)", border: `1px solid ${RED}`, color: TEXT, textAlign: "center", lineHeight: 1.5 };
const plansGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(225px, 1fr))", gap: 20, alignItems: "stretch" };
const popularBadge = { display: "inline-block", alignSelf: "flex-start", padding: "7px 10px", borderRadius: 999, background: RED, fontSize: 11, fontWeight: 700 };
const planTitle = { fontSize: 27, margin: "18px 0 5px" };
const priceStyle = { fontSize: 42, fontWeight: 700, letterSpacing: "-0.05em" };
const statsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginTop: 30 };
const statCard = { border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18, background: "rgba(255,255,255,.035)" };
const callout = { marginTop: 28, padding: 22, borderRadius: 14, border: `1px solid ${BORDER}`, background: "rgba(255,23,79,.06)" };
