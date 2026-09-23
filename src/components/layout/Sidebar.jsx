import { useEffect, useRef, useState } from "react";
import BizziBuddiLogo from "../common/BizziBuddiLogo";

const PLATFORM_NAME = "BizziBuddi";
const BRAND_BLUE = "#2563EB";
const BRAND_NAVY = "#0F2D4A";
const BRAND_CYAN = "#00B4DB";

const MENU_ITEMS = [
  {
    id: "studio",
    label: "Studio",
    icon: "S",
    submenu: [
      { label: "Dashboard", page: "studio", sectionText: "Studio Dashboard" },
      { label: "Quick Job Finder", page: "studio", sectionText: "Quick Job Finder" },
      { label: "Recent Activity", page: "studio", sectionText: "Recent Activity" },
    ],
  },
  {
    id: "people",
    label: "People",
    icon: "P",
    submenu: [
      { label: "All People", page: "people", sectionText: "People" },
      { label: "Clients", page: "people", sectionText: "Clients" },
      { label: "Client History", page: "people", sectionText: "History" },
    ],
  },
  {
    id: "jobs",
    label: "Jobs",
    icon: "J",
    submenu: [
      { label: "All Jobs", page: "jobs", buttonLabel: "All Jobs" },
      { label: "Production", page: "jobs", sectionText: "Production Workload" },
      { label: "Due Today", page: "jobs", buttonLabel: "Due Today" },
      { label: "Overdue", page: "jobs", buttonLabel: "Overdue" },
      { label: "Completed", page: "jobs", sectionText: "Completed" },
    ],
  },
  {
    id: "garments",
    label: "Garments",
    icon: "G",
    submenu: [
      { label: "All Garments", page: "garments", sectionText: "Garments" },
      { label: "In Production", page: "garments", sectionText: "In Production" },
      { label: "Ready", page: "garments", sectionText: "Ready" },
    ],
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: "C",
    submenu: [
      { label: "Calendar", page: "calendar", buttonLabel: "Calendar" },
      { label: "Today", page: "calendar", buttonLabel: "Today" },
      { label: "Appointments", page: "calendar", sectionText: "Appointments" },
      { label: "Fittings", page: "calendar", sectionText: "Fittings" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: "$",
    submenu: [
      { label: "Overview", page: "finance", buttonLabel: "Overview" },
      { label: "Quotes", page: "finance", buttonLabel: "Quotes" },
      { label: "Invoices", page: "finance", buttonLabel: "Invoices" },
      { label: "Payments", page: "finance", buttonLabel: "Payments" },
      { label: "Outstanding", page: "finance", sectionText: "Outstanding Jobs" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: "R",
    submenu: [
      { label: "Overview", page: "reports", sectionText: "Reports" },
      { label: "Jobs", page: "reports", sectionText: "Jobs" },
      { label: "Production", page: "reports", sectionText: "Production" },
      { label: "Finance", page: "reports", sectionText: "Finance" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: "⚙",
    submenu: [
      { label: "General", page: "settings", sectionText: "General" },
      { label: "Business", page: "settings", sectionText: "Business" },
      {
        label: "Jobs",
        page: "settings",
        sectionText: "Jobs",
        sectionKey: "jobs",
      },
      {
        label: "Finance",
        page: "settings",
        sectionText: "Finance",
        sectionKey: "financial",
      },
      { label: "Backup & Transfer", page: "settings", sectionText: "Backup" },
    ],
  },
];

export default function Sidebar({
  currentPage,
  setCurrentPage,
  branding,
  onNavigate,
}) {
  const primary = branding?.primaryColour || BRAND_NAVY;
  const secondary = "#2F3A3F";
  const accent = BRAND_CYAN;
  const businessName = branding?.businessName || "Your Business";
  const logo = branding?.logo || "";
  const slogan = branding?.slogan?.trim() || "";

  const [expandedItem, setExpandedItem] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredSubItem, setHoveredSubItem] = useState(null);
  const [selectedSubItem, setSelectedSubItem] = useState(null);
  const [flyoutTop, setFlyoutTop] = useState(0);

  const sidebarRef = useRef(null);
  const itemRefs = useRef({});
  const closeTimerRef = useRef(null);

  useEffect(() => {
    if (!selectedSubItem) return;

    const selectedEntry = MENU_ITEMS
      .flatMap((item) =>
        item.submenu.map((subItem) => ({ item, subItem })),
      )
      .find(
        ({ item, subItem }) =>
          `${item.id}-${subItem.label}` === selectedSubItem,
      );

    if (selectedEntry && selectedEntry.subItem.page === currentPage) {
      return;
    }

    const fallbackEntry = MENU_ITEMS
      .flatMap((item) =>
        item.submenu.map((subItem) => ({ item, subItem })),
      )
      .find(({ subItem }) => subItem.page === currentPage);

    setSelectedSubItem(
      fallbackEntry
        ? `${fallbackEntry.item.id}-${fallbackEntry.subItem.label}`
        : null,
    );
  }, [currentPage, selectedSubItem]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!sidebarRef.current?.contains(event.target)) {
        setExpandedItem(null);
        setHoveredSubItem(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
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
      setHoveredSubItem(null);
      closeTimerRef.current = null;
    }, 220);
  }

  function openMenu(item) {
    cancelCloseTimer();

    const element = itemRefs.current[item.id];

    if (element) {
      const rect = element.getBoundingClientRect();
      const flyoutHeight = Math.min(
        item.submenu.length * 38 + 62,
        window.innerHeight - 24,
      );
      const maxTop = Math.max(
        12,
        window.innerHeight - flyoutHeight - 12,
      );

      setFlyoutTop(Math.max(12, Math.min(rect.top, maxTop)));
    }

    setHoveredSubItem(null);
    setExpandedItem(item.id);
  }

  function handleMenuClick(item) {
    if (item.submenu?.length) {
      const firstSubItem = item.submenu[0];

      setExpandedItem(null);
      setHoveredSubItem(null);

      if (onNavigate) {
        onNavigate(firstSubItem);
      } else {
        setCurrentPage(firstSubItem.page || item.id);
      }

      return;
    }

    setExpandedItem(null);
    setHoveredSubItem(null);
    setCurrentPage(item.id);
  }

  function handleSubmenuClick(subItem, parentId) {
    const subKey = `${parentId}-${subItem.label}`;

    setSelectedSubItem(subKey);
    setExpandedItem(null);
    setHoveredSubItem(null);

    if (onNavigate) {
      onNavigate(subItem);
    } else {
      setCurrentPage(subItem.page || parentId);
    }
  }

  return (
    <aside
      ref={sidebarRef}
      style={{
        width: 320,
        height: "100vh",
        background: secondary,
        color: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        padding: "18px 18px",
        flexShrink: 0,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          {logo ? (
            <div
              style={{
                width: "100%",
                height: 78,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <img
                src={logo}
                alt={`${businessName} logo`}
                style={{
                  maxWidth: "220px",
                  maxHeight: "76px",
                  objectFit: "contain",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                margin: "0 auto 10px",
                borderRadius: 14,
                background: primary,
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                fontWeight: 800,
                boxShadow: `0 0 0 1px ${accent}`,
              }}
            >
              {businessName.trim().charAt(0).toUpperCase() || "B"}
            </div>
          )}

          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              lineHeight: 1.2,
              overflowWrap: "anywhere",
            }}
          >
            {businessName}
          </div>

          {slogan && (
            <div
              style={{
                color: "#E4E7E9",
                marginTop: 8,
                fontSize: 13,
                fontWeight: 400,
                lineHeight: 1.5,
                maxWidth: 230,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              {slogan}
            </div>
          )}
        </div>

        <nav
          aria-label="Main navigation"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            scrollbarWidth: "none",
            paddingRight: 2,
          }}
        >
          {MENU_ITEMS.map((item) => {
            const active = currentPage === item.id;
            const expanded = expandedItem === item.id;
            const hasSubmenu = item.submenu?.length > 0;
            const menuHovered = hoveredItem === item.id;

            return (
              <div
                key={item.id}
                ref={(element) => {
                  itemRefs.current[item.id] = element;
                }}
                onMouseEnter={() => {
                  setHoveredItem(item.id);

                  if (hasSubmenu) {
                    openMenu(item);
                  }
                }}
                onMouseLeave={() => {
                  setHoveredItem(null);
                  scheduleClose();
                }}
                style={{
                  marginBottom: 0,
                }}
              >
                <button
                  type="button"
                  aria-current={active ? "page" : undefined}
                  aria-expanded={hasSubmenu ? expanded : undefined}
                  onClick={() => handleMenuClick(item)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    textAlign: "left",
                    padding: "5px 12px",
                    border: `1px solid ${
                      active || menuHovered
                        ? BRAND_BLUE
                        : "transparent"
                    }`,
                    borderRadius:
                      expanded && hasSubmenu
                        ? "10px 10px 7px 7px"
                        : 10,
                    cursor: "pointer",
                    fontSize: 15,
                    fontWeight: active ? 600 : 400,
                    background: active
                      ? BRAND_NAVY
                      : menuHovered
                        ? BRAND_NAVY
                        : "transparent",
                    color: "#FFFFFF",
                    transition:
                      "background .18s ease, color .18s ease, border-color .18s ease, transform .18s ease",
                    transform: menuHovered
                      ? "translateX(2px)"
                      : "translateX(0)",
                    boxShadow:
                      active || menuHovered
                        ? "0 0 14px rgba(0,180,219,.22)"
                        : "none",
                    boxSizing: "border-box",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 27,
                      height: 27,
                      borderRadius: 8,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      background:
                        active || menuHovered
                          ? BRAND_BLUE
                          : "rgba(255,255,255,.10)",
                      color: "#FFFFFF",
                      fontSize: item.icon === "$" ? 17 : 12,
                      fontWeight: 700,
                    }}
                  >
                    {item.icon}
                  </span>

                  <span style={{ flex: 1 }}>{item.label}</span>

                  {hasSubmenu && (
                    <span
                      aria-hidden="true"
                      style={{
                        fontSize: 15,
                        lineHeight: 1,
                        opacity: 1,
                        color: BRAND_BLUE,
                        transform: expanded
                          ? "rotate(90deg)"
                          : "rotate(0deg)",
                        transition: "transform .18s ease",
                      }}
                    >
                      ›
                    </span>
                  )}
                </button>

                <div
                  aria-hidden={!expanded}
                  onMouseEnter={cancelCloseTimer}
                  onMouseLeave={scheduleClose}
                  style={{
                    position: "fixed",
                    left: 326,
                    top: flyoutTop,
                    width: 255,
                    maxHeight: "calc(100vh - 24px)",
                    padding: "14px 12px",
                    boxSizing: "border-box",
                    background: secondary,
                    border: `1px solid ${BRAND_BLUE}`,
                    borderRadius: 12,
                    boxShadow: "0 18px 45px rgba(0,0,0,.35)",
                    zIndex: 1000,
                    opacity: expanded ? 1 : 0,
                    visibility: expanded ? "visible" : "hidden",
                    transform: expanded
                      ? "translateX(0)"
                      : "translateX(-14px)",
                    pointerEvents: expanded ? "auto" : "none",
                    transition:
                      "opacity 220ms ease, transform 220ms ease, visibility 220ms ease",
                  }}
                >
                  <div
                    style={{
                      padding: "6px 10px 12px",
                      color: BRAND_BLUE,
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: 0.7,
                      textTransform: "uppercase",
                      borderBottom: `1px solid ${BRAND_BLUE}`,
                      marginBottom: 8,
                    }}
                  >
                    {item.label}
                  </div>

                  {item.submenu.map((subItem) => {
                    const subKey = `${item.id}-${subItem.label}`;
                    const subActive = selectedSubItem === subKey;
                    const subHovered = hoveredSubItem === subKey;

                    return (
                      <button
                        key={subKey}
                        type="button"
                        onMouseEnter={() => setHoveredSubItem(subKey)}
                        onMouseLeave={() => setHoveredSubItem(null)}
                        onClick={() =>
                          handleSubmenuClick(subItem, item.id)
                        }
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          padding: "12px 12px",
                          margin: "3px 0",
                          border: `1px solid ${
                            subActive || subHovered
                              ? BRAND_BLUE
                              : "transparent"
                          }`,
                          borderRadius: 8,
                          background: subActive
                            ? BRAND_NAVY
                            : subHovered
                              ? BRAND_NAVY
                              : "transparent",
                          color: "#FFFFFF",
                          textAlign: "left",
                          fontSize: 13,
                          fontWeight:
                            subActive || subHovered ? 700 : 400,
                          cursor: "pointer",
                          transition:
                            "background .18s ease, color .18s ease, border-color .18s ease",
                        }}
                      >
                        <span>
                          <span
                            aria-hidden="true"
                            style={{
                              display: "inline-block",
                              width: 12,
                              color: BRAND_BLUE,
                            }}
                          >
                            •
                          </span>
                          {subItem.label}
                        </span>

                        <span
                          aria-hidden="true"
                          style={{
                            color: BRAND_BLUE,
                            opacity: 1,
                          }}
                        >
                          ›
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      <div
        style={{
          flexShrink: 0,
          paddingTop: 8,
          marginTop: 6,
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: "#E4E7E9",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.8,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Powered by
        </div>

        <a
          href="/bizzibuddi/account"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View BizziBuddi plans and upgrade"
          style={{
            display: "block",
            color: "#FFFFFF",
            textDecoration: "none",
            borderRadius: 16,
            padding: "10px 10px 9px",
            background: "linear-gradient(145deg, #162C3F 0%, #0F2D4A 100%)",
            border: "1px solid #2563EB",
            boxShadow: "0 10px 28px rgba(0,0,0,.22)",
            transition: "transform .2s ease, box-shadow .2s ease, border-color .2s ease",
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.transform = "translateY(-2px)";
            event.currentTarget.style.boxShadow = "0 12px 30px rgba(0,180,219,.18)";
            event.currentTarget.style.borderColor = "#00B4DB";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.transform = "translateY(0)";
            event.currentTarget.style.boxShadow = "0 10px 28px rgba(0,0,0,.22)";
            event.currentTarget.style.borderColor = "#2563EB";
          }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <BizziBuddiLogo
              size={76}
              dark
              showWordmark
              tagline="Business support, simplified."
            />
          </div>

          <div
            style={{
              marginTop: 7,
              color: "#FFFFFF",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: ".01em",
            }}
          >
            Your personal assistant for business.
          </div>

          <div
            style={{
              marginTop: 9,
              padding: "8px 7px",
              borderRadius: 8,
              background: "linear-gradient(90deg, #2563EB 0%, #00B4DB 100%)",
              color: "#FFFFFF",
              fontSize: 11,
              fontWeight: 800,
              lineHeight: 1.4,
              boxShadow: "0 5px 16px rgba(0,180,219,.16)",
            }}
          >
            View BizziBuddi plans &amp; upgrade →
          </div>

          <div
            style={{
              marginTop: 7,
              color: "#D7E4EE",
              fontSize: 8,
              fontWeight: 400,
            }}
          >
            © {new Date().getFullYear()} {PLATFORM_NAME}. All rights reserved.
          </div>
        </a>
      </div>
    </aside>
  );
}