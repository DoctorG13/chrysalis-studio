const PLATFORM_NAME = "THRIVE";
const PLATFORM_PROMISE = "Streamline your business. Simplify your work.";

const MENU_ITEMS = [
  { id: "studio", label: "Studio", icon: "S" },
  { id: "people", label: "People", icon: "P" },
  { id: "garments", label: "Garments", icon: "G" },
  { id: "calendar", label: "Calendar", icon: "C" },
  { id: "finance", label: "Finance", icon: "$" },
  { id: "reports", label: "Reports", icon: "R" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

export default function Sidebar({
  currentPage,
  setCurrentPage,
  branding,
}) {
  const primary =
    branding?.primaryColour || "#8B1E3F";

  const secondary =
    branding?.secondaryColour || "#2F3A3F";

  const accent =
    branding?.accentColour || "#C96A83";

  const businessName =
    branding?.businessName || "Your Business";

  const logo = branding?.logo || "";
  const slogan = branding?.slogan?.trim() || "";

  function handleNavigation(page) {
    setCurrentPage(page);
  }

  return (
    <aside
      style={{
        width: 240,
        background: secondary,
        color: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 20,
        flexShrink: 0,
        boxSizing: "border-box",
        minHeight: "100vh",
      }}
    >
      <div>
        {/* THRIVE PLATFORM BRAND */}
        <div
          style={{
            paddingBottom: 20,
            marginBottom: 18,
            borderBottom: "1px solid rgba(255,255,255,.14)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              marginBottom: 8,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 28,
                height: 28,
                border: "2px solid #FFFFFF",
                borderRadius: 8,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 800,
                transform: "rotate(45deg)",
              }}
            >
              <span style={{ transform: "rotate(-45deg)" }}>
                T
              </span>
            </span>

            <span
              style={{
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: 2,
                lineHeight: 1,
              }}
            >
              {PLATFORM_NAME}
            </span>
          </div>

          <div
            style={{
              color: "#D8DADC",
              fontSize: 11,
              lineHeight: 1.45,
              maxWidth: 190,
              margin: "0 auto",
            }}
          >
            {PLATFORM_PROMISE}
          </div>
        </div>

        {/* CUSTOMER BRAND */}
        <div
          style={{
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          {logo ? (
            <div
              style={{
                width: "100%",
                height: 64,
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
                  maxWidth: "180px",
                  maxHeight: "58px",
                  objectFit: "contain",
                }}
              />
            </div>
          ) : (
            <div
              aria-hidden="true"
              style={{
                width: 48,
                height: 48,
                margin: "0 auto 10px",
                borderRadius: 12,
                background: primary,
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 800,
                boxShadow: `0 0 0 1px ${accent}`,
              }}
            >
              {businessName
                .trim()
                .charAt(0)
                .toUpperCase() || "B"}
            </div>
          )}

          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              lineHeight: 1.2,
              overflowWrap: "anywhere",
            }}
          >
            {businessName}
          </div>

          {slogan && (
            <div
              style={{
                color: "#BFC3C5",
                marginTop: 5,
                fontSize: 11,
                lineHeight: 1.4,
              }}
            >
              {slogan}
            </div>
          )}
        </div>

        {/* NAVIGATION */}
        <nav aria-label="Main navigation">
          {MENU_ITEMS.map((item) => {
            const active = currentPage === item.id;

            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => handleNavigation(item.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  textAlign: "left",
                  padding: "12px 14px",
                  marginBottom: 7,
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 15,
                  fontWeight: active ? 700 : 500,
                  background: active
                    ? primary
                    : "transparent",
                  color: "#FFFFFF",
                  transition:
                    "background .2s ease, color .2s ease, transform .2s ease",
                  boxShadow: active
                    ? `0 0 0 1px ${accent}`
                    : "none",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: active
                      ? "rgba(255,255,255,.16)"
                      : "rgba(255,255,255,.08)",
                    color: "#FFFFFF",
                    fontSize: item.icon === "$" ? 16 : 11,
                    fontWeight: 800,
                    letterSpacing:
                      item.icon === "$" ? 0 : 0.4,
                  }}
                >
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* PLATFORM FOOTER */}
      <div
        style={{
          paddingTop: 18,
          marginTop: 20,
          borderTop: "1px solid rgba(255,255,255,.12)",
          color: "#AEB4B7",
          fontSize: 11,
          lineHeight: 1.5,
          textAlign: "center",
        }}
      >
        <div style={{ color: "#D6D9DA", fontWeight: 700 }}>
          Powered by {PLATFORM_NAME}
        </div>
        <div style={{ marginTop: 3 }}>
          Business management, all in one place.
        </div>
      </div>
    </aside>
  );
}
