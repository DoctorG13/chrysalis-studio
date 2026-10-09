import { useEffect, useRef, useState } from "react";
import BizziBuddiLogo from "../components/common/BizziBuddiLogo";
import BizziBuddiAccountBuddi from "../components/common/BizziBuddiAccountBuddi";
import { bizzibuddiPlans, getBizzibuddiPlan, hasBizzibuddiFeature } from "../data/bizzibuddiPlans";
import { buildBizziBuddiIntelligence } from "../utils/bizzibuddiIntelligence";
import BizziBuddiDemoWorkspace from "../components/bizzibuddi/BizziBuddiDemoWorkspace";

const RED = "#2563EB";
const CYAN = "#00B4DB";
const BG = "#061A2B";
const SURFACE = "#0F2D4A";
const TEXT = "#FFFFFF";
const MUTED = "#B8C6D6";
const BORDER = "rgba(255,255,255,.16)";

const plans = bizzibuddiPlans;

export default function BizzibuddiAccountPage() {
  const initialRouteParams = new URLSearchParams(window.location.search);
  const initialView = initialRouteParams.get("view");
  let hasDemoSession = false;
  try {
    hasDemoSession = Boolean(window.sessionStorage.getItem("bizzibuddi-demo-session-v1"));
  } catch {
    hasDemoSession = false;
  }
  const initialDemoMode = initialView === "demo" || (hasDemoSession && initialView !== "login" && initialView !== "create");
  const initialDeepLink = {
    personId: initialRouteParams.get("person") || "",
    jobId: initialRouteParams.get("job") || "",
    appointmentId: initialRouteParams.get("appointment") || "",
    invoiceId: initialRouteParams.get("invoice") || "",
  };
  const requestedViews = new Set(["dashboard", "people", "jobs", "calendar", "finance", "automation", "production", "reports", "buddi", "plans", "account", "help", "demo", "first-run"]);
  const requestedView = requestedViews.has(initialView) ? initialView : "";
  const [view, setView] = useState(
    initialView === "create" ? "create" : initialView === "first-run" ? "first-run" : initialDemoMode ? "demo" : "login"
  );
  const [deepLink, setDeepLink] = useState(initialDeepLink);
  const [account, setAccount] = useState(null);
  const [message, setMessage] = useState("");
  const [buddiPrompt, setBuddiPrompt] = useState("");
  const [people, setPeople] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [automationEvents, setAutomationEvents] = useState([]);
  const [productionRecords, setProductionRecords] = useState([]);
  const [productionTemplates, setProductionTemplates] = useState([]);
  const [productionTimeEntries, setProductionTimeEntries] = useState([]);
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false);
  const initialWorkspaceNavSection =
    requestedView === "dashboard" || !requestedView
      ? "today"
      : requestedView === "people" || requestedView === "jobs" || requestedView === "calendar" || requestedView === "production"
      ? "work"
      : requestedView === "finance"
        ? "finance"
        : requestedView === "reports"
          ? "insights"
          : requestedView === "buddi" || requestedView === "automation"
            ? "assist"
            : "account";
  const initialWorkspaceNavItem =
    requestedView === "dashboard" || !requestedView
      ? "overview"
      : requestedView === "people"
        ? "people"
        : requestedView === "jobs"
          ? "jobs"
          : requestedView === "calendar"
            ? "calendar"
            : requestedView === "production"
              ? "production"
              : requestedView === "finance"
                ? "finance-overview"
                : requestedView === "reports"
                  ? "reports"
                  : requestedView === "buddi"
                    ? "buddi"
                    : requestedView === "automation"
                      ? "automation"
                      : requestedView === "plans"
                        ? "plans"
                        : requestedView === "account"
                          ? "account"
                          : "overview";
  const [workspaceNavSection, setWorkspaceNavSection] = useState(initialWorkspaceNavSection);
  const [workspaceNavItem, setWorkspaceNavItem] = useState(initialWorkspaceNavItem);
  const [workspaceScrollTarget, setWorkspaceScrollTarget] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!workspaceScrollTarget) return undefined;

    if (workspaceScrollTarget === "__top__") {
      const frame = window.requestAnimationFrame(() => {
        if (!cancelled) window.scrollTo({ top: 0, behavior: "auto" });
      });
      return () => {
        cancelled = true;
        window.cancelAnimationFrame(frame);
      };
    }
    let attempts = 0;
    let timer = null;

    const scrollToTarget = () => {
      if (cancelled) return;
      const element = document.getElementById(workspaceScrollTarget);
      if (element) {
        const nav = document.querySelector(".bizzibuddi-workspace-sticky-nav");
        const navHeight = nav ? nav.getBoundingClientRect().height : 0;
        const targetTop = element.getBoundingClientRect().top + window.scrollY - navHeight - 16;
        window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
        setWorkspaceScrollTarget("");
        return;
      }
      attempts += 1;
      if (attempts < 20) timer = window.setTimeout(scrollToTarget, 50);
      else setWorkspaceScrollTarget("");
    };

    const frame = window.requestAnimationFrame(scrollToTarget);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      if (timer) window.clearTimeout(timer);
    };
  }, [workspaceScrollTarget, view, account, people.length, jobs.length, appointments.length, invoices.length, productionRecords.length]);

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
      selectView(nextView);
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

        if (initialDemoMode) {
          // A public Demo session must remain isolated from the authenticated workspace.
          return;
        }

        await applyAccount(result.account);
        if (result.account.business) {
          setView(requestedView || "dashboard");
          setDeepLink(initialDeepLink);
        } else {
          setView("onboarding");
          setDeepLink({});
        }
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

    const [peopleResult, jobsResult, calendarResult, invoicesResult, automationResult, productionResult, productionTemplatesResult, productionTimeResult] = await Promise.allSettled([
      bizzibuddiAuthRequest("/api/bizzibuddi/auth/people"),
      bizzibuddiAuthRequest("/api/bizzibuddi/auth/jobs"),
      bizzibuddiAuthRequest("/api/bizzibuddi/auth/calendar"),
      bizzibuddiAuthRequest("/api/bizzibuddi/auth/invoices"),
      bizzibuddiAuthRequest("/api/bizzibuddi/auth/automation"),
      bizzibuddiAuthRequest("/api/bizzibuddi/auth/production"),
      bizzibuddiAuthRequest("/api/bizzibuddi/auth/production/templates"),
      bizzibuddiAuthRequest("/api/bizzibuddi/auth/production/time"),
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
    setProductionTemplates(
      productionTemplatesResult.status === "fulfilled" && Array.isArray(productionTemplatesResult.value.templates)
        ? productionTemplatesResult.value.templates
        : []
    );
    setProductionTimeEntries(
      productionTimeResult.status === "fulfilled" && Array.isArray(productionTimeResult.value.entries)
        ? productionTimeResult.value.entries
        : []
    );
  }

  async function recordAccountPayment(invoiceId, payment) {
    const result = await bizzibuddiAuthRequest(
      "/api/bizzibuddi/auth/invoices/" + encodeURIComponent(invoiceId) + "/payments",
      {
        method: "POST",
        body: JSON.stringify(payment),
      }
    );

    setInvoices((current) =>
      current.map((invoice) => invoice.id === invoiceId ? result.invoice : invoice)
    );

    return result.invoice;
  }

  async function updateAccountPayment(paymentId, payment) {
    const result = await bizzibuddiAuthRequest(
      "/api/bizzibuddi/auth/payments/" + encodeURIComponent(paymentId),
      {
        method: "PUT",
        body: JSON.stringify(payment),
      }
    );

    setInvoices((current) =>
      current.map((invoice) =>
        invoice.id === result.invoice.id ? result.invoice : invoice
      )
    );

    return result.invoice;
  }

  async function deleteAccountPayment(invoiceId, paymentId) {
    const result = await bizzibuddiAuthRequest(
      "/api/bizzibuddi/auth/payments/" + encodeURIComponent(paymentId),
      {
        method: "DELETE",
      }
    );

    setInvoices((current) =>
      current.map((invoice) =>
        invoice.id === result.invoice.id ? result.invoice : invoice
      )
    );

    return result.invoice;
  }

  function writeWorkspaceRoute(nextView, target = {}) {
    const params = new URLSearchParams();
    if (nextView) params.set("view", nextView);
    if (target.personId) params.set("person", target.personId);
    if (target.jobId) params.set("job", target.jobId);
    if (target.appointmentId) params.set("appointment", target.appointmentId);
    if (target.invoiceId) params.set("invoice", target.invoiceId);
    if (target.fromDemo) params.set("from", "demo");

    const query = params.toString();
    const nextUrl = window.location.pathname + (query ? "?" + query : "");
    window.history.pushState({}, "", nextUrl);
  }

  function navigateWorkspaceSection(section) {
    const firstItem = workspaceSubnav[section]?.[0];
    setWorkspaceNavSection(section);
    setWorkspaceNavItem(firstItem?.[0] || "overview");
    if (!firstItem) return;
    if (firstItem[2] === "buddi") {
      openBuddi();
      return;
    }
    selectView(firstItem[2] || "dashboard", { workspaceAnchor: firstItem[3] || "", workspaceNavItem: firstItem[0] || "" });
  }

  function navigateWorkspaceSubitem(section, item) {
    const [key, , targetView, workspaceAnchor] = item;
    setWorkspaceNavSection(section);
    setWorkspaceNavItem(key);
    if (targetView === "buddi") {
      openBuddi();
      return;
    }
    if (targetView === "logout") {
      handleLogout();
      return;
    }
    selectView(targetView || "dashboard", { workspaceAnchor: workspaceAnchor || "", workspaceNavItem: key });
  }

  function selectView(nextView, target = {}) {
    const protectedViews = new Set([
      "onboarding",
      "first-run",
      "dashboard",
      "people",
      "jobs",
      "calendar",
      "finance",
      "automation",
      "production",
      "reports",
      "buddi",
      "account",
    ]);

    if (protectedViews.has(nextView) && !account) {
      setMessage("Please log in or create your BizziBuddi account first.");
      setView("login");
      return;
    }

    const nextDeepLink = {
      personId: target.personId || "",
      jobId: target.jobId || "",
      appointmentId: target.appointmentId || "",
      invoiceId: target.invoiceId || "",
    };

    writeWorkspaceRoute(nextView, nextDeepLink);
    setDeepLink(nextDeepLink);
    setView(nextView);
    setWorkspaceScrollTarget(target.workspaceAnchor || "__top__");
    setWorkspaceNavItem(
      target.workspaceNavItem ||
        (nextView === "dashboard"
          ? "overview"
          : nextView === "people"
            ? "people"
            : nextView === "jobs"
              ? "jobs"
              : nextView === "calendar"
                ? "calendar"
                : nextView === "production"
                  ? "production"
                  : nextView === "finance"
                    ? "finance-overview"
                    : nextView === "reports"
                      ? "reports"
                      : nextView === "buddi"
                        ? "buddi"
                        : nextView === "automation"
                          ? "automation"
                          : nextView === "plans"
                            ? "plans"
                            : nextView === "account"
                              ? "account"
                              : "overview")
    );
    if (nextView === "dashboard") {
      setWorkspaceNavSection("today");
    } else if (["people", "jobs", "calendar", "production"].includes(nextView)) {
      setWorkspaceNavSection("work");
    } else if (nextView === "finance") {
      setWorkspaceNavSection("finance");
    } else if (nextView === "reports") {
      setWorkspaceNavSection("insights");
    } else if (["buddi", "automation"].includes(nextView)) {
      setWorkspaceNavSection("assist");
    } else if (nextView === "plans" || nextView === "account") {
      setWorkspaceNavSection("account");
    }
    setMessage("");
    if (nextView !== "buddi") setBuddiPrompt("");
  }

  function openBuddi(prompt = "") {
    if (!account) {
      setMessage("Please log in or create your BizziBuddi account first.");
      setView("login");
      return;
    }

    writeWorkspaceRoute("buddi");
    setDeepLink({});
    setBuddiPrompt(String(prompt || "").trim());
    setWorkspaceNavSection("assist");
    setView("buddi");
    setMessage("");
  }

  useEffect(() => {
    function handleWorkspaceHistory() {
      const params = new URLSearchParams(window.location.search);
      const nextView = requestedViews.has(params.get("view")) ? params.get("view") : "dashboard";
      setDeepLink({
        personId: params.get("person") || "",
        jobId: params.get("job") || "",
        appointmentId: params.get("appointment") || "",
        invoiceId: params.get("invoice") || "",
      });
      if (account) {
        setView(nextView);
        setWorkspaceNavItem(
          nextView === "dashboard"
            ? "overview"
            : nextView === "people"
              ? "people"
              : nextView === "jobs"
                ? "jobs"
                : nextView === "calendar"
                  ? "calendar"
                  : nextView === "production"
                    ? "production"
                    : nextView === "finance"
                      ? "finance-overview"
                      : nextView === "reports"
                        ? "reports"
                        : nextView === "buddi"
                          ? "buddi"
                          : nextView === "automation"
                            ? "automation"
                            : nextView === "plans"
                              ? "plans"
                              : nextView === "account"
                                ? "account"
                                : "overview"
        );
        if (nextView === "dashboard") {
          setWorkspaceNavSection("today");
        } else if (["people", "jobs", "calendar", "production"].includes(nextView)) {
          setWorkspaceNavSection("work");
        } else if (nextView === "finance") {
          setWorkspaceNavSection("finance");
        } else if (nextView === "reports") {
          setWorkspaceNavSection("insights");
        } else if (["buddi", "automation"].includes(nextView)) {
          setWorkspaceNavSection("assist");
        } else if (nextView === "plans" || nextView === "account") {
          setWorkspaceNavSection("account");
        }
      }
    }

    window.addEventListener("popstate", handleWorkspaceHistory);
    return () => window.removeEventListener("popstate", handleWorkspaceHistory);
  }, [account]);

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
      setDeepLink({});
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
      setMessage("Welcome back, " + result.account.name + ".");
      if (result.account.business) {
        setView(requestedView || "dashboard");
        setDeepLink(initialDeepLink);
      } else {
        setView("onboarding");
        setDeepLink({});
      }
    } catch (error) {
      setMessage(error.message || "We could not sign you in.");
    }
  }

  function openDemoWorkspace() {
    writeWorkspaceRoute("demo");
    setAccount(null);
    setDeepLink({});
    setMessage("");
    setView("demo");
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
    window.history.replaceState({}, "", window.location.pathname + "?view=login");
    setDeepLink({});
    setMessage("You have been logged out.");
    setView("login");
  }

  async function completeOnboarding(setup) {
    try {
      const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/account", {
        method: "PUT",
        body: JSON.stringify({
          business: String(setup?.business || account?.business || "").trim(),
          businessType: String(setup?.businessType || account?.businessType || "general").trim(),
          terminology: setup?.terminology || {},
          customFields: Array.isArray(setup?.customFields) ? setup.customFields : [],
        }),
      });

      await applyAccount(result.account);
      setMessage("");
      writeWorkspaceRoute("first-run");
      setView("first-run");
      setDeepLink({});
    } catch (error) {
      setMessage(error.message || "We could not save your business setup.");
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

  async function createProductionTemplate(template) {
    const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/production/templates", {
      method: "POST",
      body: JSON.stringify(template),
    });
    setProductionTemplates((current) =>
      [...current, result.template].sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      )
    );
    return result.template;
  }

  async function updateProductionTemplate(templateId, template) {
    const result = await bizzibuddiAuthRequest(
      "/api/bizzibuddi/auth/production/templates/" + encodeURIComponent(templateId),
      {
        method: "PUT",
        body: JSON.stringify(template),
      }
    );
    setProductionTemplates((current) =>
      current
        .map((item) => (item.id === templateId ? result.template : item))
        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
    );
    return result.template;
  }

  async function deleteProductionTemplate(templateId) {
    await bizzibuddiAuthRequest(
      "/api/bizzibuddi/auth/production/templates/" + encodeURIComponent(templateId),
      { method: "DELETE" }
    );
    setProductionTemplates((current) => current.filter((item) => item.id !== templateId));
  }

  async function startProductionTimer(jobId) {
    const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/production/time/start", {
      method: "POST",
      body: JSON.stringify({ jobId }),
    });
    setProductionTimeEntries((current) => [result.entry, ...current]);
    return result.entry;
  }

  async function stopProductionTimer(entryId) {
    const result = await bizzibuddiAuthRequest(
      "/api/bizzibuddi/auth/production/time/" + encodeURIComponent(entryId) + "/stop",
      { method: "POST" }
    );
    setProductionTimeEntries((current) =>
      current.map((entry) => entry.id === entryId ? result.entry : entry)
    );
    return result.entry;
  }

  function finishFirstRun(nextView = "dashboard") {
    if (account?.id) {
      try {
        localStorage.setItem(storageKey("firstRunComplete", account.id), "1");
      } catch {
        // The first-run flow still works when local storage is unavailable.
      }
    }

    if (nextView === "buddi") {
      openBuddi();
      return;
    }

    selectView(nextView);
  }

  async function resetBusinessData() {
    if (!account?.id) return;

    await bizzibuddiAuthRequest("/api/bizzibuddi/auth/reset", {
      method: "DELETE",
      body: JSON.stringify({ confirmation: "START FRESH" }),
    });

    localStorage.removeItem(storageKey("productionRecords", account.id));
    await applyAccount(account);
    setMessage("Business data cleared. Your BizziBuddi account is ready for a fresh start.");
    setView("dashboard");
  }

  async function saveProductionRecord(record) {
    const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/production", {
      method: "POST",
      body: JSON.stringify(record),
    });

    setProductionRecords((current) => [
      result.record,
      ...current.filter((item) => item.jobId !== result.record.jobId),
    ]);

    setJobs((current) =>
      current.map((job) => {
        if (job.id !== result.record.jobId) return job;

        const tasks = result.record.tasks || [];
        const completedTasks = tasks.filter((task) => task.complete).length;
        const stage = result.record.stage || "Not started";
        const progress = stage === "Complete"
          ? 100
          : stage === "Ready"
            ? 75
            : stage === "Quality check"
              ? 50
              : stage === "In production"
                ? 25
                : 0;
        const today = new Date().toISOString().slice(0, 10);
        const overdue = Boolean(
          result.record.dueDate &&
          result.record.dueDate < today &&
          stage !== "Complete"
        );
        const readiness = stage === "Complete"
          ? "Complete"
          : overdue
            ? "Overdue"
            : stage === "Ready" && tasks.length > 0 && completedTasks < tasks.length
              ? "Tasks outstanding"
              : stage === "Ready"
                ? "Ready"
                : tasks.length > 0 && completedTasks === tasks.length
                  ? "Stage update needed"
                  : stage === "Not started"
                    ? "Not started"
                    : "In progress";

        return {
          ...job,
          productionStage: stage,
          productionProgress: progress,
          productionDueDate: result.record.dueDate || "",
          productionTaskCount: tasks.length,
          productionCompletedTaskCount: completedTasks,
          productionTaskProgress: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
          productionReadiness: readiness,
          productionReadinessDetail:
            readiness === "Complete"
              ? "Production is complete."
              : readiness === "Overdue"
                ? "Ready-by date has passed."
                : readiness === "Tasks outstanding"
                  ? (tasks.length - completedTasks) + " production task(s) remain."
                  : readiness === "Stage update needed"
                    ? "All production tasks are complete."
                    : readiness === "Ready"
                      ? "Production is ready for completion."
                      : readiness === "Not started"
                        ? "Production has not started."
                        : "Production is moving through its workflow.",
        };
      })
    );

    return result.record;
  }

  return (
    <>
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

    <a className="bizzibuddi-skip-link" href="#bizzibuddi-account-content">Skip to account content</a>

    <main className="bizzibuddi-account-page" style={pageStyle}>
      <div style={ambientGlow} />
      <div id="bizzibuddi-account-content" tabIndex="-1" style={shellStyle}>
        <header style={{ ...headerStyle, minHeight: 42, marginBottom: 0 }}>
          <a href="/bizzibuddi" style={{ color: TEXT, textDecoration: "none", display: "inline-flex", alignItems: "center" }}><BizziBuddiLogo size={42} dark showWordmark /></a>
          <a href="/bizzibuddi" style={backLink}>Back to website ↗</a>
        </header>

        <section style={view === "first-run" || view === "onboarding" ? { ...heroStyle, display: "none" } : heroStyle}>
          <div style={eyebrowStyle}>BUSINESS SUPPORT, SIMPLIFIED</div>
          <h1 style={heroHeading}>Your business.<br /><span style={{ color: CYAN }}>Better organised.</span></h1>
          <p style={heroCopy}>Create a secure BizziBuddi account, set up your business and continue into your business workspace.</p>
          <div style={previewBadge}>Secure account and login · People, Jobs, Calendar and Finance are account-backed · No live billing</div>
        </section>

        <nav aria-label="Account preview navigation" className="bizzibuddi-account-nav" style={view === "demo" || view === "first-run" || view === "onboarding" ? { ...workspaceNavShell, display: "none" } : workspaceNavShell}>
          {view === "demo" ? null : !account ? (
            <div className="bizzibuddi-account-nav-main">
              {[["login", "Log in"], ["create", "Create account"], ["demo", "Explore demo"], ["plans", "Plans & upgrade"]].map(([key, label]) => (
                <button key={key} type="button" onClick={() => selectView(key)} style={tabStyle(view === key)}>{label}</button>
              ))}
            </div>
          ) : (
            <div className="bizzibuddi-workspace-sticky-nav" style={workspaceStickyNav}>
              <div
                className="bizzibuddi-workspace-main-nav"
                role="tablist"
                aria-label="BizziBuddi workspace sections"
                style={workspaceMainNav}
              >
                <button
                  type="button"
                  onClick={() => navigateWorkspaceSection("today")}
                  style={workspaceMainTab(workspaceNavSection === "today")}
                  aria-selected={workspaceNavSection === "today"}
                >
                  <span aria-hidden="true">⌂</span> Today
                </button>
                {[
                  ["work", "WORK"],
                  ["finance", "FINANCE"],
                  ["insights", "INSIGHTS"],
                  ["assist", "ASSIST"],
                  ["account", "ACCOUNT"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => navigateWorkspaceSection(key)}
                    style={workspaceMainTab(workspaceNavSection === key)}
                    aria-selected={workspaceNavSection === key}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div
                className="bizzibuddi-workspace-subnav"
                aria-label={workspaceNavSection + " submenu"}
                style={workspaceSubnavTray}
              >
                <div style={workspaceSubnavItems(workspaceNavSection)}>
                  {(getWorkspaceSubnav(account)[workspaceNavSection] || []).map((item) => (
                    <button
                      key={item[0]}
                      type="button"
                      onClick={() => navigateWorkspaceSubitem(workspaceNavSection, item)}
                      style={workspaceSubnavTab(workspaceNavItem === item[0], workspaceNavSection)}
                      title={item[1]}
                    >
                      {item[1]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </nav>

          {account && !["demo", "first-run", "onboarding"].includes(view) && (
            <div className="bizzibuddi-help-rail" aria-label="Help and support">
              <button
                type="button"
                onClick={() => openBuddi()}
                className={view === "buddi" ? "bizzibuddi-help-rail-action primary active" : "bizzibuddi-help-rail-action primary"}
                aria-label="Ask Buddi"
                title="Ask Buddi"
              >
                <span className="bizzibuddi-help-rail-icon primary" aria-hidden="true">•••</span>
                <span className="bizzibuddi-help-rail-label">ASK BUDDI</span>
              </button>
              <button
                type="button"
                onClick={() => selectView("help")}
                className={view === "help" ? "bizzibuddi-help-rail-action active" : "bizzibuddi-help-rail-action"}
                aria-label="Help and Support"
                title="Help & Support"
              >
                <span className="bizzibuddi-help-rail-icon" aria-hidden="true">?</span>
                <span className="bizzibuddi-help-rail-label">HELP</span>
              </button>
            </div>
          )}

        {message && !["login", "create"].includes(view) && <div role="status" aria-live="polite" aria-atomic="true" style={messageStyle}>{message}</div>}
        {view === "demo" && <BizziBuddiDemoWorkspace onExit={() => selectView("login")} onCreateAccount={() => selectView("create", { fromDemo: true })} />}
        {view === "login" && <AuthPanel mode="login" account={account} errorMessage={message === "You have been logged out." ? "" : message} successMessage={message === "You have been logged out." ? message : ""} onSubmit={handleLogin} onSwitch={() => selectView("create")} onExploreDemo={openDemoWorkspace} />}
        {view === "create" && <AuthPanel mode="create" fromDemo={new URLSearchParams(window.location.search).get("from") === "demo"} errorMessage={message} onSubmit={handleCreateAccount} onSwitch={() => selectView("login")} />}
        {view === "onboarding" && <OnboardingPanel account={account} onSubmit={completeOnboarding} />}
        {view === "first-run" && (
          <FirstRunPanel
            account={account}
            onPeople={() => finishFirstRun("people")}
            onJobs={() => finishFirstRun("jobs")}
            onCalendar={() => finishFirstRun("calendar")}
            onFinance={() => finishFirstRun("finance")}
            onGettingStarted={() => finishFirstRun("help")}
            onBuddi={() => finishFirstRun("buddi")}
            onExplore={() => finishFirstRun("dashboard")}
          />
        )}
        {view === "plans" && <PlansPanel onSelectPlan={selectPlan} />}
        {view === "account" && <AccountPanel account={account} onBack={() => selectView("dashboard")} onPlans={() => selectView("plans")} onResetBusiness={resetBusinessData} onAccountUpdate={setAccount} />}
        {view === "dashboard" && <DashboardPanel account={account} onPlans={() => selectView("plans")} onPeople={() => selectView("people")} onJobs={(jobId) => selectView("jobs", jobId ? { jobId } : {})} onCalendar={(appointmentId) => selectView("calendar", appointmentId ? { appointmentId } : {})} onFinance={(invoiceId) => selectView("finance", invoiceId ? { invoiceId } : {})} onAutomation={() => selectView("automation")} onProduction={(jobId) => selectView("production", jobId ? { jobId } : {})} onReports={() => selectView("reports")} onDashboard={() => selectView("dashboard")} onBuddi={() => openBuddi()} onAttentionBuddi={() => openBuddi("What needs attention today?")} onLogout={handleLogout} people={people} jobs={jobs} appointments={appointments} invoices={invoices} automationEvents={automationEvents} productionRecords={productionRecords} productionTimeEntries={productionTimeEntries} onGettingStartedBuddi={() => selectView("help")} />}
        {view === "finance" && (
          <FinancePanel
            account={account}
            invoices={invoices}
            people={people}
            initialInvoiceId={deepLink.invoiceId}
            onPlans={() => selectView("plans")}
            onRecordPayment={recordAccountPayment}
            onUpdatePayment={updateAccountPayment}
            onDeletePayment={deleteAccountPayment}
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
            onIssueInvoice={async (invoiceId) => {
              const result = await bizzibuddiAuthRequest(
                "/api/bizzibuddi/auth/invoices/" + encodeURIComponent(invoiceId) + "/issue",
                { method: "POST" }
              );
              setInvoices((current) =>
                current.map((invoice) => invoice.id === invoiceId ? result.invoice : invoice)
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
            initialAppointmentId={deepLink.appointmentId}
            onOpenProduction={(jobId) => selectView("production", { jobId })}
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
            initialPersonId={deepLink.personId}
            onOpenJob={(jobId) => selectView("jobs", { jobId })}
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
            initialJobId={deepLink.jobId}
            onOpenProduction={(jobId) => selectView("production", { jobId })}
            onOpenJob={(jobId) => selectView("jobs", { jobId })}
            onBack={() => selectView("dashboard")}
          />
        )}
        {view === "automation" && <AutomationPanel account={account} events={automationEvents} invoices={invoices} onPlans={() => selectView("plans")} onRunChecks={runAutomationChecks} onBack={() => selectView("dashboard")} />}
        {view === "production" && (
          <ProductionPanel
            account={account}
            jobs={jobs}
            records={productionRecords}
            templates={productionTemplates}
            onPlans={() => selectView("plans")}
            onCreateTemplate={createProductionTemplate}
            onUpdateTemplate={updateProductionTemplate}
            onDeleteTemplate={deleteProductionTemplate}
            timeEntries={productionTimeEntries}
            onStartTimer={startProductionTimer}
            onStopTimer={stopProductionTimer}
            initialJobId={deepLink.jobId}
            onSave={saveProductionRecord}
            onBack={() => selectView("dashboard")}
          />
        )}
        {view === "reports" && <ReportsPanel account={account} people={people} jobs={jobs} appointments={appointments} invoices={invoices} productionRecords={productionRecords} onPlans={() => selectView("plans")} onBack={() => selectView("dashboard")} />}
        {view === "buddi" && <BizziBuddiAccountBuddi account={account} people={people} jobs={jobs} appointments={appointments} invoices={invoices} automationEvents={automationEvents} productionRecords={productionRecords} initialPrompt={buddiPrompt} onFinance={() => selectView("finance")} onCalendar={() => selectView("calendar")} onJobs={() => selectView("jobs")} onProduction={(jobId) => selectView("production", { jobId })} onSaveProduction={saveProductionRecord} onCreateInvoice={async (invoice) => {
          const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/invoices", {
            method: "POST",
            body: JSON.stringify(invoice),
          });
          setInvoices((current) => [result.invoice, ...current]);
          return result.invoice;
        }} onRecordPayment={recordAccountPayment} onAddAppointment={async (appointment) => {
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
        }} onAddPerson={async (person) => {
          const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/people", {
            method: "POST",
            body: JSON.stringify(person),
          });
          setPeople((current) => [...current, result.person]);
          return result.person;
        }} onAddJob={async (job) => {
          const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/jobs", {
            method: "POST",
            body: JSON.stringify(job),
          });
          setJobs((current) => [...current, result.job]);
          return result.job;
        }} onBack={() => selectView("dashboard")} />}
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
              .bizzibuddi-skip-link {
                position: fixed;
                left: 16px;
                top: -80px;
                z-index: 2000;
                padding: 10px 14px;
                border-radius: 9px;
                background: #FFFFFF;
                color: #061A2B;
                font-weight: 800;
                text-decoration: none;
                box-shadow: 0 10px 24px rgba(0,0,0,.25);
                transition: top .16s ease;
              }
              .bizzibuddi-skip-link:focus {
                top: 16px;
                outline: 3px solid rgba(0,180,219,.55);
                outline-offset: 3px;
              }
              .bizzibuddi-account-page {
                -webkit-font-smoothing: antialiased;
                text-rendering: optimizeLegibility;
              }
              .bizzibuddi-account-page button,
              .bizzibuddi-account-page input,
              .bizzibuddi-account-page select,
              .bizzibuddi-account-page textarea {
                font: inherit;
              }
              .bizzibuddi-account-page button {
                transition: transform .16s ease, border-color .16s ease, background-color .16s ease, box-shadow .16s ease, opacity .16s ease;
              }
              .bizzibuddi-account-page button:not(:disabled):hover {
                transform: translateY(-1px);
              }
              .bizzibuddi-account-page button:not(:disabled):active {
                transform: translateY(0);
              }
              .bizzibuddi-account-page button:focus-visible,
              .bizzibuddi-account-page a:focus-visible,
              .bizzibuddi-account-page input:focus-visible,
              .bizzibuddi-account-page select:focus-visible,
              .bizzibuddi-account-page textarea:focus-visible {
                outline: 3px solid rgba(0,180,219,.45);
                outline-offset: 3px;
              }
              .bizzibuddi-account-page input::placeholder,
              .bizzibuddi-account-page textarea::placeholder {
                color: rgba(184,198,214,.62);
              }
              .bizzibuddi-account-page input,
              .bizzibuddi-account-page select,
              .bizzibuddi-account-page textarea {
                transition: border-color .16s ease, box-shadow .16s ease, background-color .16s ease;
              }
              .bizzibuddi-account-page input:hover,
              .bizzibuddi-account-page select:hover,
              .bizzibuddi-account-page textarea:hover {
                border-color: rgba(0,180,219,.42) !important;
              }
              .bizzibuddi-account-page input:focus,
              .bizzibuddi-account-page select:focus,
              .bizzibuddi-account-page textarea:focus {
                border-color: rgba(0,180,219,.78) !important;
                box-shadow: 0 0 0 3px rgba(0,180,219,.10);
              }
              .bizzibuddi-account-page .bizzibuddi-account-nav {
                padding: 12px;
                border: 1px solid rgba(255,255,255,.10);
                border-radius: 18px;
                background: rgba(6,26,43,.46);
                box-shadow: 0 14px 32px rgba(0,0,0,.12);
                backdrop-filter: blur(14px);
              }
              .bizzibuddi-account-page .bizzibuddi-account-nav-main button {
                min-height: 42px;
              }
              .bizzibuddi-account-page .bizzibuddi-help-action:hover {
                border-color: rgba(0,180,219,.78);
                box-shadow: 0 10px 26px rgba(0,0,0,.18);
              }
              .bizzibuddi-account-page .bizzibuddi-help-action-secondary:hover {
                background: rgba(0,180,219,.09);
              }
              .bizzibuddi-account-page kbd {
                box-shadow: inset 0 -1px 0 rgba(255,255,255,.10);
              }
              .bizzibuddi-account-page img {
                max-width: 100%;
                height: auto;
              }
              .bizzibuddi-table-scroll {
                width: 100%;
                max-width: 100%;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                border-radius: 12px;
                scrollbar-width: thin;
              }
              .bizzibuddi-table-scroll:focus-visible {
                outline: 3px solid rgba(0,180,219,.45);
                outline-offset: 4px;
              }
              @media (max-width: 900px) {
                .bizzibuddi-account-page .bizzibuddi-workspace-main-nav {
                  grid-template-columns: repeat(3, minmax(0, 1fr));
                  gap: 4px;
                }
                .bizzibuddi-account-page .bizzibuddi-workspace-subnav {
                  grid-template-columns: repeat(3, minmax(0, 1fr));
                }
                .bizzibuddi-account-page .bizzibuddi-workspace-subnav > div {
                  grid-column: 1 / -1 !important;
                }
                .bizzibuddi-account-page .bizzibuddi-workspace-subnav button {
                  max-width: 100%;
                }
                .bizzibuddi-account-page .bizzibuddi-account-nav-main {
                  width: 100%;
                }
                .bizzibuddi-account-page .bizzibuddi-account-nav-main button {
                  flex: 1 1 120px;
                }
                .bizzibuddi-account-page .bizzibuddi-workspace-nav {
                  width: 100%;
                }
                .bizzibuddi-account-page .bizzibuddi-workspace-nav-group {
                  flex: 1 1 180px;
                }
                .bizzibuddi-account-page .bizzibuddi-help-nav {
                  min-width: 0;
                }
              }
              @media (max-width: 560px) {
                .bizzibuddi-account-page .bizzibuddi-workspace-main-nav {
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                  gap: 4px;
                }
                .bizzibuddi-account-page .bizzibuddi-workspace-main-nav button {
                  min-height: 36px !important;
                  padding: 6px 4px !important;
                  font-size: 10px !important;
                }
                .bizzibuddi-account-page .bizzibuddi-workspace-subnav {
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                }
                .bizzibuddi-account-page .bizzibuddi-workspace-subnav > div {
                  grid-column: 1 / -1 !important;
                }
                .bizzibuddi-account-page .bizzibuddi-workspace-subnav button {
                  padding: 4px 7px !important;
                  font-size: 9px !important;
                }
                .bizzibuddi-account-page {
                  padding-top: 18px !important;
                }
                .bizzibuddi-account-page .bizzibuddi-account-nav-main {
                  display: grid;
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                  width: 100%;
                }
                .bizzibuddi-account-page .bizzibuddi-workspace-nav {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  align-items: stretch;
                }
                .bizzibuddi-account-page .bizzibuddi-workspace-nav-home {
                  grid-column: 1 / -1;
                }
                .bizzibuddi-account-page .bizzibuddi-workspace-nav-group {
                  border-left: 0;
                  padding: 7px 4px;
                }
                .bizzibuddi-account-page .bizzibuddi-account-nav-main button {
                  width: 100%;
                  min-width: 0;
                }
                .bizzibuddi-account-page .bizzibuddi-help-action {
                  grid-template-columns: 38px minmax(0, 1fr) 30px;
                  gap: 8px;
                  padding: 9px;
                }
                .bizzibuddi-account-page .bizzibuddi-help-action-copy strong {
                  font-size: 13px;
                }
                .bizzibuddi-account-page .bizzibuddi-help-action-copy small {
                  font-size: 9px;
                }
              }
              @media (max-width: 760px) {
                .bizzibuddi-account-page .bizzibuddi-people-hero {
                  align-items: flex-start;
                  margin-top: 16px !important;
                }
                .bizzibuddi-account-page .bizzibuddi-people-hero h2 {
                  font-size: 34px !important;
                }
                .bizzibuddi-account-page .bizzibuddi-people-hero button {
                  width: 100% !important;
                }
                .bizzibuddi-account-page .bizzibuddi-people-summary {
                  grid-template-columns: 1fr !important;
                }
              }
                .bizzibuddi-account-page .bizzibuddi-today-overview {
                  margin-top: 16px !important;
                  padding: 16px !important;
                }
                .bizzibuddi-account-page .bizzibuddi-today-panel {
                  padding: 15px !important;
                  margin-top: 14px !important;
                }
                .bizzibuddi-account-page .bizzibuddi-today-overview h3,
                .bizzibuddi-account-page .bizzibuddi-today-panel h3 {
                  font-size: 21px !important;
                }
                .bizzibuddi-account-page .bizzibuddi-attention-summary {
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                  margin-top: 14px;
                }
                .bizzibuddi-account-page .bizzibuddi-today-header {
                  gap: 10px;
                }
                .bizzibuddi-account-page .bizzibuddi-today-grid {
                  grid-template-columns: 1fr;
                }
              }
                .bizzibuddi-account-page {
                  padding-left: 14px !important;
                  padding-right: 14px !important;
                  padding-bottom: 48px !important;
                }
                .bizzibuddi-account-page .bizzibuddi-account-nav {
                  padding: 10px;
                  margin-top: 26px !important;
                }
              }
              @media (prefers-reduced-motion: reduce) {
                .bizzibuddi-account-page button,
                .bizzibuddi-account-page input,
                .bizzibuddi-account-page select,
                .bizzibuddi-account-page textarea {
                  transition: none !important;
                }
                .bizzibuddi-account-page button:not(:disabled):hover {
                  transform: none;
                }
              }
              .bizzibuddi-account-nav-main { display:flex; justify-content:center; gap:10px; flex-wrap:wrap; }
              .bizzibuddi-workspace-nav { display:flex; align-items:flex-end; justify-content:center; gap:10px; flex-wrap:wrap; width:100%; }
              .bizzibuddi-workspace-nav-home { align-self:stretch; display:flex; align-items:flex-end; }
              .bizzibuddi-workspace-nav-home button { min-width:92px; font-weight:900; }
              .bizzibuddi-workspace-nav-group { display:grid; gap:4px; padding:0 9px 1px; border-left:1px solid rgba(255,255,255,.12); }
              .bizzibuddi-workspace-nav-group:first-of-type { border-left:0; }
              .bizzibuddi-workspace-nav-group > small { color:#7FDFF0; font-size:9px; font-weight:900; letter-spacing:.16em; text-align:center; }
              .bizzibuddi-workspace-nav-group > div { display:flex; gap:5px; flex-wrap:wrap; justify-content:center; }
              .bizzibuddi-workspace-nav-group button { padding:9px 11px !important; min-height:38px !important; font-size:12px !important; }
              .bizzibuddi-workspace-nav-group.secondary { opacity:.82; }
              .bizzibuddi-help-rail {
                position: fixed;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                z-index: 60;
                display: grid;
                gap: 7px;
                width: 58px;
                padding: 6px;
                box-sizing: border-box;
                border: 1px solid rgba(0,180,219,.22);
                border-radius: 18px;
                background: rgba(6,28,47,.88);
                box-shadow: 0 14px 34px rgba(0,0,0,.28);
                backdrop-filter: blur(14px);
                -webkit-backdrop-filter: blur(14px);
              }
              .bizzibuddi-help-rail-action {
                width: 46px;
                min-height: 104px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 7px;
                padding: 8px 4px;
                box-sizing: border-box;
                border: 1px solid rgba(72,133,186,.38);
                border-radius: 13px;
                background: rgba(255,255,255,.025);
                color: #fff;
                cursor: pointer;
              }
              .bizzibuddi-help-rail-action.primary {
                border-color: rgba(0,180,219,.48);
                background: linear-gradient(180deg, rgba(0,180,219,.14), rgba(37,99,235,.16));
              }
              .bizzibuddi-help-rail-action.active {
                border-color: #2DE8FF;
                background: rgba(0,180,219,.14);
                box-shadow: 0 0 18px rgba(0,180,219,.16);
              }
              .bizzibuddi-help-rail-action.primary.active {
                background: linear-gradient(180deg, #12DDF5 0%, #1688F5 48%, #2563EB 100%);
              }
              .bizzibuddi-help-rail-icon {
                width: 30px;
                height: 30px;
                display: grid;
                place-items: center;
                border-radius: 10px;
                border: 1px solid rgba(0,180,219,.42);
                color: #00B4DB;
                background: rgba(0,180,219,.08);
                font-size: 16px;
                font-weight: 900;
              }
              .bizzibuddi-help-rail-icon.primary {
                border-color: rgba(255,255,255,.45);
                color: #fff;
                background: rgba(255,255,255,.12);
                letter-spacing: .08em;
              }
              .bizzibuddi-help-rail-label {
                writing-mode: vertical-rl;
                transform: none;
                color: #BFD8F0;
                font-size: 9px;
                font-weight: 900;
                letter-spacing: .12em;
                line-height: 1;
              }
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
                .bizzibuddi-help-rail {
                  right: 10px;
                  left: 10px;
                  top: auto;
                  bottom: 10px;
                  transform: none;
                  width: auto;
                  grid-template-columns: 1fr 1fr;
                  gap: 6px;
                  padding: 5px;
                  border-radius: 15px;
                }
                .bizzibuddi-help-rail-action {
                  width: 100%;
                  min-height: 50px;
                  flex-direction: row;
                  gap: 8px;
                  padding: 6px 10px;
                  border-radius: 11px;
                }
                .bizzibuddi-help-rail-label {
                  writing-mode: horizontal-tb;
                  transform: none;
                  font-size: 10px;
                }
                .bizzibuddi-help-rail-icon {
                  width: 28px;
                  height: 28px;
                }
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
    </>
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

  const legacyToMigrate = legacy.filter(
    (record) => record?.jobId && !recordsByJobId.has(record.jobId)
  );

  if (legacyToMigrate.length) {
    const migrationResults = await Promise.allSettled(
      legacyToMigrate.map((legacyRecord) =>
        bizzibuddiAuthRequest("/api/bizzibuddi/auth/production", {
          method: "POST",
          body: JSON.stringify(legacyRecord),
        })
      )
    );

    for (const result of migrationResults) {
      if (result.status === "fulfilled" && result.value?.record?.jobId) {
        recordsByJobId.set(result.value.record.jobId, result.value.record);
      } else if (result.status === "rejected") {
        migrationFailed = true;
      }
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

function AuthPanel({ mode, account, errorMessage, successMessage, onSubmit, onSwitch, onExploreDemo, fromDemo = false }) {
  const login = mode === "login";
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    setValidationError("");
  }, [mode, fromDemo]);

  const visibleError = validationError || errorMessage;

  function handleAuthSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const name = String(form.get("name") || "").trim();
    const username = String(form.get("username") || "").trim();
    const email = String(form.get("email") || "").trim();
    const identifier = String(form.get("identifier") || "").trim();
    const password = String(form.get("password") || "");

    let error = "";

    if (!login && !name) error = "Please enter your full name.";
    else if (!login && !username) error = "Please choose a username.";
    else if (!login && !email) error = "Please enter your email address.";
    else if (!login && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error = "Please enter a valid email address.";
    else if (login && !identifier) error = "Please enter your email address or username.";
    else if (!password) error = "Please enter your password.";
    else if (!login && password.length < 10) error = "Your password must be at least 10 characters.";

    if (error) {
      setValidationError(error);
      window.requestAnimationFrame(() => {
        document.getElementById("bizzibuddi-auth-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }

    setValidationError("");
    onSubmit(event);
  }

  return <section style={cardStyle(560)}>
    <div style={centerStyle}>
      <div style={stepBadge}>{login ? "SIGN IN" : "STEP 1 OF 2 · ACCOUNT"}</div>
      <BizziBuddiLogo size={78} dark showWordmark={false} />
      <h2 style={sectionHeading}>{login ? "Welcome back." : "Let’s get started."}</h2>
      <p style={copyStyle}>
        {login
          ? "Use your email address or username to continue."
          : fromDemo
            ? "Create your real BizziBuddi account. Your demo data will not be copied across."
            : "Create your secure BizziBuddi account and begin your business setup."}
      </p>
    </div>

    {visibleError && (
      <div
        id="bizzibuddi-auth-error"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        style={authErrorStyle}
      >
        <strong>{login ? "We couldn't log you in." : "We couldn't create your account."}</strong>
        <span>{visibleError}</span>
      </div>
    )}

    {successMessage && (
      <div
        id="bizzibuddi-auth-success"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ ...authErrorStyle, background: "rgba(37,99,235,.10)", border: `1px solid ${RED}` }}
      >
        <span>{successMessage}</span>
      </div>
    )}

    {fromDemo && !login && (
      <div style={{ ...businessNote, marginTop: 18 }}>
        <strong>Starting your real workspace</strong>
        <span style={{ display: "block", marginTop: 5 }}>The Harbour & Thread sample business stays in the Demo. Your new account starts clean.</span>
      </div>
    )}
    <form onSubmit={handleAuthSubmit} noValidate style={{ marginTop: 28 }}>
      {!login && <Field name="name" label="Full name" type="text" placeholder="Your name" />}
      {!login && <Field name="username" label="Username" type="text" placeholder="Choose a username" />}
      {!login && <Field name="email" label="Email address" type="email" placeholder="you@example.com" />}
      {login && <Field name="identifier" label="Email address or username" type="text" placeholder="you@example.com or username" />}
      <Field name="password" label="Password" type="password" placeholder={login ? "Your password" : "At least 10 characters"} />
      <button type="submit" style={primaryButton}>{login ? "Log in" : "Create account →"}</button>
    </form>
    {login && onExploreDemo && (
      <button type="button" onClick={onExploreDemo} style={secondaryButton}>
        Explore BizziBuddi with sample data
      </button>
    )}
    <p style={switchText}>{login ? "New to BizziBuddi?" : "Already have an account?"} <button type="button" onClick={onSwitch} style={textButton}>{login ? "Create an account" : "Log in"}</button></p>
    {login && account && <p style={smallText}>Signed in account available for {account.email} · @{account.username}.</p>}
  </section>;
}

function FirstRunPanel({
  account,
  onPeople,
  onJobs,
  onCalendar,
  onFinance,
  onGettingStarted,
  onBuddi,
  onExplore,
}) {
  const steps = [
    ["1", "Add your first person", "Start your customer, client or contact list.", onPeople],
    ["2", "Create your first job", "Track the work you need to deliver.", onJobs],
    ["3", "Schedule something", "Put the next important date on your calendar.", onCalendar],
    ["4", "Set up Finance", "Create your first invoice or payment.", onFinance],
  ];

  return (
    <section
      aria-labelledby="bizzibuddi-first-run-title"
      style={{
        ...cardStyle(900),
        marginTop: 18,
        padding: 28,
        border: "1px solid rgba(0,180,219,.38)",
        background: "linear-gradient(135deg, rgba(0,180,219,.11), rgba(37,99,235,.08))",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ textAlign: "center" }}>
          <small style={{ ...smallText, color: CYAN, fontWeight: 900, letterSpacing: ".14em" }}>
            WELCOME TO BIZZIBUDDI
          </small>
          <h2 id="bizzibuddi-first-run-title" style={{ ...sectionHeading, marginTop: 8 }}>
            Let's get your business set up.
          </h2>
          <p style={{ ...copyStyle, maxWidth: 650, margin: "8px auto 0" }}>
            Your workspace is ready. We'll help you get your first customer, job and appointment into BizziBuddi.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginTop: 26 }}>
          {steps.map(([number, title, detail, action]) => (
            <button
              key={number}
              type="button"
              onClick={action}
              style={{
                minWidth: 0,
                padding: 16,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,.12)",
                background: "rgba(255,255,255,.035)",
                color: TEXT,
                textAlign: "left",
                cursor: "pointer",
                minHeight: 150,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "rgba(0,180,219,.16)",
                  color: CYAN,
                  fontWeight: 900,
                  fontSize: 12,
                }}
              >
                {number}
              </span>
              <strong style={{ display: "block", marginTop: 12, fontSize: 14, lineHeight: 1.25 }}>
                {title}
              </strong>
              <span style={{ display: "block", marginTop: 6, color: MUTED, fontSize: 11, lineHeight: 1.5 }}>
                {detail}
              </span>
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 10,
            flexWrap: "wrap",
            marginTop: 22,
          }}
        >
          <button type="button" onClick={onPeople} style={nextActionButton}>
            Start with Add a person →
          </button>
          <button type="button" onClick={onGettingStarted} style={todayJumpButton}>
            Open the Getting Started guide
          </button>
          <button type="button" onClick={onBuddi} style={todayJumpButton}>
            Ask Buddi what to do
          </button>
        </div>

        <div
          style={{
            marginTop: 20,
            paddingTop: 15,
            borderTop: "1px solid rgba(255,255,255,.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: MUTED, fontSize: 11 }}>
            You can always come back to the Dashboard and continue at your own pace.
          </span>
          <button type="button" onClick={onExplore} style={textButton}>
            I'll explore on my own
          </button>
        </div>
      </div>
    </section>
  );
}

function OnboardingPanel({ account, onSubmit }) {
  const businessTypes = [
    ["general", "General business"],
    ["dressmaker", "Dressmaker / fashion"],
    ["hairdresser", "Hairdresser / salon"],
    ["tattooist", "Tattooist / studio"],
    ["school", "School / education"],
    ["trades", "Trades / field service"],
    ["consultant", "Consultant / professional services"],
    ["other", "Other / custom"],
  ];

  const templates = {
    general: { person: "People", job: "Jobs", appointment: "Appointments", fields: [] },
    other: { person: "People", job: "Jobs", appointment: "Appointments", fields: [] },
    dressmaker: { person: "Clients", job: "Garments", appointment: "Fittings", fields: [
      { name: "Bust", fieldKey: "bust", fieldType: "measurement", unit: "cm" },
      { name: "Waist", fieldKey: "waist", fieldType: "measurement", unit: "cm" },
      { name: "Hip", fieldKey: "hip", fieldType: "measurement", unit: "cm" },
      { name: "Height", fieldKey: "height", fieldType: "measurement", unit: "cm" },
      { name: "Shoe size", fieldKey: "shoe_size", fieldType: "text", unit: "" },
    ] },
    hairdresser: { person: "Clients", job: "Services", appointment: "Appointments", fields: [
      { name: "Hair type", fieldKey: "hair_type", fieldType: "dropdown", options: ["Straight", "Wavy", "Curly", "Coily"] },
      { name: "Colour history", fieldKey: "colour_history", fieldType: "long_text", unit: "" },
      { name: "Preferred stylist", fieldKey: "preferred_stylist", fieldType: "text", unit: "" },
      { name: "Last colour date", fieldKey: "last_colour_date", fieldType: "date", unit: "" },
    ] },
    tattooist: { person: "Clients", job: "Tattoos", appointment: "Sessions", fields: [
      { name: "Preferred artist", fieldKey: "preferred_artist", fieldType: "text", unit: "" },
      { name: "Style", fieldKey: "style", fieldType: "text", unit: "" },
      { name: "Placement", fieldKey: "placement", fieldType: "text", unit: "" },
      { name: "Design reference", fieldKey: "design_reference", fieldType: "url", unit: "" },
      { name: "Consent notes", fieldKey: "consent_notes", fieldType: "long_text", unit: "" },
    ] },
    school: { person: "Students", job: "Programs", appointment: "Meetings", fields: [
      { name: "Student ID", fieldKey: "student_id", fieldType: "text", unit: "" },
      { name: "Year level", fieldKey: "year_level", fieldType: "text", unit: "" },
      { name: "Parent / guardian", fieldKey: "guardian", fieldType: "text", unit: "" },
      { name: "Emergency contact", fieldKey: "emergency_contact", fieldType: "text", unit: "" },
      { name: "Enrolment date", fieldKey: "enrolment_date", fieldType: "date", unit: "" },
    ] },
    trades: { person: "Customers", job: "Jobs", appointment: "Site visits", fields: [
      { name: "Property type", fieldKey: "property_type", fieldType: "dropdown", options: ["Residential", "Commercial", "Industrial", "Other"] },
      { name: "Site access", fieldKey: "site_access", fieldType: "long_text", unit: "" },
      { name: "Equipment / asset", fieldKey: "equipment", fieldType: "text", unit: "" },
      { name: "Warranty status", fieldKey: "warranty_status", fieldType: "text", unit: "" },
    ] },
    consultant: { person: "Clients", job: "Projects", appointment: "Meetings", fields: [
      { name: "Industry", fieldKey: "industry", fieldType: "text", unit: "" },
      { name: "Engagement type", fieldKey: "engagement_type", fieldType: "text", unit: "" },
      { name: "Primary contact", fieldKey: "primary_contact", fieldType: "text", unit: "" },
    ] },
  };

  const [step, setStep] = useState(1);
  const [business, setBusiness] = useState(account?.business || "");
  const [businessType, setBusinessType] = useState(account?.businessType || "general");
  const [terminology, setTerminology] = useState(
    account?.terminology || templates[account?.businessType || "general"]
  );
  const [customFields, setCustomFields] = useState(
    (templates[account?.businessType || "general"]?.fields || []).map((field) => ({
      ...field,
      entityType: "person",
      required: false,
    }))
  );
  const [error, setError] = useState("");
  const template = templates[businessType] || templates.general;

  function chooseBusinessType(value) {
    setBusinessType(value);
    setTerminology((current) => ({
      ...current,
      person: templates[value].person,
      job: templates[value].job,
      appointment: templates[value].appointment,
    }));
    setCustomFields((templates[value].fields || []).map((field) => ({
      ...field,
      entityType: "person",
      required: false,
    })));
  }

  function next() {
    setError("");
    if (step === 1 && !business.trim()) {
      setError("Please enter your business name.");
      return;
    }
    setStep((current) => Math.min(4, current + 1));
  }

  function previous() {
    setError("");
    setStep((current) => Math.max(1, current - 1));
  }

  function removeField(index) {
    setCustomFields((current) => current.filter((_, fieldIndex) => fieldIndex !== index));
  }

  function submit() {
    if (!business.trim()) {
      setStep(1);
      setError("Please enter your business name.");
      return;
    }

    onSubmit({
      business: business.trim(),
      businessType,
      terminology: {
        person: terminology.person || template.person,
        job: terminology.job || template.job,
        appointment: terminology.appointment || template.appointment,
      },
      customFields,
    });
  }

  return (
    <section style={cardStyle(700)}>
      <div style={centerStyle}>
        <div style={stepBadge}>STEP {step} OF 4 · BUSINESS SETUP</div>
        <BizziBuddiLogo size={78} dark showWordmark={false} />
        <h2 style={sectionHeading}>
          {step === 1 ? "Your business." : step === 2 ? "Your terminology." : step === 3 ? "Your business fields." : "You're ready."}
        </h2>
        <p style={copyStyle}>
          {step === 1
            ? "Tell BizziBuddi what kind of business you run."
            : step === 2
              ? "Choose the words that feel natural for your business."
              : step === 3
                ? "Start with useful fields for your industry. You can change these later."
                : "Your workspace is configured and ready to use."}
        </p>
      </div>

      {error && <div role="alert" aria-live="assertive" style={authErrorStyle}><strong>Setup needs your attention.</strong><span>{error}</span></div>}

      {step === 1 && (
        <div style={{ marginTop: 28 }}>
          <input
            name="business"
            value={business}
            onChange={(event) => setBusiness(event.target.value)}
            placeholder="Your business"
            aria-label="Business name"
            style={{ ...inputStyle, marginTop: 8 }}
          />
          <label style={{ ...fieldStyle, marginTop: 18 }}>
            Business type
            <select value={businessType} onChange={(event) => chooseBusinessType(event.target.value)} style={inputStyle}>
              {businessTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "grid", gap: 14, marginTop: 28 }}>
          {[
            ["person", "What should BizziBuddi call your people?"],
            ["job", "What should BizziBuddi call your work?"],
            ["appointment", "What should BizziBuddi call your appointments?"],
          ].map(([key, labelText]) => (
            <label key={key} style={fieldStyle}>
              {labelText}
              <input value={terminology[key] || ""} onChange={(event) => setTerminology((current) => ({ ...current, [key]: event.target.value }))} style={inputStyle} />
            </label>
          ))}
          <div style={{ ...businessNote, marginTop: 4 }}>
            <strong>{businessTypes.find(([value]) => value === businessType)?.[1]}</strong>
            <span style={{ display: "block", marginTop: 5, color: MUTED }}>You can use the suggested terminology or make it your own.</span>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ display: "grid", gap: 8 }}>
            {customFields.length ? customFields.map((field, index) => (
              <div key={field.fieldKey + "-" + index} style={reportRow}>
                <span><strong>{field.name}</strong><small style={{ display: "block", color: MUTED }}>{field.fieldType}{field.unit ? " · " + field.unit : ""}</small></span>
                <button type="button" onClick={() => removeField(index)} style={textButton}>Remove</button>
              </div>
            )) : <div style={emptyPeople}>No starter fields selected. You can add fields later in Business Setup.</div>}
          </div>
          <p style={{ ...copyStyle, fontSize: 12, marginTop: 14 }}>These starter fields are attached to People. Additional custom fields can be added later.</p>
        </div>
      )}

      {step === 4 && (
        <div style={{ ...businessNote, marginTop: 28 }}>
          <strong>{business}</strong>
          <span style={{ display: "block", marginTop: 6, color: MUTED }}>{businessTypes.find(([value]) => value === businessType)?.[1]}</span>
          <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
            <div style={reportRow}><span>People</span><strong>{terminology.person}</strong></div>
            <div style={reportRow}><span>Work</span><strong>{terminology.job}</strong></div>
            <div style={reportRow}><span>Appointments</span><strong>{terminology.appointment}</strong></div>
            <div style={reportRow}><span>Starter fields</span><strong>{customFields.length}</strong></div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
        {step > 1 && <button type="button" onClick={previous} style={secondaryButton}>← Back</button>}
        {step < 4
          ? <button type="button" onClick={next} style={primaryButton}>Continue →</button>
          : <button type="button" onClick={submit} style={primaryButton}>Open my workspace →</button>}
      </div>
    </section>
  );
}

function CustomFieldsEditor({ entityType, entityId, onChange }) {
  const [fields, setFields] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const fieldsRequest = bizzibuddiAuthRequest("/api/bizzibuddi/auth/custom-fields?entity=" + encodeURIComponent(entityType));
    const valuesRequest = entityId
      ? bizzibuddiAuthRequest("/api/bizzibuddi/auth/custom-fields/values/" + encodeURIComponent(entityType) + "/" + encodeURIComponent(entityId))
      : Promise.resolve({ values: {} });

    Promise.all([fieldsRequest, valuesRequest]).then(([fieldResult, valueResult]) => {
      if (!active) return;
      const nextFields = (fieldResult.fields || []).filter((field) => field.active);
      const nextValues = valueResult.values || {};
      setFields(nextFields);
      setValues(nextValues);
      onChange?.(nextValues);
    }).catch(() => {
      if (active) setFields([]);
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [entityType, entityId]);

  if (loading) return <div style={{ ...businessNote, marginTop: 16 }}><small style={smallText}>Loading custom fields…</small></div>;
  if (!fields.length) return null;

  function updateValue(id, value) {
    const next = { ...values, [id]: value };
    setValues(next);
    onChange?.(next);
  }

  return (
    <div style={{ ...businessNote, marginTop: 18 }}>
      <small style={smallText}>CUSTOM BUSINESS FIELDS</small>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10, marginTop: 8 }}>
        {fields.map((field) => {
          const value = values[field.id] ?? "";
          if (field.fieldType === "long_text") {
            return <label key={field.id} style={{ ...fieldStyle, marginTop: 0, gridColumn: "1 / -1" }}>{field.name}
              <textarea value={value} onChange={(event) => updateValue(field.id, event.target.value)} style={{ ...inputStyle, minHeight: 90, padding: "12px 15px", resize: "vertical" }} />
            </label>;
          }
          if (field.fieldType === "yes_no") {
            return <label key={field.id} style={{ ...fieldStyle, marginTop: 0 }}>{field.name}
              <select value={String(value)} onChange={(event) => updateValue(field.id, event.target.value)} style={inputStyle}><option value="">Not set</option><option value="true">Yes</option><option value="false">No</option></select>
            </label>;
          }
          if (field.fieldType === "dropdown") {
            return <label key={field.id} style={{ ...fieldStyle, marginTop: 0 }}>{field.name}
              <select value={value} onChange={(event) => updateValue(field.id, event.target.value)} style={inputStyle}><option value="">Select…</option>{(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}</select>
            </label>;
          }
          const inputType = ["number","currency","percentage"].includes(field.fieldType) ? "number" : field.fieldType === "date" ? "date" : field.fieldType === "email" ? "email" : field.fieldType === "phone" ? "tel" : field.fieldType === "url" ? "url" : "text";
          return <label key={field.id} style={{ ...fieldStyle, marginTop: 0 }}>{field.name}{field.unit ? " (" + field.unit + ")" : ""}
            <input type={inputType} value={value} onChange={(event) => updateValue(field.id, event.target.value)} style={inputStyle} />
          </label>;
        })}
      </div>
    </div>
  );
}

function PeoplePanel({ people, jobs, appointments, invoices, productionRecords, onAddPerson, onUpdatePerson, onDeletePerson, onOpenJob, initialPersonId, onBack }) {
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [timelinePersonId, setTimelinePersonId] = useState(null);
  const [measurementPersonId, setMeasurementPersonId] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [measurementsLoading, setMeasurementsLoading] = useState(false);
  const [measurementSaving, setMeasurementSaving] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [customFieldValues, setCustomFieldValues] = useState({});

  useEffect(() => {
    if (!initialPersonId) return;
    const person = people.find((item) => String(item.id) === String(initialPersonId));
    if (!person) return;

    setTimelinePersonId(person.id);
    setMeasurementPersonId(null);
    setMeasurements([]);
  }, [initialPersonId, people]);

  function handleOpenJob(jobId) {
    if (!jobId) return;
    setTimelinePersonId(null);
    onOpenJob?.(jobId);
  }

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
        jobId: job.id,
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
        clientSince: String(form.get("clientSince") || "").trim(),
      };

      let savedPerson;
      if (editingPerson) {
        savedPerson = await onUpdatePerson(editingPerson.id, person);
      } else {
        savedPerson = await onAddPerson(person);
      }

      if (savedPerson?.id && Object.keys(customFieldValues).length) {
        await bizzibuddiAuthRequest(
          "/api/bizzibuddi/auth/custom-fields/values/person/" + encodeURIComponent(savedPerson.id),
          { method: "PUT", body: JSON.stringify({ values: customFieldValues }) }
        );
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
    setTimelinePersonId(null);
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
      const formElement = event.currentTarget;
      const form = new FormData(formElement);
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
              shoeSize: String(form.get("shoeSize") || "").trim(),
              notes: String(form.get("measurementNotes") || "").trim(),
            },
          }),
        }
      );
      setMeasurements((current) => [result.measurement, ...current]);
      formElement.reset();
    } catch (requestError) {
      setError(requestError.message || "We could not save these measurements.");
    } finally {
      setMeasurementSaving(false);
    }
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredPeople = normalizedQuery
    ? people.filter((person) =>
        [person.name, person.email, person.phone].some((value) =>
          String(value || "").toLowerCase().includes(normalizedQuery)
        )
      )
    : people;

  return <section style={cardStyle(940)}>
    <button type="button" onClick={onBack} style={textButton}>← Back to business</button>
    <div className="bizzibuddi-people-hero" style={{ marginTop: 22, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
      <div style={{ minWidth: 0, flex: "1 1 420px" }}>
        <p style={eyebrowStyle}>PEOPLE</p>
        <h2 style={sectionHeading}>Your people.</h2>
        <p style={{ ...copyStyle, marginBottom: 0 }}>Keep your clients and contacts organised in one simple place. People connect the rest of BizziBuddi — jobs, appointments, finance and production.</p>
      </div>
      <button type="button" onClick={startAdd} style={{ ...primaryButton, width: "auto", marginTop: 0 }}>+ Add a person</button>
    </div>

    {showForm ? (
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
        <Field
          name="clientSince"
          label="Client since"
          type="date"
          defaultValue={editingPerson?.clientSince || ""}
        />
        <CustomFieldsEditor
          entityType="person"
          entityId={editingPerson?.id || ""}
          onChange={setCustomFieldValues}
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
    ) : null}
    <div className="bizzibuddi-people-summary" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 9, marginTop: 18 }}>
      <div style={personSummaryCard}>
        <small style={{ ...smallText, display: "block", marginBottom: 4 }}>PEOPLE</small>
        <strong style={{ display: "block", fontSize: 22, lineHeight: 1.05, marginBottom: 3 }}>{people.length}</strong>
        <span style={{ display: "block", color: MUTED, fontSize: 12, lineHeight: 1.35 }}>{people.length === 1 ? "person" : "people"} in your list</span>
      </div>
      <div style={personSummaryCard}>
        <small style={{ ...smallText, display: "block", marginBottom: 4 }}>WITH JOBS</small>
        <strong style={{ display: "block", fontSize: 22, lineHeight: 1.05, marginBottom: 3 }}>{people.filter((person) => jobs.some((job) => job.personId === person.id)).length}</strong>
        <span style={{ display: "block", color: MUTED, fontSize: 12, lineHeight: 1.35 }}>people with active work</span>
      </div>
      <div style={personSummaryCard}>
        <small style={{ ...smallText, display: "block", marginBottom: 4 }}>WITH BOOKINGS</small>
        <strong style={{ display: "block", fontSize: 22, lineHeight: 1.05, marginBottom: 3 }}>{people.filter((person) => appointments.some((appointment) => appointment.personId === person.id)).length}</strong>
        <span style={{ display: "block", color: MUTED, fontSize: 12, lineHeight: 1.35 }}>people linked to calendar</span>
      </div>
    </div>

    <div style={{ marginTop: 18, padding: 14, borderRadius: 12, border: "1px solid " + BORDER, background: "rgba(255,255,255,.025)" }}>
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

    {selectedPersonId && (() => {
      const selectedPerson = people.find((person) => person.id === selectedPersonId);
      if (!selectedPerson) return null;
      const selectedJobs = jobs.filter((job) => job.personId === selectedPerson.id);
      const selectedAppointments = appointments
        .filter((appointment) => appointment.personId === selectedPerson.id)
        .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
      const selectedInvoices = invoices.filter((invoice) => invoice.personId === selectedPerson.id || invoice.clientId === selectedPerson.id);
      const selectedOutstanding = selectedInvoices.reduce((total, invoice) => total + Number(invoice.balance || 0), 0);
      const selectedPayments = selectedInvoices
        .flatMap((invoice) => (Array.isArray(invoice.payments) ? invoice.payments.map((payment) => ({ ...payment, invoiceNumber: invoice.number || "Invoice" })) : []))
        .sort((a, b) => String(b.date || b.createdAt || "").localeCompare(String(a.date || a.createdAt || "")));
      const selectedPaid = selectedPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
      const selectedPrimaryJob = [...selectedJobs].sort((a, b) => String(b.createdAt || b.date || "").localeCompare(String(a.createdAt || a.date || "")))[0];
      const selectedProduction = (productionRecords || [])
        .filter((record) => selectedJobs.some((job) => job.id === record.jobId))
        .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")))[0];
      const selectedProductionJob = selectedProduction
        ? selectedJobs.find((job) => job.id === selectedProduction.jobId)
        : null;
      const selectedProductionStage = selectedProduction?.stage || "Not started";
      const selectedProductionDueDate = selectedProduction?.dueDate || selectedProductionJob?.productionDueDate || null;
      const selectedNextAppointment = selectedAppointments.find((appointment) => appointment.date && String(appointment.date) >= new Date().toISOString().slice(0, 10));
      const selectedUpcomingAppointments = selectedAppointments.filter((appointment) => appointment.date && String(appointment.date) >= new Date().toISOString().slice(0, 10));
      const selectedTimeline = personTimeline(selectedPerson).slice(0, 5);
      return (
        <section style={personFocusPanel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <small style={smallText}>CLIENT OVERVIEW</small>
              <h3 style={{ margin: "5px 0 3px", fontSize: 24 }}>{selectedPerson.name}</h3>
              <span style={{ color: MUTED, fontSize: 12 }}>
                {selectedPerson.email || "No email"}{selectedPerson.phone ? ` · ${selectedPerson.phone}` : ""}
              </span>
            </div>
            <button type="button" onClick={() => setSelectedPersonId(null)} style={smallActionButton}>Close overview</button>
          </div>

          <div style={personFocusMetrics}>
            <div style={personFocusMetric}><small style={personRelationshipLabel}>JOBS</small><strong style={personRelationshipValue}>{selectedJobs.length}</strong></div>
            <div style={personFocusMetric}><small style={personRelationshipLabel}>NEXT BOOKING</small><strong style={personRelationshipValue}>{selectedNextAppointment ? formatTimelineDate(selectedNextAppointment.date) : "None scheduled"}</strong></div>
            <div style={personFocusMetric}><small style={personRelationshipLabel}>OUTSTANDING</small><strong style={personRelationshipValue}>{formatCurrency(selectedOutstanding)}</strong></div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {selectedPrimaryJob && (
              <button type="button" onClick={() => handleOpenJob(selectedPrimaryJob.id)} style={{ ...primaryButton, width: "auto", marginTop: 0 }}>Open latest job</button>
            )}
            <button type="button" onClick={() => {
              setTimelinePersonId(selectedPerson.id);
              setMeasurementPersonId(null);
              setMeasurements([]);
            }} style={smallActionButton}>View timeline</button>
            <button type="button" onClick={() => toggleMeasurements(selectedPerson)} style={smallActionButton}>Measurements</button>
            <button type="button" onClick={() => selectView("finance", selectedInvoices[0]?.id ? { invoiceId: selectedInvoices[0].id } : {})} style={smallActionButton}>
              Open finance
            </button>
          </div>

          <div style={{ marginTop: 16, padding: 12, borderRadius: 10, border: "1px solid " + BORDER, background: "rgba(255,255,255,.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div>
                <small style={smallText}>FINANCE</small>
                <strong style={{ display: "block", marginTop: 3, fontSize: 14 }}>
                  {selectedInvoices.length} {selectedInvoices.length === 1 ? "invoice" : "invoices"} · {formatCurrency(selectedOutstanding)} outstanding
                </strong>
              </div>
              <button type="button" onClick={() => selectView("finance", selectedInvoices[0]?.id ? { invoiceId: selectedInvoices[0].id } : {})} style={smallActionButton}>
                {selectedInvoices.length > 0 ? "View invoices" : "Open finance"}
              </button>
            </div>
            {selectedInvoices.length > 0 ? (
              <div style={{ display: "grid", gap: 6, marginTop: 9 }}>
                {selectedInvoices.slice(0, 3).map((invoice) => (
                  <div key={invoice.id} style={personFinanceRow}>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: "block", fontSize: 12 }}>{invoice.number || "Invoice"}</strong>
                      <span style={{ display: "block", marginTop: 2, color: MUTED, fontSize: 10 }}>
                        {invoice.status || "Issued"} · {formatCurrency(Number(invoice.amount) || 0)}
                      </span>
                    </div>
                    <strong style={{ fontSize: 12 }}>{formatCurrency(Number(invoice.balance) || 0)} due</strong>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ display: "block", marginTop: 8, color: MUTED, fontSize: 12 }}>No invoices linked to this person.</span>
            )}
          </div>

          <div style={{ marginTop: 16, padding: 12, borderRadius: 10, border: "1px solid " + BORDER, background: "rgba(255,255,255,.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div>
                <small style={smallText}>PAYMENTS</small>
                <strong style={{ display: "block", marginTop: 3, fontSize: 14 }}>
                  {selectedPayments.length} {selectedPayments.length === 1 ? "payment" : "payments"} · {formatCurrency(selectedPaid)} received
                </strong>
              </div>
              {selectedPayments.length > 0 && (
                <span style={{ color: MUTED, fontSize: 11 }}>Latest {formatTimelineDate(selectedPayments[0].date || selectedPayments[0].createdAt)}</span>
              )}
            </div>
            {selectedPayments.length > 0 ? (
              <div style={{ display: "grid", gap: 6, marginTop: 9 }}>
                {selectedPayments.slice(0, 4).map((payment) => (
                  <div key={payment.id || (payment.invoiceNumber + "-" + payment.date + "-" + payment.amount)} style={personFinanceRow}>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: "block", fontSize: 12 }}>{formatCurrency(Number(payment.amount) || 0)}</strong>
                      <span style={{ display: "block", marginTop: 2, color: MUTED, fontSize: 10 }}>
                        {payment.invoiceNumber} · {payment.method || "Other"}{payment.description ? " · " + payment.description : ""}
                      </span>
                    </div>
                    <span style={{ color: MUTED, fontSize: 10 }}>{formatTimelineDate(payment.date || payment.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ display: "block", marginTop: 8, color: MUTED, fontSize: 12 }}>No payments recorded for this person yet.</span>
            )}
          </div>

          <div style={{ marginTop: 16, padding: 12, borderRadius: 10, border: "1px solid " + BORDER, background: "rgba(255,255,255,.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div>
                <small style={smallText}>PRODUCTION</small>
                <strong style={{ display: "block", marginTop: 3, fontSize: 14 }}>
                  {selectedProductionJob ? selectedProductionJob.title || "Current job" : "No production job"}
                </strong>
              </div>
              {selectedProductionJob && (
                <button type="button" onClick={() => selectView("production", { jobId: selectedProductionJob.id })} style={smallActionButton}>
                  Open production
                </button>
              )}
            </div>
            {selectedProductionJob ? (
              <div style={personFocusProductionGrid}>
                <div>
                  <small style={personRelationshipLabel}>STAGE</small>
                  <strong style={personRelationshipValue}>{selectedProductionStage}</strong>
                </div>
                <div>
                  <small style={personRelationshipLabel}>DUE</small>
                  <strong style={personRelationshipValue}>{selectedProductionDueDate ? formatTimelineDate(selectedProductionDueDate) : "No due date"}</strong>
                </div>
              </div>
            ) : (
              <span style={{ display: "block", marginTop: 8, color: MUTED, fontSize: 12 }}>No production activity linked to this person yet.</span>
            )}
          </div>

          <div style={{ marginTop: 16, padding: 12, borderRadius: 10, border: "1px solid " + BORDER, background: "rgba(255,255,255,.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div>
                <small style={smallText}>CALENDAR</small>
                <strong style={{ display: "block", marginTop: 3, fontSize: 14 }}>
                  {selectedUpcomingAppointments.length} upcoming {selectedUpcomingAppointments.length === 1 ? "booking" : "bookings"}
                </strong>
              </div>
              {selectedNextAppointment && (
                <button
                  type="button"
                  onClick={() => selectView("calendar", { appointmentId: selectedNextAppointment.id })}
                  style={smallActionButton}
                >
                  Open calendar
                </button>
              )}
            </div>
            {selectedUpcomingAppointments.length > 0 ? (
              <div style={{ display: "grid", gap: 6, marginTop: 9 }}>
                {selectedUpcomingAppointments.slice(0, 4).map((appointment) => (
                  <div key={appointment.id} style={personFinanceRow}>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: "block", fontSize: 12 }}>{appointment.title || "Appointment"}</strong>
                      <span style={{ display: "block", marginTop: 2, color: MUTED, fontSize: 10 }}>
                        {formatAppointmentDate(appointment.date, appointment.time)}
                        {appointment.jobTitle ? " · " + appointment.jobTitle : ""}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectView("calendar", { appointmentId: appointment.id })}
                      style={smallActionButton}
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ display: "block", marginTop: 8, color: MUTED, fontSize: 12 }}>
                No upcoming bookings. Past calendar history remains available in Recent Activity.
              </span>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <small style={smallText}>RECENT ACTIVITY</small>
            {selectedTimeline.length > 0 ? (
              <div style={personFocusActivity}>
                {selectedTimeline.map((item) => (
                  <div key={item.id} style={personFocusActivityItem}>
                    <span style={{ color: MUTED, fontSize: 10, whiteSpace: "nowrap" }}>{formatTimelineDate(item.date)}</span>
                    <div>
                      <strong style={{ display: "block", fontSize: 12 }}>{item.label}</strong>
                      <span style={{ display: "block", marginTop: 2, color: MUTED, fontSize: 11 }}>{item.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ display: "block", marginTop: 8, color: MUTED, fontSize: 12 }}>No activity recorded yet.</span>
            )}
          </div>
        </section>
      );
    })()}

    {filteredPeople.length > 0 ? (
      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {filteredPeople.map((person) => {
          const isTimelineOpen = timelinePersonId === person.id;
          const timelineItems = isTimelineOpen ? personTimeline(person) : [];
          const personJobs = jobs.filter((job) => job.personId === person.id);
          const personJobCount = personJobs.length;
          const personBookingCount = appointments.filter((appointment) => appointment.personId === person.id).length;
          const personInvoiceCount = invoices.filter((invoice) => invoice.personId === person.id || invoice.clientId === person.id).length;
          const primaryJob = [...personJobs].sort((a, b) => String(b.createdAt || b.date || "").localeCompare(String(a.createdAt || a.date || "")))[0];
          const todayDate = new Date().toISOString().slice(0, 10);
          const primaryAppointment = [...appointments]
            .filter((appointment) => appointment.personId === person.id && appointment.date && String(appointment.date) >= todayDate)
            .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];
          const personOutstanding = invoices
            .filter((invoice) => invoice.personId === person.id || invoice.clientId === person.id)
            .reduce((total, invoice) => total + Number(invoice.balance || 0), 0);
          const personJobStatus = primaryJob?.status || "No active job";
          const nextAppointmentLabel = primaryAppointment
            ? formatTimelineDate(primaryAppointment.date)
            : "No upcoming booking";
          return (
            <article key={person.id} style={personCard}>
              <div style={{ minWidth: 0, flex: "1 1 280px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedPersonId(person.id)}
                  style={personNameButton}
                  title={`Open overview for ${person.name}`}
                >
                  {person.name}
                </button>
                <span style={smallText}>
                  {person.email || "No email"}{person.phone ? ` · ${person.phone}` : ""}
                </span>
                {person.clientSince && (
                  <span style={{ ...smallText, display: "block", marginTop: 4 }}>
                    Client since {new Date(person.clientSince + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                )}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
                  <span style={personMetaBadge}>{personJobCount} {personJobCount === 1 ? "job" : "jobs"}</span>
                  <span style={personMetaBadge}>{personBookingCount} {personBookingCount === 1 ? "booking" : "bookings"}</span>
                  <span style={personMetaBadge}>{personInvoiceCount} {personInvoiceCount === 1 ? "invoice" : "invoices"}</span>
                </div>
                <div style={personRelationshipGrid}>
                  <div>
                    <small style={personRelationshipLabel}>JOB STATUS</small>
                    <strong style={personRelationshipValue}>{personJobStatus}</strong>
                  </div>
                  <div>
                    <small style={personRelationshipLabel}>NEXT BOOKING</small>
                    <strong style={personRelationshipValue}>{nextAppointmentLabel}</strong>
                  </div>
                  <div>
                    <small style={personRelationshipLabel}>OUTSTANDING</small>
                    <strong style={personRelationshipValue}>{formatCurrency(personOutstanding)}</strong>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {primaryJob ? (
                  <button type="button" onClick={() => handleOpenJob(primaryJob.id)} style={{ ...primaryButton, width: "auto", marginTop: 0, padding: "7px 11px", fontSize: 12 }}>
                    Open job
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setTimelinePersonId(isTimelineOpen ? null : person.id);
                      if (!isTimelineOpen) {
                        setMeasurementPersonId(null);
                        setMeasurements([]);
                      }
                    }}
                    style={{ ...primaryButton, width: "auto", marginTop: 0, padding: "7px 11px", fontSize: 12 }}
                  >
                    {isTimelineOpen ? "Hide timeline" : "Timeline"}
                  </button>
                )}
                {primaryJob && (
                  <button
                    type="button"
                    onClick={() => {
                      setTimelinePersonId(isTimelineOpen ? null : person.id);
                      if (!isTimelineOpen) {
                        setMeasurementPersonId(null);
                        setMeasurements([]);
                      }
                    }}
                    style={smallActionButton}
                  >
                    {isTimelineOpen ? "Hide timeline" : "Timeline"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggleMeasurements(person)}
                  style={smallActionButton}
                >
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
                        ["sleeve", "Sleeve"], ["neck", "Neck"], ["backWaist", "Back waist"], ["inseam", "Inseam"], ["height", "Height"], ["shoeSize", "Shoe size"],
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
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6, marginTop: 8 }}>
                            {Object.entries(measurement.data || {}).filter(([key]) => key !== "notes").map(([key, value]) => (
                              <div key={key} style={{ padding: "6px 7px", borderRadius: 7, background: "rgba(255,255,255,.035)" }}>
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
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 8, marginTop: 9, alignItems: "start" }}>
                      {timelineItems.map((item) => (
                        <div key={item.id} style={{ display: "grid", gridTemplateColumns: "92px minmax(0,1fr)", gap: 8, padding: "8px 9px", minHeight: 0, borderRadius: 9, background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.08)" }}>
                          <span style={{ color: MUTED, fontSize: 10, fontWeight: 700, lineHeight: 1.35 }}>
                            {formatTimelineDate(item.date)}
                          </span>
                          <div>
                            <strong style={{ display: "block", fontSize: 12, lineHeight: 1.3 }}>{item.label}</strong>
                            <span style={{ display: "block", marginTop: 2, color: MUTED, fontSize: 11, lineHeight: 1.35 }}>{item.detail}</span>
                            {item.jobId && (
                              <button
                                type="button"
                                onClick={() => handleOpenJob(item.jobId)}
                                style={{ ...smallActionButton, marginTop: 6, width: "auto" }}
                              >
                                Open job
                              </button>
                            )}
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

    {error && <div role="alert" style={{ ...messageStyle, marginTop: 18 }}>{error}</div>}

  </section>;
}

function JobsPanel({ jobs, people, onAddJob, onUpdateJob, onDeleteJob, initialJobId, onOpenProduction, onOpenJob, onBack }) {
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [customFieldValues, setCustomFieldValues] = useState({});
  const [timelineJobId, setTimelineJobId] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState("");
  const focusedJobRef = useRef(null);

  useEffect(() => {
    if (!initialJobId) return;

    const job = jobs.find((item) => String(item.id) === String(initialJobId));
    if (!job) return;

    setSelectedJobId(String(job.id));
    setTimelineJobId(null);
    setTimeline([]);
    startEdit(job);
  }, [initialJobId, jobs]);

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
        dueDate: String(form.get("dueDate") || ""),
        description: String(form.get("description") || "").trim(),
        price: Number(form.get("price") || 0),
      };

      let savedJob;
      if (editingJob) {
        savedJob = await onUpdateJob(editingJob.id, job);
      } else {
        savedJob = await onAddJob(job);
      }

      if (savedJob?.id && Object.keys(customFieldValues).length) {
        await bizzibuddiAuthRequest(
          "/api/bizzibuddi/auth/custom-fields/values/job/" + encodeURIComponent(savedJob.id),
          { method: "PUT", body: JSON.stringify({ values: customFieldValues }) }
        );
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

  const focusedJobId = selectedJobId || timelineJobId || initialJobId || "";

  function handleOpenJob(jobId) {
    const job = jobs.find((item) => String(item.id) === String(jobId));
    if (!job) return;

    setSelectedJobId(String(job.id));
    setTimelineJobId(null);
    setTimeline([]);

    startEdit(job);

    window.requestAnimationFrame(() => {
      focusedJobRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  useEffect(() => {
    if (!focusedJobId || !focusedJobRef.current) return undefined;

    const frame = window.requestAnimationFrame(() => {
      focusedJobRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [focusedJobId]);

  function getJobNextAction(job) {
    if (job.status === "Complete" || job.productionReadiness === "Complete") {
      return {
        label: "Review timeline",
        detail: "This job is complete. Review its history for the final record.",
        action: () => toggleTimeline(job),
      };
    }

    if (job.productionReadiness === "Overdue") {
      return {
        label: "Open production",
        detail: "The production ready-by date has passed and needs attention.",
        action: () => onOpenProduction?.(job.id),
        urgent: true,
      };
    }

    if (job.productionReadiness === "Tasks outstanding") {
      return {
        label: "Open production",
        detail: `${job.productionTaskCount - (job.productionCompletedTaskCount || 0)} production task(s) remain.`,
        action: () => onOpenProduction?.(job.id),
      };
    }

    if (job.productionReadiness === "Stage update needed" || job.productionReadiness === "Ready") {
      return {
        label: "Open production",
        detail: job.productionReadiness === "Ready"
          ? "Production is ready for the next workflow step."
          : "All production tasks are complete. Update the production stage.",
        action: () => onOpenProduction?.(job.id),
      };
    }

    if (job.productionReadiness === "Not started") {
      return {
        label: "Start production",
        detail: "Production has not started yet. Open the production workflow to begin.",
        action: () => onOpenProduction?.(job.id),
      };
    }

    if (job.status === "Waiting") {
      return {
        label: "Review job",
        detail: "This job is waiting. Review the job details before moving it forward.",
        action: () => startEdit(job),
      };
    }

    return {
      label: "Continue production",
      detail: "Open the production workflow to keep this job moving.",
      action: () => onOpenProduction?.(job.id),
    };
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
        {jobs.map((job) => {
          const isFocused = String(focusedJobId) === String(job.id);
          const nextAction = isFocused ? getJobNextAction(job) : null;

          return (
          <article
            key={job.id}
            ref={isFocused ? focusedJobRef : null}
            style={{
              ...jobCard,
              ...(isFocused
                ? {
                    border: "1px solid rgba(0,180,219,.62)",
                    boxShadow: "0 14px 30px rgba(0,180,219,.10)",
                  }
                : {}),
              scrollMarginTop: 24,
            }}
          >
            <div style={{ minWidth: 0, flex: "1 1 240px" }}>
              <strong style={{ display: "block", fontSize: 17 }}>{job.title}</strong>
              <span style={smallText}>{job.clientName || "Unassigned"}</span>
              {job.description && (
                <p style={{ ...copyStyle, margin: "6px 0 0", fontSize: 12, lineHeight: 1.4 }}>{job.description}</p>
              )}
              {(job.dueDate || Number(job.price || 0) > 0) && (
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 8 }}>
                  {job.dueDate && (
                    <span style={jobMetaBadge}>
                      {"Due " + new Date(job.dueDate + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                  {Number(job.price || 0) > 0 && (
                    <span style={jobMetaBadge}>
                      {"$" + Number(job.price).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              )}
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
              {nextAction && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    marginTop: 12,
                    padding: "11px 12px",
                    borderRadius: 10,
                    border: "1px solid " + (nextAction.urgent ? "rgba(248,113,113,.42)" : "rgba(0,180,219,.30)"),
                    background: nextAction.urgent ? "rgba(248,113,113,.07)" : "rgba(0,180,219,.055)",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 0, flex: "1 1 220px" }}>
                    <small style={{ ...smallText, color: nextAction.urgent ? "#FCA5A5" : CYAN, fontWeight: 900, letterSpacing: ".08em" }}>NEXT ACTION</small>
                    <span style={{ display: "block", marginTop: 3, color: MUTED, fontSize: 12, lineHeight: 1.45 }}>{nextAction.detail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={nextAction.action}
                    style={{
                      ...smallActionButton,
                      width: "auto",
                      borderColor: nextAction.urgent ? "rgba(248,113,113,.45)" : "rgba(0,180,219,.45)",
                    }}
                  >
                    {nextAction.label} →
                  </button>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <span style={jobStatus}>{job.status}</span>
              <button type="button" onClick={() => toggleTimeline(job)} style={smallActionButton}>
                {timelineJobId === job.id ? "Hide timeline" : "Timeline"}
              </button>
              <button type="button" onClick={() => onOpenProduction(job.id)} style={smallActionButton}>Production</button>
              <button type="button" onClick={() => startEdit(job)} style={smallActionButton}>Edit</button>
              <button type="button" onClick={() => handleDelete(job)} style={smallDangerButton}>Delete</button>
              {timelineJobId === job.id && (
                <div style={{ width: "100%", marginTop: 14, paddingTop: 14, borderTop: "1px solid " + BORDER }}>
                  <small style={smallText}>JOB TIMELINE</small>
                  {timelineLoading ? (
                    <span style={{ display: "block", marginTop: 10, color: MUTED, fontSize: 12 }}>Loading job history…</span>
                  ) : timeline.length > 0 ? (
                    <div style={{ display: "grid", gap: 8, marginTop: 9 }}>
                      {timeline.map((item) => (
                        <div key={item.id} style={{ display: "grid", gridTemplateColumns: "92px minmax(0,1fr)", gap: 8, padding: "8px 9px", borderRadius: 9, background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.08)" }}>
                          <span style={{ color: MUTED, fontSize: 10, fontWeight: 700 }}>{formatTimelineDate(item.date)}</span>
                          <div>
                            <strong style={{ display: "block", fontSize: 12 }}>{item.label}</strong>
                            <span style={{ color: MUTED, fontSize: 11 }}>{item.detail}</span>
                            {item.jobId && (
                              <button
                                type="button"
                                onClick={() => onOpenJob(item.jobId)}
                                style={{ ...smallActionButton, marginTop: 6, width: "auto" }}
                              >
                                Open job
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ display: "block", marginTop: 10, color: MUTED, fontSize: 12 }}>No timeline events recorded yet.</span>
                  )}
                </div>
              )}
            </div>
          </article>
          );
        })}
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
        <label style={fieldStyle}>Due date
          <input name="dueDate" type="date" defaultValue={editingJob?.dueDate || ""} style={inputStyle} />
        </label>
        <label style={fieldStyle}>Description
          <textarea name="description" rows={4} placeholder="Describe the work, garment or outcome." defaultValue={editingJob?.description || ""} style={{ ...inputStyle, padding: "12px 15px", minHeight: 110, resize: "vertical" }} />
        </label>
        <label style={fieldStyle}>Price (AUD)
          <input name="price" type="number" min="0" step="0.01" defaultValue={editingJob?.price || ""} placeholder="0.00" style={inputStyle} />
        </label>
        <label style={fieldStyle}>Status
          <select name="status" defaultValue={editingJob?.status || "New"} style={inputStyle}>
            <option>New</option>
            <option>In progress</option>
            <option>Waiting</option>
            <option>Complete</option>
          </select>
        </label>
        <CustomFieldsEditor
          entityType="job"
          entityId={editingJob?.id || ""}
          onChange={setCustomFieldValues}
        />
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
  return <section id="plans-membership"><div style={centerStyle}><h2 style={sectionHeading}>Get more time back.</h2><p style={copyStyle}>Choose the level of BizziBuddi that fits your business. Your selected membership is saved to your BizziBuddi account in this development preview.</p></div><div style={plansGrid}>{plans.map((plan) => <article key={plan.id} style={{ ...cardStyle(), border: plan.featured ? `2px solid ${RED}` : `1px solid ${BORDER}`, display: "flex", flexDirection: "column" }}>{plan.featured && <span style={popularBadge}>MOST POPULAR</span>}<h3 style={planTitle}>{plan.name}</h3><div style={priceStyle}>{plan.price}<small style={smallText}>{plan.period}</small></div><p style={copyStyle}>{plan.description}</p><ul style={{ paddingLeft: 20, lineHeight: 2, flex: 1 }}>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul><button type="button" onClick={() => onSelectPlan(plan.name)} style={plan.featured ? primaryButton : secondaryButton}>{plan.name === "Free" ? "Start Free" : `Choose ${plan.name}`}</button></article>)}</div></section>;
}

function BusinessSetupPanel({ account, onAccountUpdate }) {
  const [profile, setProfile] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [newField, setNewField] = useState({ entityType: "person", name: "", fieldType: "text", unit: "", options: "" });

  useEffect(() => {
    let active = true;
    Promise.all([
      bizzibuddiAuthRequest("/api/bizzibuddi/auth/business-profile"),
      bizzibuddiAuthRequest("/api/bizzibuddi/auth/custom-fields"),
    ]).then(([profileResult, fieldsResult]) => {
      if (!active) return;
      setProfile(profileResult.profile || null);
      setFields(Array.isArray(fieldsResult.fields) ? fieldsResult.fields : []);
    }).catch((error) => {
      if (active) setMessage(error.message || "Business configuration could not be loaded.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [account?.id]);

  async function chooseIndustry(event) {
    const businessType = event.target.value;
    setSaving(true);
    setMessage("");
    try {
      const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/business-profile", {
        method: "PUT",
        body: JSON.stringify({
          business: account?.business || "",
          businessType,
        }),
      });
      setProfile((current) => ({ ...(current || {}), businessType: result.account.businessType, terminology: result.account.terminology }));
      onAccountUpdate?.(result.account);
      const fieldsResult = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/custom-fields");
      setFields(Array.isArray(fieldsResult.fields) ? fieldsResult.fields : []);
      setMessage("Business profile updated.");
    } catch (error) {
      setMessage(error.message || "Business profile could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function addField() {
    const name = newField.name.trim();
    if (!name) return;
    setSaving(true);
    setMessage("");
    try {
      const next = [...fields, {
        entityType: newField.entityType,
        name,
        fieldKey: name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""),
        fieldType: newField.fieldType,
        unit: newField.unit.trim(),
        options: newField.options.split(",").map((item) => item.trim()).filter(Boolean),
        required: false,
      }];
      const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/custom-fields", {
        method: "PUT",
        body: JSON.stringify({ fields: next }),
      });
      setFields(result.fields || []);
      setNewField({ entityType: "person", name: "", fieldType: "text", unit: "", options: "" });
      setMessage("Custom field added.");
    } catch (error) {
      setMessage(error.message || "Custom field could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function removeField(id) {
    setSaving(true);
    try {
      const next = fields.filter((field) => field.id !== id);
      const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/custom-fields", {
        method: "PUT",
        body: JSON.stringify({ fields: next }),
      });
      setFields(result.fields || []);
      setMessage("Custom field removed.");
    } catch (error) {
      setMessage(error.message || "Custom field could not be removed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <article style={{ ...reportCard, marginTop: 22 }}><small style={smallText}>BUSINESS PROFILE</small><p style={copyStyle}>Loading your business configuration…</p></article>;

  const currentTemplate = profile?.industries?.find((item) => item.key === profile?.businessType);

  return (
    <article id="account-business-setup" style={{ ...reportCard, marginTop: 22 }}>
      <div style={reportCardHeading}>
        <div>
          <small style={smallText}>BUSINESS PROFILE</small>
          <strong style={{ display: "block", marginTop: 5, fontSize: 18 }}>Make BizziBuddi fit your business.</strong>
        </div>
        {currentTemplate && <span style={advancedBadge}>{currentTemplate.name}</span>}
      </div>
      <p style={copyStyle}>Choose an industry starting point, then add your own fields. The core BizziBuddi workflow stays the same.</p>

      <label style={fieldStyle}>
        Business type
        <select value={profile?.businessType || "general"} onChange={chooseIndustry} disabled={saving} style={inputStyle}>
          {(profile?.industries?.length ? profile.industries : [
            { key: "general", name: "General business" },
            { key: "dressmaker", name: "Dressmaker / fashion" },
            { key: "hairdresser", name: "Hairdresser / salon" },
            { key: "tattooist", name: "Tattooist / studio" },
            { key: "school", name: "School / education" },
            { key: "trades", name: "Trades / field service" },
            { key: "consultant", name: "Consultant / professional services" },
            { key: "other", name: "Other / custom" },
          ]).map((industry) => <option key={industry.key} value={industry.key}>{industry.name}</option>)}
        </select>
      </label>

      {profile?.terminology && (
        <div style={{ ...reportRows, marginTop: 18 }}>
          {Object.entries(profile.terminology).map(([key, value]) => (
            <div key={key} style={reportRow}><span>{key}</span><strong>{value}</strong></div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid " + BORDER }}>
        <small style={smallText}>CUSTOM FIELDS</small>
        <p style={{ ...copyStyle, marginTop: 8 }}>These fields belong to your business profile and can later be used on People, Jobs, Appointments and Invoices.</p>
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          {fields.filter((field) => field.active).map((field) => (
            <div key={field.id} style={reportRow}>
              <span><strong>{field.name}</strong><small style={{ display: "block", color: MUTED }}>{field.entityType} · {field.fieldType}{field.unit ? " · " + field.unit : ""}</small></span>
              <button type="button" onClick={() => removeField(field.id)} disabled={saving} style={textButton}>Remove</button>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8, marginTop: 14 }}>
          <select value={newField.entityType} onChange={(event) => setNewField((current) => ({ ...current, entityType: event.target.value }))} style={inputStyle}>
            <option value="person">People</option><option value="job">Jobs</option><option value="appointment">Appointments</option><option value="invoice">Invoices</option>
          </select>
          <input value={newField.name} onChange={(event) => setNewField((current) => ({ ...current, name: event.target.value }))} placeholder="Field name" style={inputStyle} />
          <select value={newField.fieldType} onChange={(event) => setNewField((current) => ({ ...current, fieldType: event.target.value }))} style={inputStyle}>
            {["text","long_text","number","currency","date","yes_no","dropdown","multi_select","phone","email","url","measurement","percentage"].map((type) => <option key={type} value={type}>{type.replace("_"," ")}</option>)}
          </select>
          <input value={newField.unit} onChange={(event) => setNewField((current) => ({ ...current, unit: event.target.value }))} placeholder="Unit (optional)" style={inputStyle} />
          <input value={newField.options} onChange={(event) => setNewField((current) => ({ ...current, options: event.target.value }))} placeholder="Options, comma separated" style={inputStyle} />
        </div>
        <button type="button" onClick={addField} disabled={saving || !newField.name.trim()} style={{ ...primaryButton, width: "auto", minHeight: 40 }}>{saving ? "Saving…" : "+ Add custom field"}</button>
      </div>
      {message && <p style={{ ...smallText, marginBottom: 0 }}>{message}</p>}
    </article>
  );
}

function AccountPanel({ account, onBack, onPlans, onResetBusiness, onAccountUpdate }) {
  const [resetOpen, setResetOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  async function handleReset() {
    if (confirmation.trim() !== "START FRESH") return;

    setResetting(true);
    setResetError("");

    try {
      await onResetBusiness();
      setResetOpen(false);
      setConfirmation("");
    } catch (error) {
      setResetError(error instanceof Error ? error.message : "The business data could not be reset.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <section style={cardStyle(940)}>
      <button type="button" onClick={onBack} style={textButton}>← Back to business</button>
      <div style={{ marginTop: 22 }}>
        <p style={eyebrowStyle}>ACCOUNT</p>
        <h2 style={sectionHeading}>Your account.</h2>
        <p style={copyStyle}>Manage your BizziBuddi account details and membership from one place.</p>
      </div>
      <div id="account-details" style={{ ...reportSectionGrid, marginTop: 28 }}>
        <article style={reportCard}>
          <div style={reportCardHeading}>
            <div>
              <small style={smallText}>BUSINESS</small>
              <strong style={{ display: "block", marginTop: 5, fontSize: 18 }}>{account?.business || "Your business"}</strong>
            </div>
          </div>
          <div style={reportRows}>
            <div style={reportRow}><span>Account name</span><strong>{account?.name || "—"}</strong></div>
            <div style={reportRow}><span>Email</span><strong>{account?.email || "—"}</strong></div>
            <div style={reportRow}><span>Username</span><strong>@{account?.username || "—"}</strong></div>
          </div>
        </article>
        <article id="account-membership" style={reportCard}>
          <div style={reportCardHeading}>
            <div>
              <small style={smallText}>MEMBERSHIP</small>
              <strong style={{ display: "block", marginTop: 5, fontSize: 18 }}>{account?.plan || "Free"}</strong>
            </div>
          </div>
          <p style={{ ...copyStyle, marginTop: 14 }}>Your current BizziBuddi membership and available upgrade options.</p>
          <button type="button" onClick={onPlans} style={{ ...primaryButton, width: "auto" }}>View plans & membership</button>
        </article>
      </div>

      <BusinessSetupPanel account={account} onAccountUpdate={onAccountUpdate} />

      <article style={{ ...reportCard, marginTop: 22, borderColor: "rgba(220,38,38,.38)" }}>
        <div style={reportCardHeading}>
          <div>
            <small style={smallText}>BUSINESS DATA</small>
            <strong style={{ display: "block", marginTop: 5, fontSize: 18 }}>Start fresh</strong>
          </div>
        </div>
        <p style={{ ...copyStyle, marginTop: 14 }}>
          Permanently clear the business data in this BizziBuddi account and start with an empty workspace.
          Your account, login, membership and business identity will remain.
        </p>
        <button
          type="button"
          onClick={() => {
            setResetError("");
            setConfirmation("");
            setResetOpen(true);
          }}
          style={{ ...textButton, color: "#FCA5A5" }}
        >
          Start fresh →
        </button>
      </article>

      {resetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bizzibuddi-reset-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(2, 8, 23, .78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div style={{ ...cardStyle(560), width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <p style={eyebrowStyle}>START FRESH</p>
            <h2 id="bizzibuddi-reset-title" style={sectionHeading}>Clear this business data?</h2>
            <p style={copyStyle}>
              This permanently removes the business data stored for this BizziBuddi account:
              people, jobs, calendar, finance, expenses, production, production templates,
              time entries, measurements and automation history.
            </p>
            <p style={copyStyle}>
              Your account, login, membership and business identity are kept. A full database
              safety backup is created before anything is deleted.
            </p>
            <div style={{ marginTop: 20 }}>
              <label style={{ ...smallText, display: "block", marginBottom: 8 }} htmlFor="start-fresh-confirmation">
                Type START FRESH to continue
              </label>
              <input
                id="start-fresh-confirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="off"
                spellCheck="false"
                disabled={resetting}
                style={inputStyle}
              />
            </div>
            {resetError && (
              <p role="alert" style={{ ...copyStyle, color: "#FCA5A5", marginTop: 14 }}>
                {resetError}
              </p>
            )}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap", marginTop: 22 }}>
              <button type="button" onClick={() => setResetOpen(false)} disabled={resetting} style={textButton}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={resetting || confirmation.trim() !== "START FRESH"}
                style={{
                  ...primaryButton,
                  width: "auto",
                  opacity: resetting || confirmation.trim() !== "START FRESH" ? 0.5 : 1,
                  background: "#B91C1C",
                }}
              >
                {resetting ? "Starting fresh…" : "Permanently clear business data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


function BizziBuddiGettingStarted({ people, jobs, appointments, invoices, onPeople, onJobs, onCalendar, onFinance, onBuddi }) {
  const [open, setOpen] = useState(false);
  const [buddiVisited, setBuddiVisited] = useState(false);

  const steps = [
    {
      key: "people",
      title: "Add your first person",
      detail: "Start with a customer, client, student or contact.",
      complete: people.length > 0,
      action: onPeople,
      actionLabel: people.length > 0 ? "View people" : "Add a person",
    },
    {
      key: "job",
      title: "Create your first job",
      detail: "Give the work a name and keep it connected to the right person.",
      complete: jobs.length > 0,
      action: onJobs,
      actionLabel: jobs.length > 0 ? "View jobs" : "Create a job",
    },
    {
      key: "calendar",
      title: "Schedule something",
      detail: "Add an appointment, meeting, fitting or site visit.",
      complete: appointments.length > 0,
      action: onCalendar,
      actionLabel: appointments.length > 0 ? "View calendar" : "Schedule something",
    },
    {
      key: "finance",
      title: "Record your first invoice",
      detail: "Keep the money side of your business visible from the beginning.",
      complete: invoices.length > 0,
      action: onFinance,
      actionLabel: invoices.length > 0 ? "View finance" : "Add an invoice",
    },
    {
      key: "buddi",
      title: "Meet Buddi",
      detail: "Ask your assistant what needs doing, create work and find information.",
      complete: buddiVisited,
      action: () => {
        setBuddiVisited(true);
        onBuddi?.("What should I do first in my business?");
      },
      actionLabel: "Ask Buddi",
    },
  ];

  const completed = steps.filter((step) => step.complete).length;
  const progress = Math.round((completed / steps.length) * 100);

  function openGuide() {
    setOpen(true);
  }

  if (!open) {
    return (
      <div style={{ marginTop: 20, padding: 18, borderRadius: 16, border: "1px solid rgba(0,180,219,.28)", background: "linear-gradient(135deg, rgba(0,180,219,.08), rgba(37,99,235,.06))" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <small style={{ ...smallText, color: CYAN, fontWeight: 900, letterSpacing: ".12em" }}>GETTING STARTED</small>
            <strong style={{ display: "block", marginTop: 5, fontSize: 20 }}>Want a quick tour of BizziBuddi?</strong>
            <p style={{ ...copyStyle, margin: "5px 0 0" }}>Take a short guided path through the essentials. You can skip any step and come back whenever you like.</p>
          </div>
          <button type="button" onClick={openGuide} style={nextActionButton}>Start the guide →</button>
        </div>
        <div style={{ marginTop: 13, height: 6, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
          <div style={{ width: progress + "%", height: "100%", background: CYAN, borderRadius: 999, transition: "width .2s ease" }} />
        </div>
        <div style={{ marginTop: 7, color: MUTED, fontSize: 11 }}>{completed} of {steps.length} first-day steps complete</div>
      </div>
    );
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="bizzibuddi-getting-started-title" style={{ position: "fixed", inset: 0, zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 18, background: "rgba(0,0,0,.72)" }}>
      <div style={{ width: "min(680px, 100%)", maxHeight: "calc(100vh - 36px)", overflowY: "auto", borderRadius: 20, border: "1px solid " + BORDER, background: BG, color: TEXT, boxShadow: "0 30px 90px rgba(0,0,0,.55)", padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div>
            <small style={{ ...smallText, color: CYAN, fontWeight: 900, letterSpacing: ".12em" }}>YOUR FIRST DAY WITH BIZZIBUDDI</small>
            <h3 id="bizzibuddi-getting-started-title" style={{ margin: "6px 0 5px", fontSize: 27 }}>Let's get your business moving.</h3>
            <p style={{ ...copyStyle, margin: 0 }}>You do not have to complete everything now. This guide is here to make the first steps obvious.</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close getting started guide" style={{ ...textButton, flexShrink: 0 }}>Close</button>
        </div>

        <div style={{ marginTop: 18, padding: 12, borderRadius: 12, background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 11, color: MUTED }}>
            <span>{completed} of {steps.length} complete</span>
            <strong style={{ color: CYAN }}>{progress}%</strong>
          </div>
          <div style={{ marginTop: 8, height: 6, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
            <div style={{ width: progress + "%", height: "100%", background: CYAN, borderRadius: 999 }} />
          </div>
        </div>

        <div style={{ display: "grid", gap: 9, marginTop: 18 }}>
          {steps.map((step, index) => (
            <div key={step.key} style={{ display: "grid", gridTemplateColumns: "32px minmax(0,1fr) auto", gap: 12, alignItems: "center", padding: 13, borderRadius: 13, border: "1px solid " + (step.complete ? "rgba(34,197,94,.28)" : BORDER), background: step.complete ? "rgba(34,197,94,.055)" : "rgba(255,255,255,.025)" }}>
              <div aria-hidden="true" style={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", background: step.complete ? "rgba(34,197,94,.16)" : "rgba(255,255,255,.07)", color: step.complete ? "#86EFAC" : MUTED, fontWeight: 900 }}>{step.complete ? "✓" : index + 1}</div>
              <div style={{ minWidth: 0 }}>
                <strong style={{ display: "block", fontSize: 14 }}>{step.title}</strong>
                <span style={{ display: "block", marginTop: 3, color: MUTED, fontSize: 11, lineHeight: 1.45 }}>{step.detail}</span>
              </div>
              <button type="button" onClick={step.action} style={{ ...todayJumpButton, whiteSpace: "nowrap" }}>{step.actionLabel}</button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 17, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.08)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ color: MUTED, fontSize: 11 }}>You can close this guide at any time and return to it from your dashboard.</span>
          <button type="button" onClick={() => setOpen(false)} style={textButton}>I'll explore on my own</button>
        </div>
      </div>
    </div>
  );
}

function DashboardPanel({
  account, onPlans, onPeople, onJobs, onCalendar, onFinance, onAutomation,
  onProduction, onReports, onBuddi, onAttentionBuddi, onReset, onLogout, people, jobs,
  appointments, invoices, automationEvents, productionRecords, productionTimeEntries = [], onGettingStartedBuddi, onDashboard,
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
  const dueSoonLabel = (dateValue) => {
    if (!dateValue) return "Due soon";
    const due = new Date(dateValue + "T00:00:00");
    const days = Math.round((due - today) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days >= 2 && days <= 7) return "This week";
    return "Due soon";
  };
  const appointmentsToday = appointments
    .filter((appointment) => appointment.date === todayKey)
    .sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));
  const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const appointmentMinutes = (appointment) => {
    const match = String(appointment.time || "").match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (!match) return null;
    let hour = Number(match[1]);
    const minute = Number(match[2] || 0);
    const period = String(match[3] || "").toLowerCase();
    if (period === "pm" && hour < 12) hour += 12;
    if (period === "am" && hour === 12) hour = 0;
    return hour * 60 + minute;
  };
  const nowAppointment = appointmentsToday.find((appointment) => {
    const minutes = appointmentMinutes(appointment);
    return minutes !== null && minutes <= currentMinutes && currentMinutes - minutes < 60;
  });
  const upcomingAppointments = appointmentsToday.filter((appointment) => appointment.id !== nowAppointment?.id);
  const waitingJobs = jobs.filter((job) => job.status === "Waiting");
  const openJobs = jobs.filter((job) => job.status !== "Complete").length;
  const productionNeedsAttention = jobs.filter((job) =>
    ["Overdue", "Tasks outstanding", "Stage update needed"].includes(job.productionReadiness)
  );
  const productionDueSoon = jobs.filter((job) => {
    if (!job.productionDueDate || job.productionReadiness === "Complete") return false;
    const due = new Date(job.productionDueDate + "T00:00:00");
    const days = Math.ceil((due - today) / 86400000);
    return days >= 0 && days <= 7;
  });
  const readyProduction = jobs.filter((job) => job.productionReadiness === "Ready");
  const recentAutomationFlags = automationEvents.filter((event) => event.type === "invoice-overdue");

  const intelligence = buildBizziBuddiIntelligence({
    todayKey,
    invoices,
    appointments,
    jobs,
    productionRecords,
    timeEntries: productionTimeEntries,
  });

  const priorityItems = intelligence.priorityItemsTop.map((item) => ({
    ...item,
    action: item.actionKey === "finance"
      ? "Open finance"
      : item.actionKey === "calendar"
        ? "Open calendar"
        : item.actionKey === "production"
          ? "Open production"
          : "Open jobs",
    onClick:
      item.actionKey === "finance"
        ? () => onFinance?.(item.invoiceId)
        : item.actionKey === "calendar"
          ? () => onCalendar?.(item.appointmentId)
          : item.actionKey === "production"
            ? () => onProduction?.(item.jobId)
            : () => onJobs?.(item.jobId),
  }));

  const actionCount = intelligence.priorityCount;
  const nextAction = priorityItems[0] || null;
  const nextActionLabel = nextAction?.actionKey === "finance"
    ? "Open finance"
    : nextAction?.actionKey === "calendar"
      ? "Open calendar"
      : nextAction?.actionKey === "production"
        ? "Open production"
        : nextAction?.actionKey === "jobs"
          ? "Open jobs"
          : "Open workspace";
  const nextActionHandler = nextAction?.onClick || null;
  const recentActivity = [
    ...(automationEvents || []).map((event) => ({ key: "automation-" + event.id, date: event.createdAt || event.updatedAt, icon: "⚙️", label: "Automation", title: event.title || event.type || "Automation event", detail: event.detail || "A business automation event was recorded.", onClick: onAutomation })),
    ...(jobs || []).map((job) => ({ key: "job-" + job.id, date: job.updatedAt || job.createdAt, icon: "📋", label: "Job", title: job.title || "Job updated", detail: "Status: " + (job.status || "New"), onClick: () => onJobs?.(job.id) })),
    ...(appointments || []).map((appointment) => ({ key: "appointment-" + appointment.id, date: appointment.updatedAt || appointment.createdAt || appointment.date, icon: "📅", label: "Calendar", title: appointment.title || "Appointment", detail: (appointment.date || "Date not set") + (appointment.time ? " · " + appointment.time : ""), onClick: () => onCalendar?.(appointment.id) })),
    ...(invoices || []).map((invoice) => ({ key: "invoice-" + invoice.id, date: invoice.updatedAt || invoice.createdAt || invoice.issueDate, icon: "💳", label: "Finance", title: invoice.number || "Invoice", detail: (invoice.status || "Issued") + " · " + formatCurrency(Number(invoice.amount) || 0), onClick: () => onFinance?.(invoice.id) })),
    ...(productionRecords || []).map((record) => ({ key: "production-" + record.id, date: record.updatedAt || record.createdAt, icon: "🏭", label: "Production", title: record.jobTitle || "Production job", detail: "Stage: " + (record.stage || "Not started"), onClick: () => onProduction?.(record.jobId) })),
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
    { label: "Workload", value: intelligence.workload.level, detail: intelligence.workload.activeJobs + " active · " + intelligence.workload.tasksRemaining + " tasks remaining", tone: intelligence.workload.level === "Overloaded" || intelligence.workload.level === "Heavy" ? "watch" : intelligence.workload.level === "Normal" ? "good" : "neutral" },
    { label: "Today's schedule", value: appointmentsToday.length, detail: appointmentsToday.length === 1 ? "appointment booked" : "appointments booked", tone: appointmentsToday.length > 0 ? "good" : "neutral" },
  ];
  const notificationItems = [
    ...overdueInvoices.map((invoice) => ({
      key: "notification-invoice-" + invoice.id,
      icon: "💳",
      title: "Payment overdue",
      detail: (invoice.number || "Invoice") + " has an outstanding balance of " + formatCurrency(Math.max(0, (Number(invoice.amount) || 0) - (Number(invoice.amountPaid) || 0))) + ".",
      onClick: () => onFinance?.(invoice.id),
      tone: "urgent",
    })),
    ...productionNeedsAttention.map((job) => ({
      key: "notification-production-" + job.id,
      icon: "🏭",
      title: job.productionReadiness || "Production needs attention",
      detail: (job.title || "Production job") + (job.productionReadinessDetail ? " · " + job.productionReadinessDetail : "."),
      onClick: () => onProduction?.(job.id),
      tone: "attention",
    })),
    ...appointmentsToday.map((appointment) => ({
      key: "notification-appointment-" + appointment.id,
      icon: "📅",
      title: "Appointment today",
      detail: (appointment.title || "Appointment") + " · " + (appointment.time || "Time not set"),
      onClick: () => onCalendar?.(appointment.id),
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
  const isBrandNewBusiness = people.length === 0 && jobs.length === 0 && appointments.length === 0 && invoices.length === 0;

  return (
    <section style={cardStyle(940)}>
      <p style={eyebrowStyle}>YOUR BIZZIBUDDI BUSINESS</p>
      <h2 style={sectionHeading}>Welcome to {account?.business || "your business"}.</h2>
      <p style={copyStyle}>Your business is ready. This is your operating view — what needs attention, what is happening today and where to go next.</p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginTop: 18, padding: "10px 12px", borderRadius: 12, border: "1px solid " + BORDER, background: "rgba(255,255,255,.025)" }}>
        <div style={{ minWidth: 0 }}>
          <small style={smallText}>TODAY</small>
          <strong style={{ display: "block", marginTop: 3, fontSize: 16 }}>{today.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <button type="button" onClick={() => document.getElementById("today-priority-list")?.scrollIntoView({ behavior: "smooth", block: "start" })} style={todayJumpButton}>Priorities <span>{actionCount}</span></button>
          <button type="button" onClick={() => document.getElementById("today-upcoming")?.scrollIntoView({ behavior: "smooth", block: "start" })} style={todayJumpButton}>Upcoming <span>{appointmentsToday.length}</span></button>
          <button type="button" onClick={() => document.getElementById("today-attention")?.scrollIntoView({ behavior: "smooth", block: "start" })} style={todayJumpButton}>Attention <span>{notificationCount}</span></button>
        </div>
      </div>

      <div style={{ marginTop: 20, padding: 16, borderRadius: 14, border: "1px solid " + BORDER, background: "rgba(0,180,219,.045)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <small style={smallText}>HOW BIZZIBUDDI WORKS</small>
            <strong style={{ display: "block", marginTop: 5, fontSize: 18 }}>Run your business through one simple workflow.</strong>
            <p style={{ ...copyStyle, margin: "4px 0 0", fontSize: 12 }}>People become jobs. Jobs move through production. Calendar keeps time organised. Finance keeps money visible. Today brings it all together.</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 7, marginTop: 14 }}>
          {[
            ["👥", "People", "Who", onPeople],
            ["📋", "Jobs", "What", onJobs],
            ["🏭", "Production", "Work", onProduction],
            ["📅", "Calendar", "When", onCalendar],
            ["💳", "Finance", "Money", onFinance],
          ].map(([icon, label, sublabel, action], index) => (
            <button
              key={label}
              type="button"
              onClick={action}
              style={{
                minWidth: 0,
                padding: "10px 8px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,.09)",
                background: "rgba(255,255,255,.025)",
                color: TEXT,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ display: "block", fontSize: 17 }}>{icon}</span>
              <strong style={{ display: "block", marginTop: 4, fontSize: 12 }}>{index + 1}. {label}</strong>
              <small style={{ color: MUTED, fontSize: 10 }}>{sublabel}</small>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 8, color: CYAN, fontSize: 11, fontWeight: 800 }}>
          <span>1</span><span>→</span><span>2</span><span>→</span><span>3</span><span>→</span><span>4</span><span>→</span><span>5</span>
        </div>
      </div>

      {isBrandNewBusiness && (
        <div
          style={{
            marginTop: 20,
            padding: 22,
            borderRadius: 18,
            border: "1px solid rgba(0,180,219,.35)",
            background: "linear-gradient(135deg, rgba(0,180,219,.10), rgba(37,99,235,.08))",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <small style={{ ...smallText, color: CYAN, fontWeight: 900, letterSpacing: ".12em" }}>YOUR FIRST DAY</small>
              <h3 style={{ margin: "7px 0 5px", fontSize: 26 }}>Let's get your business moving.</h3>
              <p style={{ ...copyStyle, margin: 0, maxWidth: 720 }}>
                Your workspace is ready, but there is nothing to manage yet. Start with one person, then connect your first job, appointment and financial record.
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 9, marginTop: 16 }}>
            {[
              ["1", "Add a person", "Start your customer or contact list.", onPeople],
              ["2", "Create a job", "Track the work you need to deliver.", onJobs],
              ["3", "Schedule something", "Put the next important date on your calendar.", onCalendar],
              ["4", "Open Finance", "Set up your first invoice or payment.", onFinance],
            ].map(([number, title, detail, action]) => (
              <button
                key={number}
                type="button"
                onClick={action}
                style={{
                  padding: 13,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,.10)",
                  background: "rgba(255,255,255,.035)",
                  color: TEXT,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "grid", placeItems: "center", width: 24, height: 24, borderRadius: "50%", background: "rgba(0,180,219,.14)", color: CYAN, fontWeight: 900, fontSize: 11 }}>
                  {number}
                </span>
                <strong style={{ display: "block", marginTop: 8, fontSize: 13 }}>{title}</strong>
                <span style={{ display: "block", marginTop: 4, color: MUTED, fontSize: 10, lineHeight: 1.4 }}>{detail}</span>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={onGettingStartedBuddi} style={nextActionButton}>
              Open the Getting Started guide →
            </button>
            <button type="button" onClick={onBuddi} style={todayJumpButton}>
              Ask Buddi what to do →
            </button>
          </div>
        </div>
      )}

      {nextAction && (
        <div style={nextActionPanel}>
          <div style={nextActionIcon}>{nextAction.icon}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <small style={{ ...smallText, color: CYAN, fontWeight: 900, letterSpacing: ".12em" }}>NEXT ACTION</small>
            <strong style={{ display: "block", marginTop: 4, fontSize: 21 }}>{nextAction.title}</strong>
            <span style={{ display: "block", marginTop: 3, color: MUTED, fontSize: 13 }}>{nextAction.detail}</span>
          </div>
          {nextActionHandler && (
            <button type="button" onClick={nextActionHandler} style={nextActionButton}>
              {nextActionLabel} →
            </button>
          )}
        </div>
      )}

      <div id="today-overview" className="bizzibuddi-today-overview" style={attentionPanel}>
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

        <div className="bizzibuddi-attention-summary" style={attentionSummary}>
          <div style={attentionSummaryItem}>
            <strong style={{ fontSize: 18, lineHeight: 1.1 }}>{actionCount}</strong>
            <span style={{ color: MUTED, fontSize: 11, lineHeight: 1.25 }}>{actionCount === 1 ? "action item" : "action items"}</span>
          </div>
          <div style={attentionSummaryItem}>
            <strong style={{ fontSize: 18, lineHeight: 1.1 }}>{appointmentsToday.length}</strong>
            <span style={{ color: MUTED, fontSize: 11, lineHeight: 1.25 }}>{appointmentsToday.length === 1 ? "appointment today" : "appointments today"}</span>
          </div>
          <div style={attentionSummaryItem}>
            <strong style={{ fontSize: 18, lineHeight: 1.1 }}>{openJobs}</strong>
            <span style={{ color: MUTED, fontSize: 11, lineHeight: 1.25 }}>{openJobs === 1 ? "open job" : "open jobs"}</span>
          </div>
          <div style={attentionSummaryItem}>
            <strong style={{ fontSize: 18, lineHeight: 1.1 }}>{formatCurrency(outstanding)}</strong>
            <span style={{ color: MUTED, fontSize: 11, lineHeight: 1.25 }}>outstanding</span>
          </div>
        </div>

        {priorityItems.length > 0 ? (
          <div id="today-priority-list" style={attentionList}>
            {priorityItems.map((item, index) => {
              const urgencyLabel =
                item.tone === "urgent"
                  ? "URGENT"
                  : item.tone === "attention"
                    ? "ATTENTION"
                    : item.tone === "today"
                      ? "TODAY"
                      : "NEXT";
              const urgencyStyle =
                item.tone === "urgent"
                  ? { color: "#ff9b9b", background: "rgba(255,107,107,.10)", borderColor: "rgba(255,107,107,.25)" }
                  : item.tone === "attention"
                    ? { color: "#f6c453", background: "rgba(246,196,83,.10)", borderColor: "rgba(246,196,83,.25)" }
                    : item.tone === "today"
                      ? { color: CYAN, background: "rgba(0,180,219,.10)", borderColor: "rgba(0,180,219,.25)" }
                      : { color: MUTED, background: "rgba(255,255,255,.05)", borderColor: "rgba(255,255,255,.10)" };

              return (
                <article key={item.key} style={{ ...attentionItem(item.tone), position: "relative", overflow: "hidden" }}>
                  <div style={{ ...attentionItemIcon, alignSelf: "flex-start" }}>{item.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                      <small style={smallText}>{item.label}</small>
                      <span style={{ ...urgencyStyle, border: "1px solid", borderRadius: 999, padding: "2px 6px", fontSize: 9, fontWeight: 900, letterSpacing: ".08em" }}>{urgencyLabel}</span>
                      <span style={{ color: MUTED, fontSize: 10, fontWeight: 700, marginLeft: "auto" }}>#{index + 1}</span>
                    </div>
                    <strong style={{ display: "block", marginTop: 5, fontSize: 16, lineHeight: 1.3 }}>{item.title}</strong>
                    <span style={{ display: "block", marginTop: 4, color: MUTED, fontSize: 13, lineHeight: 1.45 }}>{item.detail}</span>
                  </div>
                  <button type="button" onClick={item.onClick} style={{ ...attentionAction, flexShrink: 0 }}>{item.action} →</button>
                </article>
              );
            })}
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
          <span>{intelligence.priorityCount > priorityItems.length ? `${intelligence.priorityCount - priorityItems.length} lower-priority item${intelligence.priorityCount - priorityItems.length === 1 ? "" : "s"} also available below.` : recentAutomationFlags.length > 0 ? `${recentAutomationFlags.length} overdue item${recentAutomationFlags.length === 1 ? "" : "s"} also flagged by Automation.` : "Buddi can help you review this picture and turn it into your next action."}</span>
          <button type="button" onClick={onAttentionBuddi} style={attentionFooterButton}>Ask Buddi what needs attention →</button>
        </div>
      </div>

      <div id="today-upcoming" className="bizzibuddi-today-panel" style={todayViewPanel}>
        <div className="bizzibuddi-today-header" style={todayViewHeader}>
          <div>
            <small style={smallText}>DAILY OPERATING VIEW</small>
            <h3 style={{ margin: "6px 0 5px", fontSize: 24 }}>Today & next up.</h3>
            <p style={{ ...copyStyle, margin: 0 }}>A quick view of what is happening today and what is coming up next.</p>
          </div>
          <span style={todayViewDate}>{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</span>
        </div>

        <div className="bizzibuddi-today-grid" style={todayViewGrid}>
          <div style={todayViewCard}>
            <small style={smallText}>NOW</small>
            <strong style={todayViewMetric}>{nowAppointment ? "1" : "—"}</strong>
            <span style={todayViewLabel}>{nowAppointment ? "appointment in progress" : "no appointment right now"}</span>
            {nowAppointment ? (
              <button type="button" onClick={() => onCalendar?.(nowAppointment.id)} style={todayViewItem}>
                <span>Now · {nowAppointment.time || "Time not set"}</span>
                <strong>{nowAppointment.title || "Appointment"}</strong>
              </button>
            ) : (
              <span style={todayViewEmpty}>Nothing scheduled in the current hour.</span>
            )}
          </div>

          <div style={todayViewCard}>
            <small style={smallText}>TODAY</small>
            <strong style={todayViewMetric}>{appointmentsToday.length}</strong>
            <span style={todayViewLabel}>{appointmentsToday.length === 1 ? "appointment" : "appointments"}</span>
            {upcomingAppointments.slice(0, 3).map((appointment) => (
              <button key={appointment.id} type="button" onClick={() => onCalendar?.(appointment.id)} style={todayViewItem}>
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
              <button key={`today-invoice-${invoice.id}`} type="button" onClick={() => onFinance?.(invoice.id)} style={todayViewItem}>
                <span>{dueSoonLabel(invoice.dueDate)} · {invoice.dueDate}</span>
                <strong>{invoice.clientName || invoice.client || "Invoice"}</strong>
              </button>
            ))}
            {productionDueSoon.slice(0, 2).map((job) => (
              <button key={`today-production-${job.id}`} type="button" onClick={() => onJobs?.(job.id)} style={todayViewItem}>
                <span>{dueSoonLabel(job.productionDueDate)} · Production</span>
                <strong>{job.title || "Production job"}</strong>
              </button>
            ))}
            {dueSoonInvoices.length === 0 && productionDueSoon.length === 0 && <span style={todayViewEmpty}>Nothing due in the next few days.</span>}
          </div>

          <div style={todayViewCard}>
            <small style={smallText}>WORKFLOW</small>
            <strong style={todayViewMetric}>{productionNeedsAttention.length + waitingJobs.length}</strong>
            <span style={todayViewLabel}>jobs needing a workflow step</span>
            {[...productionNeedsAttention, ...waitingJobs.filter((job) => !productionNeedsAttention.some((item) => item.id === job.id))]
              .slice(0, 4)
              .map((job) => {
                const status = productionNeedsAttention.includes(job)
                  ? job.productionReadiness
                  : "Waiting";
                const statusStyle =
                  status === "Overdue"
                    ? { color: "#ff9b9b", background: "rgba(255,107,107,.10)", borderColor: "rgba(255,107,107,.25)" }
                    : status === "Tasks outstanding"
                      ? { color: "#f6c453", background: "rgba(246,196,83,.10)", borderColor: "rgba(246,196,83,.25)" }
                      : status === "Stage update needed"
                        ? { color: CYAN, background: "rgba(0,180,219,.10)", borderColor: "rgba(0,180,219,.25)" }
                        : { color: MUTED, background: "rgba(255,255,255,.05)", borderColor: "rgba(255,255,255,.10)" };
                return (
                  <button key={`today-workflow-${job.id}`} type="button" onClick={() => onJobs?.(job.id)} style={todayViewItem}>
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span>{job.title || "Job"}</span>
                      <span style={{ color: statusStyle.color, background: statusStyle.background, border: "1px solid " + statusStyle.borderColor, borderRadius: 999, padding: "2px 6px", fontSize: 9, fontWeight: 900, letterSpacing: ".06em", whiteSpace: "nowrap" }}>{status.toUpperCase()}</span>
                    </span>
                    <strong>{status === "Waiting" ? "Waiting for next step" : status}</strong>
                  </button>
                );
              })}
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
            {recentActivity.map((item) => {
              const activityStyle =
                item.label === "Finance"
                  ? { color: "#7dd3fc", background: "rgba(56,189,248,.10)", borderColor: "rgba(56,189,248,.24)" }
                  : item.label === "Job"
                    ? { color: "#c4b5fd", background: "rgba(139,92,246,.10)", borderColor: "rgba(139,92,246,.24)" }
                    : item.label === "Calendar"
                      ? { color: "#86efac", background: "rgba(34,197,94,.10)", borderColor: "rgba(34,197,94,.24)" }
                      : item.label === "Production"
                        ? { color: "#fcd34d", background: "rgba(245,158,11,.10)", borderColor: "rgba(245,158,11,.24)" }
                        : { color: "#d8b4fe", background: "rgba(168,85,247,.10)", borderColor: "rgba(168,85,247,.24)" };

              return (
                <button key={item.key} type="button" onClick={item.onClick} style={{ display: "grid", gridTemplateColumns: "38px minmax(0,1fr) auto", alignItems: "center", gap: 11, width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.025)", color: TEXT, textAlign: "left", cursor: "pointer" }}>
                  <span style={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 9, background: activityStyle.background }}>{item.icon}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: activityStyle.color, background: activityStyle.background, border: "1px solid " + activityStyle.borderColor, borderRadius: 999, padding: "2px 6px", fontSize: 9, fontWeight: 900, letterSpacing: ".07em", textTransform: "uppercase" }}>{item.label}</span>
                    <strong style={{ display: "block", marginTop: 5, fontSize: 14 }}>{item.title}</strong>
                    <span style={{ display: "block", marginTop: 2, color: MUTED, fontSize: 12 }}>{item.detail}</span>
                  </span>
                  <span style={{ color: MUTED, fontSize: 11, whiteSpace: "nowrap" }}>{formatTimelineDate(item.date)}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <span style={todayViewEmpty}>No recent business activity has been recorded yet.</span>
        )}
      </div>

      <div id="today-attention" style={{ ...todayViewPanel, marginTop: 18 }}>
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
            {notificationItems.map((item) => {
              const statusLabel = item.tone === "urgent" ? "URGENT" : item.tone === "attention" ? "ATTENTION" : "TODAY";
              const statusStyle =
                item.tone === "urgent"
                  ? { color: "#ff9b9b", background: "rgba(255,107,107,.10)", borderColor: "rgba(255,107,107,.25)" }
                  : item.tone === "attention"
                    ? { color: "#f6c453", background: "rgba(246,196,83,.10)", borderColor: "rgba(246,196,83,.25)" }
                    : { color: CYAN, background: "rgba(0,180,219,.10)", borderColor: "rgba(0,180,219,.25)" };

              return (
                <article key={item.key} style={{ ...attentionItem(item.tone), position: "relative", overflow: "hidden" }}>
                  <div style={{ ...attentionItemIcon, alignSelf: "flex-start" }}>{item.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                      <span style={{ color: statusStyle.color, background: statusStyle.background, border: "1px solid " + statusStyle.borderColor, borderRadius: 999, padding: "2px 6px", fontSize: 9, fontWeight: 900, letterSpacing: ".08em" }}>{statusLabel}</span>
                      <strong style={{ fontSize: 15 }}>{item.title}</strong>
                    </div>
                    <span style={{ display: "block", marginTop: 5, color: MUTED, fontSize: 13, lineHeight: 1.45 }}>{item.detail}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <button type="button" onClick={item.onClick} style={{ ...attentionAction, fontWeight: 900 }}>Open →</button>
                    <button type="button" onClick={() => setDismissedNotifications((current) => [...current, item.key])} style={smallActionButton}>Dismiss</button>
                  </div>
                </article>
              );
            })}
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
        <div className="bizzibuddi-today-grid" style={{ ...todayViewGrid, marginTop: 16 }}>
          {healthMetrics.map((metric) => {
            const stateLabel = metric.tone === "good" ? "GOOD" : metric.tone === "watch" ? "WATCH" : "NEUTRAL";
            const stateStyle =
              metric.tone === "good"
                ? { color: "#58e0b1", background: "rgba(88,224,177,.10)", borderColor: "rgba(88,224,177,.25)" }
                : metric.tone === "watch"
                  ? { color: "#f6c453", background: "rgba(246,196,83,.10)", borderColor: "rgba(246,196,83,.25)" }
                  : { color: MUTED, background: "rgba(255,255,255,.05)", borderColor: "rgba(255,255,255,.10)" };

            return (
              <article key={metric.label} style={{ ...todayViewCard, position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <small style={smallText}>{metric.label.toUpperCase()}</small>
                  <span style={{ color: stateStyle.color, background: stateStyle.background, border: "1px solid " + stateStyle.borderColor, borderRadius: 999, padding: "2px 6px", fontSize: 9, fontWeight: 900, letterSpacing: ".08em" }}>{stateLabel}</span>
                </div>
                <strong style={{ ...todayViewMetric, color: metric.tone === "watch" ? "#f6c453" : metric.tone === "good" ? "#58e0b1" : TEXT }}>{metric.value}</strong>
                <span style={todayViewLabel}>{metric.detail}</span>
              </article>
            );
          })}
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
          <button type="button" onClick={onPeople} style={actionCard}><span style={actionIcon}>👥</span><span style={actionCardContent}><strong style={actionCardTitle}>Add your people</strong><small style={actionCardDescription}>Keep clients and contacts organised.</small></span></button>
          <button type="button" onClick={onJobs} style={actionCard}><span style={actionIcon}>📋</span><span style={actionCardContent}><strong style={actionCardTitle}>Create a job</strong><small style={actionCardDescription}>Start tracking work from enquiry to completion.</small></span></button>
          <button type="button" onClick={onCalendar} style={actionCard}><span style={actionIcon}>📅</span><span style={actionCardContent}><strong style={actionCardTitle}>Open your calendar</strong><small style={actionCardDescription}>Keep appointments and business dates organised.</small></span></button>
          <button type="button" onClick={onFinance} style={actionCard}><span style={actionIcon}>💳</span><span style={actionCardContent}><strong style={actionCardTitle}>Open finance</strong><small style={actionCardDescription}>Manage invoices and payment status.</small></span></button>
          <button type="button" onClick={onAutomation} style={actionCard}><span style={actionIcon}>⚙️</span><span style={actionCardContent}><strong style={actionCardTitle}>Open automation</strong><small style={actionCardDescription}>Turn routine business events into useful follow-up.</small></span></button>
          <button type="button" onClick={onProduction} style={actionCard}><span style={actionIcon}>🏭</span><span style={actionCardContent}><strong style={actionCardTitle}>Open production</strong><small style={actionCardDescription}>Track work stages, tasks and production progress.</small></span></button>
          <button type="button" onClick={onReports} style={actionCard}><span style={actionIcon}>📊</span><span style={actionCardContent}><strong style={actionCardTitle}>Open reports</strong><small style={actionCardDescription}>See the numbers and activity behind your business.</small></span></button>
          <button type="button" onClick={onBuddi} style={{ ...actionCard, borderColor: "rgba(0,180,219,.55)", background: "rgba(0,180,219,.08)" }}><span style={actionIcon}>🤖</span><span style={actionCardContent}><strong style={actionCardTitle}>Ask Buddi</strong><small style={actionCardDescription}>Get help understanding your people, jobs, calendar and money.</small></span></button>
          <button type="button" onClick={onPlans} style={actionCard}><span style={actionIcon}>⚡</span><span style={actionCardContent}><strong style={actionCardTitle}>Explore plans</strong><small style={actionCardDescription}>See what is available as BizziBuddi grows.</small></span></button>
        </div>
      </div>

      <MembershipAccessPanel planName={account?.plan} />
      <div style={businessNote}><strong>Your business is ready.</strong><p style={copyStyle}>Your BizziBuddi account and business data are securely stored on the server. Use Account → Start fresh if you ever need to clear this business and begin again.</p></div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", marginTop: 18 }}>
        <button type="button" onClick={onLogout} style={textButton}>Log out</button>
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

function ProductionPanel({ account, jobs, records, templates, timeEntries, initialJobId, onPlans, onSave, onBack, onCreateTemplate, onUpdateTemplate, onDeleteTemplate, onStartTimer, onStopTimer }) {
  const available = hasBizzibuddiFeature(account?.plan, "production");
  const stages = ["Not started", "In production", "Quality check", "Ready", "Complete"];
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id || "");
  const [taskDrafts, setTaskDrafts] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [quickSavingJobId, setQuickSavingJobId] = useState("");
  const [error, setError] = useState("");
  const [queueFilter, setQueueFilter] = useState("active");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateTaskDrafts, setTemplateTaskDrafts] = useState([]);
  const [newTemplateTaskTitle, setNewTemplateTaskTitle] = useState("");
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const [timerBusy, setTimerBusy] = useState(false);
  const [timerNow, setTimerNow] = useState(Date.now());
  const selectedWorkItemRef = useRef(null);

  const todayKey = new Date().toISOString().slice(0, 10);
  const today = new Date(todayKey + "T00:00:00");

  const productionByJob = new Map(records.map((record) => [record.jobId, record]));
  const productionJobs = jobs.map((job) => {
    const record = productionByJob.get(job.id);
    const tasks = record?.tasks || [];
    const completedTasks = tasks.filter((task) => task.complete).length;
    const stage = record?.stage || "Not started";
    const progress = stage === "Complete"
      ? 100
      : stage === "Ready"
        ? 75
        : stage === "Quality check"
          ? 50
          : stage === "In production"
            ? 25
            : 0;
    const dueDate = record?.dueDate || "";
    const due = dueDate ? new Date(dueDate + "T00:00:00") : null;
    const overdue = Boolean(due && due < today && stage !== "Complete");
    const dueToday = Boolean(due && due.getTime() === today.getTime() && stage !== "Complete");
    const ready = stage === "Ready";
    const complete = stage === "Complete";
    const readiness = complete
      ? "Complete"
      : overdue
        ? "Overdue"
        : ready && tasks.length > 0 && completedTasks < tasks.length
          ? "Tasks outstanding"
          : ready
            ? "Ready"
            : tasks.length > 0 && completedTasks === tasks.length
              ? "Stage update needed"
              : stage === "Not started"
                ? "Not started"
                : "In progress";

    return {
      ...job,
      productionRecord: record,
      productionStage: stage,
      productionProgress: progress,
      productionDueDate: dueDate,
      productionTaskCount: tasks.length,
      productionCompletedTaskCount: completedTasks,
      productionTaskProgress: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
      productionReadiness: readiness,
      overdue,
      dueToday,
      ready,
      complete,
    };
  });

  const filteredJobs = productionJobs.filter((job) => {
    if (queueFilter === "active") return !job.complete;
    if (queueFilter === "due-today") return job.dueToday;
    if (queueFilter === "overdue") return job.overdue;
    if (queueFilter === "ready") return job.ready;
    if (queueFilter === "complete") return job.complete;
    return true;
  });

  filteredJobs.sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    if (a.dueToday !== b.dueToday) return a.dueToday ? -1 : 1;
    if (a.ready !== b.ready) return a.ready ? -1 : 1;
    const aDate = a.productionDueDate ? new Date(a.productionDueDate + "T00:00:00").getTime() : Number.POSITIVE_INFINITY;
    const bDate = b.productionDueDate ? new Date(b.productionDueDate + "T00:00:00").getTime() : Number.POSITIVE_INFINITY;
    return aDate - bDate;
  });

  const activeCount = productionJobs.filter((job) => !job.complete).length;
  const dueTodayCount = productionJobs.filter((job) => job.dueToday).length;
  const overdueCount = productionJobs.filter((job) => job.overdue).length;
  const readyCount = productionJobs.filter((job) => job.ready).length;
  const completeCount = productionJobs.filter((job) => job.complete).length;
  const totalTasks = productionJobs.reduce((sum, job) => sum + job.productionTaskCount, 0);
  const completedTasks = productionJobs.reduce((sum, job) => sum + job.productionCompletedTaskCount, 0);
  const taskProgress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const workloadJobs = productionJobs
    .filter((job) => !job.complete)
    .map((job) => {
      const remainingTasks = Math.max(0, job.productionTaskCount - job.productionCompletedTaskCount);
      const dueDays = job.productionDueDate
        ? Math.ceil((new Date(job.productionDueDate + "T00:00:00") - today) / 86400000)
        : null;
      const pressureScore =
        (job.overdue ? 100 : 0) +
        (job.dueToday ? 70 : 0) +
        (dueDays !== null && dueDays > 0 && dueDays <= 3 ? 40 : 0) +
        (dueDays !== null && dueDays > 3 && dueDays <= 7 ? 20 : 0) +
        (remainingTasks * 5) +
        (job.productionStage === "Not started" ? 10 : 0);

      const pressure = pressureScore >= 100
        ? "Overloaded"
        : pressureScore >= 70
          ? "Heavy"
          : pressureScore >= 35
            ? "Normal"
            : "Light";

      const loggedSeconds = timeEntries
        .filter((entry) => entry.jobId === job.id)
        .reduce((sum, entry) => sum + Number(entry.durationSeconds || 0), 0);

      return { ...job, remainingTasks, dueDays, pressureScore, pressure, loggedSeconds };
    })
    .sort((a, b) => b.pressureScore - a.pressureScore);

  const workloadActive = workloadJobs.length;
  const workloadTasksRemaining = workloadJobs.reduce((sum, job) => sum + job.remainingTasks, 0);
  const workloadLoggedSeconds = workloadJobs.reduce((sum, job) => sum + job.loggedSeconds, 0);
  const workloadPressure = workloadJobs.length
    ? workloadJobs.reduce((sum, job) => sum + job.pressureScore, 0) / workloadJobs.length
    : 0;
  const workloadLevel = workloadPressure >= 100
    ? "Overloaded"
    : workloadPressure >= 60
      ? "Heavy"
      : workloadPressure >= 30
        ? "Normal"
        : "Light";

  const selectedJob = productionJobs.find((job) => job.id === selectedJobId);
  const existing = selectedJob?.productionRecord || null;
  const activeTimer = timeEntries.find((entry) => !entry.stoppedAt) || null;
  const selectedJobTimeSeconds = timeEntries
    .filter((entry) => entry.jobId === selectedJobId)
    .reduce((sum, entry) => {
      const elapsed = entry.stoppedAt
        ? entry.durationSeconds
        : Math.max(0, Math.round((timerNow - new Date(entry.startedAt).getTime()) / 1000));
      return sum + elapsed;
    }, 0);


  useEffect(() => {
    if (initialJobId && jobs.some((job) => String(job.id) === String(initialJobId))) {
      setSelectedJobId(initialJobId);
    }
  }, [jobs, initialJobId]);

  useEffect(() => {
    if (!selectedJobId || !selectedWorkItemRef.current) return undefined;

    const frame = window.requestAnimationFrame(() => {
      selectedWorkItemRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedJobId]);

  useEffect(() => {
    if (!jobs.some((job) => job.id === selectedJobId)) {
      setSelectedJobId(jobs[0]?.id || "");
    }
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
    setError("");
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

  async function saveRecord(record, jobId = record.jobId) {
    setError("");
    setSaving(true);

    try {
      await onSave(record);
      setSelectedJobId(jobId);
    } catch (requestError) {
      setError(requestError.message || "We could not save production progress.");
      throw requestError;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const tasks = taskDrafts
      .map((task) => ({
        id: String(task.id),
        title: String(task.title || "").trim(),
        complete: Boolean(task.complete),
      }))
      .filter((task) => task.title);

    await saveRecord({
      id: existing?.id || "production-" + Date.now(),
      jobId: selectedJobId,
      jobTitle: selectedJob?.title || "Untitled job",
      stage: String(form.get("stage") || "Not started"),
      dueDate: String(form.get("dueDate") || ""),
      notes: String(form.get("notes") || "").trim(),
      tasks,
      updatedAt: new Date().toISOString(),
    });
  }

  async function handleQuickComplete(job) {
    const record = job.productionRecord;
    setError("");
    setQuickSavingJobId(job.id);

    try {
      await onSave({
        id: record?.id || "production-" + Date.now(),
        jobId: job.id,
        jobTitle: job.title || "Untitled job",
        stage: "Complete",
        dueDate: record?.dueDate || "",
        notes: record?.notes || "",
        tasks: record?.tasks || [],
        updatedAt: new Date().toISOString(),
      });
      setSelectedJobId(job.id);
    } catch (requestError) {
      setError(requestError.message || "We could not mark production complete.");
    } finally {
      setQuickSavingJobId("");
    }
  }

  function startNewTemplate() {
    setSelectedTemplateId("");
    setTemplateName("");
    setTemplateDescription("");
    setTemplateTaskDrafts([]);
    setNewTemplateTaskTitle("");
    setTemplateError("");
  }

  function addTemplateTask(event) {
    event.preventDefault();
    const title = newTemplateTaskTitle.trim();
    if (!title || templateTaskDrafts.length >= 100) return;

    setTemplateTaskDrafts((current) => [
      ...current,
      { id: "template-task-" + Date.now() + "-" + current.length, title },
    ]);
    setNewTemplateTaskTitle("");
  }

  function updateTemplateTask(taskId, title) {
    setTemplateTaskDrafts((current) =>
      current.map((task) => task.id === taskId ? { ...task, title } : task)
    );
  }

  function removeTemplateTask(taskId) {
    setTemplateTaskDrafts((current) => current.filter((task) => task.id !== taskId));
  }

  async function saveTemplate() {
    const name = templateName.trim();
    const tasks = templateTaskDrafts
      .map((task) => ({ id: String(task.id), title: String(task.title || "").trim() }))
      .filter((task) => task.title);

    if (!name) {
      setTemplateError("Give the template a name.");
      return;
    }

    if (!tasks.length) {
      setTemplateError("Add at least one task to the template.");
      return;
    }

    setTemplateSaving(true);
    setTemplateError("");

    try {
      const payload = {
        name,
        description: templateDescription.trim(),
        tasks,
      };

      const saved = selectedTemplateId
        ? await onUpdateTemplate(selectedTemplateId, payload)
        : await onCreateTemplate(payload);

      setSelectedTemplateId(saved.id);
      setTemplateName(saved.name || "");
      setTemplateDescription(saved.description || "");
      setTemplateTaskDrafts(saved.tasks || []);
    } catch (requestError) {
      setTemplateError(requestError.message || "We could not save the production template.");
    } finally {
      setTemplateSaving(false);
    }
  }

  async function deleteTemplate() {
    if (!selectedTemplateId) return;
    const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);
    if (!selectedTemplate) return;

    setTemplateSaving(true);
    setTemplateError("");

    try {
      await onDeleteTemplate(selectedTemplateId);
      startNewTemplate();
    } catch (requestError) {
      setTemplateError(requestError.message || "We could not delete the production template.");
    } finally {
      setTemplateSaving(false);
    }
  }

  async function applySelectedTemplate() {
    const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);

    if (!selectedTemplate || !selectedJob) {
      setTemplateError("Select a template and a production job first.");
      return;
    }

    const templateTasks = (selectedTemplate.tasks || [])
      .map((task) => String(task.title || "").trim())
      .filter(Boolean);

    if (!templateTasks.length) {
      setTemplateError("This template has no tasks to apply.");
      return;
    }

    const existingTitles = new Set(
      taskDrafts.map((task) => String(task.title || "").trim().toLowerCase())
    );

    const appendedTasks = templateTasks
      .filter((title) => !existingTitles.has(title.toLowerCase()))
      .map((title, index) => ({
        id: "task-template-" + Date.now() + "-" + index,
        title,
        complete: false,
      }));

    if (!appendedTasks.length) {
      setTemplateError("All tasks from this template are already on this job.");
      return;
    }

    const nextTasks = [...taskDrafts, ...appendedTasks];

    setTaskDrafts(nextTasks);
    setTemplateError("");

    await saveRecord({
      id: existing?.id || "production-" + Date.now(),
      jobId: selectedJob.id,
      jobTitle: selectedJob.title || "Untitled job",
      stage: existing?.stage || "Not started",
      dueDate: existing?.dueDate || "",
      notes: existing?.notes || "",
      tasks: nextTasks,
      updatedAt: new Date().toISOString(),
    });

    try {
      await bizzibuddiAuthRequest("/api/bizzibuddi/auth/automation/events", {
        method: "POST",
        body: JSON.stringify({
          type: "job-production-template-applied",
          title: "Production template applied",
          detail: selectedTemplate.name + " was applied to " + (selectedJob.title || "job") + ".",
          sourceKey: "job-production-template-applied:" + selectedJob.id + ":" + selectedTemplate.id + ":" + Date.now(),
          jobId: selectedJob.id,
        }),
      });
    } catch {
      // Production is already saved; automation logging can fail without affecting the task application.
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

  const completedDraftTasks = taskDrafts.filter((task) => task.complete).length;
  const draftTaskPercent = taskDrafts.length
    ? Math.round((completedDraftTasks / taskDrafts.length) * 100)
    : 0;

  const filterButton = (key, label, count) => (
    <button
      key={key}
      type="button"
      onClick={() => setQueueFilter(key)}
      style={{
        border: "1px solid " + (queueFilter === key ? "rgba(0,180,219,.65)" : BORDER),
        borderRadius: 999,
        padding: "8px 11px",
        background: queueFilter === key ? "rgba(0,180,219,.13)" : "rgba(255,255,255,.035)",
        color: TEXT,
        fontSize: 11,
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      {label} <span style={{ color: queueFilter === key ? CYAN : MUTED }}>{count}</span>
    </button>
  );

  return (
    <section style={cardStyle(1040)}>
      <button type="button" onClick={onBack} style={textButton}>← Back to business</button>

      <div style={{ marginTop: 22 }}>
        <p style={eyebrowStyle}>PRODUCTION</p>
        <h2 style={sectionHeading}>Production workflow.</h2>
        <p style={copyStyle}>One place to see what is on the workroom floor, what is due, what is ready and what needs to move next.</p>
      </div>

      <div style={{
        marginTop: 22,
        padding: 16,
        borderRadius: 14,
        border: "1px solid " + BORDER,
        background: "rgba(255,255,255,.025)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <small style={smallText}>PRODUCTION TASK TEMPLATES</small>
            <strong style={{ display: "block", marginTop: 4, fontSize: 18 }}>Build once. Reuse every time.</strong>
            <p style={{ ...copyStyle, margin: "5px 0 0", fontSize: 13 }}>
              Save recurring workroom checklists and apply them without overwriting tasks already on a job.
            </p>
          </div>
          <button type="button" onClick={startNewTemplate} style={smallActionButton}>+ New template</button>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 14,
          marginTop: 14,
        }}>
          <div>
            <label style={fieldStyle}>
              Template
              <select
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
                style={inputStyle}
              >
                <option value="">New template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </label>

            <label style={fieldStyle}>
              Template name
              <input value={templateName} onChange={(event) => setTemplateName(event.target.value)} maxLength={120} style={inputStyle} placeholder="e.g. Standard dressmaking job" />
            </label>

            <label style={fieldStyle}>
              Description
              <input value={templateDescription} onChange={(event) => setTemplateDescription(event.target.value)} maxLength={500} style={inputStyle} placeholder="Optional workflow description" />
            </label>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              <button type="button" onClick={saveTemplate} disabled={templateSaving} style={{ ...primaryButton, width: "auto", marginTop: 0, opacity: templateSaving ? .65 : 1 }}>
                {templateSaving ? "Saving…" : selectedTemplateId ? "Save template" : "Create template"}
              </button>
              {selectedTemplateId && (
                <button type="button" onClick={deleteTemplate} disabled={templateSaving} style={smallDangerButton}>
                  Delete
                </button>
              )}
            </div>
          </div>

          <div style={{
            border: "1px solid " + BORDER,
            borderRadius: 11,
            padding: 13,
            background: "rgba(255,255,255,.02)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div>
                <small style={smallText}>TEMPLATE TASKS</small>
                <strong style={{ display: "block", marginTop: 4, fontSize: 15 }}>
                  {templateTaskDrafts.length} task{templateTaskDrafts.length === 1 ? "" : "s"}
                </strong>
              </div>
              {selectedTemplateId && selectedJob && (
                <button type="button" onClick={applySelectedTemplate} disabled={saving} style={{ ...smallActionButton, borderColor: "rgba(0,180,219,.45)", color: CYAN }}>
                  Apply to {selectedJob.title}
                </button>
              )}
            </div>

            {templateTaskDrafts.length > 0 ? (
              <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
                {templateTaskDrafts.map((task, index) => (
                  <div key={task.id} style={{ display: "grid", gridTemplateColumns: "28px minmax(0,1fr) auto", gap: 7, alignItems: "center" }}>
                    <span style={{ color: MUTED, fontSize: 11, textAlign: "center" }}>{index + 1}</span>
                    <input
                      value={task.title}
                      onChange={(event) => updateTemplateTask(task.id, event.target.value)}
                      maxLength={200}
                      style={{ ...inputStyle, minHeight: 40, marginTop: 0 }}
                    />
                    <button type="button" onClick={() => removeTemplateTask(task.id)} disabled={templateSaving} style={smallDangerButton}>Remove</button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ ...smallText, margin: "12px 0" }}>No tasks yet. Add the standard steps for this workflow.</p>
            )}

            <form onSubmit={addTemplateTask} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 7, marginTop: 10 }}>
              <input
                value={newTemplateTaskTitle}
                onChange={(event) => setNewTemplateTaskTitle(event.target.value)}
                placeholder="Add template task"
                maxLength={200}
                style={{ ...inputStyle, minHeight: 42, marginTop: 0 }}
              />
              <button type="submit" disabled={!newTemplateTaskTitle.trim() || templateTaskDrafts.length >= 100} style={{ ...secondaryButton, width: "auto", marginTop: 0 }}>
                + Add
              </button>
            </form>
          </div>
        </div>

        {templateError && <div role="alert" style={{ ...messageStyle, maxWidth: "none", margin: "12px 0 0", textAlign: "left" }}>{templateError}</div>}
      </div>

      <div style={{
        marginTop: 18,
        padding: 16,
        borderRadius: 14,
        border: "1px solid " + BORDER,
        background: activeTimer ? "rgba(0,180,219,.07)" : "rgba(255,255,255,.025)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <small style={smallText}>PRODUCTION TIME</small>
            <strong style={{ display: "block", marginTop: 4, fontSize: 18 }}>
              {selectedJob ? formatProductionDuration(selectedJobTimeSeconds) : "0m"} logged on this job
            </strong>
            <p style={{ ...copyStyle, margin: "4px 0 0", fontSize: 13 }}>
              Track hands-on work as it happens. Time is saved against the production job.
            </p>
          </div>
          {activeTimer ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ ...jobReadinessBadge("In progress"), borderColor: "rgba(0,180,219,.45)" }}>
                ⏱ {formatProductionDuration(Math.max(0, Math.round((timerNow - new Date(activeTimer.startedAt).getTime()) / 1000)))} · {activeTimer.jobTitle}
              </span>
              <button
                type="button"
                onClick={async () => {
                  setTimerBusy(true);
                  try {
                    await onStopTimer(activeTimer.id);
                  } catch (requestError) {
                    setError(requestError.message || "We could not stop the production timer.");
                  } finally {
                    setTimerBusy(false);
                  }
                }}
                disabled={timerBusy}
                style={{ ...smallDangerButton, opacity: timerBusy ? .65 : 1 }}
              >
                {timerBusy ? "Stopping…" : "Stop timer"}
              </button>
            </div>
          ) : selectedJob ? (
            <button
              type="button"
              onClick={async () => {
                setTimerBusy(true);
                setError("");
                try {
                  await onStartTimer(selectedJob.id);
                } catch (requestError) {
                  setError(requestError.message || "We could not start the production timer.");
                } finally {
                  setTimerBusy(false);
                }
              }}
              disabled={timerBusy}
              style={{ ...primaryButton, width: "auto", marginTop: 0, opacity: timerBusy ? .65 : 1 }}
            >
              {timerBusy ? "Starting…" : "▶ Start timer"}
            </button>
          ) : null}
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
        gap: 9,
        marginTop: 24,
      }}>
        {[
          ["Active", activeCount, "rgba(0,180,219,.09)", CYAN],
          ["Due today", dueTodayCount, "rgba(245,158,11,.09)", "#F6C453"],
          ["Overdue", overdueCount, "rgba(220,50,50,.09)", "#FF8C8C"],
          ["Ready", readyCount, "rgba(0,200,140,.09)", "#58E0B1"],
          ["Complete", completeCount, "rgba(255,255,255,.04)", TEXT],
          ["Task progress", taskProgress + "%", "rgba(37,99,235,.10)", TEXT],
        ].map(([label, value, background, color]) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              const filterMap = {
                Active: "active",
                "Due today": "due-today",
                Overdue: "overdue",
                Ready: "ready",
                Complete: "complete",
              };
              if (filterMap[label]) setQueueFilter(filterMap[label]);
            }}
            style={{
              border: "1px solid " + BORDER,
              borderRadius: 12,
              padding: 13,
              background,
              color: TEXT,
              textAlign: "left",
              cursor: filterMapValue(label) ? "pointer" : "default",
            }}
          >
            <small style={smallText}>{label}</small>
            <strong style={{ display: "block", marginTop: 5, fontSize: 23, color }}>{value}</strong>
          </button>
        ))}
      </div>

      <div style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 14,
        border: "1px solid " + BORDER,
        background: "rgba(255,255,255,.025)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <small style={smallText}>WORKLOAD BALANCING</small>
            <strong style={{ display: "block", marginTop: 4, fontSize: 17 }}>
              Production pressure: {workloadLevel}
            </strong>
            <p style={{ ...copyStyle, margin: "4px 0 0", fontSize: 12 }}>
              {workloadActive
                ? "Prioritised from active jobs, remaining tasks and ready-by dates."
                : "No active production workload right now."}
            </p>
          </div>
          <span style={jobReadinessBadge(workloadLevel === "Overloaded" ? "Overdue" : workloadLevel === "Heavy" ? "Tasks outstanding" : workloadLevel === "Normal" ? "In progress" : "Ready")}>
            {workloadActive} active
          </span>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
          gap: 9,
          marginTop: 13,
        }}>
          {[
            ["Active jobs", workloadActive],
            ["Tasks remaining", workloadTasksRemaining],
            ["Logged time", formatProductionDuration(workloadLoggedSeconds)],
          ].map(([label, value]) => (
            <div key={label} style={{ padding: 11, borderRadius: 10, border: "1px solid " + BORDER, background: "rgba(255,255,255,.025)" }}>
              <small style={smallText}>{label}</small>
              <strong style={{ display: "block", marginTop: 4, fontSize: 19 }}>{value}</strong>
            </div>
          ))}
        </div>

        {workloadJobs.length > 0 && (
          <div style={{ display: "grid", gap: 7, marginTop: 12 }}>
            {workloadJobs.slice(0, 4).map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => setSelectedJobId(job.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) auto",
                  gap: 10,
                  alignItems: "center",
                  width: "100%",
                  padding: "9px 11px",
                  borderRadius: 10,
                  border: "1px solid " + BORDER,
                  background: "rgba(255,255,255,.02)",
                  color: TEXT,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span style={{ minWidth: 0 }}>
                  <strong style={{ display: "block", fontSize: 12 }}>{job.title}</strong>
                  <small style={{ color: MUTED }}>
                    {job.remainingTasks} task{job.remainingTasks === 1 ? "" : "s"} remaining
                    {job.productionDueDate ? " · " + (job.overdue ? "Overdue" : job.dueToday ? "Due today" : "Ready by " + formatProductionDate(job.productionDueDate)) : ""}
                  </small>
                </span>
                <span style={jobReadinessBadge(job.pressure === "Overloaded" || job.pressure === "Heavy" ? "Overdue" : job.pressure === "Normal" ? "In progress" : "Ready")}>
                  {job.pressure}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{
        marginTop: 16,
        padding: 14,
        borderRadius: 13,
        border: "1px solid " + BORDER,
        background: "rgba(255,255,255,.025)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <small style={smallText}>PRODUCTION QUEUE</small>
            <strong style={{ display: "block", marginTop: 4, fontSize: 17 }}>
              {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"} showing
            </strong>
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {filterButton("active", "Active", activeCount)}
            {filterButton("due-today", "Due today", dueTodayCount)}
            {filterButton("overdue", "Overdue", overdueCount)}
            {filterButton("ready", "Ready", readyCount)}
            {filterButton("complete", "Complete", completeCount)}
            {filterButton("all", "All", productionJobs.length)}
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div style={{
            marginTop: 14,
            padding: 24,
            borderRadius: 11,
            border: "1px dashed " + BORDER,
            background: "rgba(255,255,255,.02)",
            textAlign: "center",
          }}>
            <strong>No production jobs in this view.</strong>
            <p style={{ ...copyStyle, margin: "5px 0 0", fontSize: 13 }}>
              {queueFilter === "overdue"
                ? "Nothing is currently past its ready-by date."
                : queueFilter === "ready"
                  ? "No production jobs are currently ready."
                  : queueFilter === "complete"
                    ? "No production jobs have been completed yet."
                    : "Create or update a job to start moving work through production."}
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(285px, 1fr))",
            gap: 10,
            marginTop: 14,
          }}>
            {filteredJobs.map((job) => {
              const isSelected = job.id === selectedJobId;
              const taskLabel = job.productionTaskCount
                ? `Tasks ${job.productionCompletedTaskCount}/${job.productionTaskCount}`
                : "No tasks yet";

              return (
                <article
                  key={job.id}
                  style={{
                    border: "1px solid " + (
                      job.overdue
                        ? "rgba(255,107,138,.55)"
                        : isSelected
                          ? "rgba(0,180,219,.55)"
                          : BORDER
                    ),
                    borderRadius: 13,
                    background: job.overdue
                      ? "rgba(220,50,50,.075)"
                      : "rgba(255,255,255,.03)",
                    padding: 14,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0 }}>
                      <small style={{ ...smallText, color: CYAN }}>CLIENT</small>
                      <strong style={{ display: "block", marginTop: 3, fontSize: 16 }}>{job.clientName || "Unassigned"}</strong>
                      <span style={{ display: "block", marginTop: 2, color: MUTED, fontSize: 12 }}>{job.title}</span>
                    </div>
                    <span style={jobReadinessBadge(job.productionReadiness)}>
                      {job.productionReadiness}
                    </span>
                  </div>

                  <div style={{ marginTop: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
                      <span style={{ ...smallText, fontSize: 11 }}>{job.productionStage}</span>
                      <strong style={{ fontSize: 11 }}>{job.productionProgress}%</strong>
                    </div>
                    <div style={jobProgressTrack}>
                      <div style={{ ...jobProgressFill, width: job.productionProgress + "%" }} />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 10 }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: 999,
                      border: "1px solid " + (job.overdue ? "rgba(255,107,138,.45)" : BORDER),
                      background: job.overdue ? "rgba(220,50,50,.09)" : "rgba(255,255,255,.035)",
                      color: job.overdue ? "#FF8C8C" : MUTED,
                      fontSize: 10,
                      fontWeight: 800,
                    }}>
                      {job.productionDueDate
                        ? job.overdue
                          ? "Overdue · " + formatProductionDate(job.productionDueDate)
                          : job.dueToday
                            ? "Due today · " + formatProductionDate(job.productionDueDate)
                            : "Ready by " + formatProductionDate(job.productionDueDate)
                        : "No ready-by date"}
                    </span>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,.035)",
                      color: MUTED,
                      fontSize: 10,
                      fontWeight: 800,
                    }}>
                      {taskLabel}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedJobId(job.id)}
                      style={{ ...smallActionButton, borderColor: "rgba(0,180,219,.45)" }}
                    >
                      {isSelected ? "Editing" : "Manage"}
                    </button>
                    {!job.complete && (
                      <button
                        type="button"
                        onClick={() => handleQuickComplete(job)}
                        disabled={quickSavingJobId === job.id || saving}
                        style={{
                          ...smallActionButton,
                          borderColor: "rgba(0,200,140,.40)",
                          color: "#58E0B1",
                          opacity: quickSavingJobId === job.id ? 0.6 : 1,
                        }}
                      >
                        {quickSavingJobId === job.id ? "Saving…" : "Mark complete"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {jobs.length === 0 ? (
        <div style={{ ...emptyPeople, marginTop: 18 }}>
          <strong>Create a job first.</strong>
          <p style={copyStyle}>Production tracking is connected directly to your BizziBuddi jobs.</p>
        </div>
      ) : (
        <div ref={selectedWorkItemRef} style={{ marginTop: 20, scrollMarginTop: 24 }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 14,
            flexWrap: "wrap",
          }}>
            <div>
              <small style={smallText}>WORK ITEM</small>
              <strong style={{ display: "block", marginTop: 4, fontSize: 19 }}>
                {selectedJob?.title || "Select a job"}
              </strong>
              <span style={{ color: MUTED, fontSize: 12 }}>
                {selectedJob?.clientName || "No client assigned"} · {selectedJob?.productionStage || "Not started"}
              </span>
            </div>
            {selectedJob && (
              <span style={jobReadinessBadge(selectedJob.productionReadiness)}>
                {selectedJob.productionReadiness}
              </span>
            )}
          </div>

          {selectedJob && (
            <>
              <div style={productionProgress}>
                {stages.map((stage, index) => {
                  const currentStage = existing?.stage || "Not started";
                  const currentIndex = stages.indexOf(currentStage);

                  return (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => {
                        setSelectedJobId(selectedJob.id);
                        const form = document.getElementById("bizzibuddi-production-editor");
                        if (form) {
                          const select = form.elements.namedItem("stage");
                          if (select) select.value = stage;
                        }
                      }}
                      style={{
                        border: 0,
                        background: "transparent",
                        cursor: "pointer",
                        padding: 4,
                        color: stage === currentStage ? TEXT : index <= currentIndex ? CYAN : MUTED,
                        fontWeight: stage === currentStage ? 800 : 600,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ display: "grid", placeItems: "center", width: 28, height: 28, margin: "0 auto 6px", borderRadius: "50%", border: "1px solid " + (index <= currentIndex ? "rgba(0,180,219,.55)" : BORDER), background: index <= currentIndex ? "rgba(0,180,219,.10)" : "rgba(255,255,255,.025)" }}>
                        {index + 1}
                      </span>
                      <small>{stage}</small>
                    </button>
                  );
                })}
              </div>

              <div style={productionTaskPanel}>
                <div style={productionTaskHeader}>
                  <div>
                    <small style={smallText}>TASK PROGRESS</small>
                    <strong style={{ display: "block", marginTop: 5, fontSize: 21 }}>
                      {completedDraftTasks}/{taskDrafts.length} complete
                    </strong>
                  </div>
                  <span style={productionTaskPercent}>{draftTaskPercent}%</span>
                </div>

                <div style={{ ...jobProgressTrack, marginTop: 12 }}>
                  <div style={{ ...jobProgressFill, width: draftTaskPercent + "%" }} />
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

              <form key={selectedJobId + "-" + (existing?.updatedAt || "new")} id="bizzibuddi-production-editor" onSubmit={handleSave} style={personForm}>
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

                <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>
                  <button type="submit" disabled={saving} style={{ ...primaryButton, maxWidth: 260, marginTop: 20, opacity: saving ? 0.65 : 1 }}>
                    {saving ? "Saving…" : "Save production progress"}
                  </button>
                  {selectedJob.productionReadiness === "Stage update needed" && (
                    <span style={{ ...smallText, color: "#F6C453" }}>All tasks are complete — move the stage forward when ready.</span>
                  )}
                </div>
                {error && <div role="alert" style={{ ...messageStyle, marginTop: 16 }}>{error}</div>}
              </form>

              {timeEntries.filter((entry) => entry.jobId === selectedJob.id && entry.stoppedAt).length > 0 && (
                <div style={businessNote}>
                  <small style={smallText}>RECENT TIME</small>
                  <div style={{ display: "grid", gap: 7, marginTop: 8 }}>
                    {timeEntries
                      .filter((entry) => entry.jobId === selectedJob.id && entry.stoppedAt)
                      .slice(0, 5)
                      .map((entry) => (
                        <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", fontSize: 12 }}>
                          <span style={{ color: MUTED }}>{formatProductionDateTime(entry.startedAt)}</span>
                          <strong>{formatProductionDuration(entry.durationSeconds)}</strong>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {existing?.notes && (
                <div style={businessNote}>
                  <small style={smallText}>CURRENT NOTES</small>
                  <p style={{ ...copyStyle, margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{existing.notes}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function filterMapValue(label) {
  return ["Active", "Due today", "Overdue", "Ready", "Complete"].includes(label);
}

function formatProductionDuration(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;

  if (hours) return hours + "h " + minutes + "m";
  if (minutes) return minutes + "m";
  return remainder + "s";
}

function formatProductionDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
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

function exportBizziBuddiReportCsv(reportData) {
  const rows = [
    ["BizziBuddi Report", ""],
    ["Generated", reportData.generatedAt || ""],
    ["" , ""],
    ["People", "Total", reportData.people?.total ?? 0],
    ["Jobs", "Total", reportData.jobs?.total ?? 0],
    ["Jobs", "Open", reportData.jobs?.open ?? 0],
    ["Jobs", "Completed", reportData.jobs?.completed ?? 0],
    ["Calendar", "Total appointments", reportData.calendar?.total ?? 0],
    ["Calendar", "Upcoming", reportData.calendar?.upcoming ?? 0],
    ["Calendar", "Booked / confirmed", reportData.calendar?.bookedConfirmed ?? 0],
    ["Calendar", "Cancelled", reportData.calendar?.cancelled ?? 0],
    ["Finance", "Total invoiced", reportData.finance?.totalInvoiced ?? 0],
    ["Finance", "Total paid", reportData.finance?.totalPaid ?? 0],
    ["Finance", "Outstanding", reportData.finance?.outstanding ?? 0],
    ["Finance", "Overdue amount", reportData.finance?.overdueAmount ?? 0],
    ["Finance", "Paid invoices", reportData.finance?.paidInvoiceCount ?? 0],
    ["Finance", "Outstanding invoices", reportData.finance?.outstandingInvoiceCount ?? 0],
    ["Finance", "Overdue invoices", reportData.finance?.overdueInvoices ?? 0],
    ["Finance", "Average invoice", reportData.finance?.averageInvoice ?? 0],
    ["Finance", "Collection rate", reportData.finance?.collectionRate ?? 0],
    ["Production", "Total", reportData.production?.total ?? 0],
    ["Production", "Active", reportData.production?.active ?? 0],
    ["Production", "Complete", reportData.production?.complete ?? 0],
    ["Insights", "Job completion rate", reportData.insights?.jobCompletionRate ?? 0],
    ["Insights", "Payment collection rate", reportData.insights?.paymentCollectionRate ?? 0],
    ["Insights", "Production completion rate", reportData.insights?.productionCompletionRate ?? 0],
    ["" , ""],
    ["Monthly statistics", "Month", "New people", "Jobs", "Appointments", "Invoiced", "Paid", "Production complete"],
    ...(reportData.monthlyStatistics || []).map((month) => [
      "Monthly statistics",
      month.label,
      month.newPeople,
      month.jobsCreated,
      month.appointments,
      month.invoiced,
      month.paid,
      month.productionCompleted,
    ]),
    ["" , ""],
    ["Business insights", "Metric", "Value", "Change", "Detail"],
    ...(reportData.businessInsights || []).map((item) => [
      "Business insights",
      item.label,
      item.value,
      item.change,
      item.detail,
    ]),
  ];

  const csv = rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? "");
          return `"${text.replaceAll('"', '""')}"`;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `bizzibuddi-report-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportFinanceReportCsv({
  reportLabel,
  startDate,
  endDate,
  payments,
  expenses,
  received,
  spent,
  net,
  includeSummary,
  includeTransactions,
  includeCategories,
}) {
  const rows = [
    ["BizziBuddi Finance Report", ""],
    ["Period", reportLabel],
    ["Start date", startDate],
    ["End date", endDate],
  ];

  if (includeSummary) {
    rows.push(
      ["" , ""],
      ["Summary", "Received", received],
      ["Summary", "Expenses", spent],
      ["Summary", "Net cashflow", net]
    );
  }

  if (includeCategories) {
    const categories = Object.entries(
      expenses.reduce((totals, expense) => {
        const category = expense.category || "Other";
        totals[category] = (totals[category] || 0) + (Number(expense.amount) || 0);
        return totals;
      }, {})
    ).sort((left, right) => right[1] - left[1]);

    rows.push(["" , ""], ["Expenses by category", "Category", "Amount"]);
    categories.forEach(([category, amount]) => {
      rows.push(["Expenses by category", category, amount]);
    });
  }

  if (includeTransactions) {
    rows.push(
      ["" , ""],
      ["Transactions", "Date", "Type", "Amount", "Category", "Method", "Description", "Invoice", "Client"]
    );

    [
      ...payments.map((payment) => ({
        date: payment.date || "",
        type: "Payment",
        amount: Number(payment.amount) || 0,
        category: "Customer payment",
        method: payment.method || "Other",
        description: payment.description || "",
        invoice: payment.invoiceNumber || "",
        client: payment.invoicePerson || "",
      })),
      ...expenses.map((expense) => ({
        date: expense.date || "",
        type: "Expense",
        amount: Number(expense.amount) || 0,
        category: expense.category || "Other",
        method: expense.method || "Other",
        description: expense.description || "",
        invoice: "",
        client: "",
      })),
    ]
      .sort((left, right) => String(right.date).localeCompare(String(left.date)))
      .forEach((item) => {
        rows.push([
          "Transactions",
          item.date,
          item.type,
          item.amount,
          item.category,
          item.method,
          item.description,
          item.invoice,
          item.client,
        ]);
      });
  }

  const csv = rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? "");
          return "\"" + text.replaceAll("\"", "\"\"") + "\"";
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob(["\\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const fileStart = String(startDate || "").replaceAll("-", "");
  const fileEnd = String(endDate || "").replaceAll("-", "");
  link.href = url;
  link.download = "bizzibuddi-finance-" + fileStart + "-to-" + fileEnd + ".csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeFinanceReportHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function printFinanceReport({
  reportLabel,
  startDate,
  endDate,
  payments,
  expenses,
  received,
  spent,
  net,
  includeSummary,
  includeTransactions,
  includeCategories,
}) {
  const printWindow = window.open("", "_blank", "width=1000,height=800");

  if (!printWindow) {
    window.alert("Please allow pop-ups for BizziBuddi to print or save this report as a PDF.");
    return;
  }

  const transactionRows = [
    ...payments.map((payment) => ({
      date: payment.date || "",
      type: "Payment",
      amount: Number(payment.amount) || 0,
      category: "Customer payment",
      method: payment.method || "Other",
      description: payment.description || "",
      reference: payment.invoiceNumber || "",
      client: payment.invoicePerson || "",
    })),
    ...expenses.map((expense) => ({
      date: expense.date || "",
      type: "Expense",
      amount: Number(expense.amount) || 0,
      category: expense.category || "Other",
      method: expense.method || "Other",
      description: expense.description || "",
      reference: "",
      client: "",
    })),
  ].sort((left, right) => String(right.date).localeCompare(String(left.date)));

  const categoryTotals = Object.entries(
    expenses.reduce((totals, expense) => {
      const category = expense.category || "Other";
      totals[category] = (totals[category] || 0) + (Number(expense.amount) || 0);
      return totals;
    }, {})
  ).sort((left, right) => right[1] - left[1]);

  const summaryHtml = includeSummary
    ? `
      <section>
        <h2>Financial Summary</h2>
        <div class="summary">
          <div><span>Received</span><strong>${escapeFinanceReportHtml(formatCurrency(received))}</strong></div>
          <div><span>Expenses</span><strong>${escapeFinanceReportHtml(formatCurrency(spent))}</strong></div>
          <div><span>Net Cashflow</span><strong>${escapeFinanceReportHtml(formatCurrency(net))}</strong></div>
        </div>
      </section>
    `
    : "";

  const categoryHtml = includeCategories
    ? `
      <section>
        <h2>Expenses by Category</h2>
        ${
          categoryTotals.length
            ? `<table><thead><tr><th>Category</th><th class="amount">Amount</th></tr></thead><tbody>${categoryTotals
                .map(
                  ([category, amount]) =>
                    `<tr><td>${escapeFinanceReportHtml(category)}</td><td class="amount">${escapeFinanceReportHtml(formatCurrency(amount))}</td></tr>`
                )
                .join("")}</tbody></table>`
            : "<p class=\"muted\">No expenses recorded for this period.</p>"
        }
      </section>
    `
    : "";

  const transactionsHtml = includeTransactions
    ? `
      <section>
        <h2>Transactions</h2>
        ${
          transactionRows.length
            ? `<table><thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Category</th><th>Method</th><th>Description</th><th>Invoice / Client</th></tr></thead><tbody>${transactionRows
                .map(
                  (item) =>
                    `<tr>
                      <td>${escapeFinanceReportHtml(formatInvoiceDate(item.date))}</td>
                      <td>${escapeFinanceReportHtml(item.type)}</td>
                      <td class="amount">${escapeFinanceReportHtml(formatCurrency(item.amount))}</td>
                      <td>${escapeFinanceReportHtml(item.category)}</td>
                      <td>${escapeFinanceReportHtml(item.method)}</td>
                      <td>${escapeFinanceReportHtml(item.description)}</td>
                      <td>${escapeFinanceReportHtml([item.reference, item.client].filter(Boolean).join(" · "))}</td>
                    </tr>`
                )
                .join("")}</tbody></table>`
            : "<p class=\"muted\">No payments or expenses were recorded for this period.</p>"
        }
      </section>
    `
    : "";

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>BizziBuddi Finance Report - ${escapeFinanceReportHtml(reportLabel)}</title>
        <style>
          @page { size: A4; margin: 16mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #17212b;
            background: #fff;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            line-height: 1.45;
          }
          .header {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            align-items: flex-start;
            border-bottom: 2px solid #17212b;
            padding-bottom: 14px;
            margin-bottom: 20px;
          }
          .brand {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: -.3px;
          }
          .eyebrow {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 1.2px;
            text-transform: uppercase;
            color: #617080;
          }
          h1 { margin: 4px 0 4px; font-size: 24px; }
          h2 {
            margin: 0 0 10px;
            font-size: 15px;
            page-break-after: avoid;
          }
          section {
            margin-bottom: 22px;
            page-break-inside: auto;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
          .summary div {
            border: 1px solid #d5dce2;
            border-radius: 6px;
            padding: 12px;
          }
          .summary span {
            display: block;
            color: #617080;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: .7px;
          }
          .summary strong {
            display: block;
            margin-top: 5px;
            font-size: 17px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 7px 6px;
            border-bottom: 1px solid #e2e6e9;
            text-align: left;
            vertical-align: top;
          }
          th {
            background: #f2f4f6;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: .4px;
          }
          .amount { text-align: right; white-space: nowrap; }
          .muted { color: #617080; }
          .footer {
            border-top: 1px solid #d5dce2;
            padding-top: 10px;
            color: #617080;
            font-size: 9px;
          }
          tr { page-break-inside: avoid; }
          @media print {
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <header class="header">
          <div>
            <div class="brand">BizziBuddi</div>
            <div class="eyebrow">Finance Report</div>
            <h1>${escapeFinanceReportHtml(reportLabel)}</h1>
            <div class="muted">${escapeFinanceReportHtml(formatInvoiceDate(startDate))} to ${escapeFinanceReportHtml(formatInvoiceDate(endDate))}</div>
          </div>
          <div class="muted">Generated ${escapeFinanceReportHtml(new Date().toLocaleString("en-AU"))}</div>
        </header>
        ${summaryHtml}
        ${categoryHtml}
        ${transactionsHtml}
        <div class="footer">
          This report uses recorded customer payments and recorded expenses. It is a transaction report, not a bank statement or tax return.
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.setTimeout(() => printWindow.print(), 250);
}

function getFinancialYearStartKey(dateValue = new Date()) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const year = date.getFullYear();
  const startYear = date.getMonth() >= 6 ? year : year - 1;
  return startYear + "-07-01";
}

function getFinancialYearLabel(startYear) {
  return "FY " + startYear + "-" + String(startYear + 1).slice(-2);
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

  const { jobs, calendar, finance, production, insights, monthlyStatistics = [], businessInsights = [] } = reportData;
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
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={() => exportBizziBuddiReportCsv(reportData)} style={smallActionButton}>
            ↓ Export CSV
          </button>
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
      </div>

      <div id="reports-summary" style={reportSummaryGrid}>
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

      <div id="reports-performance" style={{ ...reportSummaryGrid, marginTop: 14 }}>
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
              .filter(([stage, count]) => stage !== "Complete" && count > 0)
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

      <article id="reports-trends" style={{ ...reportCard, marginTop: 14 }}>
        <div style={reportCardHeading}>
          <div>
            <small style={smallText}>MONTHLY STATISTICS</small>
            <strong style={{ display: "block", marginTop: 5, fontSize: 18 }}>
              Last 12 months
            </strong>
          </div>
          <span style={reportMetric}>{monthlyStatistics.length}</span>
        </div>

        {monthlyStatistics.length ? (
          <div style={{ overflowX: "auto", marginTop: 16 }}>
            <div className="bizzibuddi-table-scroll" role="region" aria-label="Monthly statistics" tabIndex="0"><table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Month", "New people", "Jobs", "Appointments", "Invoiced", "Paid", "Production complete"].map((heading) => (
                    <th key={heading} style={{ textAlign: heading === "Month" ? "left" : "right", padding: "9px 10px", borderBottom: "1px solid " + BORDER, color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyStatistics.map((month) => (
                  <tr key={month.key}>
                    <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,.08)", fontWeight: 700 }}>{month.label}</td>
                    <td style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,.08)" }}>{month.newPeople}</td>
                    <td style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,.08)" }}>{month.jobsCreated}</td>
                    <td style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,.08)" }}>{month.appointments}</td>
                    <td style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,.08)" }}>{formatCurrency(month.invoiced)}</td>
                    <td style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,.08)" }}>{formatCurrency(month.paid)}</td>
                    <td style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,.08)" }}>{month.productionCompleted}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        ) : (
          <p style={{ ...copyStyle, marginTop: 16, marginBottom: 0 }}>No monthly activity is available yet.</p>
        )}

        <p style={{ ...copyStyle, marginTop: 14, marginBottom: 0 }}>
          Monthly figures are generated from persisted BizziBuddi activity. Invoiced amounts use invoice issue dates and paid amounts use recorded payment dates.
        </p>
      </article>

      <article style={{ ...reportCard, marginTop: 14 }}>
        <div style={reportCardHeading}>
          <div>
            <small style={smallText}>BUSINESS INSIGHTS</small>
            <strong style={{ display: "block", marginTop: 5, fontSize: 18 }}>
              What the current data shows
            </strong>
          </div>
          <span style={reportMetric}>{businessInsights.length}</span>
        </div>

        <div style={{ ...reportSummaryGrid, marginTop: 16 }}>
          {businessInsights.map((item) => (
            <div key={item.key} style={reportSummaryCard}>
              <small style={smallText}>{item.label}</small>
              <strong style={reportSummaryValue}>{item.value}</strong>
              <span style={{ display: "block", marginTop: 4, fontSize: 12, color: item.trend === "down" ? "#ffb0b0" : item.trend === "up" ? CYAN : MUTED }}>
                {item.change}
              </span>
              <span style={{ ...smallText, display: "block", marginTop: 8 }}>{item.detail}</span>
            </div>
          ))}
        </div>

        <p style={{ ...copyStyle, marginTop: 14, marginBottom: 0 }}>
          Insights are descriptive account metrics. Trend comparisons use the most recent three months against the preceding three months.
        </p>
      </article>

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

function FinancePanel({ account, invoices, people, initialInvoiceId, onPlans, onAddInvoice, onIssueInvoice, onRecordPayment, onUpdatePayment, onDeletePayment, onMarkPaid, onBack }) {
  const [showForm, setShowForm] = useState(false);
  const selectedInvoiceRef = useRef(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [paymentsByInvoice, setPaymentsByInvoice] = useState({});
  const [paymentActivityByInvoice, setPaymentActivityByInvoice] = useState({});
  const [expandedPaymentActivity, setExpandedPaymentActivity] = useState({});
  const [paymentInvoiceId, setPaymentInvoiceId] = useState("");
  const [paymentPendingRemoval, setPaymentPendingRemoval] = useState(null);
  const [editingPaymentId, setEditingPaymentId] = useState("");
  const [editingPaymentForm, setEditingPaymentForm] = useState({
    amount: "",
    date: "",
    method: "Other",
    description: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    date: getAccountLocalDateKey(),
    method: "Other",
    description: "",
  });
  const [expenses, setExpenses] = useState([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState("");
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    date: getAccountLocalDateKey(),
    category: "Other",
    method: "Other",
    description: "",
  });
  const firstPaymentInvoiceId =
    invoices.find((invoice) => (paymentsByInvoice[invoice.id] || []).length > 0)?.id || "";

  const [financeReportMode, setFinanceReportMode] = useState("month");
  const [financeReportMonth, setFinanceReportMonth] = useState(
    getAccountLocalDateKey().slice(0, 7)
  );
  const [financeReportFinancialYear, setFinanceReportFinancialYear] = useState(
    getFinancialYearStartKey()
  );
  const [financeReportStartDate, setFinanceReportStartDate] = useState(
    getFinancialYearStartKey()
  );
  const [financeReportEndDate, setFinanceReportEndDate] = useState(
    getAccountLocalDateKey()
  );
  const [financeReportIncludeSummary, setFinanceReportIncludeSummary] = useState(true);
  const [financeReportIncludeTransactions, setFinanceReportIncludeTransactions] = useState(true);
  const [financeReportIncludeCategories, setFinanceReportIncludeCategories] = useState(true);
  const available = hasBizzibuddiFeature(account?.plan, "finance");

  useEffect(() => {
    if (!initialInvoiceId || !selectedInvoiceRef.current) return undefined;

    const frame = window.requestAnimationFrame(() => {
      selectedInvoiceRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [initialInvoiceId, invoices]);

  useEffect(() => {
    setPaymentsByInvoice(
      Object.fromEntries(
        invoices.map((invoice) => [
          invoice.id,
          Array.isArray(invoice.payments) ? invoice.payments : [],
        ])
      )
    );
    setPaymentActivityByInvoice(
      Object.fromEntries(
        invoices.map((invoice) => [
          invoice.id,
          Array.isArray(invoice.paymentActivity) ? invoice.paymentActivity : [],
        ])
      )
    );
  }, [invoices]);

  useEffect(() => {
    if (!available) return undefined;

    let active = true;

    bizzibuddiAuthRequest("/api/bizzibuddi/auth/expenses")
      .then((result) => {
        if (!active) return;
        setExpenses(Array.isArray(result.expenses) ? result.expenses : []);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message || "We could not load your expenses.");
      });

    return () => {
      active = false;
    };
  }, [available]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const personId = String(form.get("personId") || "");
    const amount = Number(form.get("amount") || 0);

    try {
      const submitter = event.nativeEvent?.submitter;
      const status = submitter?.value === "Issued" ? "Issued" : "Draft";

      await onAddInvoice({
        personId,
        amount: Number.isFinite(amount) ? amount : 0,
        issueDate: String(form.get("issueDate") || ""),
        dueDate: String(form.get("dueDate") || ""),
        status,
      });

      formElement.reset();
      setShowForm(false);
    } catch (requestError) {
      setError(requestError.message || "We could not save this invoice.");
    } finally {
      setSaving(false);
    }
  }

  function startPayment(invoice) {
    setError("");
    setEditingPaymentId("");
    setEditingPaymentForm({
      amount: "",
      date: "",
      method: "Other",
      description: "",
    });
    setPaymentInvoiceId(invoice.id);
    setPaymentForm({
      amount: "",
      date: getAccountLocalDateKey(),
      method: "Other",
      description: "",
    });
  }

  function cancelPayment() {
    if (saving) return;
    setPaymentInvoiceId("");
    setError("");
  }

  function startEditPayment(payment) {
    setError("");
    setPaymentInvoiceId("");
    setEditingPaymentId(payment.id);
    setEditingPaymentForm({
      amount: String(payment.amount ?? ""),
      date: payment.date || getAccountLocalDateKey(),
      method: payment.method || "Other",
      description: payment.description || "",
    });
  }

  function handleDeletePayment(invoice, payment) {
    if (saving) return;

    const paymentId = String(payment.id || "").trim();
    if (!paymentId) {
      setError("This payment record is missing its payment ID.");
      return;
    }

    setError("");
    setPaymentPendingRemoval({ invoice, payment });
  }

  function cancelPaymentRemoval() {
    if (saving) return;
    setPaymentPendingRemoval(null);
  }

  async function confirmPaymentRemoval() {
    if (!paymentPendingRemoval || saving) return;

    const { invoice, payment } = paymentPendingRemoval;
    const paymentId = String(payment.id || "").trim();
    if (!paymentId) return;

    setError("");
    setSaving(true);

    try {
      await onDeletePayment(invoice.id, paymentId);
      setPaymentPendingRemoval(null);
      if (editingPaymentId === paymentId) {
        setEditingPaymentId("");
        setEditingPaymentForm({
          amount: "",
          date: "",
          method: "Other",
          description: "",
        });
      }
    } catch (requestError) {
      setError(requestError.message || "We could not remove this payment.");
      setPaymentPendingRemoval(null);
    } finally {
      setSaving(false);
    }
  }

  function cancelEditPayment() {
    if (saving) return;
    setEditingPaymentId("");
    setEditingPaymentForm({
      amount: "",
      date: "",
      method: "Other",
      description: "",
    });
    setError("");
  }

  async function handleUpdatePayment(event, invoice, payment) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const amount = Number(editingPaymentForm.amount);
      const currentPaid = Number(invoice.amountPaid || 0);
      const currentPaymentAmount = Number(payment.amount || 0);
      const maximumAmount = Math.max(
        currentPaymentAmount,
        Number(invoice.amount || 0) - (currentPaid - currentPaymentAmount)
      );

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter a payment amount greater than zero.");
      }

      if (amount > maximumAmount) {
        throw new Error(
          "Payment cannot be greater than the available invoice balance of " +
          formatCurrency(maximumAmount) +
          "."
        );
      }

      const paymentId = String(payment.id || "").trim();

      if (!paymentId) {
        throw new Error("This payment record is missing its payment ID.");
      }

      await onUpdatePayment(paymentId, {
        amount,
        date: editingPaymentForm.date,
        method: editingPaymentForm.method || "Other",
        description: editingPaymentForm.description || "Payment",
      });

      setEditingPaymentId("");
      setEditingPaymentForm({
        amount: "",
        date: "",
        method: "Other",
        description: "",
      });
    } catch (requestError) {
      setError(requestError.message || "We could not update this payment.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRecordPayment(event, invoice) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const amount = Number(paymentForm.amount);
      const balance = Math.max(
        0,
        Number(invoice.balance ?? (invoice.amount - (invoice.amountPaid || 0))) || 0
      );

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter a payment amount greater than zero.");
      }

      if (amount > balance) {
        throw new Error("Payment cannot be greater than the remaining balance of " + formatCurrency(balance) + ".");
      }

      await onRecordPayment(invoice.id, {
        amount,
        date: paymentForm.date,
        method: paymentForm.method || "Other",
        description: paymentForm.description || "Payment",
      });

      setPaymentInvoiceId("");
      setPaymentForm({
        amount: "",
        date: getAccountLocalDateKey(),
        method: "Other",
        description: "",
      });
    } catch (requestError) {
      setError(requestError.message || "We could not record this payment.");
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

  function resetExpenseForm() {
    setExpenseForm({
      amount: "",
      date: getAccountLocalDateKey(),
      category: "Other",
      method: "Other",
      description: "",
    });
    setEditingExpenseId("");
  }

  function startAddExpense() {
    setError("");
    resetExpenseForm();
    setShowExpenseForm(true);
  }

  function startEditExpense(expense) {
    setError("");
    setEditingExpenseId(expense.id);
    setExpenseForm({
      amount: String(expense.amount ?? ""),
      date: expense.date || getAccountLocalDateKey(),
      category: expense.category || "Other",
      method: expense.method || "Other",
      description: expense.description || "",
    });
    setShowExpenseForm(true);
  }

  function cancelExpense() {
    if (saving) return;
    setShowExpenseForm(false);
    resetExpenseForm();
    setError("");
  }

  async function handleExpenseSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const amount = Number(expenseForm.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter an expense amount greater than zero.");
      }

      const payload = {
        amount,
        date: expenseForm.date,
        category: expenseForm.category || "Other",
        method: expenseForm.method || "Other",
        description: expenseForm.description || "",
      };

      if (editingExpenseId) {
        const result = await bizzibuddiAuthRequest(
          "/api/bizzibuddi/auth/expenses/" + encodeURIComponent(editingExpenseId),
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );

        setExpenses((current) =>
          current
            .map((expense) => expense.id === editingExpenseId ? result.expense : expense)
            .sort((left, right) =>
              String(right.date || "").localeCompare(String(left.date || "")) ||
              String(right.createdAt || "").localeCompare(String(left.createdAt || ""))
            )
        );
      } else {
        const result = await bizzibuddiAuthRequest("/api/bizzibuddi/auth/expenses", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setExpenses((current) => [result.expense, ...current]);
      }

      setShowExpenseForm(false);
      resetExpenseForm();
    } catch (requestError) {
      setError(requestError.message || "We could not save this expense.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteExpense(expense) {
    if (saving) return;

    const confirmed = window.confirm(
      "Remove this expense of " + formatCurrency(expense.amount) + "?"
    );
    if (!confirmed) return;

    setError("");
    setSaving(true);

    try {
      await bizzibuddiAuthRequest(
        "/api/bizzibuddi/auth/expenses/" + encodeURIComponent(expense.id),
        { method: "DELETE" }
      );
      setExpenses((current) => current.filter((item) => item.id !== expense.id));
      if (editingExpenseId === expense.id) {
        setShowExpenseForm(false);
        resetExpenseForm();
      }
    } catch (requestError) {
      setError(requestError.message || "We could not remove this expense.");
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
  const todayKey = getAccountLocalDateKey();
  const todayDateValue = new Date(todayKey + "T00:00:00");
  const overdueInvoices = invoices.filter((invoice) => invoice.status !== "Paid" && invoice.dueDate && invoice.dueDate < todayKey);
  const dueSoonInvoices = invoices.filter((invoice) => {
    if (invoice.status === "Paid" || !invoice.dueDate) return false;
    const due = new Date(invoice.dueDate + "T00:00:00");
    const days = Math.ceil((due - todayDateValue) / 86400000);
    return days >= 0 && days <= 7;
  });

  const financePayments = invoices.flatMap((invoice) =>
    (Array.isArray(invoice.payments) ? invoice.payments : []).map((payment) => ({
      ...payment,
      invoiceNumber: invoice.number,
      invoicePerson: invoice.personName,
    }))
  );
  const totalReceived = financePayments.reduce(
    (sum, payment) => sum + (Number(payment.amount) || 0),
    0
  );
  const currentMonthKey = todayKey.slice(0, 7);
  const currentMonthReceived = financePayments
    .filter((payment) => String(payment.date || "").slice(0, 7) === currentMonthKey)
    .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const overdueAmount = overdueInvoices.reduce(
    (sum, invoice) => sum + Math.max(0, Number(invoice.balance) || 0),
    0
  );
  const upcomingAmount = invoices
    .filter((invoice) => {
      if (invoice.status === "Paid" || !invoice.dueDate) return false;
      const due = new Date(invoice.dueDate + "T00:00:00");
      const days = Math.ceil((due - todayDateValue) / 86400000);
      return days >= 0 && days <= 30;
    })
    .reduce((sum, invoice) => sum + Math.max(0, Number(invoice.balance) || 0), 0);

  const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(todayDateValue.getFullYear(), todayDateValue.getMonth() - (5 - index), 1);
    const monthKey =
      monthDate.getFullYear() +
      "-" +
      String(monthDate.getMonth() + 1).padStart(2, "0");
    const amount = financePayments
      .filter((payment) => String(payment.date || "").slice(0, 7) === monthKey)
      .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

    return {
      key: monthKey,
      label: monthDate.toLocaleDateString("en-AU", { month: "short", year: "numeric" }),
      amount,
    };
  });
  const maxMonthlyRevenue = Math.max(
    1,
    ...monthlyRevenue.map((month) => month.amount)
  );
  const currentMonthExpenses = expenses
    .filter((expense) => String(expense.date || "").slice(0, 7) === currentMonthKey)
    .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + (Number(expense.amount) || 0),
    0
  );

  const monthlyCashflow = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(
      todayDateValue.getFullYear(),
      todayDateValue.getMonth() - (5 - index),
      1
    );
    const monthKey =
      monthDate.getFullYear() +
      "-" +
      String(monthDate.getMonth() + 1).padStart(2, "0");

    const received = financePayments
      .filter((payment) => String(payment.date || "").slice(0, 7) === monthKey)
      .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

    const spent = expenses
      .filter((expense) => String(expense.date || "").slice(0, 7) === monthKey)
      .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

    return {
      key: monthKey,
      label: monthDate.toLocaleDateString("en-AU", { month: "short" }),
      received,
      spent,
      net: received - spent,
    };
  });

  const maxCashflowValue = Math.max(
    1,
    ...monthlyCashflow.map((month) => Math.max(month.received, month.spent))
  );

  const expenseByCategory = Object.entries(
    expenses.reduce((totals, expense) => {
      const category = expense.category || "Other";
      totals[category] = (totals[category] || 0) + (Number(expense.amount) || 0);
      return totals;
    }, {})
  )
    .map(([category, amount]) => ({ category, amount }))
    .sort((left, right) => right.amount - left.amount);

  const maxExpenseCategory = Math.max(
    1,
    ...expenseByCategory.map((item) => item.amount)
  );
  const expensesNext30Days = expenses
    .filter((expense) => {
      if (!expense.date) return false;
      const date = new Date(expense.date + "T00:00:00");
      const days = Math.ceil((date - todayDateValue) / 86400000);
      return days >= 0 && days <= 30;
    })
    .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  const netCashflowThisMonth = currentMonthReceived - currentMonthExpenses;
  const projectedNetCashflow30Days = upcomingAmount - expensesNext30Days;
  const outstandingCoverage = outstanding > 0
    ? Math.min(100, (upcomingAmount / outstanding) * 100)
    : 0;
  const financialYearOptions = Array.from({ length: 5 }, (_, index) => {
    const currentStartYear = Number(getFinancialYearStartKey(todayDateValue).slice(0, 4));
    const startYear = currentStartYear - index;
    return {
      key: startYear + "-07-01",
      label: getFinancialYearLabel(startYear),
    };
  });

  const selectedFinanceReport = monthlyCashflow.find(
    (month) => month.key === financeReportMonth
  ) || monthlyCashflow[monthlyCashflow.length - 1];

  const selectedFinanceReportMonth = selectedFinanceReport?.key || currentMonthKey;
  const monthStartDate = selectedFinanceReportMonth + "-01";
  const monthEndDate = new Date(
    Number(selectedFinanceReportMonth.slice(0, 4)),
    Number(selectedFinanceReportMonth.slice(5, 7)),
    0
  );
  const monthEndDateKey =
    monthEndDate.getFullYear() +
    "-" +
    String(monthEndDate.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(monthEndDate.getDate()).padStart(2, "0");

  const financialYearStartYear = Number(financeReportFinancialYear.slice(0, 4));
  const financialYearEndDate = new Date(financialYearStartYear + 1, 6, 0);
  const financialYearEndDateKey =
    financialYearEndDate.getFullYear() +
    "-" +
    String(financialYearEndDate.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(financialYearEndDate.getDate()).padStart(2, "0");

  const selectedFinanceReportStartDate =
    financeReportMode === "month"
      ? monthStartDate
      : financeReportMode === "financial-year"
        ? financeReportFinancialYear
        : financeReportStartDate;
  const selectedFinanceReportEndDate =
    financeReportMode === "month"
      ? monthEndDateKey
      : financeReportMode === "financial-year"
        ? financialYearEndDateKey
        : financeReportEndDate;

  const selectedFinanceReportPayments = financePayments.filter((payment) => {
    const date = String(payment.date || "");
    return date >= selectedFinanceReportStartDate && date <= selectedFinanceReportEndDate;
  });
  const selectedFinanceReportExpenses = expenses.filter((expense) => {
    const date = String(expense.date || "");
    return date >= selectedFinanceReportStartDate && date <= selectedFinanceReportEndDate;
  });
  const selectedFinanceReportReceived = selectedFinanceReportPayments.reduce(
    (sum, payment) => sum + (Number(payment.amount) || 0),
    0
  );
  const selectedFinanceReportSpent = selectedFinanceReportExpenses.reduce(
    (sum, expense) => sum + (Number(expense.amount) || 0),
    0
  );
  const selectedFinanceReportNet =
    selectedFinanceReportReceived - selectedFinanceReportSpent;

  const selectedFinanceReportLabel =
    financeReportMode === "month"
      ? new Date(selectedFinanceReportStartDate + "T00:00:00").toLocaleDateString("en-AU", {
          month: "long",
          year: "numeric",
        })
      : financeReportMode === "financial-year"
        ? financialYearOptions.find((option) => option.key === financeReportFinancialYear)?.label ||
          getFinancialYearLabel(financialYearStartYear)
        : "Custom report · " + formatInvoiceDate(selectedFinanceReportStartDate) + " to " + formatInvoiceDate(selectedFinanceReportEndDate);

  return <section style={cardStyle(940)}>
    {paymentPendingRemoval && (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-payment-title"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          background: "rgba(3,12,22,.72)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <div style={{ width: "min(460px, 100%)", padding: 24, border: "1px solid rgba(0,180,219,.42)", borderRadius: 18, background: "#0B243C", boxShadow: "0 24px 70px rgba(0,0,0,.48)" }}>
          <small style={{ ...smallText, color: CYAN }}>REMOVE PAYMENT</small>
          <h3 id="remove-payment-title" style={{ margin: "7px 0 10px", fontSize: 22 }}>Remove this payment?</h3>
          <p style={{ ...copyStyle, margin: 0 }}>
            Remove <strong style={{ color: TEXT }}>{formatCurrency(paymentPendingRemoval.payment.amount)}</strong> from{" "}
            <strong style={{ color: TEXT }}>{paymentPendingRemoval.invoice.number || "this invoice"}</strong>?
            The invoice balance will be recalculated and the removal will remain recorded in Payment Activity.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginTop: 18, padding: 12, borderRadius: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
            <div><small style={smallText}>AMOUNT</small><strong style={{ display: "block", marginTop: 4 }}>{formatCurrency(paymentPendingRemoval.payment.amount)}</strong></div>
            <div><small style={smallText}>DATE</small><strong style={{ display: "block", marginTop: 4 }}>{formatInvoiceDate(paymentPendingRemoval.payment.date)}</strong></div>
            <div><small style={smallText}>METHOD</small><strong style={{ display: "block", marginTop: 4 }}>{paymentPendingRemoval.payment.method || "Other"}</strong></div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, flexWrap: "wrap", marginTop: 20 }}>
            <button type="button" onClick={cancelPaymentRemoval} disabled={saving} style={{ ...secondaryButton, width: "auto", minHeight: 42, marginTop: 0 }}>Keep payment</button>
            <button type="button" onClick={confirmPaymentRemoval} disabled={saving} style={{ ...primaryButton, width: "auto", minHeight: 42, marginTop: 0, background: "#b42318" }}>{saving ? "Removing…" : "Remove payment"}</button>
          </div>
        </div>
      </div>
    )}
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

    <section
      id="finance-revenue"
      style={{
        marginTop: 24,
        padding: 18,
        border: "1px solid " + BORDER,
        borderRadius: 12,
        background: "rgba(255,255,255,.025)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div>
          <small style={smallText}>REVENUE OVERVIEW</small>
          <h3 style={{ margin: "5px 0 0", fontSize: 20 }}>Money received.</h3>
        </div>
        <small style={{ ...smallText, color: MUTED }}>Based on recorded payments</small>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
          gap: 10,
          marginTop: 15,
        }}
      >
        {[
          ["RECEIVED THIS MONTH", currentMonthReceived],
          ["RECEIVED ALL TIME", totalReceived],
          ["OUTSTANDING", outstanding],
          ["OVERDUE", overdueAmount],
          ["DUE NEXT 30 DAYS", upcomingAmount],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              padding: "13px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.10)",
              background: "rgba(255,255,255,.025)",
            }}
          >
            <small style={{ ...smallText, fontSize: 9 }}>{label}</small>
            <strong style={{ display: "block", marginTop: 6, fontSize: 18 }}>
              {formatCurrency(value)}
            </strong>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ ...smallText, fontSize: 10, marginBottom: 9 }}>MONTH-BY-MONTH REVENUE</div>
        <div style={{ display: "grid", gap: 8 }}>
          {monthlyRevenue.map((month) => (
            <div
              key={month.key}
              style={{
                display: "grid",
                gridTemplateColumns: "82px 1fr auto",
                alignItems: "center",
                gap: 10,
                fontSize: 11,
              }}
            >
              <span style={{ color: MUTED }}>{month.label}</span>
              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: "rgba(255,255,255,.07)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: (month.amount / maxMonthlyRevenue) * 100 + "%",
                    minWidth: month.amount > 0 ? 3 : 0,
                    height: "100%",
                    borderRadius: 999,
                    background: CYAN,
                  }}
                />
              </div>
              <strong style={{ minWidth: 78, textAlign: "right" }}>
                {formatCurrency(month.amount)}
              </strong>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section
      id="finance-cashflow"
      style={{
        marginTop: 18,
        padding: 18,
        border: "1px solid " + BORDER,
        borderRadius: 12,
        background: "rgba(0,180,219,.045)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div>
          <small style={smallText}>CASHFLOW OUTLOOK</small>
          <h3 style={{ margin: "5px 0 0", fontSize: 20 }}>Money in, money out.</h3>
        </div>
        <small style={{ ...smallText, color: MUTED }}>Based on recorded cash activity</small>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 10,
          marginTop: 15,
        }}
      >
        {[
          ["RECEIVED THIS MONTH", currentMonthReceived],
          ["EXPENSES THIS MONTH", currentMonthExpenses],
          ["NET THIS MONTH", netCashflowThisMonth],
          ["EXPECTED IN NEXT 30 DAYS", upcomingAmount],
          ["EXPENSES NEXT 30 DAYS", expensesNext30Days],
          ["PROJECTED NET 30 DAYS", projectedNetCashflow30Days],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              padding: "13px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.10)",
              background: "rgba(255,255,255,.025)",
            }}
          >
            <small style={{ ...smallText, fontSize: 9 }}>{label}</small>
            <strong style={{ display: "block", marginTop: 6, fontSize: 18 }}>
              {formatCurrency(value)}
            </strong>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 17 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 7 }}>
          <small style={smallText}>OUTSTANDING DUE WITHIN 30 DAYS</small>
          <strong style={{ fontSize: 12 }}>{Math.round(outstandingCoverage)}%</strong>
        </div>
        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: "rgba(255,255,255,.07)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: outstandingCoverage + "%",
              height: "100%",
              borderRadius: 999,
              background: CYAN,
            }}
          />
        </div>
      </div>

      <p style={{ ...copyStyle, margin: "13px 0 0", fontSize: 11 }}>
        Net cashflow is calculated as recorded customer payments minus recorded expenses. Upcoming figures use invoice due dates and expense dates, so they are a planning view rather than a bank balance.
      </p>
    </section>

    <section
      id="finance-expenses"
      style={{
        marginTop: 18,
        padding: 18,
        border: "1px solid " + BORDER,
        borderRadius: 12,
        background: "rgba(255,255,255,.025)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div>
          <small style={smallText}>EXPENSES & OUTGOINGS</small>
          <h3 style={{ margin: "5px 0 0", fontSize: 20 }}>Money going out.</h3>
        </div>
        <button
          type="button"
          onClick={startAddExpense}
          disabled={saving}
          style={{ ...smallActionButton, opacity: saving ? 0.6 : 1 }}
        >
          + Add expense
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 10,
          marginTop: 15,
        }}
      >
        {[
          ["EXPENSES THIS MONTH", currentMonthExpenses],
          ["EXPENSES ALL TIME", totalExpenses],
          ["EXPENSES NEXT 30 DAYS", expensesNext30Days],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              padding: "13px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.10)",
              background: "rgba(255,255,255,.025)",
            }}
          >
            <small style={{ ...smallText, fontSize: 9 }}>{label}</small>
            <strong style={{ display: "block", marginTop: 6, fontSize: 18 }}>
              {formatCurrency(value)}
            </strong>
          </div>
        ))}
      </div>

      {showExpenseForm && (
        <form
          onSubmit={handleExpenseSubmit}
          style={{
            marginTop: 16,
            padding: "13px 14px",
            borderRadius: 10,
            border: "1px solid rgba(0,180,219,.25)",
            background: "rgba(0,180,219,.035)",
          }}
        >
          <small style={smallText}>{editingExpenseId ? "EDIT EXPENSE" : "RECORD EXPENSE"}</small>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 9, marginTop: 9 }}>
            <label style={fieldStyle}>
              Amount
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={expenseForm.amount}
                onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))}
                required
                disabled={saving}
                style={inputStyle}
              />
            </label>
            <label style={fieldStyle}>
              Date
              <input
                type="date"
                value={expenseForm.date}
                onChange={(event) => setExpenseForm((current) => ({ ...current, date: event.target.value }))}
                required
                disabled={saving}
                style={inputStyle}
              />
            </label>
            <label style={fieldStyle}>
              Category
              <select
                value={expenseForm.category}
                onChange={(event) => setExpenseForm((current) => ({ ...current, category: event.target.value }))}
                disabled={saving}
                style={inputStyle}
              >
                <option>Other</option>
                <option>Rent</option>
                <option>Utilities</option>
                <option>Supplies</option>
                <option>Wages</option>
                <option>Tax</option>
                <option>Insurance</option>
                <option>Software</option>
                <option>Marketing</option>
                <option>Fees</option>
                <option>Equipment</option>
                <option>Travel</option>
              </select>
            </label>
            <label style={fieldStyle}>
              Method
              <select
                value={expenseForm.method}
                onChange={(event) => setExpenseForm((current) => ({ ...current, method: event.target.value }))}
                disabled={saving}
                style={inputStyle}
              >
                <option>Other</option>
                <option>Bank Transfer</option>
                <option>Cash</option>
                <option>Card</option>
                <option>EFTPOS</option>
                <option>Direct Debit</option>
              </select>
            </label>
            <label style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
              Description
              <input
                value={expenseForm.description}
                onChange={(event) => setExpenseForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Optional"
                disabled={saving}
                style={inputStyle}
              />
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <button
              type="submit"
              disabled={saving}
              style={{ ...primaryButton, width: "auto", minHeight: 38, marginTop: 0, opacity: saving ? 0.65 : 1 }}
            >
              {saving ? "Saving…" : editingExpenseId ? "Save changes" : "Record expense"}
            </button>
            <button
              type="button"
              onClick={cancelExpense}
              disabled={saving}
              style={{ ...secondaryButton, width: "auto", minHeight: 38, marginTop: 0 }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {expenses.length > 0 ? (
        <div style={{ display: "grid", gap: 3, marginTop: 14 }}>
          {expenses.slice(0, 12).map((expense) => (
            <div
              key={expense.id}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(82px, auto) minmax(90px, auto) 1fr auto",
                alignItems: "center",
                gap: 10,
                padding: "7px 0",
                borderTop: "1px solid rgba(255,255,255,.06)",
              }}
            >
              <strong style={{ fontSize: 14 }}>{formatCurrency(expense.amount)}</strong>
              <span style={smallText}>{formatInvoiceDate(expense.date)}</span>
              <span style={{ ...smallText, minWidth: 0 }}>
                {expense.category}{expense.description ? " · " + expense.description : ""}
              </span>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => startEditExpense(expense)}
                  disabled={saving}
                  style={{ ...smallActionButton, opacity: saving ? 0.6 : 1 }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteExpense(expense)}
                  disabled={saving}
                  style={{ ...smallActionButton, opacity: saving ? 0.6 : 1 }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {expenses.length > 12 && (
            <small style={{ ...smallText, marginTop: 7 }}>
              Showing the 12 most recent expenses.
            </small>
          )}
        </div>
      ) : (
        <p style={{ ...copyStyle, margin: "14px 0 0", fontSize: 11 }}>
          No expenses recorded yet. Add your first outgoing so BizziBuddi can include it in cashflow calculations.
        </p>
      )}
    </section>

    <section
      style={{
        marginTop: 18,
        padding: 18,
        border: "1px solid " + BORDER,
        borderRadius: 12,
        background: "rgba(255,255,255,.025)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div>
          <small style={smallText}>CASHFLOW INTELLIGENCE</small>
          <h3 style={{ margin: "5px 0 0", fontSize: 20 }}>Where is the money moving?</h3>
        </div>
        <small style={{ ...smallText, color: MUTED }}>Last 6 months</small>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ ...smallText, fontSize: 10, marginBottom: 9 }}>MONEY IN VS MONEY OUT</div>
        <div style={{ display: "grid", gap: 9 }}>
          {monthlyCashflow.map((month) => (
            <div key={month.key}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
                <span style={{ ...smallText, minWidth: 38 }}>{month.label}</span>
                <span style={{ ...smallText, color: month.net >= 0 ? TEXT : "#ff8c8c" }}>
                  Net {formatCurrency(month.net)}
                </span>
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                <div
                  style={{
                    height: 7,
                    borderRadius: 999,
                    background: "rgba(255,255,255,.07)",
                    overflow: "hidden",
                  }}
                  title={"Received " + formatCurrency(month.received)}
                >
                  <div
                    style={{
                      width: (month.received / maxCashflowValue) * 100 + "%",
                      height: "100%",
                      borderRadius: 999,
                      background: CYAN,
                    }}
                  />
                </div>
                <div
                  style={{
                    height: 7,
                    borderRadius: 999,
                    background: "rgba(255,255,255,.07)",
                    overflow: "hidden",
                  }}
                  title={"Spent " + formatCurrency(month.spent)}
                >
                  <div
                    style={{
                      width: (month.spent / maxCashflowValue) * 100 + "%",
                      height: "100%",
                      borderRadius: 999,
                      background: "rgba(255,255,255,.42)",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
          <small style={smallText}>● Received</small>
          <small style={{ ...smallText, color: MUTED }}>● Spent</small>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ ...smallText, fontSize: 10, marginBottom: 9 }}>EXPENSES BY CATEGORY</div>
        {expenseByCategory.length > 0 ? (
          <div style={{ display: "grid", gap: 8 }}>
            {expenseByCategory.map((item) => (
              <div
                key={item.category}
                style={{
                  display: "grid",
                  gridTemplateColumns: "90px 1fr auto",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 11,
                }}
              >
                <span style={{ color: MUTED }}>{item.category}</span>
                <div
                  style={{
                    height: 8,
                    borderRadius: 999,
                    background: "rgba(255,255,255,.07)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: (item.amount / maxExpenseCategory) * 100 + "%",
                      height: "100%",
                      borderRadius: 999,
                      background: "rgba(255,255,255,.42)",
                    }}
                  />
                </div>
                <strong style={{ minWidth: 78, textAlign: "right" }}>
                  {formatCurrency(item.amount)}
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ ...copyStyle, margin: 0, fontSize: 11 }}>
            Expense categories will appear here as you record outgoings.
          </p>
        )}
      </div>
    </section>

    <section
      id="finance-reporting"
      style={{
        marginTop: 18,
        padding: 18,
        border: "1px solid " + BORDER,
        borderRadius: 12,
        background: "rgba(255,255,255,.025)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <small style={smallText}>FINANCE REPORTING</small>
          <h3 style={{ margin: "5px 0 0", fontSize: 20 }}>Build your financial report.</h3>
          <p style={{ ...copyStyle, margin: "5px 0 0", fontSize: 11 }}>
            Choose a month, Australian financial year or your own date range, then customise what goes into the export.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() =>
              printFinanceReport({
                reportLabel: selectedFinanceReportLabel,
                startDate: selectedFinanceReportStartDate,
                endDate: selectedFinanceReportEndDate,
                payments: selectedFinanceReportPayments,
                expenses: selectedFinanceReportExpenses,
                received: selectedFinanceReportReceived,
                spent: selectedFinanceReportSpent,
                net: selectedFinanceReportNet,
                includeSummary: financeReportIncludeSummary,
                includeTransactions: financeReportIncludeTransactions,
                includeCategories: financeReportIncludeCategories,
              })
            }
            style={smallActionButton}
          >
            ⎙ Print / PDF
          </button>
          <button
            type="button"
            onClick={() =>
              exportFinanceReportCsv({
                reportLabel: selectedFinanceReportLabel,
                startDate: selectedFinanceReportStartDate,
                endDate: selectedFinanceReportEndDate,
                payments: selectedFinanceReportPayments,
                expenses: selectedFinanceReportExpenses,
                received: selectedFinanceReportReceived,
                spent: selectedFinanceReportSpent,
                net: selectedFinanceReportNet,
                includeSummary: financeReportIncludeSummary,
                includeTransactions: financeReportIncludeTransactions,
                includeCategories: financeReportIncludeCategories,
              })
            }
            style={smallActionButton}
          >
            ↓ Export CSV
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 10,
          marginTop: 16,
        }}
      >
        <label style={fieldStyle}>
          Report period
          <select
            value={financeReportMode}
            onChange={(event) => setFinanceReportMode(event.target.value)}
            style={inputStyle}
          >
            <option value="month">Month</option>
            <option value="financial-year">Financial year</option>
            <option value="custom">Custom range</option>
          </select>
        </label>

        {financeReportMode === "month" && (
          <label style={fieldStyle}>
            Month
            <select
              value={selectedFinanceReportMonth}
              onChange={(event) => setFinanceReportMonth(event.target.value)}
              style={inputStyle}
            >
              {monthlyCashflow.slice().reverse().map((month) => {
                const monthDate = new Date(month.key + "-01T00:00:00");
                return (
                  <option key={month.key} value={month.key}>
                    {monthDate.toLocaleDateString("en-AU", { month: "long", year: "numeric" })}
                  </option>
                );
              })}
            </select>
          </label>
        )}

        {financeReportMode === "financial-year" && (
          <label style={fieldStyle}>
            Financial year
            <select
              value={financeReportFinancialYear}
              onChange={(event) => setFinanceReportFinancialYear(event.target.value)}
              style={inputStyle}
            >
              {financialYearOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </label>
        )}

        {financeReportMode === "custom" && (
          <>
            <label style={fieldStyle}>
              Start date
              <input
                type="date"
                value={financeReportStartDate}
                onChange={(event) => setFinanceReportStartDate(event.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={fieldStyle}>
              End date
              <input
                type="date"
                value={financeReportEndDate}
                min={financeReportStartDate}
                onChange={(event) => setFinanceReportEndDate(event.target.value)}
                style={inputStyle}
              />
            </label>
          </>
        )}
      </div>

      <div
        style={{
          marginTop: 10,
          padding: "12px 14px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,.10)",
          background: "rgba(0,180,219,.035)",
        }}
      >
        <small style={smallText}>REPORT CONTENT</small>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 8 }}>
          {[
            ["Summary", financeReportIncludeSummary, setFinanceReportIncludeSummary],
            ["Transactions", financeReportIncludeTransactions, setFinanceReportIncludeTransactions],
            ["Expenses by category", financeReportIncludeCategories, setFinanceReportIncludeCategories],
          ].map(([label, checked, setChecked]) => (
            <label
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                color: TEXT,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => setChecked(event.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 10,
          marginTop: 15,
        }}
      >
        {[
          ["RECEIVED", selectedFinanceReportReceived],
          ["EXPENSES", selectedFinanceReportSpent],
          ["NET CASHFLOW", selectedFinanceReportNet],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              padding: "13px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.10)",
              background: "rgba(255,255,255,.025)",
            }}
          >
            <small style={{ ...smallText, fontSize: 9 }}>{label}</small>
            <strong
              style={{
                display: "block",
                marginTop: 6,
                fontSize: 18,
                color: label === "NET CASHFLOW" && value < 0 ? "#ff8c8c" : TEXT,
              }}
            >
              {formatCurrency(value)}
            </strong>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
          <small style={smallText}>TRANSACTIONS</small>
          <small style={{ ...smallText, color: MUTED }}>
            {selectedFinanceReportPayments.length + selectedFinanceReportExpenses.length} recorded
          </small>
        </div>

        {selectedFinanceReportPayments.length > 0 || selectedFinanceReportExpenses.length > 0 ? (
          <div style={{ display: "grid", gap: 4 }}>
            {[
              ...selectedFinanceReportPayments.map((payment) => ({
                id: "payment-" + payment.id,
                date: payment.date,
                type: "Payment",
                amount: Number(payment.amount) || 0,
                category: "Customer payment",
                method: payment.method || "Other",
                description: payment.description || "",
                reference: payment.invoiceNumber || "",
                person: payment.invoicePerson || "",
              })),
              ...selectedFinanceReportExpenses.map((expense) => ({
                id: "expense-" + expense.id,
                date: expense.date,
                type: "Expense",
                amount: Number(expense.amount) || 0,
                category: expense.category || "Other",
                method: expense.method || "Other",
                description: expense.description || "",
                reference: "",
                person: "",
              })),
            ]
              .sort((left, right) => String(right.date || "").localeCompare(String(left.date || "")))
              .map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "82px 68px minmax(70px, auto) 1fr auto",
                    alignItems: "center",
                    gap: 9,
                    padding: "8px 0",
                    borderTop: "1px solid rgba(255,255,255,.06)",
                  }}
                >
                  <span style={smallText}>{formatInvoiceDate(item.date)}</span>
                  <strong style={{ fontSize: 12, color: item.type === "Expense" ? "#ffb0b0" : TEXT }}>
                    {item.type}
                  </strong>
                  <strong style={{ fontSize: 13 }}>{formatCurrency(item.amount)}</strong>
                  <span style={{ ...smallText, minWidth: 0 }}>
                    {item.category}
                    {item.method ? " · " + item.method : ""}
                    {item.description ? " · " + item.description : ""}
                    {item.reference ? " · " + item.reference : ""}
                    {item.person ? " · " + item.person : ""}
                  </span>
                  <span />
                </div>
              ))}
          </div>
        ) : (
          <p style={{ ...copyStyle, margin: 0, fontSize: 11 }}>
            No payments or expenses were recorded for this period.
          </p>
        )}
      </div>

      <p style={{ ...copyStyle, margin: "13px 0 0", fontSize: 11 }}>
        Periods use Australian financial years (1 July to 30 June). This report uses recorded customer payments and expenses. It is a transaction report, not a bank statement or tax return.
      </p>
    </section>

    {invoices.length > 0 ? (
      <div id="finance-invoices" style={{ display: "grid", gap: 12, marginTop: 28 }}>
        {invoices.map((invoice) => {
          const balance = Math.max(
            0,
            Number(invoice.balance ?? (invoice.amount - (invoice.amountPaid || 0))) || 0
          );
          const payments = paymentsByInvoice[invoice.id] || [];
          const persistedPaymentActivity = paymentActivityByInvoice[invoice.id] || [];
          const paymentActivity =
            persistedPaymentActivity.length > 0
              ? persistedPaymentActivity
              : payments.map((payment) => ({
                  id: "payment-fallback-" + payment.id,
                  type: "finance-payment-recorded",
                  title: "Payment recorded",
                  detail:
                    formatCurrency(Number(payment.amount) || 0) +
                    " payment recorded on " +
                    invoice.number +
                    " via " +
                    (payment.method || "Other") +
                    (payment.description ? " — " + payment.description : "") +
                    ".",
                  createdAt: payment.createdAt || payment.date || null,
                }));
          const recordedPaymentTotal = payments.reduce(
            (sum, payment) => sum + (Number(payment.amount) || 0),
            0
          );
          const hasPaymentHistory =
            payments.length > 0 || Number(invoice.amountPaid || 0) > 0;

          const selected = String(invoice.id) === String(initialInvoiceId);
          return <article
            key={invoice.id}
            ref={selected ? selectedInvoiceRef : null}
            style={{
              ...invoiceCard,
              scrollMarginTop: 24,
              border: selected ? "1px solid rgba(0,180,219,.75)" : invoiceCard.border,
              boxShadow: selected ? "0 0 0 2px rgba(0,180,219,.12), 0 14px 30px rgba(0,0,0,.18)" : invoiceCard.boxShadow,
            }}
          >
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
              {invoice.status === "Draft" ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onIssueInvoice(invoice.id)}
                  style={{ ...smallActionButton, opacity: saving ? 0.6 : 1 }}
                >
                  Issue invoice
                </button>
              ) : invoice.status !== "Paid" ? (
                <>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => startPayment(invoice)}
                    style={{ ...smallActionButton, opacity: saving ? 0.6 : 1 }}
                  >
                    Add payment
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleMarkPaid(invoice)}
                    style={{ ...smallActionButton, opacity: saving ? 0.6 : 1 }}
                  >
                    Mark paid
                  </button>
                </>
              ) : null}
              {balance > 0 && <small style={smallText}>Balance {formatCurrency(balance)}</small>}
            </div>

            {paymentInvoiceId === invoice.id && (
              <form
                onSubmit={(event) => handleRecordPayment(event, invoice)}
                style={{
                  flexBasis: "100%",
                  width: "calc(100% - 18px)",
                  marginTop: 6,
                  marginLeft: 18,
                  paddingTop: 12,
                  paddingLeft: 14,
                  borderTop: "1px solid " + BORDER,
                  borderLeft: "2px solid rgba(0,180,219,.28)",
                }}
              >
                <small style={smallText}>RECORD PAYMENT</small>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 9 }}>
                  <label style={fieldStyle}>
                    Amount
                    <input
                      type="number"
                      min="0.01"
                      max={balance}
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(event) => setPaymentForm((current) => ({ ...current, amount: event.target.value }))}
                      placeholder="0.00"
                      required
                      disabled={saving}
                      style={inputStyle}
                    />
                  </label>
                  <label style={fieldStyle}>
                    Date
                    <input
                      type="date"
                      value={paymentForm.date}
                      onChange={(event) => setPaymentForm((current) => ({ ...current, date: event.target.value }))}
                      required
                      disabled={saving}
                      style={inputStyle}
                    />
                  </label>
                  <label style={fieldStyle}>
                    Method
                    <select
                      value={paymentForm.method}
                      onChange={(event) => setPaymentForm((current) => ({ ...current, method: event.target.value }))}
                      disabled={saving}
                      style={inputStyle}
                    >
                      <option>Other</option>
                      <option>Bank Transfer</option>
                      <option>Cash</option>
                      <option>Card</option>
                      <option>EFTPOS</option>
                      <option>Direct Debit</option>
                    </select>
                  </label>
                  <label style={fieldStyle}>
                    Description
                    <input
                      value={paymentForm.description}
                      onChange={(event) => setPaymentForm((current) => ({ ...current, description: event.target.value }))}
                      placeholder="Optional"
                      disabled={saving}
                      style={inputStyle}
                    />
                  </label>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{ ...primaryButton, width: "auto", minHeight: 42, marginTop: 0, opacity: saving ? 0.65 : 1 }}
                  >
                    {saving ? "Saving…" : "Record payment"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelPayment}
                    disabled={saving}
                    style={{ ...secondaryButton, width: "auto", minHeight: 42, marginTop: 0 }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {(hasPaymentHistory || paymentActivity.length > 0) && (
              <div
                style={{
                  flexBasis: "100%",
                  width: "calc(100% - 18px)",
                  marginTop: 6,
                  marginLeft: 18,
                  paddingTop: 12,
                  paddingLeft: 14,
                  borderTop: "1px solid " + BORDER,
                  borderLeft: "2px solid rgba(0,180,219,.28)",
                }}
              >
                {hasPaymentHistory && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                      <small
                        id={invoice.id === firstPaymentInvoiceId ? "finance-payments" : undefined}
                        style={{ ...smallText, scrollMarginTop: 120 }}
                      >
                        PAYMENT HISTORY
                      </small>
                      {recordedPaymentTotal > 0 && (
                        <small style={{ ...smallText, fontWeight: 700 }}>
                          {formatCurrency(recordedPaymentTotal)} PAID
                        </small>
                      )}
                    </div>

                    {payments.length > 0 ? (
                  <div style={{ display: "grid", gap: 2, marginTop: 7 }}>
                    {payments.map((payment) => (
                      <div key={payment.id} style={{ display: "grid", gap: 5 }}>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(78px, auto) minmax(150px, auto) 1fr auto",
                            alignItems: "center",
                            gap: 10,
                            padding: "4px 0",
                          }}
                        >
                          <strong style={{ fontSize: 14 }}>{formatCurrency(payment.amount)}</strong>
                          <span style={smallText}>
                            {formatInvoiceDate(payment.date)} · {payment.method || "Other"}
                          </span>
                          {payment.description ? (
                            <span style={{ ...smallText, minWidth: 0 }}>
                              {payment.description}
                            </span>
                          ) : (
                            <span />
                          )}
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              onClick={() => startEditPayment(payment)}
                              disabled={saving}
                              style={{ ...smallActionButton, opacity: saving ? 0.6 : 1 }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(invoice, payment)}
                              disabled={saving}
                              style={{ ...smallActionButton, opacity: saving ? 0.6 : 1 }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {editingPaymentId === payment.id && (
                          <form
                            onSubmit={(event) => handleUpdatePayment(event, invoice, payment)}
                            style={{
                              marginLeft: 10,
                              padding: "10px 0 8px 12px",
                              borderLeft: "1px solid rgba(0,180,219,.22)",
                            }}
                          >
                            <small style={smallText}>EDIT PAYMENT</small>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginTop: 8 }}>
                              <label style={fieldStyle}>
                                Amount
                                <input
                                  type="number"
                                  min="0.01"
                                  max={Math.max(
                                    Number(payment.amount || 0),
                                    Number(invoice.amount || 0) -
                                      (Number(invoice.amountPaid || 0) - Number(payment.amount || 0))
                                  )}
                                  step="0.01"
                                  value={editingPaymentForm.amount}
                                  onChange={(event) => setEditingPaymentForm((current) => ({ ...current, amount: event.target.value }))}
                                  required
                                  disabled={saving}
                                  style={inputStyle}
                                />
                              </label>
                              <label style={fieldStyle}>
                                Date
                                <input
                                  type="date"
                                  value={editingPaymentForm.date}
                                  onChange={(event) => setEditingPaymentForm((current) => ({ ...current, date: event.target.value }))}
                                  required
                                  disabled={saving}
                                  style={inputStyle}
                                />
                              </label>
                              <label style={fieldStyle}>
                                Method
                                <select
                                  value={editingPaymentForm.method}
                                  onChange={(event) => setEditingPaymentForm((current) => ({ ...current, method: event.target.value }))}
                                  disabled={saving}
                                  style={inputStyle}
                                >
                                  <option>Other</option>
                                  <option>Bank Transfer</option>
                                  <option>Cash</option>
                                  <option>Card</option>
                                  <option>EFTPOS</option>
                                  <option>Direct Debit</option>
                                </select>
                              </label>
                              <label style={fieldStyle}>
                                Description
                                <input
                                  value={editingPaymentForm.description}
                                  onChange={(event) => setEditingPaymentForm((current) => ({ ...current, description: event.target.value }))}
                                  placeholder="Optional"
                                  disabled={saving}
                                  style={inputStyle}
                                />
                              </label>
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                              <button
                                type="submit"
                                disabled={saving}
                                style={{ ...primaryButton, width: "auto", minHeight: 38, marginTop: 0, opacity: saving ? 0.65 : 1 }}
                              >
                                {saving ? "Saving…" : "Save changes"}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditPayment}
                                disabled={saving}
                                style={{ ...secondaryButton, width: "auto", minHeight: 38, marginTop: 0 }}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ ...smallText, marginTop: 7 }}>
                    Payment details are not available yet.
                  </div>
                )}

                  </>
                )}

                {paymentActivity.length > 0 && (
                  <section
                    style={{
                      marginTop: 12,
                      border: "1px solid rgba(255,255,255,.14)",
                      borderRadius: 10,
                      background: "rgba(255,255,255,.035)",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPaymentActivity((current) => ({
                          ...current,
                          [invoice.id]: !current[invoice.id],
                        }))
                      }
                      aria-expanded={Boolean(expandedPaymentActivity[invoice.id])}
                      style={{
                        width: "100%",
                        border: 0,
                        background: "transparent",
                        color: TEXT,
                        padding: "11px 12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                        <span style={{ color: CYAN, fontSize: 15, fontWeight: 800, width: 16, textAlign: "center" }}>
                          {expandedPaymentActivity[invoice.id] ? "▾" : "▸"}
                        </span>
                        <span>
                          <span style={{ display: "block", fontSize: 11, fontWeight: 800, letterSpacing: 0.8 }}>
                            PAYMENT ACTIVITY
                          </span>
                          <span style={{ display: "block", marginTop: 3, fontSize: 11, color: MUTED }}>
                            {paymentActivity.length} {paymentActivity.length === 1 ? "event" : "events"} recorded
                          </span>
                        </span>
                      </span>
                      <span
                        style={{
                          minWidth: 24,
                          height: 24,
                          padding: "0 7px",
                          borderRadius: 999,
                          background: "rgba(0,180,219,.12)",
                          border: "1px solid rgba(0,180,219,.28)",
                          color: CYAN,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {paymentActivity.length}
                      </span>
                    </button>

                    {expandedPaymentActivity[invoice.id] && (
                      <div
                        style={{
                          borderTop: "1px solid rgba(255,255,255,.10)",
                          padding: "7px 12px 10px 37px",
                        }}
                      >
                        {paymentActivity.map((event) => (
                          <div
                            key={event.id}
                            style={{
                              padding: "9px 0",
                              borderBottom: "1px solid rgba(255,255,255,.07)",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                              <strong style={{ fontSize: 12, color: TEXT }}>
                                {event.title}
                              </strong>
                              <span style={{ fontSize: 10, color: MUTED, whiteSpace: "nowrap" }}>
                                {formatPaymentActivityDate(event.createdAt)}
                              </span>
                            </div>
                            <span style={{ display: "block", marginTop: 4, fontSize: 11, color: MUTED, lineHeight: 1.45 }}>
                              {event.detail}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}
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
            name="invoiceAction"
            value="Draft"
            disabled={people.length === 0 || saving}
            style={{ ...secondaryButton, width: "auto", minHeight: 42, marginTop: 0, opacity: people.length === 0 || saving ? 0.5 : 1 }}
          >
            {saving ? "Saving…" : "Save draft"}
          </button>
          <button
            type="submit"
            name="invoiceAction"
            value="Issued"
            disabled={people.length === 0 || saving}
            style={{ ...primaryButton, width: "auto", minHeight: 42, marginTop: 0, opacity: people.length === 0 || saving ? 0.5 : 1 }}
          >
            {saving ? "Saving…" : "Save & issue"}
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

function getAccountLocalDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(amount) || 0);
}

function formatPaymentActivityDate(value) {
  const raw = String(value || "");
  if (!raw) return "Date not set";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw.slice(0, 16);

  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }) + " · " + date.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatInvoiceDate(date) {
  if (!date) return "Not set";
  const value = new Date(date + "T00:00");
  if (Number.isNaN(value.getTime())) return date;
  return value.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function calendarDateKey(date) {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function calendarDateFromKey(value) {
  const [year, month, day] = String(value || "").split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function calendarStartOfWeek(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  const day = value.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + offset);
  return value;
}

function formatCalendarMonth(date) {
  return new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric" }).format(date);
}

function formatCalendarWeek(date) {
  const start = calendarStartOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const startLabel = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" }).format(start);
  const endLabel = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(end);
  return startLabel + " – " + endLabel;
}

function formatCalendarDay(date) {
  return new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
}

function CalendarPanel({
  appointments,
  people,
  jobs,
  account,
  productionRecords,
  initialAppointmentId,
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
  onOpenProduction,
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
  const [calendarView, setCalendarView] = useState("month");
  const [calendarCursor, setCalendarCursor] = useState(() => new Date());
  const calendarSectionRefs = useRef({});
  const advancedScheduling = hasBizzibuddiFeature(account?.plan, "advancedScheduling");
  const selectedAppointmentRef = useRef(null);

  useEffect(() => {
    if (!initialAppointmentId) return;
    const appointment = appointments.find((item) => String(item.id) === String(initialAppointmentId));
    if (!appointment) return;

    setCalendarFilter("all");
    setCalendarSearch("");
    setEditingAppointment(appointment);
    setShowForm(true);
  }, [initialAppointmentId, appointments]);
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

  useEffect(() => {
    if (!initialAppointmentId || !selectedAppointmentRef.current) return undefined;

    const frame = window.requestAnimationFrame(() => {
      selectedAppointmentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [initialAppointmentId, visibleAppointments]);
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

  function scrollToCalendarSection(key) {
    calendarSectionRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

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
          <span style={schedulingSummaryContent}>
            <strong style={{ fontSize: 16, lineHeight: 1.25 }}>Advanced scheduling</strong>
            <small style={{ color: MUTED, fontSize: 13, lineHeight: 1.4 }}>Duration, buffer time and appointment status are enabled.</small>
          </span>
          <span style={advancedBadge}>PROFESSIONAL</span>
        </div>
      )}
    <div style={{ position: "sticky", top: 70, zIndex: 9, marginTop: 16, padding: "8px 10px", border: "1px solid " + BORDER, borderRadius: 12, background: "rgba(13,38,60,.97)", backdropFilter: "blur(12px)", boxShadow: "0 10px 24px rgba(0,0,0,.18)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
        <span style={{ ...smallText, fontWeight: 800, marginRight: 3 }}>FITTINGS</span>
        <button type="button" onClick={() => scrollToCalendarSection("calendar")} style={smallActionButton}>Calendar</button>
        <button type="button" onClick={() => scrollToCalendarSection("appointments")} style={{ ...smallActionButton, borderColor: BORDER, color: MUTED }}>Appointments · {appointments.length}</button>
        <button type="button" onClick={() => { startAdd(); requestAnimationFrame(() => scrollToCalendarSection("appointment-form")); }} style={{ ...smallActionButton, borderColor: BORDER, color: MUTED }}>+ Add appointment</button>
      </div>
    </div>
    <div ref={(node) => { calendarSectionRefs.current.appointments = node; }} id="calendar-appointments" style={{ scrollMarginTop: 110 }} />

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
              <div style={{ minWidth: 0 }}>
                <strong>{record.jobTitle || "Production job"}</strong>
                <span style={{ ...smallText, display: "block", marginTop: 3 }}>
                  Ready by {formatProductionDate(record.dueDateValue)} · {record.stage || "Not started"}
                </span>
              </div>
              {record.jobId && (
                <button
                  type="button"
                  onClick={() => onOpenProduction?.(record.jobId)}
                  style={smallActionButton}
                >
                  Open production →
                </button>
              )}
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
                  style={calendarFilter === value ? smallActionButton : { ...smallActionButton, borderColor: BORDER, color: MUTED }}
                >
                  {label} · {count}
                </button>
              ))}
              <button type="button" onClick={() => setShowCalendarSearch((current) => !current)} style={showCalendarSearch ? smallActionButton : { ...smallActionButton, borderColor: BORDER, color: MUTED }}>
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
        <div ref={(node) => { calendarSectionRefs.current.calendar = node; }} id="calendar-grid" style={{ scrollMarginTop: 96, marginTop: 6, border: "1px solid " + BORDER, borderRadius: 14, background: "rgba(255,255,255,.025)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "7px 12px", borderBottom: "1px solid " + BORDER, background: "rgba(13,38,60,.97)" }}>
            <div>
              <strong style={{ display: "block", fontSize: 17 }}>
                {calendarView === "month" ? formatCalendarMonth(calendarCursor) : calendarView === "week" ? formatCalendarWeek(calendarCursor) : formatCalendarDay(calendarCursor)}
              </strong>
              <span style={{ ...smallText, display: "block", marginTop: 3 }}>Visual scheduling calendar</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {["month", "week", "day", "agenda"].map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setCalendarView(view)}
                  style={calendarView === view ? { ...smallActionButton, borderRadius: 7, padding: "6px 11px" } : { ...smallActionButton, borderColor: "transparent", color: MUTED, borderRadius: 7, padding: "6px 11px" }}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {calendarView !== "agenda" && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 14px", borderBottom: "1px solid " + BORDER }}>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(calendarCursor);
                    if (calendarView === "month") next.setMonth(next.getMonth() - 1);
                    else if (calendarView === "week") next.setDate(next.getDate() - 7);
                    else next.setDate(next.getDate() - 1);
                    setCalendarCursor(next);
                  }}
                  style={smallActionButton}
                  aria-label="Previous period"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarCursor(new Date())}
                  style={smallActionButton}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(calendarCursor);
                    if (calendarView === "month") next.setMonth(next.getMonth() + 1);
                    else if (calendarView === "week") next.setDate(next.getDate() + 7);
                    else next.setDate(next.getDate() + 1);
                    setCalendarCursor(next);
                  }}
                  style={smallActionButton}
                  aria-label="Next period"
                >
                  →
                </button>
              </div>

              {(() => {
                const cellAppointments = (date) => sortedAppointments.filter((appointment) => appointment.date === calendarDateKey(date));
                const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

                if (calendarView === "month") {
                  const monthStart = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1);
                  const gridStart = calendarStartOfWeek(monthStart);
                  const cells = Array.from({ length: 42 }, (_, index) => {
                    const date = new Date(gridStart);
                    date.setDate(gridStart.getDate() + index);
                    return date;
                  });
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
                      {dayNames.map((name) => (
                        <div key={name} style={{ padding: "9px 7px", borderRight: "1px solid " + BORDER, borderBottom: "1px solid " + BORDER, color: MUTED, fontSize: 11, fontWeight: 700, textAlign: "center" }}>{name}</div>
                      ))}
                      {cells.map((date) => {
                        const key = calendarDateKey(date);
                        const items = cellAppointments(date);
                        const inMonth = date.getMonth() === calendarCursor.getMonth();
                        const isToday = key === calendarDateKey(new Date());
                        return (
                          <div key={key} style={{ minHeight: 68, padding: 6, borderRight: "1px solid " + BORDER, borderBottom: "1px solid " + BORDER, background: isToday ? "rgba(0,180,219,.08)" : "transparent", opacity: inMonth ? 1 : 0.42 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? TEXT : MUTED }}>{date.getDate()}</div>
                            <div style={{ display: "grid", gap: 4, marginTop: 6 }}>
                              {items.slice(0, 3).map((appointment) => (
                                <button key={appointment.id} type="button" onClick={() => { startEdit(appointment); requestAnimationFrame(() => document.getElementById("calendar-appointment-" + appointment.id)?.scrollIntoView({ behavior: "smooth", block: "center" })); }} style={{ width: "100%", textAlign: "left", border: "1px solid rgba(0,180,219,.35)", borderRadius: 6, padding: "5px 6px", background: "rgba(0,180,219,.10)", color: TEXT, cursor: "pointer", fontSize: 10, lineHeight: 1.25 }}>
                                  <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appointment.time || "All day"}</strong>
                                  <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appointment.title || "Appointment"}</span>
                                </button>
                              ))}
                              {items.length > 3 && <span style={{ color: MUTED, fontSize: 10 }}>+ {items.length - 3} more</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                const days = calendarView === "week"
                  ? Array.from({ length: 7 }, (_, index) => {
                      const date = calendarStartOfWeek(calendarCursor);
                      date.setDate(date.getDate() + index);
                      return date;
                    })
                  : [new Date(calendarCursor)];

                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(" + days.length + ", minmax(0, 1fr))", overflowX: "auto" }}>
                    {days.map((date) => {
                      const items = cellAppointments(date);
                      const key = calendarDateKey(date);
                      const isToday = key === calendarDateKey(new Date());
                      return (
                        <div key={key} style={{ minWidth: calendarView === "week" ? 150 : 260, minHeight: 300, borderRight: "1px solid " + BORDER, background: isToday ? "rgba(0,180,219,.08)" : "transparent" }}>
                          <div style={{ padding: 10, borderBottom: "1px solid " + BORDER, textAlign: "center" }}>
                            <strong style={{ display: "block", fontSize: 12 }}>{new Intl.DateTimeFormat("en-AU", { weekday: "short" }).format(date)}</strong>
                            <span style={{ color: isToday ? TEXT : MUTED, fontSize: 12 }}>{date.getDate()} {new Intl.DateTimeFormat("en-AU", { month: "short" }).format(date)}</span>
                          </div>
                          <div style={{ display: "grid", gap: 8, padding: 10 }}>
                            {items.length > 0 ? items.map((appointment) => (
                              <button key={appointment.id} type="button" onClick={() => startEdit(appointment)} style={{ textAlign: "left", border: "1px solid rgba(0,180,219,.40)", borderRadius: 8, padding: 9, background: "rgba(0,180,219,.10)", color: TEXT, cursor: "pointer" }}>
                                <strong style={{ display: "block", fontSize: 12 }}>{appointment.time || "All day"}</strong>
                                <span style={{ display: "block", marginTop: 3, fontSize: 12 }}>{appointment.title || "Appointment"}</span>
                                {appointment.personName && <span style={{ display: "block", marginTop: 3, color: MUTED, fontSize: 10 }}>{appointment.personName}</span>}
                                {appointment.jobTitle && <span style={{ display: "block", marginTop: 2, color: MUTED, fontSize: 10 }}>{appointment.jobTitle}</span>}
                              </button>
                            )) : (
                              <span style={{ color: MUTED, fontSize: 11, padding: 8 }}>No appointments</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </>
          )}
        </div>

        {visibleAppointments.length > 0 ? (
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {visibleAppointments.map((appointment) => (
          <article
            id={"calendar-appointment-" + appointment.id}
            key={appointment.id}
            ref={String(initialAppointmentId) === String(appointment.id) ? selectedAppointmentRef : null}
            style={{
              ...appointmentCard,
              ...(String(initialAppointmentId) === String(appointment.id)
                ? {
                    border: "1px solid rgba(0,180,219,.62)",
                    boxShadow: "0 14px 30px rgba(0,180,219,.10)",
                  }
                : {}),
              scrollMarginTop: 24,
            }}
          >
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

    <div ref={(node) => { calendarSectionRefs.current["appointment-form"] = node; }} id="calendar-appointment-form" style={{ scrollMarginTop: 96 }} />
    {!showForm ? (
      <button type="button" onClick={() => { startAdd(); requestAnimationFrame(() => scrollToCalendarSection("appointment-form")); }} style={{ ...primaryButton, maxWidth: 260 }}>+ Add an appointment</button>
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
        <Field name="notes" label="Notes" type="text" placeholder="Optional notes" defaultValue={editingAppointment?.notes || ""} required={false} />
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
  marginTop: 16, padding: 18, borderRadius: 16,
  border: "1px solid " + BORDER,
  background: "rgba(255,255,255,.025)",
};
const todayViewHeader = {
  display: "flex", alignItems: "flex-start", justifyContent: "space-between",
  gap: 14, flexWrap: "wrap",
};
const todayViewDate = {
  display: "inline-flex", alignItems: "center", minHeight: 34,
  padding: "0 10px", borderRadius: 9, border: "1px solid " + BORDER,
  color: MUTED, fontSize: 12, fontWeight: 700,
};
const todayViewGrid = {
  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 9, marginTop: 14,
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
 
const nextActionPanel = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  marginTop: 18,
  padding: 17,
  borderRadius: 16,
  border: "1px solid rgba(0,180,219,.58)",
  background: "linear-gradient(135deg, rgba(0,180,219,.12), rgba(37,99,235,.12))",
  boxShadow: "0 12px 28px rgba(0,0,0,.14)",
  flexWrap: "wrap",
};

const nextActionIcon = {
  width: 48,
  height: 48,
  display: "grid",
  placeItems: "center",
  flex: "0 0 auto",
  borderRadius: 13,
  background: "rgba(0,180,219,.15)",
  border: "1px solid rgba(0,180,219,.34)",
  fontSize: 23,
};

const nextActionButton = {
  flex: "0 0 auto",
  minHeight: 42,
  padding: "0 14px",
  border: "1px solid rgba(0,180,219,.55)",
  borderRadius: 10,
  background: "rgba(6,26,43,.62)",
  color: TEXT,
  fontWeight: 800,
  cursor: "pointer",
};

const attentionPanel = {
  marginTop: 20, padding: 20, borderRadius: 18,
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
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 8,
  marginTop: 18,
};
const attentionSummaryItem = {
  minWidth: 0,
  display: "grid",
  gap: 3,
  padding: "9px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.025)",
  textAlign: "center",
};
const attentionList = { display: "grid", gap: 8, marginTop: 15 };
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
const todayJumpButton = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: "1px solid rgba(0,180,219,.28)",
  borderRadius: 999,
  padding: "5px 9px",
  background: "rgba(0,180,219,.06)",
  color: TEXT,
  fontSize: 11,
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const actionGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginTop: 20 };
const actionCard = { display: "flex", alignItems: "flex-start", gap: 12, textAlign: "left", minHeight: 92, padding: 16, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)", color: TEXT, cursor: "pointer" };
const actionIcon = { fontSize: 22, lineHeight: 1, flex: "0 0 auto", marginTop: 2 };
const actionCardContent = { display: "grid", gap: 6, minWidth: 0, flex: "1 1 auto", lineHeight: 1.35 };
const actionCardTitle = { display: "block", fontSize: 16, lineHeight: 1.25 };
const actionCardDescription = { display: "block", color: MUTED, fontSize: 13, lineHeight: 1.45 };
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
const schedulingSummaryContent = { display: "grid", gap: 5, minWidth: 0, flex: "1 1 260px" };
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

const jobMetaBadge = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 24,
  padding: "0 8px",
  borderRadius: 999,
  border: "1px solid rgba(0,180,219,.24)",
  background: "rgba(0,180,219,.07)",
  color: MUTED,
  fontSize: 11,
  fontWeight: 700,
};
const jobCard = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: 18, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)" };
const jobStatus = { padding: "6px 9px", borderRadius: 999, background: "rgba(0,180,219,.12)", color: CYAN, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" };
const personCard = { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 16, padding: 18, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.035)" };
const smallDangerButton = { ...smallActionButton, borderColor: "rgba(255,23,79,.45)", color: "#FF6B8A" };
const emptyPeople = { marginTop: 28, padding: 28, borderRadius: 14, border: `1px dashed ${BORDER}`, background: "rgba(255,255,255,.025)", textAlign: "center" };
const personSummaryCard = {
  minWidth: 0, padding: "11px 12px", borderRadius: 11,
  border: "1px solid " + BORDER, background: "rgba(255,255,255,.025)",
};
const personNameButton = {
  display: "block",
  padding: 0,
  margin: 0,
  border: 0,
  background: "transparent",
  color: TEXT,
  fontSize: 17,
  fontWeight: 800,
  lineHeight: 1.25,
  textAlign: "left",
  cursor: "pointer",
};

const personFocusPanel = {
  marginTop: 14,
  padding: 16,
  borderRadius: 13,
  border: "1px solid rgba(0,180,219,.28)",
  background: "linear-gradient(180deg, rgba(0,180,219,.08), rgba(255,255,255,.025))",
  boxShadow: "0 12px 28px rgba(0,0,0,.12)",
};

const personFocusMetrics = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
  marginTop: 14,
};

const personFocusMetric = {
  minWidth: 0,
  padding: "9px 10px",
  borderRadius: 9,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.025)",
};

const personFocusActivity = {
  display: "grid",
  gap: 6,
  marginTop: 9,
};

const personFocusActivityItem = {
  display: "grid",
  gridTemplateColumns: "86px minmax(0,1fr)",
  gap: 9,
  padding: "8px 9px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,.07)",
  background: "rgba(255,255,255,.02)",
};
const personFinanceRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  padding: "8px 9px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,.07)",
  background: "rgba(255,255,255,.02)",
};
const personFocusProductionGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
  marginTop: 10,
};

const personMetaBadge = {
  display: "inline-flex",
  alignItems: "center",
  padding: "3px 7px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.035)",
  color: MUTED,
  fontSize: 10,
  fontWeight: 700,
  lineHeight: 1.2,
};
const personRelationshipGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 7,
  marginTop: 10,
};
const personRelationshipLabel = {
  display: "block",
  color: MUTED,
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: ".06em",
  textTransform: "uppercase",
};
const personRelationshipValue = {
  display: "block",
  marginTop: 3,
  fontSize: 11,
  lineHeight: 1.25,
  fontWeight: 700,
};

const personForm = { marginTop: 24, padding: 22, borderRadius: 14, border: `1px solid ${BORDER}`, background: "rgba(0,180,219,.05)" };
const businessNote = { marginTop: 22, padding: 18, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.025)" };

function Field({ name, label, type, placeholder, defaultValue, required = true }) {
  return <label style={fieldStyle}>{label}<input required={required} name={name} type={type} placeholder={placeholder} defaultValue={defaultValue} style={inputStyle} /></label>;
}

const pageStyle = { minHeight: "100vh", position: "relative", overflowX: "clip", background: `linear-gradient(135deg, ${BG} 0%, ${SURFACE} 62%, #08233A 100%)`, color: TEXT, padding: "0 20px 24px", boxSizing: "border-box", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" };
const shellStyle = { width: "100%", maxWidth: 1120, margin: "0 auto", position: "relative", zIndex: 1 };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" };
const brandStyle = { color: TEXT, textDecoration: "none", fontWeight: 700, fontSize: 28, letterSpacing: "0.02em" };
const backLink = { color: RED, textDecoration: "none", fontWeight: 600, fontSize: 13 };
const heroStyle = { maxWidth: 820, margin: "4px auto 8px", textAlign: "center" };
const eyebrowStyle = { display: "inline-block", color: RED, fontSize: 10, fontWeight: 800, letterSpacing: "0.14em" };
const heroHeading = { margin: "8px 0 8px", fontSize: "clamp(36px, 4.5vw, 52px)", lineHeight: 0.98, letterSpacing: "-0.055em", fontWeight: 600 };
const heroCopy = { maxWidth: 650, margin: "0 auto", color: MUTED, fontSize: 14, lineHeight: 1.4 };
const previewBadge = { display: "inline-block", marginTop: 10, padding: "6px 11px", border: `1px solid ${RED}`, borderRadius: 999, background: "rgba(0,180,219,.08)", color: RED, fontSize: 10, fontWeight: 600 };
const navStyle = { display: "flex", justifyContent: "center", alignItems: "center", gap: 10, flexWrap: "wrap", margin: "12px 0 12px" };
const navMainGroup = { display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" };
const tabStyle = (active) => ({ border: `1px solid ${active ? RED : BORDER}`, borderRadius: 999, padding: "9px 14px", background: active ? "rgba(255,23,79,.16)" : "rgba(255,255,255,.04)", color: TEXT, fontSize: 12, fontWeight: 700, cursor: "pointer" });
const workspaceNavShell = {
  position: "sticky",
  top: 8,
  zIndex: 100,
  width: "100%",
  boxSizing: "border-box",
  padding: 7,
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 12,
  background: "rgba(6,28,47,.94)",
  boxShadow: "0 10px 24px rgba(0,0,0,.20)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
}; 
const workspaceStickyNav = {
  position: "relative",
  zIndex: 1,
  width: "100%",
  minWidth: 0,
  margin: 0,
  padding: 0,
  background: "transparent",
  overflow: "hidden",
};
const workspaceMainNav = {
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: 5,
  width: "100%",
  minWidth: 0,
  overflow: "hidden",
};
const workspaceMainTab = (active) => ({
  width: "100%",
  minWidth: 0,
  minHeight: 38,
  border: "1px solid " + (active ? RED : BORDER),
  borderRadius: 9,
  padding: "7px 5px",
  background: active ? "rgba(37,99,235,.18)" : "rgba(255,255,255,.035)",
  color: TEXT,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: ".06em",
  lineHeight: 1.1,
  cursor: "pointer",
  whiteSpace: "normal",
});
const workspaceSubnavTray = {
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  width: "100%",
  minWidth: 0,
  minHeight: 30,
  margin: 0,
  padding: "2px 0 1px",
  boxSizing: "border-box",
  borderTop: "1px solid rgba(0,180,219,.10)",
  background: "linear-gradient(180deg, rgba(0,180,219,.03), rgba(0,180,219,0))",
  overflow: "hidden",
};
const workspaceSubnavItems = (section) => {
  const layout = {
    today: { gridColumn: "1 / span 2" },
    work: { gridColumn: "2 / span 2" },
    finance: { gridColumn: "3 / span 3" },
    insights: { gridColumn: "4 / span 2" },
    assist: { gridColumn: "5 / span 2" },
    account: { gridColumn: "5 / span 2" },
  };
  return {
    ...(layout[section] || layout.today),
    minWidth: 0,
    maxWidth: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    rowGap: 3,
    flexWrap: "wrap",
    overflow: "hidden",
  };
};
const workspaceSubnavTab = (active, section = "") => ({
  flex: ["finance", "today", "work", "insights", "assist", "account"].includes(section) ? "1 1 0" : "0 0 auto",
  minWidth: ["finance", "today", "work", "insights", "assist", "account"].includes(section) ? 0 : undefined,
  boxSizing: "border-box",
  overflow: ["finance", "today", "work", "insights", "assist", "account"].includes(section) ? "hidden" : undefined,
  textOverflow: ["finance", "today", "work", "insights", "assist", "account"].includes(section) ? "ellipsis" : undefined,
  border: "1px solid " + (active ? CYAN : "rgba(255,255,255,.10)"),
  borderRadius: 999,
  padding: "4px 9px",
  background: active ? "rgba(0,180,219,.13)" : "rgba(255,255,255,.025)",
  color: active ? TEXT : MUTED,
  fontSize: 10,
  fontWeight: 700,
  lineHeight: 1.1,
  cursor: "pointer",
  whiteSpace: "nowrap",
});
const workspaceSubnav = {
  today: [
    ["overview", "Overview", "dashboard", "today-overview"],
    ["priorities", "Priorities", "dashboard", "today-priority-list"],
    ["upcoming", "Upcoming", "dashboard", "today-upcoming"],
    ["attention", "Attention", "dashboard", "today-attention"],
  ],
  work: [
    ["people", "People", "people"],
    ["jobs", "Jobs", "jobs"],
    ["calendar", "Calendar", "calendar"],
    ["production", "Production", "production"],
  ],
  finance: [
    ["finance-overview", "Revenue", "finance", "finance-revenue"],
    ["invoices", "Invoices", "finance", "finance-invoices"],
    ["payments", "Payments", "finance", "finance-payments"],
    ["expenses", "Expenses & Outgoings", "finance", "finance-expenses"],
    ["cashflow", "Cashflow Outlook", "finance", "finance-cashflow"],
  ],
  insights: [
    ["reports", "Reports", "reports", "reports-summary"],
    ["performance", "Performance", "reports", "reports-performance"],
    ["trends", "Trends", "reports", "reports-trends"],
  ],
  assist: [
    ["buddi", "Buddi", "buddi"],
    ["automation", "Automation", "automation"],
  ],
  account: [
    ["plans", "Plans", "plans", "plans-membership"],
    ["membership", "Membership", "account", "account-membership"],
    ["account", "Account", "account", "account-details"],
    ["logout", "Log out", "logout"],
  ],
};
function getWorkspaceSubnav(account) {
  const terminology = account?.terminology || {};
  const personLabel = terminology.person || "People";
  const jobLabel = terminology.job || "Jobs";
  const appointmentLabel = terminology.appointment || "Calendar";
  return {
    ...workspaceSubnav,
    work: [
      ["people", personLabel, "people"],
      ["jobs", jobLabel, "jobs"],
      ["calendar", appointmentLabel, "calendar"],
      ["production", "Production", "production"],
    ],
  };
}
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
const inputStyle = { display: "block", width: "100%", minHeight: 52, marginTop: 8, padding: "0 15px", boxSizing: "border-box", border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 15, color: TEXT, background: SURFACE, colorScheme: "dark" };
const messageStyle = { maxWidth: 760, margin: "0 auto 24px", padding: 15, borderRadius: 10, background: "rgba(37,99,235,.12)", border: `1px solid ${RED}`, color: TEXT, textAlign: "center", lineHeight: 1.5 };
const authErrorStyle = { position: "sticky", top: 12, zIndex: 20, display: "grid", gap: 5, margin: "22px 0 0", padding: "14px 16px", borderRadius: 12, background: "rgba(255,75,75,.12)", border: "1px solid rgba(255,120,120,.62)", color: TEXT, lineHeight: 1.45, boxShadow: "0 12px 28px rgba(0,0,0,.22)" };
const plansGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(225px, 1fr))", gap: 20, alignItems: "stretch" };
const popularBadge = { display: "inline-block", alignSelf: "flex-start", padding: "7px 10px", borderRadius: 999, background: RED, fontSize: 11, fontWeight: 700 };
const planTitle = { fontSize: 27, margin: "18px 0 5px" };
const priceStyle = { fontSize: 42, fontWeight: 700, letterSpacing: "-0.05em" };
const statsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginTop: 30 };
const statCard = { border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18, background: "rgba(255,255,255,.035)" };
const callout = { marginTop: 28, padding: 22, borderRadius: 14, border: `1px solid ${BORDER}`, background: "rgba(255,23,79,.06)" };
