import { useEffect, useRef, useState } from "react";

const PLATFORM_NAME = "bizzibuddi";

const MENU_ITEMS = [
  { id: "studio", label: "Studio", icon: "S", submenu: [
    { label: "Dashboard", page: "studio", sectionText: "Studio Dashboard" },
    { label: "Quick Job Finder", page: "studio", sectionText: "Quick Job Finder" },
    { label: "Recent Activity", page: "studio", sectionText: "Recent Activity" },
  ]},
  { id: "people", label: "People", icon: "P", submenu: [
    { label: "All People", page: "people", sectionText: "People" },
    { label: "Clients", page: "people", sectionText: "Clients" },
    { label: "Client History", page: "people", sectionText: "History" },
  ]},
  { id: "jobs", label: "Jobs", icon: "J", submenu: [
    { label: "All Jobs", page: "jobs", buttonLabel: "All Jobs" },
    { label: "Production", page: "jobs", sectionText: "Production Workload" },
    { label: "Due Today", page: "jobs", buttonLabel: "Due Today" },
    { label: "Overdue", page: "jobs", buttonLabel: "Overdue" },
    { label: "Completed", page: "jobs", sectionText: "Completed" },
  ]},
  { id: "garments", label: "Garments", icon: "G", submenu: [
    { label: "All Garments", page: "garments", sectionText: "Garments" },
    { label: "In Production", page: "garments", sectionText: "In Production" },
    { label: "Ready", page: "garments", sectionText: "Ready" },
  ]},
  { id: "calendar", label: "Calendar", icon: "C", submenu: [
    { label: "Calendar", page: "calendar", buttonLabel: "Calendar" },
    { label: "Today", page: "calendar", buttonLabel: "Today" },
    { label: "Appointments", page: "calendar", sectionText: "Appointments" },
    { label: "Fittings", page: "calendar", sectionText: "Fittings" },
  ]},
  { id: "finance", label: "Finance", icon: "$", submenu: [
    { label: "Overview", page: "finance", buttonLabel: "Overview" },
    { label: "Quotes", page: "finance", buttonLabel: "Quotes" },
    { label: "Invoices", page: "finance", buttonLabel: "Invoices" },
    { label: "Payments", page: "finance", buttonLabel: "Payments" },
    { label: "Outstanding", page: "finance", sectionText: "Outstanding Jobs" },
  ]},
  { id: "reports", label: "Reports", icon: "R", submenu: [
    { label: "Overview", page: "reports", sectionText: "Reports" },
    { label: "Jobs", page: "reports", sectionText: "Jobs" },
    { label: "Production", page: "reports", sectionText: "Production" },
    { label: "Finance", page: "reports", sectionText: "Finance" },
  ]},
  { id: "settings", label: "Settings", icon: "⚙", submenu: [
    { label: "General", page: "settings", sectionText: "General" },
    { label: "Business", page: "settings", sectionText: "Business" },
    { label: "Jobs", page: "settings", sectionText: "Jobs" },
    { label: "Finance", page: "settings", sectionText: "Finance" },
    { label: "Backup & Transfer", page: "settings", sectionText: "Backup" },
  ]},
];

export default function Sidebar({ currentPage, setCurrentPage, branding, onNavigate }) {
  const primary = branding?.primaryColour || "#8B1E3F";
  const secondary = branding?.secondaryColour || "#2F3A3F";
  const accent = branding?.accentColour || "#C96A83";
  const businessName = branding?.businessName || "Your Business";
  const logo = branding?.logo || "";
  const slogan = branding?.slogan?.trim() || "";
  const [expandedItem, setExpandedItem] = useState(null);
  const [flyoutTop, setFlyoutTop] = useState(0);
  const sidebarRef = useRef(null);
  const itemRefs = useRef({});
  const closeTimerRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!sidebarRef.current?.contains(event.target)) setExpandedItem(null);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function cancelCloseTimer() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function scheduleClose() {
    cancelCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setExpandedItem(null);
      closeTimerRef.current = null;
    }, 220);
  }

  function openMenu(item) {
    cancelCloseTimer();
    const element = itemRefs.current[item.id];
    if (element) {
      const rect = element.getBoundingClientRect();
      const flyoutHeight = Math.min(item.submenu.length * 38 + 62, window.innerHeight - 24);
      const maxTop = Math.max(12, window.innerHeight - flyoutHeight - 12);
      setFlyoutTop(Math.max(12, Math.min(rect.top, maxTop)));
    }
    setExpandedItem(item.id);
  }

  function handleMenuClick(item) {
    if (!item.submenu?.length) {
      setExpandedItem(null);
      setCurrentPage(item.id);
    }
  }

  function handleSubmenuClick(subItem, parentId) {
    if (onNavigate) onNavigate(subItem);
    else setCurrentPage(subItem.page || parentId);
  }

  return (
    <aside ref={sidebarRef} style={{ width: 240, height: "100vh", background: secondary, color: "#FFFFFF", display: "flex", flexDirection: "column", padding: "16px 14px", flexShrink: 0, boxSizing: "border-box", overflow: "visible" }}>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ flexShrink: 0, marginBottom: 14, textAlign: "center" }}>
          {logo ? (
            <div style={{ width: "100%", height: 52, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <img src={logo} alt={`${businessName} logo`} style={{ maxWidth: "170px", maxHeight: "50px", objectFit: "contain" }} />
            </div>
          ) : (
            <div style={{ width: 48, height: 48, margin: "0 auto 10px", borderRadius: 12, background: primary, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, boxShadow: `0 0 0 1px ${accent}` }}>
              {businessName.trim().charAt(0).toUpperCase() || "B"}
            </div>
          )}
          <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2, overflowWrap: "anywhere" }}>{businessName}</div>
          {slogan && <div style={{ color: "#BFC3C5", marginTop: 5, fontSize: 11, lineHeight: 1.4, maxWidth: 190, marginLeft: "auto", marginRight: "auto" }}>{slogan}</div>}
        </div>

        <nav aria-label="Main navigation" style={{ flex: 1, minHeight: 0, overflow: "visible" }}>
          {MENU_ITEMS.map((item) => {
            const active = currentPage === item.id;
            const expanded = expandedItem === item.id;
            const hasSubmenu = item.submenu?.length > 0;
            return (
              <div key={item.id} ref={(element) => { itemRefs.current[item.id] = element; }} onMouseEnter={() => openMenu(item)} onMouseLeave={scheduleClose} style={{ marginBottom: 3 }}>
                <button type="button" aria-current={active ? "page" : undefined} aria-expanded={hasSubmenu ? expanded : undefined} onClick={() => handleMenuClick(item)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, textAlign: "left", padding: "8px 10px", border: "none", borderRadius: expanded && hasSubmenu ? "10px 10px 7px 7px" : 10, cursor: "pointer", fontSize: 14, fontWeight: active ? 700 : 500, background: active ? primary : "transparent", color: "#FFFFFF", transition: "background .2s ease, color .2s ease", boxShadow: active ? `0 0 0 1px ${accent}` : "none", boxSizing: "border-box" }}>
                  <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: 7, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: active ? "rgba(255,255,255,.16)" : "rgba(255,255,255,.08)", color: "#FFFFFF", fontSize: item.icon === "$" ? 16 : 11, fontWeight: 800 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {hasSubmenu && <span aria-hidden="true" style={{ fontSize: 12, lineHeight: 1, opacity: 0.72, transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .18s ease" }}>›</span>}
                </button>

                <div aria-hidden={!expanded} onMouseEnter={cancelCloseTimer} onMouseLeave={scheduleClose} style={{ position: "fixed", left: 246, top: flyoutTop, width: 235, maxHeight: "calc(100vh - 24px)", padding: "12px 10px", boxSizing: "border-box", background: secondary, border: "1px solid rgba(255,255,255,.14)", borderRadius: 12, boxShadow: "0 18px 45px rgba(0,0,0,.22)", zIndex: 1000, opacity: expanded ? 1 : 0, visibility: expanded ? "visible" : "hidden", transform: expanded ? "translateX(0)" : "translateX(-14px)", pointerEvents: expanded ? "auto" : "none", transition: "opacity 420ms ease, transform 460ms ease, visibility 460ms ease" }}>
                  <div style={{ padding: "5px 9px 10px", color: "#FFFFFF", fontSize: 11, fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,.12)", marginBottom: 7 }}>{item.label}</div>
                  {item.submenu.map((subItem) => {
                    const subActive = currentPage === subItem.page;
                    return (
                      <button key={`${item.id}-${subItem.label}`} type="button" onClick={() => handleSubmenuClick(subItem, item.id)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "9px 10px", margin: "2px 0", border: "none", borderRadius: 8, background: subActive ? primary : "transparent", color: subActive ? "#FFFFFF" : "#D5D9DA", textAlign: "left", fontSize: 12, fontWeight: subActive ? 700 : 500, cursor: "pointer", transition: "background 320ms ease, color 320ms ease" }}>
                        <span><span aria-hidden="true" style={{ display: "inline-block", width: 12, opacity: 0.65 }}>•</span>{subItem.label}</span>
                        <span aria-hidden="true" style={{ opacity: 0.55 }}>›</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      <div style={{ flexShrink: 0, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,.12)", marginTop: 8 }}>
        <a href="/bizzibuddi" aria-label="Visit bizzibuddi" style={{ display: "block", color: "#AEB4B7", fontSize: 9, lineHeight: 1.35, textAlign: "center", textDecoration: "none", borderRadius: 8, padding: "5px 6px", transition: "color .2s ease, background .2s ease" }} onMouseEnter={(event) => { event.currentTarget.style.color = "#FFFFFF"; event.currentTarget.style.background = "rgba(255,255,255,.06)"; }} onMouseLeave={(event) => { event.currentTarget.style.color = "#AEB4B7"; event.currentTarget.style.background = "transparent"; }}>
          <div style={{ color: "inherit", fontWeight: 700 }}>Powered by {PLATFORM_NAME}</div>
          <div style={{ marginTop: 2 }}>Business management, all in one place.</div>
          <div style={{ marginTop: 4, color: "#858D91", fontSize: 8 }}>© {new Date().getFullYear()} {PLATFORM_NAME}. All rights reserved.</div>
        </a>
      </div>
    </aside>
  );
}
