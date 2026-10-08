export default function BizziBuddiLogo({
  size = 72,
  dark = false,
  showWordmark = true,
  tagline = "",
  featureLine = false,
  className = "",
}) {
  const navy = dark ? "#FFFFFF" : "#0F2D4A";
  const blue = "#2563EB";
  const cyan = "#00B4DB";
  const wordSize = Math.max(20, size * 0.48);

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: showWordmark ? Math.max(9, size * 0.12) : 0,
        color: navy,
        textAlign: "center",
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
        {/* Approved BizziBuddi 'b' mark: pointed navy stem + three evenly
            spaced segments increasing in length clockwise. */}
        <path
          d="M52 17 L77 42 L77 126 C77 143 84 151 98 155 L98 181 C68 178 51 161 51 130 L51 17 Z"
          fill={navy}
        />

        {/* Approved five-piece circular colour arc. One centre, one inner radius, one outer radius. */}
        <path d="M96.08 39.48 A65 65 0 0 1 138.44 48.88 L126.26 68.38 A42 42 0 0 0 98.88 62.31 Z" fill={cyan} />
        <path d="M148.33 56.46 A65 65 0 0 1 166.16 85.00 L144.16 91.72 A42 42 0 0 0 132.64 73.28 Z" fill={blue} />
        <path d="M168.52 96.08 A65 65 0 0 1 160.29 136.50 L140.37 125.00 A42 42 0 0 0 145.69 98.88 Z" fill={blue} />
        {/* Gold segments: same ring width and curvature as the blue segments. */}
        <path d="M162.0 133.0 A65 65 0 0 1 138.9 159.7 L124.6 139.5 A42 42 0 0 0 141.5 122.7 Z" fill="#F4B942" />
        <path d="M136.5 160.3 A65 65 0 0 1 107.4 168.9 L106.2 145.9 A42 42 0 0 0 125.0 140.4 Z" fill="#F4B942" />

        {/* Clock hands — deliberately no centre circle. */}
        <path
          d="M104 104 L104 73"
          fill="none"
          stroke={navy}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M104 104 L128 121"
          fill="none"
          stroke={navy}
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>

      {showWordmark && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "flex-start",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: wordSize,
              lineHeight: 0.94,
              fontWeight: 800,
              letterSpacing: "-0.065em",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ color: dark ? "#FFFFFF" : navy }}>Bizzi</span>
            <span style={{ color: blue }}>Buddi</span>
            <sup
              style={{
                marginLeft: 3,
                marginTop: 1,
                fontSize: Math.max(7, wordSize * 0.17),
                lineHeight: 1,
                color: navy,
                letterSpacing: 0,
              }}
            >
              ™
            </sup>
          </div>

          {tagline && (
            <div
              style={{
                marginTop: Math.max(8, size * 0.09),
                color: navy,
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: Math.max(9, size * 0.105),
                lineHeight: 1.2,
                fontWeight: 600,
                letterSpacing: ".16em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {tagline}
            </div>
          )}

          {featureLine && (
            <>
              <div
                aria-hidden="true"
                style={{
                  width: Math.max(42, size * 0.42),
                  height: 2,
                  margin:
                    Math.max(11, size * 0.12) +
                    "px auto " +
                    Math.max(10, size * 0.11) +
                    "px",
                  background: cyan,
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: Math.max(9, size * 0.08),
                  color: navy,
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: Math.max(8, size * 0.095),
                  fontWeight: 500,
                  letterSpacing: ".13em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                <span>Organise</span>
                <span style={{ color: cyan }}>│</span>
                <span>Plan</span>
                <span style={{ color: cyan }}>│</span>
                <span>Do</span>
                <span style={{ color: cyan }}>│</span>
                <span>Grow</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
