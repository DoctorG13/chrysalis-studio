import { useEffect, useRef, useState } from "react";
import BizziBuddiLogo from "../components/common/BizziBuddiLogo";
import BizziBuddiAccountBuddi from "../components/common/BizziBuddiAccountBuddi";
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
  const [account, setAccount] = useState(null);
  const [message, setMessage] = useState("");
  const [buddiPrompt, setBuddiPrompt] = useState("");
  const [people, setPeople] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [automationEvents, setAutomationEvents] = useState([]);
  const [productionRecords, setProductionRecords] = useState([]);
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false);

  useEffect(() => {
    function handleKeyboardShortcuts(event) {
      const target = event.target;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;
      if (isTyping) return;

      if (event.key === "?") {
        event.preventDefault();
        setShortcutHelpOpen((current) => !current);
        return;
      }

      if (event.key === "Escape") {
        setShortcutHelpOpen(false);
        return;
      }

      const shortcuts = { d: "dashboard", p: "people", j: "jobs", c: "calendar", f: "finance", a: "automation", r: "reports" };
      const nextView = shortcuts[event.key.toLowerCase()];
      if (!nextView || !account) return;

      event.preventDefault();
      setView(nextView);
      setMessage("");
      setBuddiPrompt("");
    }

    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
  }, [account]);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/me");
        if (!active || !result?.account) return;

        applyAccount(result.account);
        setView(result.account.business ? "dashboard" : "onboarding");
      } catch {
        // A visitor without a BizziBuddi session remains on the requested public account view.
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  async function applyAccount(nextAccount) {
    setAccount(nextAccount);
    setPeople([]);
    setJobs([]);
    setAppointments([]);
    applyAccountData(nextAccount, {
      setInvoices,
      setAutomationEvents,
      setProductionRecords,
    });

    const [peopleResult, jobsResult, calendarResult, invoicesResult, automationResult, productionResult] = await Promise.allSettled([
      bizzibuddiAuthRequest("/api/bizzibuddi/auth/people"),
      bizzibuddiAuthRequest("/api/bizzibuddi/auth/jobs"),
      bizzibuddiAuthRequest("/api/bizzibuddi/auth/calendar"),
      bizzibuddiAuthRequest("/api/bizzibuddi/auth/invoices"),
      bizzibuddiAuthRequest("/api/bizzibuddi/auth/automation"),
      bizzibuddiAuthRequest("/api/bizzibuddi/auth/production"),
    ]);

    setPeople(
      peopleResult.status === "fulfilled" && Array.isArray(peopleResult.value.people)
        ? peopleResult.value.people
        : []
    );
    setJobs(
      jobsResult.status === "fulfilled" && Array.isArray(jobsResult.value.jobs)
        ? jobsResult.value.jobs
        : []
    );
    setAppointments(
      calendarResult.status === "fulfilled" && Array.isArray(calendarResult.value.calendar)
        ? calendarResult.value.calendar
        : []
    );
    setInvoices(
      invoicesResult.status === "fulfilled" && Array.isArray(invoicesResult.value.invoices)
        ? invoicesResult.value.invoices
        : []
    );
    setAutomationEvents(
      automationResult.status === "fulfilled" && Array.isArray(automationResult.value.events)
        ? automationResult.value.events
        : []
    );
    const serverProductionRecords =
      productionResult.status === "fulfilled" && Array.isArray(productionResult.value.records)
        ? productionResult.value.records
        : [];
    setProductionRecords(await loadProductionRecords(nextAccount.id, serverProductionRecords));
  }

  function selectView(nextView) {
    const protectedViews = new Set([
      "onboarding",
      "dashboard",
      "people",
      "jobs",
      "calendar",
      "finance",
      "automation",
      "production",
      "reports",
      "buddi",
    ]);

    if (protectedViews.has(nextView) && !account) {
      setMessage("Please log in or create your BizziBuddi account first.");
      setView("login");
      return;
    }

    setView(nextView);
    setMessage("");
    if (nextView !== "buddi") setBuddiPrompt("");
  }

  function openBuddi(prompt = "") {
    if (!account) {
      setMessage("Please log in or create your BizziBuddi account first.");
      setView("login");
      return;
    }

    setBuddiPrompt(String(prompt || "").trim());
    setView("buddi");
    setMessage("");
  }

  async function handleCreateAccount(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: String(form.get("name") || "").trim(),
          username: String(form.get("username") || "").trim().toLowerCase(),
          email: String(form.get("email") || "").trim().toLowerCase(),
          password: String(form.get("password") || ""),
        }),
      });

      await applyAccount(result.account);
      setMessage("Your BizziBuddi account has been created securely.");
      setView("onboarding");
    } catch (error) {
      setMessage(error.message || "We could not create your account.");
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier: String(form.get("identifier") || "").trim(),
          password: String(form.get("password") || ""),
        }),
      });

      await applyAccount(result.account);
      setMessage(`Welcome back, ${result.account.name}.`);
      setView(result.account.business ? "dashboard" : "onboarding");
    } catch (error) {
      setMessage(error.message || "We could not sign you in.");
    }
  }

  async function handleLogout() {
    try {
      await bizzibuddiAuthRequest("/api/bizzibuddi/auth/logout", { method: "POST" });
    } catch {
      // Clear the client view even if the logout request cannot reach the server.
    }

    setAccount(null);
    setPeople([]);
    setJobs([]);
    setAppointments([]);
    setInvoices([]);
    setAutomationEvents([]);
    setProductionRecords([]);
    setMessage("You have been logged out.");
    setView("login");
  }

  async function completeOnboarding(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/account", {
        method: "PUT",
        body: JSON.stringify({
          business: String(form.get("business") || account?.business || "").trim(),
        }),
      });

      await applyAccount(result.account);
      setMessage("Business setup complete. Your account is now ready.");
      setView("dashboard");
    } catch (error) {
      setMessage(error.message || "We could not save your business details.");
    }
  }

  async function selectPlan(planName) {
    if (!account) {
      setMessage("Please create or log in to your BizziBuddi account before selecting a membership.");
      setView("login");
      return;
    }

    const selectedPlan = getBizzibuddiPlan(planName);

    try {
      const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/account", {
        method: "PUT",
        body: JSON.stringify({
          business: account.business || "",
          plan: selectedPlan.name,
        }),
      });

      await applyAccount(result.account);
      setMessage(`${selectedPlan.name} membership selected. Your choice is saved to your BizziBuddi account.`);
      setView("dashboard");
    } catch (error) {
      setMessage(error.message || "We could not save your membership selection.");
    }
  }
  async function addAutomationEvent(event) {
    if (!hasBizzibuddiFeature(account?.plan, "automation")) return null;

    const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/automation/events", {
      method: "POST",
      body: JSON.stringify(event),
    });

    setAutomationEvents((current) => {
      const nextEvents = [result.event, ...current.filter((item) => item.id !== result.event.id)].slice(0, 100);
      return nextEvents;
    });

    return result.event;
  }

  async function runAutomationChecks() {
    if (!hasBizzibuddiFeature(account?.plan, "automation")) return;

    try {
      const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/automation/checks", {
        method: "POST",
      });
      setAutomationEvents(Array.isArray(result.events) ? result.events : []);
      setMessage(
        result.created?.length
          ? `${result.created.length} automation item${result.created.length === 1 ? "" : "s"} flagged.`
          : "Automation check complete. Nothing new needs attention."
      );
    } catch (error) {
      setMessage(error.message || "We could not run the automation checks.");
    }
  }

  async function resetDemo() {
    if (!account?.id) return;

    // Persistent BizziBuddi records stay on the server. Only clear legacy browser-local Production data.
    localStorage.removeItem(storageKey("productionRecords", account.id));
    await applyAccount(account);
    setMessage("Local legacy preview data cleared. Your BizziBuddi account data remains stored.");
    setView("dashboard");
  }

  return (
    {account && shortcutHelpOpen && (
      <div role="dialog" aria-label="Keyboard shortcuts" style={{ position: "fixed", right: 24, bottom: 24, zIndex: 1000, width: "min(360px, calc(100vw - 48px))", padding: 20, borderRadius: 16, border: "1px solid " + BORDER, background: SURFACE, boxShadow: "0 18px 45px rgba(0,0,0,.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
          <div>
            <small style={smallText}>KEYBOARD SHORTCUTS</small>
            <h3 style={{ margin: "6px 0 0", fontSize: 20 }}>Move around BizziBuddi faster.</h3>
          </div>
          <button type="button" onClick={() => setShortcutHelpOpen(false)} style={smallActionButton}>Close</button>
        </div>
        <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
          {[["D","Dashboard"],["P","People"],["J","Jobs"],["C","Calendar"],["F","Finance"],["A","Automation"],["R","Reports"],["?","Show / hide shortcuts"],["Esc","Close shortcuts"]].map(([key,label]) => (
            <div key={key} style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
              <span style={{ color: MUTED, fontSize: 13 }}>{label}</span>
              <kbd style={{ minWidth: 34, padding: "5px 8px", borderRadius: 7, border: "1px solid " + BORDER, background: "rgba(255,255,255,.06)", color: TEXT, textAlign: "center", fontSize: 12, fontWeight: 800 }}>{key}</kbd>
            </div>
          ))}
        </div>
      </div>
    )}

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
          <p style={heroCopy}>Create a secure BizziBuddi account, set up your business and continue into your business workspace.</p>
          <div style={previewBadge}>Secure account and login · People, Jobs, Calendar and Finance are account-backed · No live billing</div>
        </section>

        <nav aria-label="Account preview navigation" className="bizzibuddi-account-nav" style={navStyle}>
          <div className="bizzibuddi-account-nav-main">
            {[["login", "Log in"], ["create", "Create account"], ["plans", "Plans & upgrade"], ["dashboard", "Account preview"]].map(([key, label]) => (
              <button key={key} type="button" onClick={() => selectView(key)} style={tabStyle(view === key)}>{label}</button>
            ))}
          </div>

          <div className="bizzibuddi-help-nav">
            <div className="bizzibuddi-help-nav-heading">
              <span aria-hidden="true" />
              <span>NEED A HAND?</span>
              <span aria-hidden="true" />
            </div>
            <p className="bizzibuddi-help-nav-subheading">Get answers. Find help. Keep moving.</p>
            <div className="bizzibuddi-help-nav-buttons">
              <button type="button" onClick={() => openBuddi()} className={view === "buddi" ? "bizzibuddi-help-action bizzibuddi-help-action-primary active" : "bizzibuddi-help-action bizzibuddi-help-action-primary"}>
                <span className="bizzibuddi-help-action-icon primary" aria-hidden="true">•••</span>
                <span className="bizzibuddi-help-action-copy">
                  <strong>ASK BUDDI</strong>
                  <small>Get instant help with your business</small>
                </span>
                <span className="bizzibuddi-help-action-arrow primary" aria-hidden="true">→</span>
              </button>
              <button type="button" onClick={() => selectView("help")} className={view === "help" ? "bizzibuddi-help-action bizzibuddi-help-action-secondary active" : "bizzibuddi-help-action bizzibuddi-help-action-secondary"}>
                <span className="bizzibuddi-help-action-icon" aria-hidden="true">◯</span>
                <span className="bizzibuddi-help-action-copy">
                  <strong>HELP & SUPPORT</strong>
                  <small>Guides, FAQs and contact options</small>
                </span>
                <span className="bizzibuddi-help-action-arrow" aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </nav>

        {message && <div role="status" style={messageStyle}>{message}</div>}
        {view === "login" && <AuthPanel mode="login" account={account} onSubmit={handleLogin} onSwitch={() => selectView("create")} />}
        {view === "create" && <AuthPanel mode="create" onSubmit={handleCreateAccount} onSwitch={() => selectView("login")} />}
        {view === "onboarding" && <OnboardingPanel account={account} onSubmit={completeOnboarding} />}
        {view === "plans" && <PlansPanel onSelectPlan={selectPlan} />}
        {view === "dashboard" && <DashboardPanel account={account} onPlans={() => selectView("plans")} onPeople={() => selectView("people")} onJobs={() => selectView("jobs")} onCalendar={() => selectView("calendar")} onFinance={() => selectView("finance")} onAutomation={() => selectView("automation")} onProduction={() => selectView("production")} onReports={() => selectView("reports")} onBuddi={() => openBuddi()} onAttentionBuddi={() => openBuddi("What needs attention today?")} onReset={resetDemo} onLogout={handleLogout} people={people} jobs={jobs} appointments={appointments} invoices={invoices} automationEvents={automationEvents} productionRecords={productionRecords} />}
        {view === "finance" && (
          <FinancePanel
            account={account}
            invoices={invoices}
            people={people}
            onPlans={() => selectView("plans")}
            onAddInvoice={async (invoice) => {
              const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/invoices", {
                method: "POST",
                body: JSON.stringify(invoice),
              });
              setInvoices((current) =>
                [...current, result.invoice].sort((a, b) =>
                  (a.dueDate || "").localeCompare(b.dueDate || "")
                )
              );
              return result.invoice;
            }}
            onMarkPaid={async (invoiceId) => {
              const result = await bizzibuddiAuthRequest(
                "/api/bizzibuddi/auth/invoices/" + encodeURIComponent(invoiceId) + "/payments",
                {
                  method: "POST",
                  body: JSON.stringify({ method: "Other" }),
                }
              );
              setInvoices((current) =>
                current.map((invoice) => invoice.id === invoiceId ? result.invoice : invoice)
              );
              return result.invoice;
            }}
            onBack={() => selectView("dashboard")}
          />
        )}
        {view === "calendar" && (
          <CalendarPanel
            appointments={appointments}
            people={people}
            jobs={jobs}
            account={account}
            productionRecords={productionRecords}
            onAddAppointment={async (appointment) => {
              const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/calendar", {
                method: "POST",
                body: JSON.stringify(appointment),
              });
              setAppointments((current) =>
                [...current, result.appointment].sort((a, b) =>
                  (a.date + "T" + a.time).localeCompare(b.date + "T" + b.time)
                )
              );
              try {
                await addAutomationEvent({
                  type: "appointment-created",
                  title: "Appointment reminder prepared",
                  detail: "Reminder prepared for " + (result.appointment.title || "appointment") + " on " + result.appointment.date + ".",
                  sourceKey: "appointment:" + result.appointment.id,
                });
              } catch {
                // The appointment itself is already saved; automation can be retried from the Automation screen.
              }
              return result.appointment;
            }}
            onUpdateAppointment={async (appointmentId, appointment) => {
              const result = await bizzibuddiAuthRequest(
                "/api/bizzibuddi/auth/calendar/" + encodeURIComponent(appointmentId),
                {
                  method: "PUT",
                  body: JSON.stringify(appointment),
                }
              );
              setAppointments((current) =>
                current
                  .map((item) => (item.id === appointmentId ? result.appointment : item))
                  .sort((a, b) =>
                    (a.date + "T" + a.time).localeCompare(b.date + "T" + b.time)
                  )
              );
              return result.appointment;
            }}
            onDeleteAppointment={async (appointmentId) => {
              await bizzibuddiAuthRequest(
                "/api/bizzibuddi/auth/calendar/" + encodeURIComponent(appointmentId),
                { method: "DELETE" }
              );
              setAppointments((current) =>
                current.filter((item) => item.id !== appointmentId)
              );
            }}
            onPlans={() => selectView("plans")}
            onBack={() => selectView("dashboard")}
          />
        )}
        {view === "people" && (
          <PeoplePanel
            people={people}
            jobs={jobs}
            appointments={appointments}
            invoices={invoices}
            productionRecords={productionRecords}
            onAddPerson={async (person) => {
              const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/people", {
                method: "POST",
                body: JSON.stringify(person),
              });
              setPeople((current) => [...current, result.person]);
              return result.person;
            }}
            onUpdatePerson={async (personId, person) => {
              const result = await bizzibuddiAuthRequest(
                `/api/bizzibuddi/auth/people/${encodeURIComponent(personId)}`,
                {
                  method: "PUT",
                  body: JSON.stringify(person),
                }
              );
              setPeople((current) =>
                current.map((item) => (item.id === personId ? result.person : item))
              );
              return result.person;
            }}
            onDeletePerson={async (personId) => {
              await bizzibuddiAuthRequest(
                `/api/bizzibuddi/auth/people/${encodeURIComponent(personId)}`,
                {
                  method: "DELETE",
                }
              );
              setPeople((current) => current.filter((item) => item.id !== personId));
              setJobs((current) =>
                current.map((job) =>
                  job.personId === personId
                    ? { ...job, personId: null, clientName: "Unassigned" }
                    : job
                )
              );
            }}
            onBack={() => selectView("dashboard")}
          />
        )}
        {view === "jobs" && (
          <JobsPanel
            jobs={jobs}
            people={people}
            onAddJob={async (job) => {
              const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/jobs", {
                method: "POST",
                body: JSON.stringify(job),
              });
              setJobs((current) => [...current, result.job]);
              return result.job;
            }}
            onUpdateJob={async (jobId, job) => {
              const result = await bizzibuddiAuthRequest(
                `/api/bizzibuddi/auth/jobs/${encodeURIComponent(jobId)}`,
                {
                  method: "PUT",
                  body: JSON.stringify(job),
                }
              );
              setJobs((current) =>
                current.map((item) => (item.id === jobId ? result.job : item))
              );
              return result.job;
            }}
            onDeleteJob={async (jobId) => {
              await bizzibuddiAuthRequest(
                `/api/bizzibuddi/auth/jobs/${encodeURIComponent(jobId)}`,
                {
                  method: "DELETE",
                }
              );
              setJobs((current) => current.filter((item) => item.id !== jobId));
            }}
            onBack={() => selectView("dashboard")}
          />
        )}
        {view === "automation" && <AutomationPanel account={account} events={automationEvents} invoices={invoices} onPlans={() => selectView("plans")} onRunChecks={runAutomationChecks} onBack={() => selectView("dashboard")} />}
        {view === "production" && (
          <ProductionPanel
            account={account}
            jobs={jobs}
            records={productionRecords}
            onPlans={() => selectView("plans")}
            onSave={async (record) => {
              const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/production", {
                method: "POST",
                body: JSON.stringify(record),
              });
              setProductionRecords((current) => [
                result.record,
                ...current.filter((item) => item.jobId !== result.record.jobId),
              ]);
              return result.record;
            }}
            onBack={() => selectView("dashboard")}
          />
        )}
        {view === "reports" && <ReportsPanel account={account} people={people} jobs={jobs} appointments={appointments} invoices={invoices} productionRecords={productionRecords} onPlans={() => selectView("plans")} onBack={() => selectView("dashboard")} />}
        {view === "buddi" && <BizziBuddiAccountBuddi account={account} people={people} jobs={jobs} appointments={appointments} invoices={invoices} automationEvents={automationEvents} productionRecords={productionRecords} initialPrompt={buddiPrompt} onFinance={() => selectView("finance")} onCalendar={() => selectView("calendar")} onJobs={() => selectView("jobs")} onProduction={() => selectView("production")} onBack={() => selectView("dashboard")} />}
        {view === "help" && (
          <HelpSupportPanel
            onBuddi={() => selectView("buddi")}
            onDashboard={() => selectView("dashboard")}
            onPeople={() => selectView("people")}
            onJobs={() => selectView("jobs")}
            onCalendar={() => selectView("calendar")}
            onFinance={() => selectView("finance")}
            onAutomation={() => selectView("automation")}
            onProduction={() => selectView("production")}
            onReports={() => selectView("reports")}
          />
        )}


        <style>{`
              .bizzibuddi-account-nav-main { display:flex; justify-content:center; gap:10px; flex-wrap:wrap; }
              .bizzibuddi-help-nav { display:grid; gap:6px; justify-items:center; min-width:420px; padding:14px 0 0 20px; border-left:1px solid rgba(255,255,255,.18); }
              .bizzibuddi-help-nav-heading { width:100%; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:12px; color:#BFD8F0; font-size:11px; font-weight:900; letter-spacing:.18em; }
              .bizzibuddi-help-nav-heading span:first-child,.bizzibuddi-help-nav-heading span:last-child { height:1px; background:rgba(0,180,219,.30); }
              .bizzibuddi-help-nav-subheading { margin:0 0 8px; color:#B8C6D6; font-size:11px; font-style:italic; line-height:1.3; }
              .bizzibuddi-help-nav-buttons { display:grid; grid-template-columns:1fr 1fr; gap:10px; width:100%; }
              .bizzibuddi-help-action { display:grid; grid-template-columns:40px minmax(0,1fr) 34px; align-items:center; gap:11px; min-height:76px; padding:10px 12px; border-radius:38px; color:#fff; cursor:pointer; }
              .bizzibuddi-help-action-primary { border:1px solid rgba(0,180,219,.48); background:linear-gradient(135deg,rgba(0,180,219,.13),rgba(37,99,235,.18)); box-shadow:0 8px 22px rgba(0,0,0,.12); }
              .bizzibuddi-help-action-primary.active { border-color:#2DE8FF; background:linear-gradient(135deg,#12DDF5 0%,#1688F5 45%,#2563EB 100%); box-shadow:0 10px 28px rgba(0,180,219,.30),0 0 24px rgba(0,180,219,.18); }
              .bizzibuddi-help-action-secondary { border:1px solid rgba(72,133,186,.58); background:rgba(7,31,51,.48); }
              .bizzibuddi-help-action-secondary.active { border-color:rgba(0,180,219,.8); background:rgba(0,180,219,.13); }
              .bizzibuddi-help-action-icon { width:38px; height:38px; display:grid; place-items:center; flex:0 0 auto; border-radius:12px; border:1px solid rgba(0,180,219,.42); color:#00B4DB; background:rgba(0,180,219,.08); font-size:20px; font-weight:900; }
              .bizzibuddi-help-action-icon.primary { border-color:rgba(255,255,255,.45); color:#fff; background:rgba(255,255,255,.12); font-size:17px; letter-spacing:.08em; }
              .bizzibuddi-help-action-copy { display:grid; gap:3px; min-width:0; text-align:left; }
              .bizzibuddi-help-action-copy strong { font-size:14px; letter-spacing:.03em; }
              .bizzibuddi-help-action-copy small { color:#B8C6D6; font-size:10px; line-height:1.25; }
              .bizzibuddi-help-action-arrow { width:34px; height:34px; display:grid; place-items:center; flex:0 0 auto; border-radius:50%; background:rgba(37,99,235,.22); color:#fff; font-size:22px; font-weight:500; }
              .bizzibuddi-help-action-arrow.primary { background:rgba(255,255,255,.16); }
              .bizzibuddi-dashboard-buddi-content {
                display: flex;
                align-items: flex-start;
                gap: 14px;
              }
              .bizzibuddi-dashboard-buddi-copy {
                flex: 1;
                min-width: 0;
              }
              @media (max-width: 760px) {
                .bizzibuddi-help-nav { min-width:0; width:100%; padding:14px 0 0; border-left:0; border-top:1px solid rgba(255,255,255,.18); }
                .bizzibuddi-help-nav-buttons { grid-template-columns:1fr; }
              }
              @media (max-width: 760px) {
                .bizzibuddi-dashboard-buddi-content {
                  flex-direction: column;
                  align-items: stretch;
                  gap: 14px;
                }
                .bizzibuddi-dashboard-buddi-copy {
                  min-width: 0;
                  width: 100%;
                }
                .bizzibuddi-dashboard-buddi-button {
                  width: 100% !important;
                }
                .bizzibuddi-buddi-launcher.dashboard {
                  display: none;
                }
              }
              @keyframes bizzibuddiBuddiPulse {
                0%, 100% { box-shadow: 0 12px 30px rgba(0,0,0,.28), 0 0 0 0 rgba(0,180,219,.28); }
                50% { box-shadow: 0 14px 34px rgba(0,0,0,.34), 0 0 0 10px rgba(0,180,219,0); }
              }
              @media (prefers-reduced-motion: reduce) {
                .bizzibuddi-buddi-launcher { animation: none !important; }
              }
        `}</style>

        {account && (
          <button
            type="button"
            className={view === "dashboard" ? "bizzibuddi-buddi-launcher dashboard" : "bizzibuddi-buddi-launcher"}
            aria-label="Open Ask Buddi"
            onClick={() => (view === "buddi" ? selectView("dashboard") : openBuddi())}
            style={buddiFloatingButton}
          >
            <BizziBuddiLogo size={32} dark showWordmark={false} />
            <span>Ask Buddi</span>
          </button>
        )}
        <footer style={footerStyle}>Account authentication is live · People, Jobs, Calendar, Finance, Automation, Production and Reports are now account-backed · <a href="/bizzibuddi" style={{ color: RED }}>Return to BizziBuddi</a></footer>
      </div>
    </main>
  );
}

function measurementFieldLabel(key) {
  const labels = {
    bust: "Bust",
    waist: "Waist",
    hip: "Hip",
    shoulder: "Shoulder",
    sleeve: "Sleeve",
    neck: "Neck",
    backWaist: "Back waist",
    inseam: "Inseam",
    height: "Height",
  };
  return labels[key] || key;
}

function formatTimelineDate(value) {
  const raw = String(value || "");
  if (!raw) return "Date not set";
  const date = new Date(raw.length === 10 ? raw + "T00:00:00" : raw);
  if (Number.isNaN(date.getTime())) return raw.slice(0, 16);
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function storageKey(key, accountId) {
  return `bizzibuddiMock${key.charAt(0).toUpperCase() + key.slice(1)}:${accountId}`;
}

function readLocalList(key, accountId) {
  try {
    const value = localStorage.getItem(storageKey(key, accountId));
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function applyAccountData(account, setters) {
  if (!account?.id) return;

  setters.setAutomationEvents(readLocalList("automationEvents", account.id));
}

async function loadProductionRecords(accountId, serverRecords) {
  const current = Array.isArray(serverRecords) ? serverRecords : [];
  const legacy = readLocalList("productionRecords", accountId);

  if (!legacy.length) return current;

  const recordsByJobId = new Map(current.map((record) => [record.jobId, record]));
  let migrationFailed = false;

  for (const legacyRecord of legacy) {
    if (!legacyRecord?.jobId || recordsByJobId.has(legacyRecord.jobId)) continue;

    try {
      const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/production", {
        method: "POST",
        body: JSON.stringify(legacyRecord),
      });
      if (result?.record?.jobId) recordsByJobId.set(result.record.jobId, result.record);
    } catch {
      migrationFailed = true;
    }
  }

  const merged = Array.from(recordsByJobId.values()).sort((a, b) =>
    String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))
  );

  if (!migrationFailed && legacy.every((record) => record?.jobId && recordsByJobId.has(record.jobId))) {
    localStorage.removeItem(storageKey("productionRecords", accountId));
  }

  return merged;
}

function bizzibuddiAuthRequest(path, options = {}) {
  return fetch(path, {
    ...options,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.error || "The BizziBuddi account service could not complete that request.");
    }

    return payload;
  });
}

function AuthPanel({ mode, account, onSubmit, onSwitch }) {
  const login = mode === "login";
  return <section style={cardStyle(560)}>
    <div style={centerStyle}>
      <div style={stepBadge}>{login ? "SIGN IN" : "STEP 1 OF 2 · ACCOUNT"}</div>
      <BizziBuddiLogo size={78} dark showWordmark={false} />
      <h2 style={sectionHeading}>{login ? "Welcome back." : "Let’s get started."}</h2>
      <p style={copyStyle}>{login ? "Use your email address or username to continue." : "Create your secure BizziBuddi account and begin your business setup."}</p>
    </div>
    <form onSubmit={onSubmit} style={{ marginTop: 28 }}>
      {!login && <Field name="name" label="Full name" type="text" placeholder="Your name" />}
      {!login && <Field name="username" label="Username" type="text" placeholder="Choose a username" />}
      {!login && <Field name="email" label="Email address" type="email" placeholder="you@example.com" />}
      {login && <Field name="identifier" label="Email address or username" type="text" placeholder="you@example.com or username" />}
      <Field name="password" label="Password" type="password" placeholder={login ? "Your password" : "At least 10 characters"} />
      <button type="submit" style={primaryButton}>{login ? "Log in" : "Create account →"}</button>
    </form>
    <p style={switchText}>{login ? "New to BizziBuddi?" : "Already have an account?"} <button type="button" onClick={onSwitch} style={textButton}>{login ? "Create an account" : "Log in"}</button></p>
    {login && account && <p style={smallText}>Signed in account available for {account.email} · @{account.username}.</p>}
  </section>;
}

function OnboardingPanel({ account, onSubmit }) {
  return <section style={cardStyle(620)}><div style={centerStyle}><div style={stepBadge}>STEP 2 OF 2 · BUSINESS SETUP</div><BizziBuddiLogo size={78} dark showWordmark={false} /><h2 style={sectionHeading}>Set up your business.</h2><p style={copyStyle}>Welcome {account?.name || "there"}. Give your business a name to continue.</p></div><form onSubmit={onSubmit} style={{ marginTop: 28 }}><Field name="business" label="Business name" type="text" placeholder={account?.business || "Your business"} defaultValue={account?.business || ""} /><button type="submit" style={primaryButton}>Finish setup →</button></form></section>;
}

function PeoplePanel({ people, jobs, appointments, invoices, productionRecords, onAddPerson, onUpdatePerson, onDeletePerson, onBack }) {
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [timelinePersonId, setTimelinePersonId] = useState(null);
  const [measurementPersonId, setMeasurementPersonId] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [measurementsLoading, setMeasurementsLoading] = useState(false);
  const [measurementSaving, setMeasurementSaving] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function personTimeline(person) {
    const items = [
      ...(person?.createdAt ? [{
        id: `person-created-${person.id}`,
        date: person.createdAt,
        label: "Person added",
        detail: "This person was added to BizziBuddi.",
      }] : []),
      ...(jobs || []).filter((job) => job.personId === person.id).map((job) => ({
        id: `person-job-${job.id}`,
        date: job.createdAt || job.updatedAt,
        label: `Job · ${job.status || "New"}`,
        detail: job.title || "Untitled job",
      })),
      ...(appointments || []).filter((appointment) => appointment.personId === person.id).map((appointment) => ({
        id: `person-appointment-${appointment.id}`,
        date: appointment.date || appointment.createdAt,
        label: "Appointment",
        detail: `${appointment.date || "Date not set"}${appointment.time ? ` · ${appointment.time}` : ""}${appointment.title ? ` · ${appointment.title}` : ""}`,
      })),
      ...(invoices || []).filter((invoice) => invoice.personId === person.id).map((invoice) => ({
        id: `person-invoice-${invoice.id}`,
        date: invoice.dueDate || invoice.issueDate || invoice.createdAt,
        label: `Invoice · ${invoice.status || "Issued"}`,
        detail: `${invoice.number || "Invoice"} · ${formatCurrency(Number(invoice.amount) || 0)}`,
      })),
      ...(productionRecords || []).filter((record) => {
        const job = (jobs || []).find((item) => item.id === record.jobId);
        return job?.personId === person.id;
      }).map((record) => ({
        id: `person-production-${record.id}`,
        date: record.updatedAt || record.createdAt,
        label: `Production · ${record.stage || "Not started"}`,
        detail: record.jobTitle || "Production job",
      })),
    ];

    return items
      .filter((item) => item.date)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }

  function startAdd() {
    setError("");
    setEditingPerson(null);
    setShowForm(true);
  }

  function startEdit(person) {
    setError("");
    setEditingPerson(person);
    setShowForm(true);
  }

  function cancelForm() {
    setError("");
    setEditingPerson(null);
    setShowForm(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      const person = {
        name: String(form.get("name") || "").trim(),
        email: String(form.get("email") || "").trim(),
        phone: String(form.get("phone") || "").trim(),
      };

      if (editingPerson) {
        await onUpdatePerson(editingPerson.id, person);
      } else {
        await onAddPerson(person);
      }

      formElement.reset();
      setEditingPerson(null);
      setShowForm(false);
    } catch (requestError) {
      setError(requestError.message || "We could not save this person.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(person) {
    const confirmed = window.confirm(
      `Delete ${person.name}? This will permanently remove this person from your BizziBuddi People list.`
    );

    if (!confirmed) return;

    setError("");

    try {
      await onDeletePerson(person.id);
    } catch (requestError) {
      setError(requestError.message || "We could not delete this person.");
    }
  }

  async function toggleMeasurements(person) {
    if (measurementPersonId === person.id) {
      setMeasurementPersonId(null);
      setMeasurements([]);
      return;
    }

    setMeasurementPersonId(person.id);
    setMeasurements([]);
    setError("");
    setMeasurementsLoading(true);

    try {
      const result = await bizzibuddiAuthRequest(
        "/api/bizzibuddi/auth/people/" + encodeURIComponent(person.id) + "/measurements"
      );
      setMeasurements(result.measurements || []);
    } catch (requestError) {
      setError(requestError.message || "We could not load this person's measurements.");
    } finally {
      setMeasurementsLoading(false);
    }
  }

  async function handleMeasurementSubmit(event, person) {
    event.preventDefault();
    setError("");
    setMeasurementSaving(true);

    try {
      const form = new FormData(event.currentTarget);
      const result = await bizzibuddiAuthRequest(
        "/api/bizzibuddi/auth/people/" + encodeURIComponent(person.id) + "/measurements",
        {
          method: "POST",
          body: JSON.stringify({
            label: String(form.get("measurementLabel") || "Measurement set").trim(),
            data: {
              bust: String(form.get("bust") || "").trim(),
              waist: String(form.get("waist") || "").trim(),
              hip: String(form.get("hip") || "").trim(),
              shoulder: String(form.get("shoulder") || "").trim(),
              sleeve: String(form.get("sleeve") || "").trim(),
              neck: String(form.get("neck") || "").trim(),
              backWaist: String(form.get("backWaist") || "").trim(),
              inseam: String(form.get("inseam") || "").trim(),
              height: String(form.get("height") || "").trim(),
              notes: String(form.get("measurementNotes") || "").trim(),
            },
          }),
        }
      );
      setMeasurements((current) => [result.measurement, ...current]);
      event.currentTarget.reset();
    } catch (requestError) {
      setError(requestError.message || "We could not save these measurements.");
    } finally {
      setMeasurementSaving(false);
    }
  }

  return <section style={cardStyle(940)}>
    <button type="button" onClick={onBack} style={textButton}>← Back to business</button>
    <div style={{ marginTop: 22 }}>
      <p style={eyebrowStyle}>PEOPLE</p>
      <h2 style={sectionHeading}>Your people.</h2>
      <p style={copyStyle}>Keep your clients and contacts organised in one simple place.</p>
    </div>

    <div style={{ marginTop: 22, padding: 14, borderRadius: 12, border: "1px solid " + BORDER, background: "rgba(255,255,255,.025)" }}>
      <label style={{ ...fieldStyle, marginTop: 0 }}>
        Search people
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by name, email or phone"
          aria-label="Search people by name, email or phone"
          style={inputStyle}
        />
      </label>
    </div>

    {(() => {
      const normalizedQuery = searchQuery.trim().toLowerCase();
      const filteredPeople = normalizedQuery
        ? people.filter((person) =>
            [person.name, person.email, person.phone]
              .some((value) => String(value || "").toLowerCase().includes(normalizedQuery))
          )
        : people;

      return filteredPeople.length > 0 ? (
      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {people.map((person) => {
          const isTimelineOpen = timelinePersonId === person.id;
          const timelineItems = isTimelineOpen ? personTimeline(person) : [];
          return (
            <article key={person.id} style={personCard}>
              <div style={{ minWidth: 0, flex: "1 1 280px" }}>
                <strong style={{ display: "block", fontSize: 17 }}>{person.name}</strong>
                <span style={smallText}>
                  {person.email || "No email"}{person.phone ? ` · ${person.phone}` : ""}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setTimelinePersonId(isTimelineOpen ? null : person.id)} style={smallActionButton}>
                  {isTimelineOpen ? "Hide timeline" : "Timeline"}
                </button>
                <button type="button" onClick={() => toggleMeasurements(person)} style={smallActionButton}>
                  {measurementPersonId === person.id ? "Hide measurements" : "Measurements"}
                </button>
                <button type="button" onClick={() => startEdit(person)} style={smallActionButton}>Edit</button>
                <button type="button" onClick={() => handleDelete(person)} style={smallDangerButton}>Delete</button>
              </div>
              {measurementPersonId === person.id && (
                <div style={{ width: "100%", marginTop: 14, paddingTop: 14, borderTop: "1px solid " + BORDER }}>
                  <small style={smallText}>MEASUREMENT HISTORY</small>
                  <p style={{ ...copyStyle, margin: "5px 0 0", fontSize: 12 }}>Save dated measurement snapshots so changes can be tracked over time.</p>

                  <form onSubmit={(event) => handleMeasurementSubmit(event, person)} style={{ marginTop: 12, padding: 14, borderRadius: 10, border: "1px solid " + BORDER, background: "rgba(0,180,219,.045)" }}>
                    <label style={{ ...fieldStyle, marginTop: 0 }}>Snapshot label
                      <input name="measurementLabel" type="text" placeholder="e.g. Initial fitting" defaultValue="Measurement set" style={inputStyle} />
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 9, marginTop: 10 }}>
                      {[
                        ["bust", "Bust"], ["waist", "Waist"], ["hip", "Hip"], ["shoulder", "Shoulder"],
                        ["sleeve", "Sleeve"], ["neck", "Neck"], ["backWaist", "Back waist"], ["inseam", "Inseam"], ["height", "Height"],
                      ].map(([name, label]) => (
                        <label key={name} style={{ ...fieldStyle, marginTop: 0 }}>{label}
                          <input name={name} type="text" placeholder="e.g. 92 cm" style={inputStyle} />
                        </label>
                      ))}
                    </div>
                    <label style={fieldStyle}>Notes
                      <input name="measurementNotes" type="text" placeholder="Optional fitting notes" style={inputStyle} />
                    </label>
                    <button type="submit" disabled={measurementSaving} style={{ ...primaryButton, width: "auto", marginTop: 14, opacity: measurementSaving ? 0.7 : 1 }}>
                      {measurementSaving ? "Saving…" : "Save measurement snapshot"}
                    </button>
                  </form>

                  {measurementsLoading ? (
                    <span style={{ display: "block", marginTop: 14, color: MUTED, fontSize: 12 }}>Loading measurement history…</span>
                  ) : measurements.length > 0 ? (
                    <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                      {measurements.map((measurement) => (
                        <article key={measurement.id} style={{ padding: 13, borderRadius: 10, border: "1px solid " + BORDER, background: "rgba(255,255,255,.025)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                            <div>
                              <strong style={{ display: "block", fontSize: 14 }}>{measurement.label}</strong>
                              <span style={{ display: "block", marginTop: 3, color: MUTED, fontSize: 11 }}>{formatTimelineDate(measurement.createdAt)}</span>
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 7, marginTop: 10 }}>
                            {Object.entries(measurement.data || {}).filter(([key]) => key !== "notes").map(([key, value]) => (
                              <div key={key} style={{ padding: "7px 8px", borderRadius: 7, background: "rgba(255,255,255,.035)" }}>
                                <small style={{ color: MUTED, fontSize: 10, textTransform: "uppercase" }}>{measurementFieldLabel(key)}</small>
                                <strong style={{ display: "block", marginTop: 2, fontSize: 12 }}>{value}</strong>
                              </div>
                            ))}
                          </div>
                          {measurement.data?.notes && <p style={{ ...copyStyle, margin: "9px 0 0", fontSize: 12 }}>{measurement.data.notes}</p>}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <span style={{ display: "block", marginTop: 12, color: MUTED, fontSize: 12 }}>No measurement snapshots recorded yet.</span>
                  )}
                </div>
              )}

              {isTimelineOpen && (
                <div style={{ width: "100%", marginTop: 14, paddingTop: 14, borderTop: "1px solid " + BORDER }}>
                  <small style={smallText}>CLIENT TIMELINE</small>
                  {timelineItems.length > 0 ? (
                    <div style={{ display: "grid", gap: 9, marginTop: 10 }}>
                      {timelineItems.map((item) => (
                        <div key={item.id} style={{ display: "grid", gridTemplateColumns: "112px minmax(0,1fr)", gap: 10, padding: "9px 10px", borderRadius: 9, background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.08)" }}>
                          <span style={{ color: MUTED, fontSize: 11, fontWeight: 700 }}>
                            {formatTimelineDate(item.date)}
                          </span>
                          <div>
                            <strong style={{ display: "block", fontSize: 13 }}>{item.label}</strong>
                            <span style={{ display: "block", marginTop: 3, color: MUTED, fontSize: 12 }}>{item.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ display: "block", marginTop: 9, color: MUTED, fontSize: 12 }}>No activity recorded for this person yet.</span>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    ) : (
      <div style={emptyPeople}>
        <strong>{people.length > 0 ? "No matching people." : "No people added yet."}</strong>
        <p style={copyStyle}>
          {people.length > 0
            ? "Try a different name, email address or phone number."
            : "Add your first client or contact to start building your business."}
        </p>
        {people.length > 0 && searchQuery && (
          <button type="button" onClick={() => setSearchQuery("")} style={{ ...secondaryButton, width: "auto", marginTop: 14 }}>
            Clear search
          </button>
        )}
      </div>
    )}
      );
    })()}

    {error && <div role="alert" style={{ ...messageStyle, marginTop: 18 }}>{error}</div>}

    {!showForm ? (
      <button type="button" onClick={startAdd} style={{ ...primaryButton, maxWidth: 240 }}>+ Add a person</button>
    ) : (
      <form key={editingPerson?.id || "new-person"} onSubmit={handleSubmit} style={personForm}>
        <strong style={{ fontSize: 18 }}>{editingPerson ? "Edit person" : "Add a person"}</strong>
        <Field
          name="name"
          label="Name"
          type="text"
          placeholder="Client or contact name"
          defaultValue={editingPerson?.name || ""}
        />
        <Field
          name="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          defaultValue={editingPerson?.email || ""}
        />
        <Field
          name="phone"
          label="Phone"
          type="tel"
          placeholder="Phone number"
          defaultValue={editingPerson?.phone || ""}
        />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
          <button type="submit" disabled={saving} style={{ ...primaryButton, width: "auto", marginTop: 0, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : editingPerson ? "Save changes" : "Save person"}
          </button>
          <button type="button" onClick={cancelForm} disabled={saving} style={{ ...secondaryButton, width: "auto", marginTop: 0 }}>
            Cancel
          </button>
        </div>
      </form>
    )}
  </section>;
}

function JobsPanel({ jobs, people, onAddJob, onUpdateJob, onDeleteJob, onBack }) {
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [timelineJobId, setTimelineJobId] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  async function toggleTimeline(job) {
    if (timelineJobId === job.id) {
      setTimelineJobId(null);
      setTimeline([]);
      return;
    }

    setTimelineJobId(job.id);
    setTimeline([]);
    setTimelineLoading(true);

    try {
      const result = await bizzibuddiAuthRequest(
        "/api/bizzibuddi/auth/jobs/" + encodeURIComponent(job.id)
      );
      setTimeline(result.timeline || []);
    } catch (requestError) {
      setError(requestError.message || "We could not load the job timeline.");
    } finally {
      setTimelineLoading(false);
    }
  }

  function startAdd() {
    setError("");
    setEditingJob(null);
    setShowForm(true);
  }

  function startEdit(job) {
    setError("");
    setEditingJob(job);
    setShowForm(true);
  }

  function cancelForm() {
    setError("");
    setEditingJob(null);
    setShowForm(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      const job = {
        title: String(form.get("title") || "").trim(),
        personId: String(form.get("personId") || ""),
        status: String(form.get("status") || "New"),
      };

      if (editingJob) {
        await onUpdateJob(editingJob.id, job);
      } else {
        await onAddJob(job);
      }

      formElement.reset();
      setEditingJob(null);
      setShowForm(false);
    } catch (requestError) {
      setError(requestError.message || "We could not save this job.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(job) {
    const confirmed = window.confirm(
      `Delete ${job.title}? This will permanently remove this job from your BizziBuddi Jobs list.`
    );

    if (!confirmed) return;

    setError("");

    try {
      await onDeleteJob(job.id);
    } catch (requestError) {
      setError(requestError.message || "We could not delete this job.");
    }
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
            <div style={{ minWidth: 0, flex: "1 1 240px" }}>
              <strong style={{ display: "block", fontSize: 17 }}>{job.title}</strong>
              <span style={smallText}>{job.clientName || "Unassigned"}</span>
              <div style={{ marginTop: 10, maxWidth: 360 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
                  <span style={{ ...smallText, fontSize: 11 }}>Production: {job.productionStage || "Not started"}</span>
                  <span style={{ ...smallText, fontSize: 11, fontWeight: 700 }}>{job.productionProgress || 0}%</span>
                </div>
                <div style={jobProgressTrack}>
                  <div style={{ ...jobProgressFill, width: (job.productionProgress || 0) + "%" }} />
                </div>
              </div>
              {job.productionTaskCount > 0 && (
                <span style={{ ...smallText, display: "block", marginTop: 5 }}>
                  Tasks: {job.productionCompletedTaskCount || 0}/{job.productionTaskCount}
                </span>
              )}
              <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", marginTop: 7 }}>
                <span
                  style={jobReadinessBadge(job.productionReadiness || "In progress")}
                  title={job.productionReadinessDetail || ""}
                >
                  {job.productionReadiness || "In progress"}
                </span>
                {job.productionDueDate && (
                  <span
                    style={jobDueDateBadge(job.productionDueDate, job.productionReadiness || "In progress")}
                    title="Production ready-by date"
                  >
                    {jobDueDateLabel(job.productionDueDate, job.productionReadiness || "In progress")}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <span style={jobStatus}>{job.status}</span>
              <button type="button" onClick={() => startEdit(job)} style={smallActionButton}>Edit</button>
              <button type="button" onClick={() => handleDelete(job)} style={smallDangerButton}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    ) : (
      <div style={emptyPeople}>
        <strong>No jobs created yet.</strong>
        <p style={copyStyle}>Create your first job to start tracking work in your business.</p>
      </div>
    )}

    {error && <div role="alert" style={{ ...messageStyle, marginTop: 18 }}>{error}</div>}

    {!showForm ? (
      <button type="button" onClick={startAdd} style={{ ...primaryButton, maxWidth: 240 }}>+ Create a job</button>
    ) : (
      <form key={editingJob?.id || "new-job"} onSubmit={handleSubmit} style={personForm}>
        <strong style={{ fontSize: 18 }}>{editingJob ? "Edit job" : "Create a job"}</strong>
        <Field
          name="title"
          label="Job name"
          type="text"
          placeholder="e.g. Wedding dress alteration"
          defaultValue={editingJob?.title || ""}
        />
        <label style={fieldStyle}>Client
          <select required name="personId" defaultValue={editingJob?.personId || ""} style={inputStyle}>
            <option value="" disabled>Select a person</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>{person.name}</option>
            ))}
          </select>
        </label>
        <label style={fieldStyle}>Status
          <select name="status" defaultValue={editingJob?.status || "New"} style={inputStyle}>
            <option>New</option>
            <option>In progress</option>
            <option>Waiting</option>
            <option>Complete</option>
          </select>
        </label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
          <button type="submit" disabled={people.length === 0 || saving} style={{ ...primaryButton, width: "auto", marginTop: 0, opacity: people.length === 0 || saving ? 0.5 : 1 }}>
            {saving ? "Saving…" : editingJob ? "Save changes" : "Save job"}
          </button>
          <button type="button" onClick={cancelForm} disabled={saving} style={{ ...secondaryButton, width: "auto", marginTop: 0 }}>
            Cancel
          </button>
        </div>
        {people.length === 0 && <p style={{ ...smallText, marginBottom: 0 }}>Add a person first, then you can create a job.</p>}
      </form>
    )}
  </section>;
}

function PlansPanel({ onSelectPlan }) {
  return <section><div style={centerStyle}><h2 style={sectionHeading}>Get more time back.</h2><p style={copyStyle}>Choose the level of BizziBuddi that fits your business. Your selected membership is saved to your BizziBuddi account in this development preview.</p></div><div style={plansGrid}>{plans.map((plan) => <article key={plan.id} style={{ ...cardStyle(), border: plan.featured ? `2px solid ${RED}` : `1px solid ${BORDER}`, display: "flex", flexDirection: "column" }}>{plan.featured && <span style={popularBadge}>MOST POPULAR</span>}<h3 style={planTitle}>{plan.name}</h3><div style={priceStyle}>{plan.price}<small style={smallText}>{plan.period}</small></div><p style={copyStyle}>{plan.description}</p><ul style={{ paddingLeft: 20, lineHeight: 2, flex: 1 }}>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul><button type="button" onClick={() => onSelectPlan(plan.name)} style={plan.featured ? primaryButton : secondaryButton}>{plan.name === "Free" ? "Start Free" : `Choose ${plan.name}`}</button></article>)}</div></section>;
}

function DashboardPanel({
  account, onPlans, onPeople, onJobs, onCalendar, onFinance, onAutomation,
  onProduction, onReports, onBuddi, onAttentionBuddi, onReset, onLogout, people, jobs,
  appointments, invoices, automationEvents, productionRecords,
}) {
  const [dismissedNotifications, setDismissedNotifications] = useState([]);
  const todayKey = new Date().toISOString().slice(0, 10);
  const today = new Date(todayKey + "T00:00:00");
  const overdueInvoices = invoices.filter((invoice) => invoice.status !== "Paid" && invoice.dueDate && invoice.dueDate < todayKey);
  const dueSoonInvoices = invoices.filter((invoice) => {
    if (invoice.status === "Paid" || !invoice.dueDate) return false;
    const due = new Date(invoice.dueDate + "T00:00:00");
    const days = Math.ceil((due - today) / 86400000);
    return days >= 0 && days <= 7;
  });
  const appointmentsToday = appointments.filter((appointment) => appointment.date === todayKey);
  const waitingJobs = jobs.filter((job) => job.status === "Waiting");
  const openJobs = jobs.filter((job) => job.status !== "Complete").length;
  const productionNeedsAttention = jobs.filter((job) =>
    ["Overdue", "Tasks outstanding", "Stage update needed"].includes(job.productionReadiness)
  );
  const productionDueSoon = jobs.filter((job) => {
    if (!job.productionDueDate || job.productionReadiness === "Complete") return false;
    const due = new Date(job.productionDueDate + "T00:00:00");
    const days = Math.ceil((due - today) / 86400000);
    return days >= 0 && days <= 2;
  });
  const readyProduction = jobs.filter((job) => job.productionReadiness === "Ready");
  const recentAutomationFlags = automationEvents.filter((event) => event.type === "invoice-overdue");

  const attentionItems = [
    ...overdueInvoices.map((invoice) => ({
      key: `invoice-overdue-${invoice.id}`, icon: "💳", label: "Payment overdue",
      title: invoice.clientName || invoice.client || "Invoice requires attention",
      detail: `${formatCurrency(Math.max(0, (Number(invoice.amount) || 0) - (Number(invoice.amountPaid) || 0)))} outstanding · Due ${invoice.dueDate}`,
      action: "Open finance", onClick: onFinance, tone: "urgent",
    })),
    ...dueSoonInvoices.map((invoice) => ({
      key: `invoice-soon-${invoice.id}`, icon: "💰", label: invoice.dueDate === todayKey ? "Due today" : "Due soon",
      title: invoice.clientName || invoice.client || "Invoice due soon",
      detail: `${formatCurrency(Math.max(0, (Number(invoice.amount) || 0) - (Number(invoice.amountPaid) || 0)))} outstanding · Due ${invoice.dueDate}`,
      action: "Open finance", onClick: onFinance, tone: "attention",
    })),
    ...productionNeedsAttention.map((job) => ({
      key: `production-attention-${job.id}`, icon: "🏭", label: job.productionReadiness,
      title: job.title || "Production job",
      detail: job.productionReadinessDetail || "Production needs a workflow update.",
      action: "Open jobs", onClick: onJobs, tone: job.productionReadiness === "Overdue" ? "urgent" : "attention",
    })),
    ...productionDueSoon.filter((job) => !productionNeedsAttention.some((item) => item.id === job.id)).map((job) => ({
      key: `production-due-${job.id}`, icon: "📦", label: "Production due soon",
      title: job.title || "Production job",
      detail: `Ready by ${formatProductionDate(job.productionDueDate)}`,
      action: "Open jobs", onClick: onJobs, tone: "today",
    })),
    ...appointmentsToday.map((appointment) => ({
      key: `appointment-${appointment.id}`, icon: "📅", label: "Today",
      title: appointment.title || "Appointment",
      detail: `${appointment.time || "Time not set"}${appointment.personName ? ` · ${appointment.personName}` : ""}`,
      action: "Open calendar", onClick: onCalendar, tone: "today",
    })),
    ...waitingJobs.map((job) => ({
      key: `waiting-${job.id}`, icon: "⏳", label: "Waiting",
      title: job.title || "Job waiting",
      detail: job.clientName || job.client ? `Waiting on ${job.clientName || job.client}` : "This job is waiting for the next step.",
      action: "Open jobs", onClick: onJobs, tone: "attention",
    })),
    ...readyProduction.map((job) => ({
      key: `production-ready-${job.id}`, icon: "✅", label: "Ready",
      title: job.title || "Production job",
      detail: job.productionDueDate ? `Ready by ${formatProductionDate(job.productionDueDate)}` : "Production has reached the Ready stage.",
      action: "Open jobs", onClick: onJobs, tone: "ready",
    })),
  ];
  const priorityWeight = {
    urgent: 400,
    attention: 300,
    today: 200,
    ready: 100,
  };
  const uniqueAttentionItems = attentionItems
    .filter((item, index, items) => items.findIndex((candidate) => candidate.key === item.key) === index)
    .map((item) => ({
      ...item,
      priorityScore:
        (priorityWeight[item.tone] || 0) +
        (item.label === "Payment overdue" ? 40 : 0) +
        (item.label === "Overdue" ? 30 : 0) +
        (item.label === "Due today" ? 20 : 0) +
        (item.label === "Today" ? 15 : 0),
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
  const priorityItems = uniqueAttentionItems.slice(0, 6);
  const actionCount = uniqueAttentionItems.length;
  const recentActivity = [
    ...(automationEvents || []).map((event) => ({ key: "automation-" + event.id, date: event.createdAt || event.updatedAt, icon: "⚙️", label: "Automation", title: event.title || event.type || "Automation event", detail: event.detail || "A business automation event was recorded.", onClick: onAutomation })),
    ...(jobs || []).map((job) => ({ key: "job-" + job.id, date: job.updatedAt || job.createdAt, icon: "📋", label: "Job", title: job.title || "Job updated", detail: "Status: " + (job.status || "New"), onClick: onJobs })),
    ...(appointments || []).map((appointment) => ({ key: "appointment-" + appointment.id, date: appointment.updatedAt || appointment.createdAt || appointment.date, icon: "📅", label: "Calendar", title: appointment.title || "Appointment", detail: (appointment.date || "Date not set") + (appointment.time ? " · " + appointment.time : ""), onClick: onCalendar })),
    ...(invoices || []).map((invoice) => ({ key: "invoice-" + invoice.id, date: invoice.updatedAt || invoice.createdAt || invoice.issueDate, icon: "💳", label: "Finance", title: invoice.number || "Invoice", detail: (invoice.status || "Issued") + " · " + formatCurrency(Number(invoice.amount) || 0), onClick: onFinance })),
    ...(productionRecords || []).map((record) => ({ key: "production-" + record.id, date: record.updatedAt || record.createdAt, icon: "🏭", label: "Production", title: record.jobTitle || "Production job", detail: "Stage: " + (record.stage || "Not started"), onClick: onProduction })),
  ].filter((item) => item.date).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
  const completedJobs = jobs.filter((job) => job.status === "Complete").length;
  const completionRate = jobs.length ? Math.round((completedJobs / jobs.length) * 100) : 0;
  const paidInvoices = invoices.filter((invoice) => invoice.status === "Paid");
  const invoicedTotal = invoices.reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0);
  const paidTotal = paidInvoices.reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0);
  const collectionRate = invoicedTotal > 0 ? Math.round((paidTotal / invoicedTotal) * 100) : 0;
  const overdueAmount = overdueInvoices.reduce((sum, invoice) => sum + Math.max(0, (Number(invoice.amount) || 0) - (Number(invoice.amountPaid) || 0)), 0);
  const productionComplete = productionRecords.filter((record) => record.stage === "Complete").length;
  const productionActive = productionRecords.filter((record) => record.stage && record.stage !== "Complete").length;
  const healthMetrics = [
    { label: "Work completion", value: jobs.length ? completionRate + "%" : "—", detail: jobs.length ? completedJobs + " of " + jobs.length + " jobs complete" : "No jobs recorded yet", tone: completionRate >= 75 ? "good" : completionRate >= 40 ? "watch" : "neutral" },
    { label: "Payment collection", value: invoices.length ? collectionRate + "%" : "—", detail: invoices.length ? formatCurrency(overdueAmount) + " currently overdue" : "No invoices recorded yet", tone: overdueAmount > 0 ? "watch" : "good" },
    { label: "Production flow", value: productionRecords.length ? productionActive + " active" : "—", detail: productionRecords.length ? productionComplete + " completed" : "No production records yet", tone: productionActive > 0 ? "good" : "neutral" },
    { label: "Today's schedule", value: appointmentsToday.length, detail: appointmentsToday.length === 1 ? "appointment booked" : "appointments booked", tone: appointmentsToday.length > 0 ? "good" : "neutral" },
  ];
  const notificationItems = [
    ...overdueInvoices.map((invoice) => ({
      key: "notification-invoice-" + invoice.id,
      icon: "💳",
      title: "Payment overdue",
      detail: (invoice.number || "Invoice") + " has an outstanding balance of " + formatCurrency(Math.max(0, (Number(invoice.amount) || 0) - (Number(invoice.amountPaid) || 0))) + ".",
      onClick: onFinance,
      tone: "urgent",
    })),
    ...productionNeedsAttention.map((job) => ({
      key: "notification-production-" + job.id,
      icon: "🏭",
      title: job.productionReadiness || "Production needs attention",
      detail: (job.title || "Production job") + (job.productionReadinessDetail ? " · " + job.productionReadinessDetail : "."),
      onClick: onProduction,
      tone: "attention",
    })),
    ...appointmentsToday.map((appointment) => ({
      key: "notification-appointment-" + appointment.id,
      icon: "📅",
      title: "Appointment today",
      detail: (appointment.title || "Appointment") + " · " + (appointment.time || "Time not set"),
      onClick: onCalendar,
      tone: "today",
    })),
    ...(automationEvents || []).slice(0, 8).map((event) => ({
      key: "notification-automation-" + event.id,
      icon: "⚙️",
      title: event.title || "Automation event",
      detail: event.detail || "A BizziBuddi automation event was recorded.",
      onClick: onAutomation,
      tone: event.type === "invoice-overdue" ? "urgent" : "attention",
    })),
  ]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.key === item.key) === index)
    .filter((item) => !dismissedNotifications.includes(item.key))
    .slice(0, 8);
  const notificationCount = notificationItems.length;
  const recentActivityCount = recentActivity.length;
  const outstanding = invoices.reduce((sum, invoice) => invoice.status === "Paid" ? sum : sum + Math.max(0, (Number(invoice.amount) || 0) - (Number(invoice.amountPaid) || 0)), 0);

  return (
    <section style={cardStyle(940)}>
      <p style={eyebrowStyle}>YOUR BIZZIBUDDI BUSINESS</p>
      <h2 style={sectionHeading}>Welcome to {account?.business || "your business"}.</h2>
      <p style={copyStyle}>Your business is ready. This is your operating view — what needs attention, what is happening today and where to go next.</p>

      <div style={attentionPanel}>
        <div style={attentionHeader}>
          <div>
            <small style={smallText}>TODAY'S BUSINESS PICTURE</small>
            <h3 style={{ margin: "6px 0 5px", fontSize: 28 }}>Your business at a glance.</h3>
            <p style={{ ...copyStyle, margin: 0 }}>One queue for the work, money and activity that needs your attention now. Items are ordered by urgency so the most important actions appear first.</p>
          </div>
          <button type="button" onClick={onAttentionBuddi} style={attentionBuddiButton}>
            <BizziBuddiLogo size={30} dark showWordmark={false} />
            <span>Ask Buddi</span>
          </button>
        </div>

        <div style={attentionSummary}>
          <div><strong>{actionCount}</strong><span>{actionCount === 1 ? "action item" : "action items"}</span></div>
          <div><strong>{appointmentsToday.length}</strong><span>{appointmentsToday.length === 1 ? "appointment today" : "appointments today"}</span></div>
          <div><strong>{openJobs}</strong><span>{openJobs === 1 ? "open job" : "open jobs"}</span></div>
          <div><strong>{formatCurrency(outstanding)}</strong><span>outstanding</span></div>
        </div>

        {priorityItems.length > 0 ? (
          <div style={attentionList}>
            {priorityItems.map((item) => (
              <article key={item.key} style={attentionItem(item.tone)}>
                <div style={attentionItemIcon}>{item.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <small style={smallText}>{item.label}</small>
                  <strong style={{ display: "block", marginTop: 3, fontSize: 16 }}>{item.title}</strong>
                  <span style={{ display: "block", marginTop: 4, color: MUTED, fontSize: 13 }}>{item.detail}</span>
                </div>
                <button type="button" onClick={item.onClick} style={attentionAction}>{item.action} →</button>
              </article>
            ))}
          </div>
        ) : (
          <div style={attentionClear}>
            <div style={attentionClearIcon}>✓</div>
            <div>
              <strong style={{ display: "block", fontSize: 17 }}>Your dashboard is clear.</strong>
              <p style={{ ...copyStyle, margin: "5px 0 0" }}>No overdue payments, production actions, due-soon work, today's appointments or waiting jobs are currently showing.</p>
            </div>
          </div>
        )}

        <div style={attentionFooter}>
          <span>{uniqueAttentionItems.length > priorityItems.length ? `${uniqueAttentionItems.length - priorityItems.length} lower-priority item${uniqueAttentionItems.length - priorityItems.length === 1 ? "" : "s"} also available below.` : recentAutomationFlags.length > 0 ? `${recentAutomationFlags.length} overdue item${recentAutomationFlags.length === 1 ? "" : "s"} also flagged by Automation.` : "Buddi can help you review this picture and turn it into your next action."}</span>
          <button type="button" onClick={onAttentionBuddi} style={attentionFooterButton}>Ask Buddi what needs attention →</button>
        </div>
      </div>

      <div style={todayViewPanel}>
        <div style={todayViewHeader}>
          <div>
            <small style={smallText}>DAILY OPERATING VIEW</small>
            <h3 style={{ margin: "6px 0 5px", fontSize: 24 }}>Today & next up.</h3>
            <p style={{ ...copyStyle, margin: 0 }}>A quick view of what is happening today and what is coming up next.</p>
          </div>
          <span style={todayViewDate}>{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</span>
        </div>

        <div style={todayViewGrid}>
          <div style={todayViewCard}>
            <small style={smallText}>TODAY</small>
            <strong style={todayViewMetric}>{appointmentsToday.length}</strong>
            <span style={todayViewLabel}>{appointmentsToday.length === 1 ? "appointment" : "appointments"}</span>
            {appointmentsToday.slice(0, 3).map((appointment) => (
              <button key={appointment.id} type="button" onClick={onCalendar} style={todayViewItem}>
                <span>{appointment.time || "Time not set"}</span>
                <strong>{appointment.title || "Appointment"}</strong>
              </button>
            ))}
            {appointmentsToday.length === 0 && <span style={todayViewEmpty}>No appointments booked for today.</span>}
          </div>

          <div style={todayViewCard}>
            <small style={smallText}>DUE SOON</small>
            <strong style={todayViewMetric}>{dueSoonInvoices.length + productionDueSoon.length}</strong>
            <span style={todayViewLabel}>items in the next 7 days</span>
            {dueSoonInvoices.slice(0, 2).map((invoice) => (
              <button key={`today-invoice-${invoice.id}`} type="button" onClick={onFinance} style={todayViewItem}>
                <span>{invoice.dueDate === todayKey ? "Today" : `Due ${invoice.dueDate}`}</span>
                <strong>{invoice.clientName || invoice.client || "Invoice"}</strong>
              </button>
            ))}
            {productionDueSoon.slice(0, 2).map((job) => (
              <button key={`today-production-${job.id}`} type="button" onClick={onJobs} style={todayViewItem}>
                <span>Production · {formatProductionDate(job.productionDueDate)}</span>
                <strong>{job.title || "Production job"}</strong>
              </button>
            ))}
            {dueSoonInvoices.length === 0 && productionDueSoon.length === 0 && <span style={todayViewEmpty}>Nothing due in the next few days.</span>}
          </div>

          <div style={todayViewCard}>
            <small style={smallText}>WORKFLOW</small>
            <strong style={todayViewMetric}>{productionNeedsAttention.length + waitingJobs.length}</strong>
            <span style={todayViewLabel}>jobs needing a workflow step</span>
            {productionNeedsAttention.slice(0, 2).map((job) => (
              <button key={`today-workflow-${job.id}`} type="button" onClick={onJobs} style={todayViewItem}>
                <span>{job.productionReadiness}</span>
                <strong>{job.title || "Production job"}</strong>
              </button>
            ))}
            {waitingJobs.slice(0, 2).map((job) => (
              <button key={`today-waiting-${job.id}`} type="button" onClick={onJobs} style={todayViewItem}>
                <span>Waiting</span>
                <strong>{job.title || "Job waiting"}</strong>
              </button>
            ))}
            {productionNeedsAttention.length === 0 && waitingJobs.length === 0 && <span style={todayViewEmpty}>No workflow blockers are showing.</span>}
          </div>
        </div>
      </div>

      <div style={{ ...todayViewPanel, marginTop: 18 }}>
        <div style={todayViewHeader}>
          <div>
            <small style={smallText}>RECENT ACTIVITY</small>
            <h3 style={{ margin: "6px 0 5px", fontSize: 24 }}>What has been happening.</h3>
            <p style={{ ...copyStyle, margin: 0 }}>The latest activity across jobs, calendar, finance, automation and production.</p>
          </div>
          <span style={todayViewDate}>{recentActivityCount} recent</span>
        </div>
        {recentActivityCount > 0 ? (
          <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
            {recentActivity.map((item) => (
              <button key={item.key} type="button" onClick={item.onClick} style={{ display: "grid", gridTemplateColumns: "38px minmax(0,1fr) auto", alignItems: "center", gap: 11, width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.025)", color: TEXT, textAlign: "left", cursor: "pointer" }}>
                <span style={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 9, background: "rgba(0,180,219,.10)" }}>{item.icon}</span>
                <span style={{ minWidth: 0 }}>
                  <small style={smallText}>{item.label}</small>
                  <strong style={{ display: "block", marginTop: 2, fontSize: 14 }}>{item.title}</strong>
                  <span style={{ display: "block", marginTop: 2, color: MUTED, fontSize: 12 }}>{item.detail}</span>
                </span>
                <span style={{ color: MUTED, fontSize: 11, whiteSpace: "nowrap" }}>{formatTimelineDate(item.date)}</span>
              </button>
            ))}
          </div>
        ) : (
          <span style={todayViewEmpty}>No recent business activity has been recorded yet.</span>
        )}
      </div>

      <div style={{ ...todayViewPanel, marginTop: 18 }}>
        <div style={todayViewHeader}>
          <div>
            <small style={smallText}>NOTIFICATIONS</small>
            <h3 style={{ margin: "6px 0 5px", fontSize: 24 }}>What needs your attention.</h3>
            <p style={{ ...copyStyle, margin: 0 }}>Important business events gathered into one notification feed.</p>
          </div>
          {notificationCount > 0 && (
            <span style={todayViewDate}>{notificationCount} active</span>
          )}
        </div>
        {notificationItems.length > 0 ? (
          <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
            {notificationItems.map((item) => (
              <article key={item.key} style={attentionItem(item.tone)}>
                <div style={attentionItemIcon}>{item.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: "block", fontSize: 15 }}>{item.title}</strong>
                  <span style={{ display: "block", marginTop: 4, color: MUTED, fontSize: 13 }}>{item.detail}</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" onClick={item.onClick} style={attentionAction}>Open →</button>
                  <button type="button" onClick={() => setDismissedNotifications((current) => [...current, item.key])} style={smallActionButton}>Dismiss</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div style={todayViewEmpty}>No active notifications. Your notification feed is clear.</div>
        )}
      </div>

      <div style={{ ...todayViewPanel, marginTop: 18 }}>
        <div style={todayViewHeader}>
          <div>
            <small style={smallText}>BUSINESS HEALTH</small>
            <h3 style={{ margin: "6px 0 5px", fontSize: 24 }}>How the business is tracking.</h3>
            <p style={{ ...copyStyle, margin: 0 }}>A compact health snapshot based on the activity already recorded in BizziBuddi.</p>
          </div>
        </div>
        <div style={{ ...todayViewGrid, marginTop: 16 }}>
          {healthMetrics.map((metric) => (
            <article key={metric.label} style={todayViewCard}>
              <small style={smallText}>{metric.label.toUpperCase()}</small>
              <strong style={{ ...todayViewMetric, color: metric.tone === "watch" ? "#f6c453" : metric.tone === "good" ? "#58e0b1" : TEXT }}>{metric.value}</strong>
              <span style={todayViewLabel}>{metric.detail}</span>
            </article>
          ))}
        </div>
        <p style={{ ...smallText, margin: "14px 0 0" }}>These indicators are descriptive snapshots, not financial or business advice.</p>
      </div>

      <div style={statsGrid}>
        {[
          ["Business", account?.business ? "Ready" : "Not set up"],
          ["Plan", account?.plan || "Free"],
          ["People", people.length ? `${people.length} added` : "Ready to add"],
          ["Jobs", jobs.length ? `${jobs.length} created` : "Ready to add"],
          ["Calendar", appointments.length ? `${appointments.length} booked` : "Ready to use"],
          ["Finance", invoices.length ? `${invoices.length} invoices` : "Ready to use"],
          ["Automation", hasBizzibuddiFeature(account?.plan, "automation") ? (automationEvents.length ? `${automationEvents.length} events` : "Ready to use") : "Professional"],
          ["Production", hasBizzibuddiFeature(account?.plan, "production") ? (productionRecords.length ? `${productionRecords.length} tracked` : "Ready to use") : "Business"],
          ["Reports", hasBizzibuddiFeature(account?.plan, "reports") ? "Ready to use" : "Business"],
        ].map(([label, value]) => (
          <div key={label} style={statCard}><small style={smallText}>{label}</small><strong style={{ display: "block", marginTop: 8, fontSize: 20 }}>{value}</strong></div>
        ))}
      </div>

      <div style={buddiDashboardCard} className="bizzibuddi-dashboard-buddi-card">
        <div className="bizzibuddi-dashboard-buddi-content">
          <div style={buddiDashboardIcon} className="bizzibuddi-dashboard-buddi-icon"><BizziBuddiLogo size={38} dark showWordmark={false} /></div>
          <div className="bizzibuddi-dashboard-buddi-copy">
            <small style={smallText}>YOUR BUSINESS ASSISTANT</small>
            <strong style={{ display: "block", marginTop: 5, fontSize: 22 }}>Ask Buddi.</strong>
            <p style={{ ...copyStyle, margin: "6px 0 0" }}>Ask questions about your people, jobs, calendar, money and business activity.</p>
          </div>
          <button type="button" onClick={onBuddi} style={{ ...primaryButton, width: "auto", marginTop: 0, whiteSpace: "nowrap" }} className="bizzibuddi-dashboard-buddi-button">Ask Buddi →</button>
        </div>
      </div>

      <div style={businessActions}>
        <div>
          <strong style={{ fontSize: 20 }}>What would you like to do next?</strong>
          <p style={{ ...copyStyle, marginBottom: 0 }}>Jump directly into the part of your business you want to work on.</p>
        </div>
        <div style={planSummary}>
          <div><small style={smallText}>CURRENT MEMBERSHIP</small><strong style={{ display: "block", marginTop: 5, fontSize: 22 }}>{getBizzibuddiPlan(account?.plan).name}</strong></div>
          <div style={{ color: MUTED, fontSize: 13, lineHeight: 1.5 }}>{getBizzibuddiPlan(account?.plan).features.join(" · ")}</div>
        </div>
        <div style={actionGrid}>
          <button type="button" onClick={onPeople} style={actionCard}><span style={actionIcon}>👥</span><span><strong>Add your people</strong><small>Keep clients and contacts organised.</small></span></button>
          <button type="button" onClick={onJobs} style={actionCard}><span style={actionIcon}>📋</span><span><strong>Create a job</strong><small>Start tracking work from enquiry to completion.</small></span></button>
          <button type="button" onClick={onCalendar} style={actionCard}><span style={actionIcon}>📅</span><span><strong>Open your calendar</strong><small>Keep appointments and business dates organised.</small></span></button>
          <button type="button" onClick={onFinance} style={actionCard}><span style={actionIcon}>💳</span><span><strong>Open finance</strong><small>Manage invoices and payment status.</small></span></button>
          <button type="button" onClick={onAutomation} style={actionCard}><span style={actionIcon}>⚙️</span><span><strong>Open automation</strong><small>Turn routine business events into useful follow-up.</small></span></button>
          <button type="button" onClick={onProduction} style={actionCard}><span style={actionIcon}>🏭</span><span><strong>Open production</strong><small>Track work stages, tasks and production progress.</small></span></button>
          <button type="button" onClick={onReports} style={actionCard}><span style={actionIcon}>📊</span><span><strong>Open reports</strong><small>See the numbers and activity behind your business.</small></span></button>
          <button type="button" onClick={onBuddi} style={{ ...actionCard, borderColor: "rgba(0,180,219,.55)", background: "rgba(0,180,219,.08)" }}><span style={actionIcon}>🤖</span><span><strong>Ask Buddi</strong><small>Get help understanding your people, jobs, calendar and money.</small></span></button>
          <button type="button" onClick={onPlans} style={actionCard}><span style={actionIcon}>⚡</span><span><strong>Explore plans</strong><small>See what is available as BizziBuddi grows.</small></span></button>
        </div>
      </div>

      <MembershipAccessPanel planName={account?.plan} />
      <div style={businessNote}><strong>Development preview</strong><p style={copyStyle}>Your BizziBuddi account and login are connected to the server. People, jobs, calendar, finance, automation, production and reporting are now account-backed.</p></div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", marginTop: 18 }}>
        <button type="button" onClick={onLogout} style={textButton}>Log out</button>
        <button type="button" onClick={onReset} style={textButton}>Reset local business demo</button>
      </div>
    </section>
  );
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
      <p style={copyStyle}>These automations are stored with your BizziBuddi account. They do not send emails, messages or external notifications yet.</p>
    </div>
  </section>;
}

function ProductionPanel({ account, jobs, records, onPlans, onSave, onBack }) {
  const available = hasBizzibuddiFeature(account?.plan, "production");
  const stages = ["Not started", "In production", "Quality check", "Ready", "Complete"];
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id || "");
  const [taskDrafts, setTaskDrafts] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selectedJob = jobs.find((job) => job.id === selectedJobId);
  const existing = records.find((record) => record.jobId === selectedJobId);

  useEffect(() => {
    if (!selectedJobId && jobs[0]?.id) setSelectedJobId(jobs[0].id);
  }, [jobs, selectedJobId]);

  useEffect(() => {
    setTaskDrafts(
      (existing?.tasks || []).map((task, index) => ({
        id: String(task.id || "task-" + index + "-" + Date.now()),
        title: String(task.title || "").trim(),
        complete: Boolean(task.complete),
      }))
    );
    setNewTaskTitle("");
  }, [selectedJobId, existing?.id]);

  if (!available) {
    return (
      <section style={cardStyle(720)}>
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
      </section>
    );
  }

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const form = new FormData(event.currentTarget);
      const tasks = taskDrafts
        .map((task) => ({
          id: String(task.id),
          title: String(task.title || "").trim(),
          complete: Boolean(task.complete),
        }))
        .filter((task) => task.title);

      await onSave({
        id: existing?.id || "production-" + Date.now(),
        jobId: selectedJobId,
        jobTitle: selectedJob?.title || "Untitled job",
        stage: String(form.get("stage") || "Not started"),
        dueDate: String(form.get("dueDate") || ""),
        notes: String(form.get("notes") || "").trim(),
        tasks,
        updatedAt: new Date().toISOString(),
      });
    } catch (requestError) {
      setError(requestError.message || "We could not save production progress.");
    } finally {
      setSaving(false);
    }
  }

  function addTask(event) {
    event.preventDefault();
    const title = newTaskTitle.trim();
    if (!title || taskDrafts.length >= 100) return;

    setTaskDrafts((current) => [
      ...current,
      { id: "task-" + Date.now() + "-" + current.length, title, complete: false },
    ]);
    setNewTaskTitle("");
  }

  function toggleTask(taskId) {
    setTaskDrafts((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, complete: !task.complete } : task
      )
    );
  }

  function removeTask(taskId) {
    setTaskDrafts((current) => current.filter((task) => task.id !== taskId));
  }

  const completedTasks = taskDrafts.filter((task) => task.complete).length;
  const taskPercent = taskDrafts.length ? Math.round((completedTasks / taskDrafts.length) * 100) : 0;

  return (
    <section style={cardStyle(940)}>
      <button type="button" onClick={onBack} style={textButton}>← Back to business</button>

      <div style={{ marginTop: 22 }}>
        <p style={eyebrowStyle}>PRODUCTION</p>
        <h2 style={sectionHeading}>Production tracking.</h2>
        <p style={copyStyle}>See where each job is, what needs doing and when the work needs to be ready.</p>
      </div>

      {jobs.length === 0 && (
        <div style={emptyPeople}>
          <strong>Create a job first.</strong>
          <p style={copyStyle}>Production tracking works from your BizziBuddi jobs.</p>
        </div>
      )}

      {jobs.length > 0 && (
        <div>
          <label style={fieldStyle}>
            Job
            <select value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)} style={inputStyle}>
              {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
            </select>
          </label>

          <div style={productionProgress}>
            {stages.map((stage, index) => {
              const currentStage = existing?.stage || "Not started";
              const currentIndex = stages.indexOf(currentStage);

              return (
                <div key={stage} style={productionStage(stage === currentStage, index <= currentIndex)}>
                  <span>{index + 1}</span>
                  <small>{stage}</small>
                </div>
              );
            })}
          </div>

          <div style={productionTaskPanel}>
            <div style={productionTaskHeader}>
              <div>
                <small style={smallText}>TASK PROGRESS</small>
                <strong style={{ display: "block", marginTop: 5, fontSize: 21 }}>
                  {completedTasks}/{taskDrafts.length} complete
                </strong>
              </div>
              <span style={productionTaskPercent}>{taskPercent}%</span>
            </div>

            <div style={{ ...jobProgressTrack, marginTop: 12 }}>
              <div style={{ ...jobProgressFill, width: taskPercent + "%" }} />
            </div>

            {taskDrafts.length > 0 ? (
              <div style={productionTaskList}>
                {taskDrafts.map((task) => (
                  <div key={task.id} style={productionTaskRow(task.complete)}>
                    <label style={productionTaskLabel}>
                      <input
                        type="checkbox"
                        checked={task.complete}
                        onChange={() => toggleTask(task.id)}
                      />
                      <span style={{ textDecoration: task.complete ? "line-through" : "none", opacity: task.complete ? 0.65 : 1 }}>
                        {task.title}
                      </span>
                    </label>
                    <button type="button" onClick={() => removeTask(task.id)} style={smallDangerButton} disabled={saving}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ ...smallText, margin: "14px 0 0" }}>No production tasks yet. Add the work that needs to be completed.</p>
            )}

            <form onSubmit={addTask} style={productionTaskAdd}>
              <input
                value={newTaskTitle}
                onChange={(event) => setNewTaskTitle(event.target.value)}
                placeholder="Add a production task"
                maxLength={200}
                style={inputStyle}
              />
              <button type="submit" disabled={!newTaskTitle.trim() || taskDrafts.length >= 100} style={{ ...secondaryButton, width: "auto", marginTop: 0, opacity: !newTaskTitle.trim() || taskDrafts.length >= 100 ? 0.5 : 1 }}>
                + Add task
              </button>
            </form>
          </div>

          <form onSubmit={handleSave} style={personForm}>
            <strong style={{ fontSize: 18 }}>Update production</strong>

            <label style={fieldStyle}>
              Production stage
              <select required name="stage" defaultValue={existing?.stage || "Not started"} style={inputStyle}>
                {stages.map((stage) => <option key={stage}>{stage}</option>)}
              </select>
            </label>

            <Field name="dueDate" label="Ready by" type="date" defaultValue={existing?.dueDate || ""} />

            <label style={fieldStyle}>
              Production notes
              <textarea
                name="notes"
                defaultValue={existing?.notes || ""}
                placeholder="Optional production notes"
                rows="4"
                maxLength={2000}
                style={{ ...inputStyle, padding: 15, resize: "vertical" }}
              />
            </label>

            <button type="submit" disabled={saving} style={{ ...primaryButton, maxWidth: 260, opacity: saving ? 0.65 : 1 }}>
              {saving ? "Saving…" : "Save production progress"}
            </button>
            {error && <div role="alert" style={{ ...messageStyle, marginTop: 16 }}>{error}</div>}
          </form>
        </div>
      )}

      {records.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <small style={smallText}>TRACKED JOBS</small>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {records.map((record) => {
              const completed = (record.tasks || []).filter((task) => task.complete).length;
              const total = (record.tasks || []).length;

              return (
                <article key={record.id} style={productionRecordCard}>
                  <div>
                    <strong style={{ display: "block", fontSize: 16 }}>{record.jobTitle}</strong>
                    <span style={smallText}>
                      {record.stage}
                      {record.dueDate ? " · Ready " + formatProductionDate(record.dueDate) : ""}
                    </span>
                    {total > 0 && (
                      <span style={{ ...smallText, display: "block", marginTop: 5 }}>
                        Tasks {completed}/{total} complete
                      </span>
                    )}
                  </div>
                  <span style={productionBadge}>{record.stage.toUpperCase()}</span>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
function formatTimelineDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatProductionDate(date) {
  if (!date) return "";
  const value = new Date(date + "T00:00");
  if (Number.isNaN(value.getTime())) return date;
  return value.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function ReportsPanel({ account, onPlans, onBack }) {
  const [reportData, setReportData] = useState(null);
  const [reportError, setReportError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const available = hasBizzibuddiFeature(account?.plan, "reports");

  useEffect(() => {
    if (!available) return undefined;

    let active = true;

    async function loadReports() {
      setLoading(true);
      setReportError("");

      try {
        const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/reports");
        if (!active) return;
        setReportData(result?.reports || null);
      } catch (error) {
        if (!active) return;
        setReportData(null);
        setReportError(
          error instanceof Error ? error.message : "Unable to load reports."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReports();

    return () => {
      active = false;
    };
  }, [account?.id, available]);

  if (!available) {
    return (
      <section style={cardStyle(720)}>
        <button type="button" onClick={onBack} style={textButton}>
          ← Back to business
        </button>

        <div style={{ ...centerStyle, marginTop: 24 }}>
          <p style={eyebrowStyle}>REPORTS</p>
          <h2 style={sectionHeading}>See the bigger picture.</h2>
          <p style={copyStyle}>
            Advanced reporting is included with Business membership. Bring your
            people, jobs, calendar, finance and production activity together in
            one view.
          </p>

          <div style={lockedFeatureCard}>
            <span style={{ fontSize: 26 }}>🔒</span>
            <div>
              <strong style={{ display: "block", fontSize: 18 }}>
                Business advanced reporting
              </strong>
              <p style={{ ...copyStyle, marginBottom: 0 }}>
                Business reporting turns your existing BizziBuddi activity into
                a clearer operating picture.
              </p>
            </div>
          </div>

          <button type="button" onClick={onPlans} style={primaryButton}>
            View membership plans
          </button>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section style={cardStyle(720)}>
        <button type="button" onClick={onBack} style={textButton}>
          ← Back to business
        </button>

        <div style={{ ...centerStyle, marginTop: 24 }}>
          <p style={eyebrowStyle}>REPORTS</p>
          <h2 style={sectionHeading}>Preparing your business report.</h2>
          <p style={copyStyle}>
            BizziBuddi is loading the latest account-backed figures.
          </p>
        </div>
      </section>
    );
  }

  if (reportError || !reportData) {
    return (
      <section style={cardStyle(720)}>
        <button type="button" onClick={onBack} style={textButton}>
          ← Back to business
        </button>

        <div style={{ ...centerStyle, marginTop: 24 }}>
          <p style={eyebrowStyle}>REPORTS</p>
          <h2 style={sectionHeading}>Reports could not be loaded.</h2>
          <p style={copyStyle}>
            {reportError ||
              "No report data was returned by the BizziBuddi server."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={primaryButton}
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  const { jobs, calendar, finance, production, insights } = reportData;
  const jobStatusGroups = jobs.statusGroups || [];
  const productionStageGroups = production.stageGroups || [];

  return (
    <section style={cardStyle(940)}>
      <button type="button" onClick={onBack} style={textButton}>
        ← Back to business
      </button>

      <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: "1 1 520px" }}>
          <p style={eyebrowStyle}>REPORTS</p>
          <h2 style={sectionHeading}>Your business at a glance.</h2>
          <p style={copyStyle}>
            A Business-level view of the activity already captured in BizziBuddi.
            These figures are generated from your account-backed business data.
          </p>
        </div>
        <button type="button" disabled={refreshing} onClick={async () => {
          setRefreshing(true);
          setReportError("");
          try {
            const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/reports");
            setReportData(result?.reports || null);
          } catch (error) {
            setReportError(error instanceof Error ? error.message : "Unable to refresh reports.");
          } finally {
            setRefreshing(false);
          }
        }} style={{ ...smallActionButton, opacity: refreshing ? 0.6 : 1 }}>
          {refreshing ? "Refreshing…" : "↻ Refresh report"}
        </button>
      </div>

      <div style={reportSummaryGrid}>
        <div style={reportSummaryCard}>
          <small style={smallText}>PEOPLE</small>
          <strong style={reportSummaryValue}>{reportData.people.total}</strong>
          <span style={smallText}>contacts</span>
        </div>

        <div style={reportSummaryCard}>
          <small style={smallText}>OPEN JOBS</small>
          <strong style={reportSummaryValue}>{jobs.open}</strong>
          <span style={smallText}>{jobs.completed} completed</span>
        </div>

        <div style={reportSummaryCard}>
          <small style={smallText}>UPCOMING</small>
          <strong style={reportSummaryValue}>{calendar.upcoming}</strong>
          <span style={smallText}>appointments</span>
        </div>

        <div style={reportSummaryCard}>
          <small style={smallText}>OUTSTANDING</small>
          <strong style={reportSummaryValue}>
            {formatCurrency(finance.outstanding)}
          </strong>
          <span style={smallText}>
            {finance.overdueInvoices} overdue
          </span>
        </div>
      </div>

      <div style={{ ...reportSummaryGrid, marginTop: 14 }}>
        <div style={reportSummaryCard}>
          <small style={smallText}>JOB COMPLETION</small>
          <strong style={reportSummaryValue}>{insights?.jobCompletionRate ?? 0}%</strong>
          <span style={smallText}>jobs complete</span>
        </div>
        <div style={reportSummaryCard}>
          <small style={smallText}>PAYMENT COLLECTION</small>
          <strong style={reportSummaryValue}>{insights?.paymentCollectionRate ?? 0}%</strong>
          <span style={smallText}>of invoiced value paid</span>
        </div>
        <div style={reportSummaryCard}>
          <small style={smallText}>PRODUCTION COMPLETION</small>
          <strong style={reportSummaryValue}>{insights?.productionCompletionRate ?? 0}%</strong>
          <span style={smallText}>production records complete</span>
        </div>
        <div style={reportSummaryCard}>
          <small style={smallText}>REPORT GENERATED</small>
          <strong style={{ ...reportSummaryValue, fontSize: 16 }}>{formatTimelineDate(reportData.generatedAt)}</strong>
          <span style={smallText}>account-backed snapshot</span>
        </div>
      </div>

      <div style={reportSectionGrid}>
        <article style={{ ...reportCard, gridColumn: "1 / -1" }}>
          <div style={reportCardHeading}>
            <div>
              <small style={smallText}>FINANCIAL SUMMARY</small>
              <strong style={{ display: "block", marginTop: 5, fontSize: 18 }}>
                Money position
              </strong>
            </div>
            <span style={reportMetric}>
              {formatCurrency(finance.outstanding)}
            </span>
          </div>

          <div style={{ ...reportSummaryGrid, marginTop: 16 }}>
            <div style={reportSummaryCard}>
              <small style={smallText}>INVOICED</small>
              <strong style={reportSummaryValue}>{formatCurrency(finance.totalInvoiced)}</strong>
              <span style={smallText}>{finance.averageInvoice ? formatCurrency(finance.averageInvoice) : "—"} average invoice</span>
            </div>
            <div style={reportSummaryCard}>
              <small style={smallText}>PAID</small>
              <strong style={reportSummaryValue}>{formatCurrency(finance.totalPaid)}</strong>
              <span style={smallText}>{finance.paidInvoiceCount} paid invoice{finance.paidInvoiceCount === 1 ? "" : "s"}</span>
            </div>
            <div style={reportSummaryCard}>
              <small style={smallText}>OUTSTANDING</small>
              <strong style={reportSummaryValue}>{formatCurrency(finance.outstanding)}</strong>
              <span style={smallText}>{finance.outstandingInvoiceCount} open invoice{finance.outstandingInvoiceCount === 1 ? "" : "s"}</span>
            </div>
            <div style={reportSummaryCard}>
              <small style={smallText}>OVERDUE</small>
              <strong style={{ ...reportSummaryValue, color: finance.overdueInvoices ? "#ff8c8c" : TEXT }}>{formatCurrency(finance.overdueAmount)}</strong>
              <span style={smallText}>{finance.overdueInvoices} overdue invoice{finance.overdueInvoices === 1 ? "" : "s"}</span>
            </div>
          </div>

          <div style={{ ...reportRows, marginTop: 18 }}>
            <div style={reportRow}>
              <span>Collection rate</span>
              <strong>{finance.collectionRate}%</strong>
            </div>
            <div style={reportRow}>
              <span>Outstanding balance</span>
              <strong>{formatCurrency(finance.outstanding)}</strong>
            </div>
            <div style={reportRow}>
              <span>Overdue balance</span>
              <strong>{formatCurrency(finance.overdueAmount)}</strong>
            </div>
          </div>
        </article>

        <article style={reportCard}>
          <div style={reportCardHeading}>
            <div>
              <small style={smallText}>JOBS</small>
              <strong style={{ display: "block", marginTop: 5, fontSize: 18 }}>
                Work status
              </strong>
            </div>
            <span style={reportMetric}>{jobs.total}</span>
          </div>

          <div style={reportRows}>
            {jobStatusGroups.map(([label, count]) => (
              <div key={label} style={reportRow}>
                <span>{label}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </article>

        <article style={reportCard}>
          <div style={reportCardHeading}>
            <div>
              <small style={smallText}>CALENDAR</small>
              <strong style={{ display: "block", marginTop: 5, fontSize: 18 }}>
                Scheduled activity
              </strong>
            </div>
            <span style={reportMetric}>{calendar.total}</span>
          </div>

          <div style={reportRows}>
            <div style={reportRow}>
              <span>Total appointments</span>
              <strong>{calendar.total}</strong>
            </div>
            <div style={reportRow}>
              <span>Upcoming</span>
              <strong>{calendar.upcoming}</strong>
            </div>
            <div style={reportRow}>
              <span>Booked / confirmed</span>
              <strong>{calendar.bookedConfirmed}</strong>
            </div>
            <div style={reportRow}>
              <span>Cancelled</span>
              <strong>{calendar.cancelled}</strong>
            </div>
          </div>
        </article>

        <article style={reportCard}>
          <div style={reportCardHeading}>
            <div>
              <small style={smallText}>PRODUCTION</small>
              <strong style={{ display: "block", marginTop: 5, fontSize: 18 }}>
                Production status
              </strong>
            </div>
            <span style={reportMetric}>{production.total}</span>
          </div>

          <div style={reportRows}>
            <div style={reportRow}>
              <span>Active</span>
              <strong>{production.active}</strong>
            </div>
            <div style={reportRow}>
              <span>Complete</span>
              <strong>{production.complete}</strong>
            </div>

            {productionStageGroups
              .filter(([, count]) => count > 0)
              .map(([stage, count]) => (
                <div key={stage} style={reportRow}>
                  <span>{stage}</span>
                  <strong>{count}</strong>
                </div>
              ))}

            {production.total === 0 && (
              <div style={reportRow}>
                <span>No production records yet</span>
                <strong>—</strong>
              </div>
            )}
          </div>
        </article>
      </div>

      <div style={businessNote}>
        <strong>Advanced reporting</strong>
        <p style={copyStyle}>
          These figures are generated on the BizziBuddi server from your
          account-backed people, jobs, calendar, finance and production data.
        </p>
      </div>
    </section>
  );
}

function FinancePanel({ account, invoices, people, onPlans, onAddInvoice, onMarkPaid, onBack }) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const available = hasBizzibuddiFeature(account?.plan, "finance");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const personId = String(form.get("personId") || "");
    const amount = Number(form.get("amount") || 0);

    try {
      await onAddInvoice({
        personId,
        amount: Number.isFinite(amount) ? amount : 0,
        issueDate: String(form.get("issueDate") || ""),
        dueDate: String(form.get("dueDate") || ""),
      });

      formElement.reset();
      setShowForm(false);
    } catch (requestError) {
      setError(requestError.message || "We could not save this invoice.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkPaid(invoice) {
    setError("");
    setSaving(true);

    try {
      await onMarkPaid(invoice.id);
    } catch (requestError) {
      setError(requestError.message || "We could not record this payment.");
    } finally {
      setSaving(false);
    }
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
            <p style={{ ...copyStyle, marginBottom: 0 }}>Upgrade your membership preview to explore invoice and payment management.</p>
          </div>
        </div>
        <button type="button" onClick={onPlans} style={{ ...primaryButton, maxWidth: 260 }}>View membership plans</button>
      </div>
    </section>;
  }

  const outstanding = invoices.reduce(
    (sum, invoice) => sum + Math.max(0, Number(invoice.balance ?? (invoice.amount - (invoice.amountPaid || 0))) || 0),
    0
  );
  const paidCount = invoices.filter((invoice) => invoice.status === "Paid").length;
  const todayKey = new Date().toISOString().slice(0, 10);
  const overdueInvoices = invoices.filter((invoice) => invoice.status !== "Paid" && invoice.dueDate && invoice.dueDate < todayKey);
  const dueSoonInvoices = invoices.filter((invoice) => {
    if (invoice.status === "Paid" || !invoice.dueDate) return false;
    const due = new Date(invoice.dueDate + "T00:00:00");
    const today = new Date(todayKey + "T00:00:00");
    const days = Math.ceil((due - today) / 86400000);
    return days >= 0 && days <= 7;
  });

  return <section style={cardStyle(940)}>
    <button type="button" onClick={onBack} style={textButton}>← Back to business</button>
    <div style={{ marginTop: 22 }}>
      <p style={eyebrowStyle}>FINANCE</p>
      <h2 style={sectionHeading}>Your finances.</h2>
      <p style={copyStyle}>Create invoices and keep track of what has been paid. Your financial records are now stored with your BizziBuddi account.</p>
    </div>

    <div style={financeSummary}>
      <div>
        <small style={smallText}>OUTSTANDING</small>
        <strong style={{ display: "block", marginTop: 7, fontSize: 24 }}>{formatCurrency(outstanding)}</strong>
      </div>
      <div>
        <small style={smallText}>INVOICES</small>
        <strong style={{ display: "block", marginTop: 7, fontSize: 24 }}>{invoices.length}</strong>
      </div>
      <div>
        <small style={smallText}>PAID</small>
        <strong style={{ display: "block", marginTop: 7, fontSize: 24 }}>{paidCount}</strong>
      </div>
      <div>
        <small style={smallText}>OVERDUE</small>
        <strong style={{ display: "block", marginTop: 7, fontSize: 24, color: overdueInvoices.length ? "#ff8c8c" : TEXT }}>{overdueInvoices.length}</strong>
      </div>
      <div>
        <small style={smallText}>DUE WITHIN 7 DAYS</small>
        <strong style={{ display: "block", marginTop: 7, fontSize: 24, color: dueSoonInvoices.length ? "#f6c453" : TEXT }}>{dueSoonInvoices.length}</strong>
      </div>
    </div>

    {error && <div role="alert" style={{ ...messageStyle, marginTop: 18 }}>{error}</div>}

    {invoices.length > 0 ? (
      <div style={{ display: "grid", gap: 12, marginTop: 28 }}>
        {invoices.map((invoice) => {
          const balance = Math.max(
            0,
            Number(invoice.balance ?? (invoice.amount - (invoice.amountPaid || 0))) || 0
          );

          return <article key={invoice.id} style={invoiceCard}>
            <div>
              <strong style={{ display: "block", fontSize: 17 }}>{invoice.number}</strong>
              <span style={smallText}>
                {invoice.personName} · Due {formatInvoiceDate(invoice.dueDate)}
              </span>
              <span style={{ ...smallText, display: "block", marginTop: 4 }}>
                Issued {formatInvoiceDate(invoice.issueDate)}
              </span>
              {invoice.status !== "Paid" && (
                <span style={invoiceDueSignal(invoice, todayKey)}>
                  {invoice.status === "Overdue"
                    ? "Payment overdue"
                    : invoice.dueDate === todayKey
                      ? "Due today"
                      : "Due soon"}
                </span>
              )}
            </div>
            <div style={invoiceMeta}>
              <strong>{formatCurrency(invoice.amount)}</strong>
              <span style={invoiceStatus(invoice.status)}>{invoice.status}</span>
              {invoice.status !== "Paid" && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleMarkPaid(invoice)}
                  style={{ ...smallActionButton, opacity: saving ? 0.6 : 1 }}
                >
                  Mark paid
                </button>
              )}
              {balance > 0 && <small style={smallText}>Balance {formatCurrency(balance)}</small>}
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
      <button type="button" onClick={() => { setError(""); setShowForm(true); }} style={{ ...primaryButton, maxWidth: 240 }}>
        + Create an invoice
      </button>
    ) : (
      <form onSubmit={handleSubmit} style={personForm}>
        <strong style={{ fontSize: 18 }}>Create an invoice</strong>

        <label style={fieldStyle}>
          Client
          <select required name="personId" defaultValue="" style={inputStyle}>
            <option value="" disabled>Select a person</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>{person.name}</option>
            ))}
            {people.length === 0 && <option value="" disabled>Add a person first</option>}
          </select>
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <Field name="amount" label="Amount" type="number" placeholder="0.00" required />
          <Field name="issueDate" label="Issue date" type="date" required />
          <Field name="dueDate" label="Due date" type="date" required />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
          <button
            type="submit"
            disabled={people.length === 0 || saving}
            style={{ ...primaryButton, width: "auto", marginTop: 0, opacity: people.length === 0 || saving ? 0.5 : 1 }}
          >
            {saving ? "Saving…" : "Save invoice"}
          </button>
          <button
            type="button"
            onClick={() => { setError(""); setShowForm(false); }}
            disabled={saving}
            style={{ ...secondaryButton, width: "auto", marginTop: 0 }}
          >
            Cancel
          </button>
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

function CalendarPanel({
  appointments,
  people,
  jobs,
  account,
  productionRecords,
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
  onBack,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [calendarFilter, setCalendarFilter] = useState("upcoming");
  const [showCalendarSearch, setShowCalendarSearch] = useState(false);
  const [calendarSearch, setCalendarSearch] = useState("");
  const [calendarType, setCalendarType] = useState("all");
  const advancedScheduling = hasBizzibuddiFeature(account?.plan, "advancedScheduling");
  const calendarTodayKey = new Date().toISOString().slice(0, 10);
  const sortedAppointments = [...appointments].sort((a, b) => {
    const aKey = String(a.date || "") + "T" + String(a.time || "00:00");
    const bKey = String(b.date || "") + "T" + String(b.time || "00:00");
    return aKey.localeCompare(bKey);
  });
  const visibleAppointments = sortedAppointments.filter((appointment) => {
    if (calendarFilter === "today" && appointment.date !== calendarTodayKey) return false;
    if (calendarFilter === "past" && !(appointment.date && appointment.date < calendarTodayKey)) return false;
    if (calendarFilter === "upcoming" && appointment.date && appointment.date < calendarTodayKey) return false;
    if (calendarType !== "all" && String(appointment.status || "Booked") !== calendarType) return false;
    const query = calendarSearch.trim().toLowerCase();
    if (query) {
      const haystack = [appointment.title, appointment.personName, appointment.jobTitle, appointment.notes]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
  const appointmentTypes = ["all", "Booked", "Confirmed", "Pending", "Cancelled"];
  const calendarCounts = {
    today: appointments.filter((appointment) => appointment.date === calendarTodayKey).length,
    upcoming: appointments.filter((appointment) => !appointment.date || appointment.date >= calendarTodayKey).length,
    past: appointments.filter((appointment) => appointment.date && appointment.date < calendarTodayKey).length,
  };
  const scheduledProduction = (productionRecords || [])
    .filter((record) => record.dueDate)
    .map((record) => ({
      ...record,
      dueDateValue: String(record.dueDate),
    }))
    .sort((a, b) => a.dueDateValue.localeCompare(b.dueDateValue));
  const productionSchedule = scheduledProduction.filter((record) => record.dueDateValue >= calendarTodayKey).slice(0, 6);

  function startAdd() {
    setError("");
    setEditingAppointment(null);
    setShowForm(true);
  }

  function startEdit(appointment) {
    setError("");
    setEditingAppointment(appointment);
    setShowForm(true);
  }

  function cancelForm() {
    setError("");
    setEditingAppointment(null);
    setShowForm(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      const appointment = {
        title: String(form.get("title") || "").trim(),
        date: String(form.get("date") || ""),
        time: String(form.get("time") || ""),
        personId: String(form.get("personId") || ""),
        jobId: String(form.get("jobId") || ""),
        notes: String(form.get("notes") || "").trim(),
        duration: advancedScheduling ? Number(form.get("duration") || 60) : 60,
        buffer: advancedScheduling ? Number(form.get("buffer") || 0) : 0,
        status: advancedScheduling ? String(form.get("status") || "Booked") : "Booked",
      };

      if (editingAppointment) {
        await onUpdateAppointment(editingAppointment.id, appointment);
      } else {
        await onAddAppointment(appointment);
      }

      formElement.reset();
      setEditingAppointment(null);
      setShowForm(false);
    } catch (requestError) {
      setError(requestError.message || "We could not save this appointment.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(appointment) {
    if (!window.confirm("Delete " + appointment.title + "? This will permanently remove this calendar entry.")) {
      return;
    }

    setError("");
    try {
      await onDeleteAppointment(appointment.id);
    } catch (requestError) {
      setError(requestError.message || "We could not delete this appointment.");
    }
  }

  return <section style={cardStyle(940)}>
    <button type="button" onClick={onBack} style={textButton}>← Back to business</button>
    <div style={{ marginTop: 22 }}>
      <p style={eyebrowStyle}>CALENDAR</p>
      <h2 style={sectionHeading}>Your calendar.</h2>
      <p style={copyStyle}>Keep appointments, fittings, meetings and important business dates organised.</p>
      {advancedScheduling && (
        <div style={schedulingSummary}>
          <span>
            <strong>Advanced scheduling</strong>
            <small>Duration, buffer time and appointment status are enabled.</small>
          </span>
          <span style={advancedBadge}>PROFESSIONAL</span>
        </div>
      )}
    </div>

    {productionSchedule.length > 0 && (
      <div style={{ ...todayViewPanel, marginTop: 18 }}>
        <div style={todayViewHeader}>
          <div>
            <small style={smallText}>GARMENT SCHEDULE</small>
            <h3 style={{ margin: "6px 0 5px", fontSize: 20 }}>Production ready-by dates.</h3>
            <p style={{ ...copyStyle, margin: 0 }}>Upcoming production deadlines alongside your appointments.</p>
          </div>
          <span style={todayViewDate}>{productionSchedule.length} scheduled</span>
        </div>
        <div style={{ display: "grid", gap: 9, marginTop: 14 }}>
          {productionSchedule.map((record) => (
            <article key={record.id} style={todayViewItem}>
              <strong>{record.jobTitle || "Production job"}</strong>
              <span style={{ ...smallText, marginTop: 3 }}>
                Ready by {formatProductionDate(record.dueDateValue)} · {record.stage || "Not started"}
              </span>
            </article>
          ))}
        </div>
      </div>
    )}

    {appointments.length > 0 ? (
      <>
        <div style={{ ...todayViewPanel, marginTop: 24 }}>
          <div style={todayViewHeader}>
            <div>
              <small style={smallText}>CALENDAR VIEW</small>
              <h3 style={{ margin: "6px 0 5px", fontSize: 20 }}>See what is coming up.</h3>
              <p style={{ ...copyStyle, margin: 0 }}>Appointments are sorted by date and time so the next work is always easy to find.</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {[
                ["upcoming", "Upcoming", calendarCounts.upcoming],
                ["today", "Today", calendarCounts.today],
                ["past", "Past", calendarCounts.past],
                ["all", "All", appointments.length],
              ].map(([value, label, count]) => (

                <button
                  key={value}
                  type="button"
                  onClick={() => setCalendarFilter(value)}
                  style={calendarFilter === value ? smallActionButton : secondaryButton}
                >
                  {label} · {count}
                </button>
              ))}
              <button type="button" onClick={() => setShowCalendarSearch((current) => !current)} style={showCalendarSearch ? smallActionButton : secondaryButton}>
                🔎 Search
              </button>
            </div>
          </div>
          {showCalendarSearch && (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) minmax(160px, 220px)", gap: 10, marginTop: 16 }}>
              <input
                value={calendarSearch}
                onChange={(event) => setCalendarSearch(event.target.value)}
                placeholder="Search appointments, people or jobs"
                style={inputStyle}
              />
              <select value={calendarType} onChange={(event) => setCalendarType(event.target.value)} style={inputStyle}>
                {appointmentTypes.map((type) => (
                  <option key={type} value={type}>{type === "all" ? "All statuses" : type}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        {visibleAppointments.length > 0 ? (
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {visibleAppointments.map((appointment) => (
          <article key={appointment.id} style={appointmentCard}>
            <div style={{ minWidth: 0 }}>
              <strong style={{ display: "block", fontSize: 17 }}>{appointment.title}</strong>
              <span style={smallText}>
                {formatAppointmentDate(appointment.date, appointment.time)}
                {appointment.personName ? " · " + appointment.personName : ""}
                {appointment.jobTitle ? " · " + appointment.jobTitle : ""}
              </span>
              {appointment.notes && (
                <span style={{ ...smallText, display: "block", marginTop: 5 }}>
                  {appointment.notes}
                </span>
              )}
              {advancedScheduling && (
                <span style={{ ...smallText, display: "block", marginTop: 5 }}>
                  {(appointment.duration || 60) + " min"}
                  {appointment.buffer ? " · " + appointment.buffer + " min buffer" : ""}
                  {" · " + (appointment.status || "Booked")}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => startEdit(appointment)} style={smallActionButton}>Edit</button>
              <button type="button" onClick={() => handleDelete(appointment)} style={smallDangerButton}>Delete</button>
            </div>
            </article>
            ))}
          </div>
        ) : (
          <div style={{ ...emptyPeople, marginTop: 16 }}>
            <strong>No appointments in this view.</strong>
            <p style={copyStyle}>Try another calendar filter or add a new appointment.</p>
          </div>
        )}
      </>
    ) : (
      <div style={emptyPeople}>
        <strong>No appointments yet.</strong>
        <p style={copyStyle}>Add your first appointment to start using the BizziBuddi calendar.</p>
      </div>
    )}

    {error && <div role="alert" style={{ ...messageStyle, marginTop: 18 }}>{error}</div>}

    {!showForm ? (
      <button type="button" onClick={startAdd} style={{ ...primaryButton, maxWidth: 260 }}>+ Add an appointment</button>
    ) : (
      <form key={editingAppointment?.id || "new-appointment"} onSubmit={handleSubmit} style={personForm}>
        <strong style={{ fontSize: 18 }}>{editingAppointment ? "Edit appointment" : "Add an appointment"}</strong>
        <Field name="title" label="Appointment" type="text" placeholder="e.g. Client fitting" defaultValue={editingAppointment?.title || ""} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <Field name="date" label="Date" type="date" required defaultValue={editingAppointment?.date || ""} />
          <Field name="time" label="Time" type="time" required defaultValue={editingAppointment?.time || ""} />
        </div>
        <label style={fieldStyle}>
          Person
          <select name="personId" defaultValue={editingAppointment?.personId || ""} style={inputStyle}>
            <option value="">No person linked</option>
            {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
        </label>
        <label style={fieldStyle}>
          Job
          <select name="jobId" defaultValue={editingAppointment?.jobId || ""} style={inputStyle}>
            <option value="">No job linked</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}{job.clientName ? " — " + job.clientName : ""}
              </option>
            ))}
          </select>
        </label>
        {advancedScheduling && (
          <div style={advancedScheduleFields}>
            <Field name="duration" label="Duration (minutes)" type="number" placeholder="60" defaultValue={String(editingAppointment?.duration || 60)} />
            <Field name="buffer" label="Buffer after (minutes)" type="number" placeholder="0" defaultValue={String(editingAppointment?.buffer || 0)} />
            <label style={fieldStyle}>
              Status
              <select name="status" defaultValue={editingAppointment?.status || "Booked"} style={inputStyle}>
                <option>Booked</option>
                <option>Confirmed</option>
                <option>Pending</option>
                <option>Cancelled</option>
              </select>
            </label>
          </div>
        )}
        <Field name="notes" label="Notes" type="text" placeholder="Optional notes" defaultValue={editingAppointment?.notes || ""} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
          <button type="submit" disabled={saving} style={{ ...primaryButton, width: "auto", marginTop: 0, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : editingAppointment ? "Save changes" : "Save appointment"}
          </button>
          <button type="button" onClick={cancelForm} disabled={saving} style={{ ...secondaryButton, width: "auto", marginTop: 0 }}>
            Cancel
          </button>
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

function HelpSupportPanel({
  onBuddi,
  onDashboard,
  onPeople,
  onJobs,
  onCalendar,
  onFinance,
  onAutomation,
  onProduction,
  onReports,
}) {
  const [showGettingStarted, setShowGettingStarted] = useState(false);
  const [showFeatureGuides, setShowFeatureGuides] = useState(false);
  const [showFaqs, setShowFaqs] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const [activeFeatureGuide, setActiveFeatureGuide] = useState("people");
  const [activeFaq, setActiveFaq] = useState(null);
  const gettingStartedRef = useRef(null);
  const featureGuidesRef = useRef(null);
  const faqRef = useRef(null);
  const contactSupportRef = useRef(null);

  useEffect(() => {
    if (!showGettingStarted || !gettingStartedRef.current) return undefined;

    const frame = window.requestAnimationFrame(() => {
      gettingStartedRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [showGettingStarted]);

  useEffect(() => {
    if (!showFeatureGuides || !featureGuidesRef.current) return undefined;

    const frame = window.requestAnimationFrame(() => {
      featureGuidesRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [showFeatureGuides]);

  useEffect(() => {
    if (!showFaqs || !faqRef.current) return undefined;

    const frame = window.requestAnimationFrame(() => {
      faqRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [showFaqs]);
  useEffect(() => {
    if (!showContactSupport || !contactSupportRef.current) return undefined;

    const frame = window.requestAnimationFrame(() => {
      contactSupportRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [showContactSupport]);

  const helpItems = [
    {
      icon: "🤖",
      title: "Ask Buddi",
      description: "Get help understanding your people, jobs, calendar, money and business activity.",
      action: "Ask Buddi →",
      onClick: onBuddi,
      featured: true,
    },
    {
      icon: "🚀",
      title: "Getting started",
      description: "Follow a simple path from business setup to your first people, jobs and appointments.",
      action: showGettingStarted ? "Hide guide" : "Start the guide →",
      onClick: () => setShowGettingStarted((current) => !current),
      featured: false,
    },
    {
      icon: "🧭",
      title: "Feature guides",
      description: "Explore People, Jobs, Calendar, Finance, Automation, Production and Reports.",
      action: showFeatureGuides ? "Hide guides" : "Explore features →",
      onClick: () => setShowFeatureGuides((current) => !current),
      featured: false,
    },
    {
      icon: "❓",
      title: "Frequently asked questions",
      description: "Find quick answers about accounts, memberships, data and how BizziBuddi works.",
      action: showFaqs ? "Hide FAQs" : "View FAQs →",
      onClick: () => setShowFaqs((current) => !current),
    },
    {
      icon: "✉️",
      title: "Contact support",
      description: "Need a hand with something specific? Tell us what you need and keep your support request organised.",
      action: showContactSupport ? "Hide support form" : "Contact support →",
      onClick: () => {
        setSupportSubmitted(false);
        setShowContactSupport((current) => !current);
      },
    },
  ];

  const gettingStartedItems = [
    {
      number: "01",
      title: "Set up your business",
      description: "Give BizziBuddi your business name so your account is ready to use.",
      action: "Go to dashboard",
      onClick: onDashboard,
    },
    {
      number: "02",
      title: "Add your people",
      description: "Start building your business records with the people and clients you work with.",
      action: "Add people",
      onClick: onPeople,
    },
    {
      number: "03",
      title: "Create your first job",
      description: "Turn your work into something you can track from start to completion.",
      action: "Create a job",
      onClick: onJobs,
    },
    {
      number: "04",
      title: "Add your calendar",
      description: "Keep appointments, bookings and important dates in one place.",
      action: "Open calendar",
      onClick: onCalendar,
    },
    {
      number: "05",
      title: "Ask Buddi",
      description: "Once your business has some information in it, ask Buddi what needs attention.",
      action: "Ask Buddi",
      onClick: onBuddi,
    },
  ];

  const featureGuideItems = [
    {
      id: "people",
      number: "01",
      title: "People",
      icon: "👥",
      summary: "Keep the people and clients connected to your business organised in one place.",
      details: "Store names, contact details and business relationships so you can quickly find the people you work with and connect them to jobs and appointments.",
      steps: ["Add a person or client.", "Keep their contact information up to date.", "Use their record when creating jobs and appointments."],
      action: "Open People",
      onClick: onPeople,
    },
    {
      id: "jobs",
      number: "02",
      title: "Jobs",
      icon: "📋",
      summary: "Turn your work into trackable jobs from the first conversation through to completion.",
      details: "Create jobs, assign them to people and keep the current status visible so you always know what work is new, underway, waiting or complete.",
      steps: ["Create a job and choose the person it belongs to.", "Update the job status as work progresses.", "Use the job record as your central place for the work."],
      action: "Open Jobs",
      onClick: onJobs,
    },
    {
      id: "calendar",
      number: "03",
      title: "Calendar",
      icon: "📅",
      summary: "Keep appointments, bookings and important dates together with your business activity.",
      details: "Use the calendar to see upcoming appointments and keep your schedule connected to the people and jobs you are working with.",
      steps: ["Add an appointment with a date and time.", "Link it to a person when useful.", "Use the calendar to see what is coming up."],
      action: "Open Calendar",
      onClick: onCalendar,
    },
    {
      id: "finance",
      number: "04",
      title: "Finance",
      icon: "💳",
      summary: "Keep invoices, payments and outstanding money visible as your business grows.",
      details: "Finance gives you a simple view of invoices and payment status, helping you see what has been issued, what has been paid and what remains outstanding.",
      steps: ["Create an invoice for a person or client.", "Track its payment status.", "Use the finance summary to keep an eye on outstanding amounts."],
      action: "Open Finance",
      onClick: onFinance,
    },
    {
      id: "automation",
      number: "05",
      title: "Automation",
      icon: "⚡",
      summary: "Let BizziBuddi prepare useful business follow-ups and surface things that need attention.",
      details: "Automation helps reduce repetitive checking by preparing appointment reminders and identifying items such as overdue invoices that may need your attention.",
      steps: ["Create appointments that can generate reminder events.", "Run an automation check when you want to review business activity.", "Review the event history and follow up where needed."],
      action: "Open Automation",
      onClick: onAutomation,
    },
    {
      id: "production",
      number: "06",
      title: "Production",
      icon: "🏭",
      summary: "Track work through production stages so you can see what is being made and what is ready.",
      details: "Production tracking gives you a clear stage-by-stage view of work, including readiness dates, notes and tasks.",
      steps: ["Create a production record for a job.", "Move work through the production stages.", "Use tasks, notes and ready-by dates to keep production moving."],
      action: "Open Production",
      onClick: onProduction,
    },
    {
      id: "reports",
      number: "07",
      title: "Reports",
      icon: "📊",
      summary: "Bring your business information together so you can see how things are tracking.",
      details: "Reports turns your BizziBuddi information into a business-at-a-glance view covering people, jobs, calendar activity, finance and production.",
      steps: ["Review the business summary.", "Check finance, jobs and calendar activity.", "Use production information to understand work in progress."],
      action: "Open Reports",
      onClick: onReports,
    },
  ];

  const faqItems = [
    {
      question: "What is BizziBuddi?",
      answer: "BizziBuddi is a business management platform designed to keep the important parts of your business together — people, jobs, calendar, finance, automation, production and reporting.",
    },
    {
      question: "Which membership includes each feature?",
      answer: "Free includes People & contacts, Basic jobs, Calendar and the Dashboard. Professional adds Advanced scheduling, Payments & invoices and Automation. Business adds Production tracking, Advanced reporting and additional business controls.",
    },
    {
      question: "Can I start with the Free membership?",
      answer: "Yes. The Free membership is designed as a starting point for independent operators. You can begin with your people, basic jobs, calendar and dashboard before deciding whether you need additional features.",
    },
    {
      question: "What happens when I create a person or client?",
      answer: "The person is added to your BizziBuddi business records so you can use that information when working with jobs and appointments. Keeping the record current helps the rest of BizziBuddi stay connected.",
    },
    {
      question: "How do Jobs and People work together?",
      answer: "A job is connected to the person or client it belongs to. This gives you a clearer picture of who the work is for and lets you manage the work and its status from the Jobs area.",
    },
    {
      question: "What can I use the Calendar for?",
      answer: "Use Calendar for appointments, bookings and important dates. Depending on your membership, additional scheduling information such as duration, buffer and booking status can also be used.",
    },
    {
      question: "What does Buddi know about my business?",
      answer: "Buddi can use the business information available to the assistant, including people, jobs, calendar activity, finance information, automation events and production records. Buddi is there to help you understand what is happening; you remain in control of your business decisions.",
    },
    {
      question: "Can I change my membership later?",
      answer: "Yes. BizziBuddi is structured so you can start with the membership that suits your needs and move to a membership with more functionality when you need it.",
    },
    {
      question: "Where should I start if I'm new to BizziBuddi?",
      answer: "Start with Getting started in this Help Centre. The five-step guide takes you through your business setup, people, first job, calendar and then Buddi.",
    },
    {
      question: "Where can I get help if my question isn't answered here?",
      answer: "Ask Buddi first for help understanding your business and how BizziBuddi works. If you need assistance with something specific that is not covered here, use the Contact support option in this Help Centre.",
    },
  ];

  const activeGuide = featureGuideItems.find((guide) => guide.id === activeFeatureGuide) || featureGuideItems[0];

  return (
    <section style={cardStyle(940)}>
      <div style={helpHero}>
        <div style={helpIcon}>
          <span>?</span>
        </div>
        <div>
          <p style={eyebrowStyle}>HELP & SUPPORT</p>
          <h2 style={sectionHeading}>How can we help?</h2>
          <p style={{ ...copyStyle, maxWidth: 650, margin: "0 auto" }}>
            Get answers, learn how BizziBuddi works, or ask Buddi about what is happening in your business.
          </p>
        </div>
      </div>

      <div style={helpGrid}>
        {helpItems.map((item) => (
          <article key={item.title} style={helpCard(item.featured)}>
            <div style={helpCardIcon}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", fontSize: 18 }}>{item.title}</strong>
              <p style={{ ...copyStyle, margin: "8px 0 18px" }}>{item.description}</p>
              <button
                type="button"
                onClick={item.onClick}
                disabled={!item.onClick}
                style={item.onClick ? helpPrimaryButton : helpSecondaryButton}
              >
                {item.action}
              </button>
            </div>
          </article>
        ))}
      </div>

      {showGettingStarted && (
        <div ref={gettingStartedRef} style={gettingStartedPanel}>
          <div style={gettingStartedIntro}>
            <div>
              <small style={smallText}>BIZZIBUDDI QUICK START</small>
              <h3 style={{ margin: "7px 0 6px", fontSize: 26 }}>Your first five steps.</h3>
              <p style={{ ...copyStyle, margin: 0 }}>
                You don't need to learn everything at once. Start here, add a little information, and let BizziBuddi grow with your business.
              </p>
            </div>
            <button type="button" onClick={() => setShowGettingStarted(false)} style={helpCloseButton} aria-label="Close getting started guide">×</button>
          </div>

          <div style={gettingStartedStepsStyle}>
            {gettingStartedItems.map((step, index) => (
              <article key={step.number} style={gettingStartedStep}>
                <div style={gettingStartedNumber}>{step.number}</div>
                <div style={{ flex: 1 }}>
                  <strong style={{ display: "block", fontSize: 17 }}>{step.title}</strong>
                  <p style={{ ...copyStyle, margin: "6px 0 14px" }}>{step.description}</p>
                  <button type="button" onClick={step.onClick} style={helpSecondaryButton}>
                    {step.action} →
                  </button>
                </div>
                {index < gettingStartedItems.length - 1 && <div style={gettingStartedConnector} aria-hidden="true" />}
              </article>
            ))}
          </div>
        </div>
      )}

      {showFeatureGuides && (
        <div ref={featureGuidesRef} style={featureGuidesPanel}>
          <div style={gettingStartedIntro}>
            <div>
              <small style={smallText}>BIZZIBUDDI FEATURE GUIDES</small>
              <h3 style={{ margin: "7px 0 6px", fontSize: 26 }}>Understand each part of your business.</h3>
              <p style={{ ...copyStyle, margin: 0 }}>
                Choose a feature below to see what it does, how to use it and where it fits into your day-to-day business.
              </p>
            </div>
            <button type="button" onClick={() => setShowFeatureGuides(false)} style={helpCloseButton} aria-label="Close feature guides">×</button>
          </div>

          <div style={featureGuideTabs}>
            {featureGuideItems.map((guide) => (
              <button
                key={guide.id}
                type="button"
                onClick={() => setActiveFeatureGuide(guide.id)}
                style={featureGuideTab(activeFeatureGuide === guide.id)}
              >
                <span style={featureGuideTabNumber}>{guide.number}</span>
                <span>{guide.icon} {guide.title}</span>
              </button>
            ))}
          </div>

          <article style={featureGuideDetail}>
            <div style={featureGuideDetailHeader}>
              <div style={helpCardIcon}>{activeGuide.icon}</div>
              <div>
                <small style={smallText}>FEATURE {activeGuide.number}</small>
                <h4 style={{ margin: "5px 0 6px", fontSize: 23 }}>{activeGuide.title}</h4>
                <p style={{ ...copyStyle, margin: 0 }}>{activeGuide.summary}</p>
              </div>
            </div>

            <p style={{ ...copyStyle, margin: "20px 0 0" }}>{activeGuide.details}</p>

            <div style={featureGuideSteps}>
              {activeGuide.steps.map((step, index) => (
                <div key={step} style={featureGuideStep}>
                  <span style={featureGuideStepNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>

            <button type="button" onClick={activeGuide.onClick} style={helpPrimaryButton}>
              {activeGuide.action} →
            </button>
          </article>
        </div>
      )}

      {showFaqs && (
        <div ref={faqRef} style={faqPanel}>
          <div style={gettingStartedIntro}>
            <div>
              <small style={smallText}>BIZZIBUDDI FAQ</small>
              <h3 style={{ margin: "7px 0 6px", fontSize: 26 }}>Frequently asked questions.</h3>
              <p style={{ ...copyStyle, margin: 0 }}>
                Quick answers to the questions you're most likely to have while getting started with BizziBuddi.
              </p>
            </div>
            <button type="button" onClick={() => setShowFaqs(false)} style={helpCloseButton} aria-label="Close frequently asked questions">×</button>
          </div>

          <div style={faqList}>
            {faqItems.map((item, index) => {
              const isOpen = activeFaq === index;

              return (
                <article key={item.question} style={faqItem}>
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    style={faqQuestion}
                    aria-expanded={isOpen}
                  >
                    <span>{item.question}</span>
                    <span style={faqQuestionIcon}>{isOpen ? "−" : "+"}</span>
                  </button>

                  {isOpen && (
                    <div style={faqAnswer}>
                      <p style={{ ...copyStyle, margin: 0 }}>{item.answer}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}

      {showContactSupport && (
        <div ref={contactSupportRef} style={supportPanel}>
          <div style={gettingStartedIntro}>
            <div>
              <small style={smallText}>BIZZIBUDDI SUPPORT</small>
              <h3 style={{ margin: "7px 0 6px", fontSize: 26 }}>How can we help?</h3>
              <p style={{ ...copyStyle, margin: 0 }}>
                Tell us what you need help with. In this local preview, your request is saved in this browser so you can test the support experience.
              </p>
            </div>
            <button type="button" onClick={() => setShowContactSupport(false)} style={helpCloseButton} aria-label="Close contact support">×</button>
          </div>

          {supportSubmitted ? (
            <div style={supportConfirmation}>
              <div style={supportConfirmationIcon}>✓</div>
              <div>
                <strong style={{ display: "block", fontSize: 18 }}>Support request saved.</strong>
                <p style={{ ...copyStyle, margin: "6px 0 0" }}>
                  Your request has been saved locally in this demo environment. When BizziBuddi is connected to its support service, this form can send the request directly to the support team.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSupportSubmitted(false)}
                style={helpSecondaryButton}
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const request = {
                  id: `support-${Date.now()}`,
                  category: String(form.get("category") || ""),
                  subject: String(form.get("subject") || "").trim(),
                  message: String(form.get("message") || "").trim(),
                  name: String(form.get("name") || "").trim(),
                  email: String(form.get("email") || "").trim(),
                  createdAt: new Date().toISOString(),
                };

                const existing = JSON.parse(localStorage.getItem("bizzibuddiMockSupportRequests") || "[]");
                localStorage.setItem(
                  "bizzibuddiMockSupportRequests",
                  JSON.stringify([...existing, request])
                );
                setSupportSubmitted(true);
              }}
              style={supportForm}
            >
              <label style={fieldStyle}>
                What do you need help with?
                <select name="category" defaultValue="General help" style={inputStyle} required>
                  <option>General help</option>
                  <option>Account & membership</option>
                  <option>People & clients</option>
                  <option>Jobs</option>
                  <option>Calendar</option>
                  <option>Finance</option>
                  <option>Automation</option>
                  <option>Production</option>
                  <option>Reports</option>
                  <option>Buddi</option>
                </select>
              </label>

              <label style={fieldStyle}>
                Subject
                <input name="subject" type="text" placeholder="Briefly describe the issue" style={inputStyle} required />
              </label>

              <label style={fieldStyle}>
                Your message
                <textarea
                  name="message"
                  placeholder="Tell us what is happening and what you need help with..."
                  style={supportTextarea}
                  required
                />
              </label>

              <div style={supportFormGrid}>
                <label style={fieldStyle}>
                  Your name
                  <input name="name" type="text" placeholder="Your name" style={inputStyle} required />
                </label>
                <label style={fieldStyle}>
                  Email address
                  <input name="email" type="email" placeholder="you@example.com" style={inputStyle} required />
                </label>
              </div>

              <button type="submit" style={helpPrimaryButton}>
                Save support request →
              </button>
            </form>
          )}
        </div>
      )}

      <div style={helpTip}>
        <BizziBuddiLogo size={30} showWordmark={false} />
        <div>
          <strong style={{ display: "block" }}>Buddi is always close by.</strong>
          <span style={smallText}>Use the floating Ask Buddi button whenever you want help without leaving what you're working on.</span>
        </div>
      </div>
    </section>
  );
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


const buddiFloatingButton = {
  position: "fixed",
  right: 24,
  bottom: 24,
  zIndex: 1200,
  minWidth: 144,
  height: 58,
  padding: "0 18px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 9,
  border: "2px solid #FFFFFF",
  borderRadius: 30,
  background: "linear-gradient(135deg, #0F2D4A 0%, #2563EB 72%, #00B4DB 100%)",
  color: "#FFFFFF",
  fontSize: 15,
  fontWeight: 900,
  boxShadow: "0 12px 30px rgba(0,0,0,.28)",
  cursor: "pointer",
  animation: "bizzibuddiBuddiPulse 3s infinite",
};

const helpHero = {
  display: "grid",
  justifyItems: "center",
  gap: 16,
  textAlign: "center",
};

const helpIcon = {
  width: 72,
  height: 72,
  display: "grid",
  placeItems: "center",
  borderRadius: 22,
  background: "linear-gradient(135deg, rgba(0,180,219,.18), rgba(37,99,235,.18))",
  border: "1px solid rgba(0,180,219,.45)",
  color: CYAN,
  fontSize: 34,
  fontWeight: 800,
  boxShadow: "0 14px 32px rgba(0,0,0,.18)",
};

const helpGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: 14,
  marginTop: 34,
};

const helpCard = (featured) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: 14,
  padding: 20,
  borderRadius: 16,
  border: "1px solid " + (featured ? "rgba(0,180,219,.6)" : BORDER),
  background: featured ? "linear-gradient(135deg, rgba(0,180,219,.12), rgba(37,99,235,.08))" : "rgba(255,255,255,.035)",
  boxShadow: featured ? "0 14px 30px rgba(0,0,0,.14)" : "none",
});

const helpCardIcon = {
  width: 42,
  height: 42,
  display: "grid",
  placeItems: "center",
  flex: "0 0 auto",
  borderRadius: 12,
  background: "rgba(255,255,255,.06)",
  fontSize: 21,
};

const helpPrimaryButton = {
  minHeight: 42,
  padding: "0 15px",
  border: 0,
  borderRadius: 9,
  background: RED,
  color: TEXT,
  fontWeight: 800,
  cursor: "pointer",
};

const helpSecondaryButton = {
  minHeight: 42,
  padding: "0 15px",
  border: "1px solid " + BORDER,
  borderRadius: 9,
  background: "transparent",
  color: MUTED,
  fontWeight: 700,
  cursor: "default",
};

const supportPanel = {
  marginTop: 18,
  padding: 24,
  borderRadius: 18,
  border: "1px solid rgba(37,99,235,.38)",
  background: "linear-gradient(135deg, rgba(37,99,235,.08), rgba(0,180,219,.06))",
  boxShadow: "0 14px 34px rgba(0,0,0,.16)",
};
const supportForm = {
  display: "grid",
  gap: 2,
  marginTop: 18,
};
const supportTextarea = {
  display: "block",
  width: "100%",
  minHeight: 150,
  marginTop: 8,
  padding: "14px 15px",
  boxSizing: "border-box",
  border: `1px solid ${BORDER}`,
  borderRadius: 10,
  fontSize: 15,
  color: TEXT,
  background: SURFACE,
  resize: "vertical",
  lineHeight: 1.5,
  fontFamily: "inherit",
};
const supportFormGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 16,
};
const supportConfirmation = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  gap: 14,
  alignItems: "start",
  marginTop: 22,
  padding: 18,
  borderRadius: 13,
  border: "1px solid rgba(0,180,219,.38)",
  background: "rgba(0,180,219,.07)",
};
const supportConfirmationIcon = {
  width: 38,
  height: 38,
  display: "grid",
  placeItems: "center",
  borderRadius: "50%",
  background: "rgba(0,180,219,.16)",
  color: CYAN,
  fontSize: 20,
  fontWeight: 900,
};
const faqPanel = {
  marginTop: 18,
  padding: 24,
  borderRadius: 18,
  border: "1px solid rgba(37,99,235,.38)",
  background: "linear-gradient(135deg, rgba(37,99,235,.08), rgba(0,180,219,.06))",
  boxShadow: "0 14px 34px rgba(0,0,0,.16)",
};
const faqList = {
  display: "grid",
  gap: 8,
  marginTop: 24,
};
const faqItem = {
  overflow: "hidden",
  border: "1px solid " + BORDER,
  borderRadius: 11,
  background: "rgba(255,255,255,.035)",
};
const faqQuestion = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "15px 16px",
  border: "none",
  background: "transparent",
  color: TEXT,
  fontSize: 14,
  fontWeight: 800,
  textAlign: "left",
  cursor: "pointer",
};
const faqQuestionIcon = {
  flex: "0 0 auto",
  width: 24,
  height: 24,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 7,
  background: "rgba(0,180,219,.10)",
  color: CYAN,
  fontSize: 18,
  lineHeight: 1,
};
const faqAnswer = {
  padding: "0 16px 16px",
  borderTop: "1px solid rgba(255,255,255,.08)",
};
const featureGuidesPanel = {
  marginTop: 18,
  padding: 24,
  borderRadius: 18,
  border: "1px solid rgba(37,99,235,.38)",
  background: "linear-gradient(135deg, rgba(37,99,235,.08), rgba(0,180,219,.06))",
  boxShadow: "0 14px 34px rgba(0,0,0,.16)",
};
const featureGuideTabs = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 8,
  marginTop: 24,
};
const featureGuideTab = (active) => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  minHeight: 46,
  padding: "8px 11px",
  border: "1px solid " + (active ? "rgba(0,180,219,.65)" : BORDER),
  borderRadius: 10,
  background: active ? "rgba(0,180,219,.13)" : "rgba(255,255,255,.035)",
  color: TEXT,
  fontSize: 12,
  fontWeight: active ? 800 : 700,
  cursor: "pointer",
  textAlign: "left",
});
const featureGuideTabNumber = {
  color: CYAN,
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: ".06em",
};
const featureGuideDetail = {
  marginTop: 14,
  padding: 22,
  borderRadius: 14,
  border: "1px solid " + BORDER,
  background: "rgba(255,255,255,.035)",
};
const featureGuideDetailHeader = {
  display: "flex",
  alignItems: "flex-start",
  gap: 14,
};
const featureGuideSteps = {
  display: "grid",
  gap: 9,
  marginTop: 20,
};
const featureGuideStep = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 9,
  background: "rgba(0,180,219,.06)",
  color: TEXT,
  fontSize: 13,
  lineHeight: 1.5,
};
const featureGuideStepNumber = {
  color: CYAN,
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: ".06em",
};
const gettingStartedPanel = {
  marginTop: 18,
  padding: 24,
  borderRadius: 18,
  border: "1px solid rgba(0,180,219,.38)",
  background: "linear-gradient(135deg, rgba(0,180,219,.08), rgba(37,99,235,.07))",
  boxShadow: "0 14px 34px rgba(0,0,0,.16)",
};
const gettingStartedIntro = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 20,
};
const gettingStartedStepsStyle = {
  display: "grid",
  gap: 0,
  marginTop: 24,
};
const gettingStartedStep = {
  position: "relative",
  display: "flex",
  alignItems: "flex-start",
  gap: 14,
  padding: "16px 0",
  borderTop: "1px solid rgba(255,255,255,.09)",
};
const gettingStartedNumber = {
  width: 42,
  height: 42,
  display: "grid",
  placeItems: "center",
  flex: "0 0 auto",
  borderRadius: 12,
  background: "rgba(0,180,219,.12)",
  border: "1px solid rgba(0,180,219,.34)",
  color: CYAN,
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: ".08em",
};
const gettingStartedConnector = {
  position: "absolute",
  left: 20,
  top: 58,
  bottom: -16,
  width: 1,
  background: "rgba(0,180,219,.20)",
};
const helpCloseButton = {
  width: 36,
  height: 36,
  flex: "0 0 auto",
  border: "1px solid " + BORDER,
  borderRadius: "50%",
  background: "rgba(255,255,255,.04)",
  color: MUTED,
  fontSize: 22,
  lineHeight: 1,
  cursor: "pointer",
};
const helpTip = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginTop: 20,
  padding: 16,
  borderRadius: 14,
  border: "1px solid rgba(0,180,219,.24)",
  background: "rgba(0,180,219,.05)",
};

const membershipAccess = { marginTop: 20, padding: 20, borderRadius: 14, border: "1px solid " + BORDER, background: "rgba(37,99,235,.06)" };
const membershipFeatureGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10, marginTop: 16 };
const membershipFeature = (available) => ({ display: "flex", alignItems: "flex-start", gap: 9, padding: 12, borderRadius: 10, border: "1px solid " + (available ? "rgba(0,180,219,.28)" : BORDER), background: available ? "rgba(0,180,219,.08)" : "rgba(255,255,255,.025)", color: available ? TEXT : MUTED });

const todayViewPanel = {
  marginTop: 18, padding: 20, borderRadius: 16,
  border: "1px solid " + BORDER,
  background: "rgba(255,255,255,.025)",
};
const todayViewHeader = {
  display: "flex", alignItems: "flex-start", justifyContent: "space-between",
  gap: 16, flexWrap: "wrap",
};
const todayViewDate = {
  display: "inline-flex", alignItems: "center", minHeight: 34,
  padding: "0 10px", borderRadius: 9, border: "1px solid " + BORDER,
  color: MUTED, fontSize: 12, fontWeight: 700,
};
const todayViewGrid = {
  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 10, marginTop: 16,
};
const todayViewCard = {
  display: "flex", flexDirection: "column", minWidth: 0, padding: 15,
  borderRadius: 13, border: "1px solid " + BORDER, background: "rgba(6,26,43,.42)",
};
const todayViewMetric = { display: "block", marginTop: 7, fontSize: 30, lineHeight: 1 };
const todayViewLabel = { display: "block", marginTop: 5, color: MUTED, fontSize: 12 };
const todayViewItem = {
  display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%",
  marginTop: 10, padding: "9px 10px", border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 9, background: "rgba(255,255,255,.025)", color: TEXT,
  textAlign: "left", cursor: "pointer",
};
const todayViewEmpty = { display: "block", marginTop: 14, color: MUTED, fontSize: 12 };
 
const attentionPanel = {
  marginTop: 24, padding: 22, borderRadius: 18,
  border: "1px solid rgba(0,180,219,.55)",
  background: "linear-gradient(135deg, rgba(0,180,219,.10), rgba(37,99,235,.10))",
  boxShadow: "0 16px 34px rgba(0,0,0,.18)",
};
const attentionHeader = {
  display: "flex", alignItems: "flex-start", justifyContent: "space-between",
  gap: 18, flexWrap: "wrap",
};
const attentionBuddiButton = {
  display: "inline-flex", alignItems: "center", gap: 9, minHeight: 46,
  padding: "0 15px", border: "1px solid rgba(0,180,219,.55)",
  borderRadius: 12, background: "rgba(6,26,43,.72)", color: TEXT,
  fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
};
const attentionSummary = {
  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: 8, marginTop: 18,
};
const attentionList = { display: "grid", gap: 9, marginTop: 16 };
const attentionItem = (tone) => ({
  display: "flex", alignItems: "center", gap: 12, padding: 13,
  borderRadius: 12,
  border: "1px solid " + (tone === "urgent" ? "rgba(248,113,113,.42)" : tone === "today" ? "rgba(0,180,219,.42)" : BORDER),
  background: tone === "urgent" ? "rgba(248,113,113,.07)" : "rgba(255,255,255,.035)",
  flexWrap: "wrap",
});
const attentionItemIcon = {
  width: 40, height: 40, display: "grid", placeItems: "center",
  flex: "0 0 auto", borderRadius: 11, background: "rgba(0,180,219,.10)", fontSize: 20,
};
const attentionAction = {
  flex: "0 0 auto", minHeight: 38, padding: "0 12px",
  border: "1px solid " + BORDER, borderRadius: 9, background: "transparent",
  color: TEXT, fontWeight: 700, cursor: "pointer",
};
const attentionClear = {
  display: "flex", alignItems: "center", gap: 12, marginTop: 16, padding: 15,
  borderRadius: 12, border: "1px solid rgba(0,180,219,.30)", background: "rgba(0,180,219,.06)",
};
const attentionClearIcon = {
  width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: "50%",
  background: "rgba(0,180,219,.14)", color: CYAN, fontSize: 19, fontWeight: 900,
};
const attentionFooter = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  gap: 14, marginTop: 15, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.10)",
  color: MUTED, fontSize: 12, lineHeight: 1.5, flexWrap: "wrap",
};
const attentionFooterButton = {
  flex: "0 0 auto", border: 0, padding: 0, background: "transparent",
  color: CYAN, fontWeight: 800, cursor: "pointer",
};

const buddiDashboardCard = {
  marginTop: 22,
  padding: 18,
  borderRadius: 16,
  border: "1px solid rgba(0,180,219,.55)",
  background: "linear-gradient(135deg, rgba(0,180,219,.11), rgba(37,99,235,.08))",
  boxShadow: "0 12px 30px rgba(0,0,0,.16)",
};

const buddiDashboardIcon = {
  width: 52,
  height: 52,
  display: "grid",
  placeItems: "center",
  flex: "0 0 auto",
  borderRadius: 14,
  background: "rgba(0,180,219,.12)",
};

const businessActions = { marginTop: 28, padding: 24, borderRadius: 14, border: `1px solid ${BORDER}`, background: "rgba(0,180,219,.05)" };
const planSummary = { marginTop: 18, display: "grid", gap: 8, padding: 16, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)" };
const actionGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginTop: 20 };
const actionCard = { display: "flex", alignItems: "flex-start", gap: 12, textAlign: "left", minHeight: 92, padding: 16, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)", color: TEXT, cursor: "pointer" };
const actionIcon = { fontSize: 22, lineHeight: 1 };
const productionProgress = { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginTop: 24, padding: 16, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)" };
const productionStage = (current, reached) => ({ display: "grid", justifyItems: "center", gap: 7, textAlign: "center", color: current ? TEXT : reached ? CYAN : MUTED, fontWeight: current ? 800 : 600, fontSize: 12 });
const productionTaskPanel = { marginTop: 18, padding: 18, borderRadius: 14, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)" };
const productionTaskHeader = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 };
const productionTaskPercent = { color: CYAN, fontSize: 22, fontWeight: 800 };
const productionTaskList = { display: "grid", gap: 8, marginTop: 14 };
const productionTaskRow = (complete) => ({ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 12px", borderRadius: 9, border: "1px solid " + (complete ? "rgba(0,180,219,.28)" : BORDER), background: complete ? "rgba(0,180,219,.07)" : "rgba(255,255,255,.025)" });
const productionTaskLabel = { display: "flex", alignItems: "center", gap: 10, minWidth: 0, color: TEXT, fontSize: 14, lineHeight: 1.4, cursor: "pointer" };
const productionTaskAdd = { display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8, marginTop: 12 };
const productionRecordCard = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: 16, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)", flexWrap: "wrap" };
const productionBadge = { padding: "6px 9px", borderRadius: 999, background: "rgba(0,180,219,.12)", color: CYAN, fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", whiteSpace: "nowrap" };
const reportSummaryGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginTop: 28 };
const reportSummaryCard = { display: "grid", gap: 5, padding: 18, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(0,180,219,.06)" };
const reportSummaryValue = { fontSize: 26, fontWeight: 800 };
const reportSectionGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, marginTop: 18 };
const reportCard = { padding: 20, borderRadius: 14, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)" };
const reportCardHeading = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 16 };
const reportMetric = { fontSize: 20, fontWeight: 800, color: CYAN, whiteSpace: "nowrap" };
const reportRows = { display: "grid", gap: 0 };
const reportRow = { display: "flex", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: `1px solid ${BORDER}` };
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
const invoiceStatus = (status) => ({ padding: "6px 9px", borderRadius: 999, background: status === "Paid" ? "rgba(0,180,219,.12)" : status === "Overdue" ? "rgba(220,50,50,.10)" : "rgba(37,99,235,.12)", color: status === "Paid" ? CYAN : status === "Overdue" ? "#ff8c8c" : RED, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" });
const invoiceDueSignal = (invoice, today) => {
  if (!invoice?.dueDate || invoice.status === "Paid") return { display: "none" };
  const due = new Date(invoice.dueDate + "T00:00:00");
  const current = new Date(today + "T00:00:00");
  const days = Math.ceil((due - current) / 86400000);
  const overdue = invoice.status === "Overdue" || days < 0;
  const urgent = days >= 0 && days <= 7;

  return {
    display: "inline-flex",
    width: "fit-content",
    marginTop: 7,
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid " + (overdue ? "rgba(220,50,50,.42)" : urgent ? "rgba(245,158,11,.42)" : "rgba(255,255,255,.12)"),
    background: overdue ? "rgba(220,50,50,.09)" : urgent ? "rgba(245,158,11,.08)" : "rgba(255,255,255,.04)",
    color: overdue ? "#ff8c8c" : urgent ? "#f6c453" : MUTED,
    fontSize: 10,
    fontWeight: 800,
  };
};
const smallActionButton = { border: `1px solid ${RED}`, borderRadius: 8, padding: "7px 10px", background: "transparent", color: TEXT, fontSize: 12, fontWeight: 700, cursor: "pointer" };
const lockedFeatureCard = { display: "flex", alignItems: "flex-start", gap: 14, maxWidth: 520, margin: "24px auto 0", padding: 18, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)", textAlign: "left" };
const jobTimelinePanel = {
  gridColumn: "1 / -1",
  marginTop: 12,
  padding: 14,
  borderRadius: 12,
  border: "1px solid " + BORDER,
  background: "rgba(0,0,0,.12)",
};

const jobTimelineItem = {
  display: "grid",
  gap: 4,
  padding: 10,
  borderRadius: 10,
  border: "1px solid " + BORDER,
  background: "rgba(255,255,255,.025)",
};

const jobProgressTrack = {
  height: 7,
  overflow: "hidden",
  borderRadius: 999,
  background: "rgba(255,255,255,.08)",
};

const jobProgressFill = {
  height: "100%",
  borderRadius: 999,
  background: "linear-gradient(90deg, " + CYAN + ", " + RED + ")",
  transition: "width .2s ease",
};

const jobReadinessBadge = (status) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 8px",
  borderRadius: 999,
  border: "1px solid " + (status === "Complete" || status === "Ready" ? "rgba(0,200,140,.35)" : status === "Overdue" ? "rgba(220,50,50,.4)" : "rgba(255,255,255,.12)"),
  background: status === "Complete" || status === "Ready" ? "rgba(0,200,140,.08)" : status === "Overdue" ? "rgba(220,50,50,.1)" : "rgba(255,255,255,.04)",
  color: status === "Complete" || status === "Ready" ? "#58e0b1" : status === "Overdue" ? "#ff8c8c" : TEXT,
  fontSize: 11,
  fontWeight: 800,
});

const jobDueDateBadge = (dueDate, readiness) => {
  if (!dueDate) return { display: "none" };
  const today = new Date().toISOString().slice(0, 10);
  const daysUntilDue = Math.ceil((new Date(dueDate + "T00:00:00") - new Date(today + "T00:00:00")) / 86400000);
  const overdue = readiness === "Overdue" || daysUntilDue < 0;
  const urgent = readiness !== "Complete" && daysUntilDue >= 0 && daysUntilDue <= 2;

  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid " + (overdue ? "rgba(220,50,50,.45)" : urgent ? "rgba(245,158,11,.45)" : "rgba(255,255,255,.12)"),
    background: overdue ? "rgba(220,50,50,.10)" : urgent ? "rgba(245,158,11,.10)" : "rgba(255,255,255,.04)",
    color: overdue ? "#ff8c8c" : urgent ? "#f6c453" : MUTED,
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: "nowrap",
  };
};

const jobDueDateLabel = (dueDate, readiness) => {
  if (!dueDate) return "";
  const today = new Date().toISOString().slice(0, 10);
  const daysUntilDue = Math.ceil((new Date(dueDate + "T00:00:00") - new Date(today + "T00:00:00")) / 86400000);
  if (readiness === "Complete") return "Ready by " + formatProductionDate(dueDate);
  if (daysUntilDue < 0) return "Overdue · " + formatProductionDate(dueDate);
  if (daysUntilDue === 0) return "Due today · " + formatProductionDate(dueDate);
  if (daysUntilDue === 1) return "Due tomorrow · " + formatProductionDate(dueDate);
  return "Ready by " + formatProductionDate(dueDate);
};

const jobCard = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: 18, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)" };
const jobStatus = { padding: "6px 9px", borderRadius: 999, background: "rgba(0,180,219,.12)", color: CYAN, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" };
const personCard = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: 18, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)" };
const smallDangerButton = { ...smallActionButton, borderColor: "rgba(255,23,79,.45)", color: "#FF6B8A" };
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
const navStyle = { display: "flex", justifyContent: "center", alignItems: "center", gap: 18, flexWrap: "wrap", margin: "34px 0 28px" };
const navMainGroup = { display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" };
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
