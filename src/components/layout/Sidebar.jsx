const PLATFORM_NAME = "THRIVE";
const PLATFORM_PROMISE =
  "Streamline your business. Simplify your work.";

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
  isDemoMode = false,
  onToggleDemo,
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

  const slogan =
    branding?.slogan?.trim() || "";

  return (
    <aside
      style={{
        width: 240,
        height: "100vh",
        background: secondary,
        color: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        padding: "16px 14px",
        flexShrink: 0,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* =====================================================
          TOP / NAVIGATION AREA
      ====================================================== */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* THRIVE PLATFORM BRAND */}
        <div
          style={{
            flexShrink: 0,
            paddingBottom: 14,
            marginBottom: 14,
            borderBottom:
              "1px solid rgba(255,255,255,.14)",
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
              <span
                style={{
                  transform: "rotate(-45deg)",
                }}
              >
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
              textAlign: "center",
            }}
          >
            <div>
              {PLATFORM_PROMISE.split(" ")[0]
                ? "Streamline your business."
                : ""}
            </div>
            <div>Simplify your work.</div>
          </div>
        </div>

        {/* CUSTOMER BRAND */}
        <div
          style={{
            flexShrink: 0,
            marginBottom: 14,
            textAlign: "center",
          }}
        >
          {logo ? (
            <div
              style={{
                width: "100%",
                height: 52,
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
                  maxWidth: "170px",
                  maxHeight: "50px",
                  objectFit: "contain",
                }}
              />
            </div>
          ) : (
            <div
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
                boxShadow:
                  `0 0 0 1px ${accent}`,
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
              fontSize: 16,
              fontWeight: 700,
              lineHeight: 1.2,
              overflowWrap: "anywhere",
              textWrap: "balance",
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
                maxWidth: 190,
                marginLeft: "auto",
                marginRight: "auto",
                textAlign: "center",
              }}
            >
              {slogan}
            </div>
          )}
        </div>

        {/* MAIN NAVIGATION
            This section can scroll if the viewport
            becomes too short. */}
        <nav
          aria-label="Main navigation"
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          
          }}
        >
          {MENU_ITEMS.map((item) => {
            const active =
              currentPage === item.id;

            return (
              <button
                key={item.id}
                type="button"
                aria-current={
                  active ? "page" : undefined
                }
                onClick={() =>
                  setCurrentPage(item.id)
                }
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  textAlign: "left",
                  padding: "8px 10px",
                  marginBottom: 3,
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: active
                    ? 700
                    : 500,
                  background: active
                    ? primary
                    : "transparent",
                  color: "#FFFFFF",
                  transition:
                    "background .2s ease, color .2s ease",
                  boxShadow: active
                    ? `0 0 0 1px ${accent}`
                    : "none",
                  boxSizing: "border-box",
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
                    fontSize:
                      item.icon === "$"
                        ? 16
                        : 11,
                    fontWeight: 800,
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

      <div
        style={{
          flexShrink: 0,
          paddingTop: 10,
          borderTop: "1px solid rgba(255,255,255,.12)",
          marginTop: 8,
        }}
      >
        <div
          style={{
            color: "#AEB4B7",
            fontSize: 9,
            lineHeight: 1.35,
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: "#D6D9DA",
              fontWeight: 700,
            }}
          >
            Powered by {PLATFORM_NAME}
          </div>
          <div style={{ marginTop: 2 }}>
            Business management, all in one place.
          </div>
          <div
            style={{
              marginTop: 4,
              color: "#858D91",
              fontSize: 8,
            }}
          >
            © {new Date().getFullYear()} {PLATFORM_NAME}. All rights reserved.
          </div>
        </div>
      </div>
    </aside>
  );
}
