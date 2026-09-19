import { useEffect, useRef, useState } from "react";

const PLATFORM_NAME = "BizziBuddi";
const BRAND_RED = "#FF174F";
const BRAND_RED_DARK = "#C4003D";

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
    { label: "Jobs", page: "jobs", sectionText: "Jobs" },
    { label: "Finance", page: "finance", sectionText: "Finance" },
    { label: "Backup & Transfer", page: "settings", sectionText: "Backup" },
  ]},
];

export default function Sidebar({ currentPage, setCurrentPage, branding, onNavigate }) {
  const primary = branding?.primaryColour || BRAND_RED_DARK;
  const secondary = branding?.secondaryColour || "#2F3A3F";
  const accent = branding?.accentColour || BRAND_RED;
  const businessName = branding?.businessName || "Your Business";
  const logo = branding?.logo || "";
  const slogan = branding?.slogan?.trim() || "";
  const [expandedItem, setExpandedItem] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredSubItem, setHoveredSubItem] = useState(null);
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
    <aside ref={sidebarRef} style={{ width: 300, height: "100dvh", background: secondary, color: "#FFFFFF", display: "flex", flexDirection: "column", padding: "12px 14px", flexShrink: 0, boxSizing: "border-box", overflow: "hidden" }}>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ flexShrink: 0, marginBottom: 8, textAlign: "center" }}>
          {logo ? (
            <div style={{ width: "100%", height: 58, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 7 }}>
              <img src={logo} alt={`${businessName} logo`} style={{ maxWidth: "190px", maxHeight: "56px", objectFit: "contain" }} />
            </div>
          ) : (
            <div style={{ width: 54, height: 54, margin: "0 auto 7px", borderRadius: 13, background: primary, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, boxShadow: `0 0 0 1px ${accent}` }}>
              {businessName.trim().charAt(0).toUpperCase() || "B"}
            </div>
          )}
          <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.15, overflowWrap: "anywhere" }}>{businessName}</div>
          {slogan && <div style={{ color: "#E4E7E9", marginTop: 5, fontSize: 12, fontWeight: 400, lineHeight: 1.35, maxWidth: 230, marginLeft: "auto", marginRight: "auto" }}>{slogan}</div>}
        </div>

        <nav aria-label="Main navigation" style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {MENU_ITEMS.map((item) => {
            const active = currentPage === item.id;
            const expanded = expandedItem === item.id;
            const hasSubmenu = item.submenu?.length > 0;
            const menuHovered = hoveredItem === item.id;
            return (
              <div key={item.id} ref={(element) => { itemRefs.current[item.id] = element; }} onMouseEnter={() => { setHoveredItem(item.id); openMenu(item); }} onMouseLeave={() => { setHoveredItem(null); scheduleClose(); }} style={{ marginBottom: 1 }}>
                <button type="button" aria-current={active ? "page" : undefined} aria-expanded={hasSubmenu ? expanded : undefined} onClick={() => handleMenuClick(item)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, textAlign: "left", padding: "6px 10px", border: `1px solid ${active || menuHovered ? BRAND_RED : "transparent"}`, borderRadius: expanded && hasSubmenu ? "9px 9px 6px 6px" : 9, cursor: "pointer", fontSize: 14, fontWeight: active ? 600 : 400, background: active ? BRAND_RED_DARK : menuHovered ? BRAND_RED_DARK : "transparent", color: "#FFFFFF", transition: "background .18s ease, color .18s ease, border-color .18s ease, transform .18s ease", transform: menuHovered ? "translateX(2px)" : "translateX(0)", boxShadow: active || menuHovered ? `0 0 12px rgba(255,23,79,.22)` : "none", boxSizing: "border-box" }}>
                  <span aria-hidden="true" style={{ width: 27, height: 27, borderRadius: 7, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: active || menuHovered ? BRAND_RED : "rgba(255,255,255,.10)", color: "#FFFFFF", fontSize: item.icon === "$" ? 16 : 11, fontWeight: 700 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {hasSubmenu && <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1, opacity: 1, color: BRAND_RED, transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .18s ease" }}>›</span>}
                </button>

                <div aria-hidden={!expanded} onMouseEnter={cancelCloseTimer} onMouseLeave={scheduleClose} style={{ position: "fixed", left: 306, top: flyoutTop, width: 255, maxHeight: "calc(100vh - 24px)", padding: "14px 12px", boxSizing: "border-box", background: secondary, border: `1px solid ${BRAND_RED}`, borderRadius: 12, boxShadow: "0 18px 45px rgba(0,0,0,.35)", zIndex: 1000, opacity: expanded ? 1 : 0, visibility: expanded ? "visible" : "hidden", transform: expanded ? "translateX(0)" : "translateX(-14px)", pointerEvents: expanded ? "auto" : "none", transition: "opacity 220ms ease, transform 220ms ease, visibility 220ms ease" }}>
                  <div style={{ padding: "6px 10px 12px", color: BRAND_RED, fontSize: 12, fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase", borderBottom: `1px solid ${BRAND_RED}`, marginBottom: 8 }}>{item.label}</div>
                  {item.submenu.map((subItem) => {
                    const subActive = currentPage === subItem.page;
                    const subKey = `${item.id}-${subItem.label}`;
                    const subHovered = hoveredSubItem === subKey;
                    return (
                      <button key={subKey} type="button" onMouseEnter={() => setHoveredSubItem(subKey)} onMouseLeave={() => setHoveredSubItem(null)} onClick={() => handleSubmenuClick(subItem, item.id)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "12px 12px", margin: "3px 0", border: `1px solid ${subActive || subHovered ? BRAND_RED : "transparent"}`, borderRadius: 8, background: subActive ? BRAND_RED_DARK : subHovered ? BRAND_RED_DARK : "transparent", color: "#FFFFFF", textAlign: "left", fontSize: 13, fontWeight: subActive || subHovered ? 700 : 400, cursor: "pointer", transition: "background .18s ease, color .18s ease, border-color .18s ease" }}>
                        <span><span aria-hidden="true" style={{ display: "inline-block", width: 12, color: BRAND_RED }}>•</span>{subItem.label}</span>
                        <span aria-hidden="true" style={{ color: BRAND_RED, opacity: 1 }}>›</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      <div style={{ flexShrink: 0, paddingTop: 10, marginTop: 8 }}>
        <a href="/bizzibuddi/account" target="_blank" rel="noopener noreferrer" aria-label="View BizziBuddi plans and upgrade" style={{ display: "block", color: "#FFFFFF", fontSize: 12, lineHeight: 1.45, textAlign: "center", textDecoration: "none", borderRadius: 12, padding: "11px 10px", background: "linear-gradient(145deg, #20252B 0%, #151923 100%)", border: `1px solid ${BRAND_RED}`, boxShadow: "0 8px 24px rgba(0,0,0,.18)", transition: "color .2s ease, background .2s ease, transform .2s ease, box-shadow .2s ease" }} onMouseEnter={(event) => { event.currentTarget.style.background = BRAND_RED_DARK; event.currentTarget.style.transform = "translateY(-2px)"; event.currentTarget.style.boxShadow = `0 8px 22px rgba(255,23,79,.24)`; }} onMouseLeave={(event) => { event.currentTarget.style.background = "linear-gradient(145deg, #20252B 0%, #151923 100%)"; event.currentTarget.style.transform = "translateY(0)"; event.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.18)"; }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 7 }}>
            <span aria-hidden="true" style={{ width: 38, height: 38, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: `2px solid ${BRAND_RED}`, background: BRAND_RED, color: "#FFFFFF", fontSize: 20, fontWeight: 900 }}>B</span>
            <span style={{ color: "#FFFFFF", fontWeight: 400, fontSize: 16, letterSpacing: 0.2 }}>{PLATFORM_NAME}</span>
          </div>
          <div style={{ color: "#FFFFFF", fontWeight: 300, fontSize: 11 }}>Business management, all in one place.</div>
          <div style={{ marginTop: 8, color: BRAND_RED, fontSize: 11, fontWeight: 700 }}>View BizziBuddi plans &amp; upgrade →</div>
          <div style={{ marginTop: 6, color: "#FFFFFF", fontSize: 9, fontWeight: 300 }}>© {new Date().getFullYear()} {PLATFORM_NAME}. All rights reserved.</div>
        </a>
      </div>
    </aside>
  );
}
