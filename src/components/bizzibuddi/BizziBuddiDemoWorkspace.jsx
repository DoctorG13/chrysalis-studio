import { useEffect, useMemo, useRef, useState } from "react";
import { bizzibuddiDemoData as seedData, getDemoSummary } from "../../data/bizzibuddiDemoData";

const BLUE = "#2563EB";
const CYAN = "#00B4DB";
const TEXT = "#FFFFFF";
const MUTED = "#B8C6D6";
const BORDER = "rgba(255,255,255,.14)";
const DEMO_SESSION_KEY = "bizzibuddi-demo-session-v2";

function cloneSeed() {
  return JSON.parse(JSON.stringify(seedData));
}

function readDemoSession() {
  try {
    const raw = window.sessionStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.data || typeof parsed.data !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function BizziBuddiDemoWorkspace({ onExit, onCreateAccount }) {
  const initialSession = readDemoSession();
  const initialDemoRoute = new URLSearchParams(window.location.search).get("demoModule");
  const validModules = new Set(["overview", "people", "jobs", "calendar", "finance", "production", "automation", "custom", "buddi"]);
  const initialModule = validModules.has(initialDemoRoute)
    ? initialDemoRoute
    : validModules.has(initialSession?.module)
      ? initialSession.module
      : "overview";
  const [data, setData] = useState(() => initialSession?.data || cloneSeed());
  const [module, setModule] = useState(initialModule);
  const [notice, setNotice] = useState("");
  const [personForm, setPersonForm] = useState({ name: "", email: "", phone: "" });
  const [jobForm, setJobForm] = useState({ title: "", personId: "", price: "", dueDate: "" });
  const [appointmentForm, setAppointmentForm] = useState({ title: "", personId: "", date: "", time: "" });
  const [customFieldName, setCustomFieldName] = useState("");
  const [pendingRemove, setPendingRemove] = useState("");
  const [buddiQuestion, setBuddiQuestion] = useState("");
  const [buddiAnswer, setBuddiAnswer] = useState("");
  const peopleWorkspaceRef = useRef(null);
  const noticeTimerRef = useRef(null);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ data, module }));
    } catch {
      // Demo remains fully usable if session storage is unavailable.
    }
  }, [data, module]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("view", "demo");
    params.set("demoModule", module);
    const nextUrl = window.location.pathname + "?" + params.toString();
    if (window.location.pathname + window.location.search !== nextUrl) {
      window.history.replaceState({}, "", nextUrl);
    }
  }, [module]);

  function leaveDemo(callback) {
    try {
      window.sessionStorage.removeItem(DEMO_SESSION_KEY);
    } catch {
      // Ignore storage failures; leaving the demo still works normally.
    }
    callback();
  }

  useEffect(() => {
    if (module !== "people") return;

    let cancelled = false;
    let attempts = 0;
    let timer = null;

    const scrollPeopleIntoView = () => {
      if (cancelled) return;

      const target = peopleWorkspaceRef.current;
      if (!target) {
        attempts += 1;
        if (attempts < 20) timer = window.setTimeout(scrollPeopleIntoView, 50);
        return;
      }

      const nav = document.querySelector(".bizzibuddi-workspace-sticky-nav");
      const navHeight = nav ? nav.getBoundingClientRect().height : 0;

      target.scrollIntoView({ block: "start", behavior: "smooth" });

      window.requestAnimationFrame(() => {
        if (cancelled) return;
        const currentTop = target.getBoundingClientRect().top;
        const desiredOffset = navHeight + 16;
        if (Math.abs(currentTop - desiredOffset) > 4) {
          window.scrollBy({ top: currentTop - desiredOffset, behavior: "smooth" });
        }
      });
    };

    const frame = window.requestAnimationFrame(scrollPeopleIntoView);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      if (timer) window.clearTimeout(timer);
    };
  }, [module]);

  const summary = useMemo(() => getDemoSummary(data), [data]);

  function notify(message) {
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    setNotice(message);
    noticeTimerRef.current = window.setTimeout(() => {
      setNotice("");
      noticeTimerRef.current = null;
    }, 4000);
  }

  useEffect(() => () => {
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
  }, []);

  function resetDemo() {
    setData(cloneSeed());
    setModule("overview");
    setPersonForm({ name: "", email: "", phone: "" });
    setJobForm({ title: "", personId: "", price: "", dueDate: "" });
    setAppointmentForm({ title: "", personId: "", date: "", time: "" });
    setCustomFieldName("");
    setPendingRemove("");
    setBuddiQuestion("");
    setBuddiAnswer("");
    notify("The original Harbour & Thread sample business has been restored. Your real BizziBuddi account has not been changed.");
  }

  function addPerson(event) {
    event.preventDefault();
    const name = personForm.name.trim();
    if (!name) return;

    const person = {
      id: "demo-person-" + Date.now(),
      name,
      email: personForm.email.trim(),
      phone: personForm.phone.trim(),
      createdAt: new Date().toISOString(),
    };

    setData((current) => ({ ...current, people: [...current.people, person] }));
    setPersonForm({ name: "", email: "", phone: "" });
    notify(name + " was added to the demo workspace. This change is temporary and will not affect your real account.");
  }

  function removePerson(id) {
    const person = data.people.find((item) => item.id === id);
    if (!person) return;

    setData((current) => ({
      ...current,
      people: current.people.filter((item) => item.id !== id),
      jobs: current.jobs.filter((item) => item.personId !== id),
      appointments: current.appointments.filter((item) => item.personId !== id),
    }));
    setPendingRemove("");
    notify(person.name + " was removed from the demo workspace. Your real account was not changed.");
  }

  function addJob(event) {
    event.preventDefault();
    const title = jobForm.title.trim();
    const person = data.people.find((item) => item.id === jobForm.personId) || data.people[0];
    if (!title || !person) return;

    const job = {
      id: "demo-job-" + Date.now(),
      personId: person.id,
      clientName: person.name,
      title,
      status: "New",
      dueDate: jobForm.dueDate,
      price: Number(jobForm.price) || 0,
      productionStage: "Ready",
      productionProgress: 0,
    };

    setData((current) => ({ ...current, jobs: [...current.jobs, job] }));
    setJobForm({ title: "", personId: "", price: "", dueDate: "" });
    notify(title + " was added to the demo workspace. This change is temporary and will not affect your real account.");
  }

  function removeJob(id) {
    const job = data.jobs.find((item) => item.id === id);
    if (!job) return;

    setData((current) => ({
      ...current,
      jobs: current.jobs.filter((item) => item.id !== id),
      production: current.production.filter((item) => item.jobId !== id),
    }));
    setPendingRemove("");
    notify(job.title + " was removed from the demo workspace. Your real account was not changed.");
  }

  function addAppointment(event) {
    event.preventDefault();
    const title = appointmentForm.title.trim();
    const person = data.people.find((item) => item.id === appointmentForm.personId) || data.people[0];
    if (!title || !person) return;

    const appointment = {
      id: "demo-appt-" + Date.now(),
      title,
      date: appointmentForm.date,
      time: appointmentForm.time,
      personId: person.id,
      personName: person.name,
      status: "Booked",
    };

    setData((current) => ({ ...current, appointments: [...current.appointments, appointment] }));
    setAppointmentForm({ title: "", personId: "", date: "", time: "" });
    notify(title + " was added to the demo workspace. This change is temporary and will not affect your real account.");
  }

  function updateJobStatus(id) {
    const statuses = ["New", "In progress", "Waiting", "Complete"];
    setData((current) => ({
      ...current,
      jobs: current.jobs.map((job) => {
        if (job.id !== id) return job;
        const next = statuses[(statuses.indexOf(job.status) + 1) % statuses.length];
        return { ...job, status: next };
      }),
    }));
    notify("Job status updated in the demo. This change is temporary and will not affect your real account.");
  }

  function toggleProductionTask(productionId, taskIndex) {
    setData((current) => ({
      ...current,
      production: current.production.map((record) => record.id !== productionId
        ? record
        : {
            ...record,
            tasks: record.tasks.map((task, index) =>
              index === taskIndex ? { ...task, complete: !task.complete } : task
            ),
          }),
    }));
    notify("Production task updated in the demo. This change is temporary and will not affect your real account.");
  }

  function askBuddi(question) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    let response = { summary: "Here is what I found in the Harbour & Thread demo workspace.", items: [], emptyMessage: "There is nothing to report for this question." };

    if (question === "Who currently owes me money?") {
      const owing = data.invoices
        .filter((invoice) => Number(invoice.balance) > 0)
        .sort((a, b) => Number(b.balance) - Number(a.balance));
      const total = owing.reduce((sum, invoice) => sum + Number(invoice.balance || 0), 0);
      response = {
        summary: `${owing.length} ${owing.length === 1 ? "invoice has" : "invoices have"} an outstanding balance totalling ${money(total)}.`,
        items: owing.map((invoice) => ({
          title: invoice.personName,
          detail: invoice.description || "Outstanding invoice",
          meta: `${invoice.number} · ${invoice.status}`,
          amount: money(invoice.balance),
          destination: "finance",
        })),
        emptyMessage: "All sample invoices have been paid. There are no outstanding balances.",
      };
    } else if (question === "What is due this week?") {
      const dueJobs = data.jobs.filter((job) => {
        if (!job.dueDate || job.status === "Complete") return false;
        const due = new Date(`${job.dueDate}T00:00:00`);
        return !Number.isNaN(due.getTime()) && due >= today && due <= weekEnd;
      }).map((job) => ({
        title: job.title,
        detail: `Job for ${job.clientName}`,
        meta: `Due ${formatDate(job.dueDate)} · ${job.status}`,
        destination: "jobs",
      }));
      const dueAppointments = data.appointments.filter((appointment) => {
        if (!appointment.date) return false;
        const date = new Date(`${appointment.date}T00:00:00`);
        return !Number.isNaN(date.getTime()) && date >= today && date <= weekEnd;
      }).map((item) => ({
        title: item.title,
        detail: `Appointment with ${item.personName}`,
        meta: `${formatDate(item.date)}${item.time ? ` · ${item.time}` : ""}`,
        destination: "calendar",
      }));
      response = {
        summary: `${dueJobs.length} open ${dueJobs.length === 1 ? "job" : "jobs"} and ${dueAppointments.length} ${dueAppointments.length === 1 ? "appointment" : "appointments"} are scheduled in the next seven days.`,
        items: [...dueJobs, ...dueAppointments],
        emptyMessage: "There are no open jobs or appointments due in the next seven days.",
      };
    } else if (question === "Which jobs need attention?") {
      const jobsNeedingAttention = data.jobs.filter((job) => job.status !== "Complete");
      response = {
        summary: `${jobsNeedingAttention.length} ${jobsNeedingAttention.length === 1 ? "job is" : "jobs are"} currently open.`,
        items: jobsNeedingAttention.map((job) => ({
          title: job.title,
          detail: `Customer: ${job.clientName}`,
          meta: `${job.status}${job.dueDate ? ` · Due ${formatDate(job.dueDate)}` : " · No due date"}`,
          destination: "jobs",
        })),
        emptyMessage: "All sample jobs are marked complete. Nothing currently needs attention.",
      };
    } else if (question === "Show me production workload") {
      const active = data.production.filter((record) => record.stage !== "Complete");
      response = {
        summary: `${active.length} active production ${active.length === 1 ? "record" : "records"} across the sample business.`,
        items: active.map((record) => {
          const done = record.tasks.filter((task) => task.complete).length;
          return {
            title: record.jobTitle,
            detail: record.stage,
            meta: `${done} of ${record.tasks.length} tasks complete${record.dueDate ? ` · Due ${formatDate(record.dueDate)}` : ""}`,
            progress: record.tasks.length ? Math.round((done / record.tasks.length) * 100) : 0,
            destination: "production",
          };
        }),
        emptyMessage: "There are no active production records in the demo.",
      };
    }

    setBuddiQuestion(question);
    setBuddiAnswer(response);
  }

  function addCustomField(event) {
    event.preventDefault();
    const name = customFieldName.trim();
    if (!name) return;

    setData((current) => ({
      ...current,
      customFields: [...current.customFields, [name, "Example value"]],
    }));
    setCustomFieldName("");
    notify("Custom field added to the demo workspace. This change is temporary and will not affect your real account.");
  }

  function renderModule() {
    if (module === "people") {
      return (
        <PeopleDemo
          data={data}
          form={personForm}
          setForm={setPersonForm}
          onAdd={addPerson}
          pendingRemove={pendingRemove}
          setPendingRemove={setPendingRemove}
          onRemove={removePerson}
        />
      );
    }

    if (module === "jobs") {
      return (
        <JobsDemo
          data={data}
          form={jobForm}
          setForm={setJobForm}
          onAdd={addJob}
          pendingRemove={pendingRemove}
          setPendingRemove={setPendingRemove}
          onRemove={removeJob}
          onStatus={updateJobStatus}
        />
      );
    }

    if (module === "calendar") {
      return (
        <CalendarDemo
          data={data}
          form={appointmentForm}
          setForm={setAppointmentForm}
          onAdd={addAppointment}
        />
      );
    }

    if (module === "finance") return <FinanceDemo data={data} />;
    if (module === "production") return <ProductionDemo data={data} onToggleTask={toggleProductionTask} />;
    if (module === "automation") return <RecordList title="Automation & activity" rows={data.automationEvents} fields={["title", "detail", "createdAt"]} />;
    if (module === "custom") {
      return (
        <CustomDemo
          data={data}
          fieldName={customFieldName}
          setFieldName={setCustomFieldName}
          onAdd={addCustomField}
        />
      );
    }
    if (module === "buddi") return <BuddiDemo data={data} question={buddiQuestion} answer={buddiAnswer} onAsk={askBuddi} onClose={() => { setBuddiQuestion(""); setBuddiAnswer(""); }} onNavigate={setModule} />;

    return <Overview summary={summary} onReset={resetDemo} />;
  }

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

  return (
    <section style={shell}>
      <div style={banner}>
        <div style={{ minWidth: 0 }}>
          <strong>DEMO WORKSPACE</strong>
          <span> Explore BizziBuddi with realistic sample business data. Everything here is temporary and isolated from real account data.</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={resetDemo} style={secondary}>↻ Reset demo</button>
          <button type="button" onClick={() => leaveDemo(onExit)} style={secondary}>Exit demo</button>
          <button type="button" onClick={() => leaveDemo(onCreateAccount)} style={primary}>Create real account →</button>
        </div>
      </div>

      {notice && (
        <div style={noticeStyle} role="status" aria-live="polite">
          <strong style={{ display: "block", fontSize: 13, marginBottom: 3 }}>Demo action</strong>
          <span>{notice}</span>
        </div>
      )}

      <div style={header}>
        <small style={eyebrow}>HARBOUR & THREAD STUDIO · DRESSMAKER TEMPLATE</small>
        <h2 style={heading}>See how BizziBuddi works.</h2>
        <p style={copy}>Create temporary records, move work through stages, explore finance and production, test custom fields and see how Buddi interprets your business.</p>
      </div>

      <nav style={nav} aria-label="Demo workspace">
        {modules.map(([key, label]) => (
          <button key={key} type="button" onClick={() => setModule(key)} style={tab(module === key)} aria-current={module === key ? "page" : undefined}>
            {label}
          </button>
        ))}
      </nav>

      {renderModule()}
    </section>
  );
}

function Overview({ summary, onReset }) {
  return (
    <div style={grid}>
      {[
        ["PEOPLE", summary.people, "contacts"],
        ["OPEN JOBS", summary.openJobs, "jobs in progress"],
        ["APPOINTMENTS", summary.appointments, "scheduled"],
        ["OUTSTANDING", money(summary.outstanding), "to collect"],
        ["PRODUCTION", summary.productionActive, "active records"],
      ].map(([label, value, detail]) => (
        <article key={label} style={card}>
          <small style={muted}>{label}</small>
          <strong style={metric}>{value}</strong>
          <span style={muted}>{detail}</span>
        </article>
      ))}

      <article style={{ ...card, gridColumn: "1 / -1" }}>
        <small style={muted}>BUSINESS OPERATING SYSTEM</small>
        <h3 style={{ margin: "8px 0", fontSize: 22 }}>People → Work → Calendar → Money → Production → Intelligence</h3>
        <p style={copy}>BizziBuddi keeps the core workflow consistent while business-specific terminology and fields can be configured around it.</p>
        <button type="button" onClick={onReset} style={secondary}>Restore original sample business</button>
      </article>
    </div>
  );
}

function PeopleDemo({ data, form, setForm, onAdd, pendingRemove, setPendingRemove, onRemove }) {
  return (
    <article style={card}>
      <SectionHeading label="DEMO PEOPLE" title="People" count={data.people.length} />

      <div style={formPanel}>
        <div>
          <small style={muted}>ADD TO DEMO WORKSPACE</small>
          <h4 style={formTitle}>Add a person</h4>
          <p style={formCopy}>This creates a temporary demo person only. It will never be saved to your real BizziBuddi account.</p>
        </div>

        <form onSubmit={onAdd} style={formGrid}>
          <Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} placeholder="e.g. Sarah Jones" required />
          <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} placeholder="sarah@example.com" />
          <Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} placeholder="0400 000 000" />
          <div style={formAction}>
            <button type="submit" style={smallPrimary}>+ Add person to demo</button>
          </div>
        </form>
      </div>

      <div style={recordList}>
        {data.people.map((person) => (
          <div key={person.id} style={rowStyle}>
            <div style={recordContent}>
              <strong>{person.name}</strong>
              <small style={muted}>{person.email || "No email"} · {person.phone || "No phone"}</small>
            </div>

            {pendingRemove === person.id ? (
              <div style={inlineConfirm}>
                <span style={confirmText}>Remove this demo person?</span>
                <button type="button" onClick={() => onRemove(person.id)} style={dangerButton}>Remove</button>
                <button type="button" onClick={() => setPendingRemove("")} style={secondary}>Cancel</button>
              </div>
            ) : (
              <button type="button" onClick={() => setPendingRemove(person.id)} style={dangerButton}>Remove</button>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}

function JobsDemo({ data, form, setForm, onAdd, pendingRemove, setPendingRemove, onRemove, onStatus }) {
  const defaultPersonId = data.people[0]?.id || "";

  return (
    <article style={card}>
      <SectionHeading label="DEMO WORK" title="Jobs" count={data.jobs.length} />

      <div style={formPanel}>
        <div>
          <small style={muted}>ADD TO DEMO WORKSPACE</small>
          <h4 style={formTitle}>Add a job</h4>
          <p style={formCopy}>Choose a demo person and create a temporary job without touching the real Jobs workspace.</p>
        </div>

        <form onSubmit={onAdd} style={formGrid}>
          <Field label="Job title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} placeholder="e.g. Mother of the Bride Dress" required />
          <SelectField
            label="Person"
            value={form.personId || defaultPersonId}
            onChange={(value) => setForm({ ...form, personId: value })}
            options={data.people.map((person) => [person.id, person.name])}
          />
          <Field label="Price" type="number" min="0" step="0.01" value={form.price} onChange={(value) => setForm({ ...form, price: value })} placeholder="0.00" />
          <Field label="Due date" type="date" value={form.dueDate} onChange={(value) => setForm({ ...form, dueDate: value })} />
          <div style={formAction}>
            <button type="submit" style={smallPrimary} disabled={!data.people.length}>+ Add job to demo</button>
          </div>
        </form>

        {!data.people.length && <p style={emptyFormNote}>Add a demo person first so a job can be linked to them.</p>}
      </div>

      <div style={recordList}>
        {data.jobs.map((job) => (
          <div key={job.id} style={rowStyle}>
            <div style={recordContent}>
              <strong>{job.title}</strong>
              <small style={muted}>{job.clientName} · Due {job.dueDate || "not set"} · {money(job.price)}</small>
            </div>

            <div style={rowActions}>
              <button type="button" onClick={() => onStatus(job.id)} style={secondary}>{job.status}</button>
              {pendingRemove === job.id ? (
                <div style={inlineConfirm}>
                  <span style={confirmText}>Remove?</span>
                  <button type="button" onClick={() => onRemove(job.id)} style={dangerButton}>Remove</button>
                  <button type="button" onClick={() => setPendingRemove("")} style={secondary}>Cancel</button>
                </div>
              ) : (
                <button type="button" onClick={() => setPendingRemove(job.id)} style={dangerButton}>Remove</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function CalendarDemo({ data, form, setForm, onAdd }) {
  const defaultPersonId = data.people[0]?.id || "";

  return (
    <article style={card}>
      <SectionHeading label="DEMO CALENDAR" title="Calendar" count={data.appointments.length} />

      <div style={formPanel}>
        <div>
          <small style={muted}>ADD TO DEMO WORKSPACE</small>
          <h4 style={formTitle}>Add an appointment</h4>
          <p style={formCopy}>Create a temporary booking using the sample business data.</p>
        </div>

        <form onSubmit={onAdd} style={formGrid}>
          <Field label="Appointment" value={form.title} onChange={(value) => setForm({ ...form, title: value })} placeholder="e.g. Final fitting" required />
          <SelectField
            label="Person"
            value={form.personId || defaultPersonId}
            onChange={(value) => setForm({ ...form, personId: value })}
            options={data.people.map((person) => [person.id, person.name])}
          />
          <Field label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} />
          <Field label="Time" type="time" value={form.time} onChange={(value) => setForm({ ...form, time: value })} />
          <div style={formAction}>
            <button type="submit" style={smallPrimary} disabled={!data.people.length}>+ Add appointment to demo</button>
          </div>
        </form>

        {!data.people.length && <p style={emptyFormNote}>Add a demo person first so an appointment can be linked to them.</p>}
      </div>

      <div style={recordList}>
        {[...data.appointments].sort((a, b) => {
          const dateTimeA = `${a.date || "9999-12-31"} ${a.time || "23:59"}`;
          const dateTimeB = `${b.date || "9999-12-31"} ${b.time || "23:59"}`;
          return dateTimeA.localeCompare(dateTimeB);
        }).map((appointment) => (
          <div key={appointment.id} style={rowStyle}>
            <div style={recordContent}>
              <strong>{appointment.title}</strong>
              <small style={muted}>{appointment.personName} · {appointment.date || "Date not set"} {appointment.time || ""}</small>
            </div>
            <span style={badge}>{appointment.status}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function RecordList({ title, rows, fields }) {
  const orderedRows = fields.includes("createdAt")
    ? [...rows].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    : rows;

  return (
    <article style={card}>
      <SectionHeading label="DEMO DATA" title={title} count={rows.length} />
      <div style={recordList}>
        {orderedRows.map((row) => (
          <div key={row.id} style={rowStyle}>
            <div style={recordGrid}>
              {fields.map((field) => (
                <div key={field}>
                  <small style={muted}>{label(field)}</small>
                  <strong style={{ display: "block", marginTop: 3, fontSize: 13 }}>{field === "createdAt" ? formatDateTime(row[field]) : String(row[field] ?? "—")}</strong>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function FinanceDemo({ data }) {
  const paid = data.invoices.reduce((sum, item) => sum + Number(item.amountPaid || 0), 0);
  const invoiced = data.invoices.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <article style={card}>
      <SectionHeading label="SAMPLE FINANCE" title="Invoices, payments and balances" count={data.invoices.length} />
      <div style={{ ...grid, marginTop: 16 }}>
        <div style={card}>
          <small style={muted}>TOTAL INVOICED</small>
          <strong style={metric}>{money(invoiced)}</strong>
        </div>
        <div style={card}>
          <small style={muted}>PAYMENTS RECEIVED</small>
          <strong style={metric}>{money(paid)}</strong>
        </div>
        <div style={card}>
          <small style={muted}>OUTSTANDING</small>
          <strong style={metric}>{money(data.invoices.reduce((sum, item) => sum + Number(item.balance || 0), 0))}</strong>
        </div>
      </div>
      <h4 style={{ margin: "20px 0 8px", fontSize: 16 }}>Invoices</h4>
      <div style={recordList}>
        {data.invoices.map((invoice) => (
          <div key={invoice.id} style={rowStyle}>
            <div>
              <strong>{invoice.number}</strong>
              <small style={{ display: "block", ...muted }}>{invoice.personName} · {invoice.description}</small>
            </div>
            <div style={{ textAlign: "right" }}>
              <strong>{money(invoice.amount)}</strong>
              <small style={{ display: "block", ...muted }}>{invoice.status} · {money(invoice.balance)} balance</small>
            </div>
          </div>
        ))}
      </div>
      <h4 style={{ margin: "22px 0 8px", fontSize: 16 }}>Payment activity</h4>
      <div style={recordList}>
        {(data.payments || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).map((payment) => {
          const invoice = data.invoices.find((item) => item.id === payment.invoiceId);
          return (
            <div key={payment.id} style={rowStyle}>
              <div style={recordContent}>
                <strong>{invoice?.number || "Demo payment"}</strong>
                <small style={muted}>{invoice?.personName || "Customer"} · {payment.description || payment.method || "Payment"} · {formatDate(payment.date)}</small>
              </div>
              <div style={{ textAlign: "right" }}>
                <strong>{money(payment.amount)}</strong>
                <small style={{ display: "block", ...muted }}>{payment.method || "Payment method not recorded"}</small>
              </div>
            </div>
          );
        })}
        {!(data.payments || []).length && <p style={copy}>No payments have been recorded in this demo yet.</p>}
      </div>
      <p style={copy}>Collection rate: {invoiced ? Math.round((paid / invoiced) * 100) : 0}%. Finance is fully isolated inside this demo.</p>
    </article>
  );
}

function ProductionDemo({ data, onToggleTask }) {
  return (
    <article style={card}>
      <small style={muted}>DEMO PRODUCTION</small>
      <h3 style={{ margin: "6px 0", fontSize: 22 }}>Production workflow</h3>
      <div style={recordList}>
        {data.production.map((record) => (
          <div key={record.id} style={rowStyle}>
            <div>
              <strong>{record.jobTitle}</strong>
              <small style={{ display: "block", ...muted }}>{record.stage} · Due {record.dueDate}</small>
              <div style={{ display: "grid", gap: 5, marginTop: 9 }}>
                {record.tasks.map((task, index) => (
                  <label key={task.label} style={checkboxLabel}>
                    <input type="checkbox" checked={task.complete} onChange={() => onToggleTask(record.id, index)} />
                    {task.label}
                  </label>
                ))}
              </div>
            </div>
            <span style={badge}>{record.tasks.filter((task) => task.complete).length}/{record.tasks.length}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function CustomDemo({ data, fieldName, setFieldName, onAdd }) {
  return (
    <article style={card}>
      <div style={sectionHeader}>
        <div>
          <small style={muted}>CUSTOM FIELDS</small>
          <h3 style={{ margin: "6px 0", fontSize: 22 }}>Industry-specific information</h3>
        </div>
        <span style={badge}>{data.customFields.length} fields</span>
      </div>

      <div style={formPanel}>
        <small style={muted}>ADD TO DEMO WORKSPACE</small>
        <h4 style={formTitle}>Add a custom field</h4>
        <p style={formCopy}>Try adding a field that would make BizziBuddi more useful for a particular industry.</p>
        <form onSubmit={onAdd} style={inlineForm}>
          <Field label="Field name" value={fieldName} onChange={setFieldName} placeholder="e.g. Favourite Colour" required />
          <button type="submit" style={smallPrimary}>+ Add field to demo</button>
        </form>
      </div>

      <div style={grid}>
        {data.customFields.map(([name, value], index) => (
          <div key={name + index} style={rowStyle}>
            <strong>{name}</strong>
            <span>{value}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function BuddiDemo({ data, question, answer, onAsk, onClose, onNavigate }) {
  const [answerSource, setAnswerSource] = useState(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingAppointments = data.appointments
    .filter((item) => item.date && new Date(`${item.date}T00:00:00`) >= today)
    .sort((a, b) => `${a.date} ${a.time || ""}`.localeCompare(`${b.date} ${b.time || ""}`));
  const unpaidInvoices = data.invoices
    .filter((invoice) => Number(invoice.balance) > 0)
    .sort((a, b) => Number(b.balance) - Number(a.balance));
  const activeProduction = data.production.filter((record) => record.stage !== "Complete");

  const priorities = [
    ...(upcomingAppointments.length ? [{
      title: upcomingAppointments[0].title,
      detail: `${upcomingAppointments[0].personName} · ${formatDate(upcomingAppointments[0].date)}${upcomingAppointments[0].time ? ` at ${upcomingAppointments[0].time}` : ""}`,
      destination: "calendar",
      action: "View calendar",
    }] : []),
    ...(unpaidInvoices.length ? [{
      title: `${unpaidInvoices.length} invoices need payment`,
      detail: `${money(unpaidInvoices.reduce((sum, invoice) => sum + Number(invoice.balance || 0), 0))} outstanding · Largest balance: ${unpaidInvoices[0].personName} (${money(unpaidInvoices[0].balance)})`,
      destination: "finance",
      action: "View finance",
    }] : []),
    ...(activeProduction.length ? [{
      title: `${activeProduction.length} jobs in production`,
      detail: `${activeProduction.slice(0, 2).map((record) => record.jobTitle).join(" · ")}${activeProduction.length > 2 ? " · and more" : ""}`,
      destination: "production",
      action: "View production",
    }] : []),
  ];

  const questions = ["Who currently owes me money?", "What is due this week?", "Which jobs need attention?", "Show me production workload"];
  const questionRowRefs = useRef([]);

  function handlePriorityClick(item) {
    const relatedQuestion = {
      calendar: "What is due this week?",
      finance: "Who currently owes me money?",
      production: "Show me production workload",
    }[item.destination];

    if (!relatedQuestion) return;
    const source = `priority:${item.destination}`;
    if (answerSource === source) {
      closeAnswer();
      return;
    }
    onAsk(relatedQuestion);
    setAnswerSource(source);
  }

  function handleQuestionClick(item) {
    if (answerSource === `question:${item}`) {
      closeAnswer();
      return;
    }
    onAsk(item);
    setAnswerSource(`question:${item}`);
  }

  function closeAnswer() {
    setAnswerSource(null);
    onClose();
  }

  function renderAnswerPanel() {
    if (!answer || !answerSource) return null;
    return (
      <section style={answerPanel} role="status" aria-live="polite" aria-labelledby="buddi-answer-heading">
        <div style={sectionHeader}>
          <div>
            <small style={{ color: CYAN, fontWeight: 800, letterSpacing: ".06em" }}>BUDDI'S DEMO RESPONSE</small>
            <h4 id="buddi-answer-heading" style={{ margin: "5px 0 0", fontSize: 18 }}>{question}</h4>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={badge}>{answer.items.length} {answer.items.length === 1 ? "result" : "results"}</span>
            <button type="button" onClick={closeAnswer} style={answerClose} aria-label="Close Buddi response">✕ Close</button>
          </div>
        </div>
        <p style={{ ...copy, margin: "10px 0 14px" }}>{answer.summary}</p>
        {answer.items.length ? (
          <div style={answerList}>
            {answer.items.map((result, resultIndex) => (
              <div key={`${result.title}-${resultIndex}`} style={answerItem}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong style={{ display: "block" }}>{result.title}</strong>
                  <span style={answerDetail}>{result.detail}</span>
                  <small style={muted}>{result.meta}</small>
                  {typeof result.progress === "number" && (
                    <div style={progressTrack}><div style={{ ...progressFill, width: `${result.progress}%` }} /></div>
                  )}
                </div>
                {result.amount && <strong style={{ whiteSpace: "nowrap", color: TEXT }}>{result.amount}</strong>}
                <button type="button" onClick={() => onNavigate(result.destination)} style={answerLink}>View →</button>
              </div>
            ))}
          </div>
        ) : (
          <div style={emptyAnswer}>{answer.emptyMessage}</div>
        )}
      </section>
    );
  }

  return (
    <article style={card}>
      <small style={muted}>ASK BUDDI</small>
      <h3 style={{ margin: "6px 0", fontSize: 22 }}>Your business assistant</h3>
      <p style={copy}>Explore what is happening in Harbour & Thread. Choose a question and Buddi will summarise the current demo records.</p>

      <section style={{ ...priorityPanel, marginTop: 16 }} aria-labelledby="demo-priorities-heading">
        <div style={sectionHeader}>
          <div>
            <small style={{ color: CYAN, fontWeight: 800, letterSpacing: ".06em" }}>BUSINESS SNAPSHOT</small>
            <h4 id="demo-priorities-heading" style={{ margin: "5px 0 0", fontSize: 18 }}>What needs attention today?</h4>
          </div>
          <span style={badge}>{priorities.length} priorities</span>
        </div>
        {priorities.length ? (
          <div style={priorityGrid}>
            {priorities.map((item) => (
              <button key={item.destination} type="button" onClick={() => handlePriorityClick(item)} style={{ ...priorityCard, ...(answerSource === `priority:${item.destination}` ? questionRowActive : {}) }} aria-expanded={answerSource === `priority:${item.destination}`}>
                <strong>{item.title}</strong>
                <span style={muted}>{item.detail}</span>
                <span style={{ color: CYAN, fontSize: 12, fontWeight: 800 }}>{item.action} →</span>
              </button>
            ))}
          </div>
        ) : (
          <p style={copy}>Nothing urgent is showing in the current demo data.</p>
        )}
        {answerSource && answerSource.startsWith("priority:") && (
          <div style={{ marginTop: 12, width: "100%" }}>
            {renderAnswerPanel()}
          </div>
        )}
      </section>

      <section style={{ marginTop: 22 }} aria-labelledby="buddi-questions-heading">
        <small style={{ color: CYAN, fontWeight: 800, letterSpacing: ".06em" }}>SUGGESTED QUESTIONS</small>
        <h4 id="buddi-questions-heading" style={{ margin: "5px 0 10px", fontSize: 18 }}>What would you like to know?</h4>
        <div style={{ display: "grid", gap: 8 }}>
          {questions.map((item, index) => (
            <div key={item} style={{ display: "grid", gap: 8 }}>
              <button
                ref={(element) => { questionRowRefs.current[index] = element; }}
                type="button"
                onClick={() => handleQuestionClick(item)}
                style={{ ...questionRow, ...(question === item ? questionRowActive : {}) }}
                aria-pressed={question === item}
              >
                <span style={questionNumber}>{String(index + 1).padStart(2, "0")}</span>
                <span style={{ flex: 1, textAlign: "left" }}>{item}</span>
                <span style={{ color: CYAN, whiteSpace: "nowrap", fontWeight: 800 }}>Ask Buddi →</span>
              </button>

              {answerSource === `question:${item}` && renderAnswerPanel()}
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}

function SectionHeading({ label: sectionLabel, title, count }) {
  return (
    <div style={sectionHeader}>
      <div>
        <small style={muted}>{sectionLabel}</small>
        <h3 style={{ margin: "6px 0 0", fontSize: 22 }}>{title}</h3>
      </div>
      <span style={badge}>{count} {count === 1 ? "record" : "records"}</span>
    </div>
  );
}

function Field({ label: fieldLabel, type = "text", value, onChange, placeholder, required = false, min, step }) {
  return (
    <label style={fieldStyle}>
      <span>{fieldLabel}{required ? " *" : ""}</span>
      <input
        required={required}
        type={type}
        value={value}
        min={min}
        step={step}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

function SelectField({ label: fieldLabel, value, onChange, options }) {
  return (
    <label style={fieldStyle}>
      <span>{fieldLabel}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

function label(value) {
  return String(value).replace(/([A-Z])/g, " $1").replace(/^./, (m) => m.toUpperCase());
}

function money(value) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(value) || 0);
}

const shell = { width: "100%", maxWidth: 940, margin: "0 auto", padding: "0 0 40px" };
const banner = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", padding: 16, borderRadius: 14, border: "1px solid rgba(245,196,83,.48)", background: "rgba(245,196,83,.08)", color: TEXT };
const noticeStyle = { position: "sticky", top: 10, zIndex: 20, margin: "12px 0", padding: "12px 14px", borderRadius: 10, background: "rgba(0,180,219,.18)", border: "1px solid rgba(0,180,219,.48)", color: TEXT, fontSize: 12, fontWeight: 700, boxShadow: "0 8px 24px rgba(0,0,0,.18)" };
const header = { marginTop: 24 };
const eyebrow = { color: CYAN, fontSize: 11, fontWeight: 800, letterSpacing: ".12em" };
const heading = { margin: "8px 0", fontSize: "clamp(32px,5vw,48px)", letterSpacing: "-.04em" };
const copy = { color: MUTED, lineHeight: 1.65 };
const nav = { display: "flex", gap: 7, flexWrap: "wrap", margin: "24px 0 16px" };
const tab = (active) => ({ border: "1px solid " + (active ? CYAN : BORDER), borderRadius: 999, padding: "8px 11px", background: active ? "rgba(0,180,219,.12)" : "rgba(255,255,255,.035)", color: TEXT, fontSize: 11, fontWeight: 800, cursor: "pointer" });
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 };
const card = { padding: 18, borderRadius: 14, border: "1px solid " + BORDER, background: "rgba(255,255,255,.035)" };
const rowStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.025)" };
const recordContent = { display: "grid", gap: 4, minWidth: 0, flex: 1 };
const recordList = { display: "grid", gap: 8, marginTop: 16 };
const recordGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 12, flex: 1 };
const rowActions = { display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" };
const metric = { display: "block", marginTop: 7, fontSize: 28 };
const muted = { color: MUTED, fontSize: 11 };
const badge = { padding: "5px 8px", borderRadius: 999, background: "rgba(0,180,219,.10)", color: CYAN, fontSize: 10, fontWeight: 800 };
const sectionHeader = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" };
const promptBox = { marginTop: 16, padding: 16, borderRadius: 12, border: "1px solid rgba(0,180,219,.35)", background: "rgba(0,180,219,.07)", color: TEXT, lineHeight: 1.5 };
const priorityPanel = { padding: 16, borderRadius: 12, border: "1px solid rgba(0,180,219,.32)", background: "linear-gradient(135deg,rgba(0,180,219,.09),rgba(255,255,255,.025))" };
const priorityGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 9, marginTop: 13 };
const priorityCard = { display: "grid", gap: 8, minWidth: 0, padding: 13, borderRadius: 10, border: "1px solid rgba(255,255,255,.12)", background: "rgba(7,25,43,.25)", color: TEXT, textAlign: "left", font: "inherit", cursor: "pointer" };
const questionRow = { display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "13px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,.10)", background: "rgba(255,255,255,.025)", color: TEXT, font: "inherit", textAlign: "left", cursor: "pointer" };
const questionRowActive = { borderColor: "rgba(0,180,219,.65)", background: "rgba(0,180,219,.09)" };
const questionNumber = { color: CYAN, fontSize: 11, fontWeight: 900, letterSpacing: ".05em" };
const answerPanel = { minWidth: 0, marginTop: 4, padding: 15, borderRadius: 12, border: "1px solid rgba(0,180,219,.38)", background: "rgba(0,180,219,.065)" };
const answerClose = { flexShrink: 0, padding: "7px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.045)", color: TEXT, fontSize: 11, fontWeight: 800, cursor: "pointer" };
const answerList = { display: "grid", gap: 8 };
const answerItem = { display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 9, border: "1px solid rgba(255,255,255,.10)", background: "rgba(255,255,255,.035)" };
const answerDetail = { display: "block", margin: "3px 0", color: "#E0EAF4", fontSize: 12 };
const answerLink = { flexShrink: 0, padding: "7px 9px", borderRadius: 7, border: "1px solid rgba(0,180,219,.35)", background: "rgba(0,180,219,.08)", color: CYAN, fontSize: 11, fontWeight: 800, cursor: "pointer" };
const emptyAnswer = { padding: 13, borderRadius: 9, background: "rgba(255,255,255,.035)", color: MUTED, fontSize: 13 };
const progressTrack = { height: 5, marginTop: 8, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,.12)" };
const progressFill = { height: "100%", borderRadius: 99, background: CYAN };
const primary = { border: 0, borderRadius: 9, padding: "10px 13px", background: BLUE, color: TEXT, fontWeight: 800, cursor: "pointer" };
const smallPrimary = { ...primary, padding: "9px 11px", fontSize: 11 };
const secondary = { border: "1px solid " + BORDER, borderRadius: 9, padding: "10px 13px", background: "transparent", color: TEXT, fontWeight: 800, cursor: "pointer" };
const dangerButton = { ...secondary, color: "#FFB4B4", borderColor: "rgba(255,120,120,.28)" };
const formPanel = { marginTop: 16, padding: 16, borderRadius: 12, border: "1px solid rgba(0,180,219,.24)", background: "rgba(0,180,219,.045)" };
const formTitle = { margin: "5px 0 3px", fontSize: 17 };
const formCopy = { ...copy, margin: "0 0 12px", fontSize: 12 };
const formGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, alignItems: "end" };
const inlineForm = { display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 10, alignItems: "end" };
const fieldStyle = { display: "grid", gap: 5, color: TEXT, fontSize: 11, fontWeight: 800 };
const inputStyle = { width: "100%", minHeight: 40, boxSizing: "border-box", padding: "0 10px", border: "1px solid " + BORDER, borderRadius: 8, background: "rgba(0,0,0,.16)", color: TEXT, fontSize: 12, outline: "none" };
const formAction = { display: "flex", alignItems: "end", minHeight: 40 };
const inlineConfirm = { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" };
const confirmText = { color: MUTED, fontSize: 11, fontWeight: 700 };
const emptyFormNote = { margin: "10px 0 0", color: MUTED, fontSize: 11 };
const checkboxLabel = { display: "flex", gap: 8, alignItems: "center", fontSize: 12 };
