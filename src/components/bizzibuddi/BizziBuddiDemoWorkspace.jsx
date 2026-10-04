import { useEffect, useMemo, useRef, useState } from "react";
import { bizzibuddiDemoData as seedData, getDemoSummary } from "../../data/bizzibuddiDemoData";

const BLUE = "#2563EB";
const CYAN = "#00B4DB";
const TEXT = "#FFFFFF";
const MUTED = "#B8C6D6";
const BORDER = "rgba(255,255,255,.14)";
const DEMO_SESSION_KEY = "bizzibuddi-demo-session-v1";

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
    if (module === "buddi") return <BuddiDemo data={data} />;

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
        {data.appointments.map((appointment) => (
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

function RecordList({ title, rows, fields }) {
  return (
    <article style={card}>
      <SectionHeading label="DEMO DATA" title={title} count={rows.length} />
      <div style={recordList}>
        {rows.map((row) => (
          <div key={row.id} style={rowStyle}>
            <div style={recordGrid}>
              {fields.map((field) => (
                <div key={field}>
                  <small style={muted}>{label(field)}</small>
                  <strong style={{ display: "block", marginTop: 3, fontSize: 13 }}>{String(row[field] ?? "—")}</strong>
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

function BuddiDemo({ data }) {
  const priorities = [];
  if (data.appointments.length) priorities.push(data.appointments[0].title);
  const unpaid = data.invoices.find((invoice) => Number(invoice.balance) > 0);
  if (unpaid) priorities.push(unpaid.number + " has an outstanding balance");
  const activeProduction = data.production.find((record) => record.stage !== "Complete");
  if (activeProduction) priorities.push(activeProduction.jobTitle + " is in production");

  return (
    <article style={card}>
      <small style={muted}>ASK BUDDI</small>
      <h3 style={{ margin: "6px 0", fontSize: 22 }}>Your business assistant</h3>
      <p style={copy}>This demo response changes as you modify the sample business.</p>
      <div style={promptBox}>
        “What needs attention today?”
        <br />
        <strong style={{ display: "block", marginTop: 8 }}>
          {priorities.length ? priorities.join(" · ") : "Nothing currently needs attention."}
        </strong>
      </div>
      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
        {["Who currently owes me money?", "What is due this week?", "Which jobs need attention?", "Show me production workload"].map((item) => (
          <div key={item} style={rowStyle}>
            <span>{item}</span>
            <span style={{ color: CYAN }}>Ask Buddi →</span>
          </div>
        ))}
      </div>
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
