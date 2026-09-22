export default function BizziBuddiLogo({
  size = 72,
  dark = false,
  showWordmark = true,
  tagline = "",
  className = "",
}) {
  const navy = dark ? "#FFFFFF" : "#0F2D4A";
  const blue = "#2563EB";
  const cyan = "#00B4DB";

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: showWordmark ? 10 : 0,
        color: dark ? "#FFFFFF" : navy,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        role="img"
        aria-label="BizziBuddi logo"
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="bizziBuddiArc" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={cyan} />
            <stop offset="100%" stopColor={blue} />
          </linearGradient>
        </defs>
        <path d="M45 18 L69 40 L69 126 C69 143 78 151 94 154 L94 178 C61 176 43 157 43 127 L43 18 Z" fill={navy} />
        <path d="M91 51 A63 63 0 0 1 119 66" fill="none" stroke="url(#bizziBuddiArc)" strokeWidth="23" strokeLinecap="round" />
        <path d="M131 78 A63 63 0 0 1 137 108" fill="none" stroke="url(#bizziBuddiArc)" strokeWidth="23" strokeLinecap="round" />
        <path d="M134 125 A63 63 0 0 1 98 165" fill="none" stroke="url(#bizziBuddiArc)" strokeWidth="23" strokeLinecap="round" />
        <path d="M99 103 L99 72" fill="none" stroke={navy} strokeWidth="9" strokeLinecap="round" />
        <path d="M99 103 L123 119" fill="none" stroke={navy} strokeWidth="9" strokeLinecap="round" />
      </svg>
      {showWordmark && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: Math.max(24, size * 0.43), lineHeight: 1, fontWeight: 800, letterSpacing: "-0.055em", whiteSpace: "nowrap" }}>
            <span style={{ color: dark ? "#FFFFFF" : navy }}>Bizzi</span><span style={{ color: blue }}>Buddi</span>
          </div>
          {tagline && <div style={{ marginTop: 9, fontSize: Math.max(10, size * 0.14), fontWeight: 600, letterSpacing: ".18em", textTransform: "uppercase", color: dark ? "rgba(255,255,255,.78)" : navy, whiteSpace: "nowrap" }}>{tagline}</div>}
        </div>
      )}
    </div>
  );
}
