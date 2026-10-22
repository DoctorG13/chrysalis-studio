import React from "react";

export default function AppShell({
  sidebar,
  header,
  children,
  branding,
}) {
  const primary = branding?.primaryColour || "#0F2D4A";
  const secondary = branding?.secondaryColour || "#142B3D";
  const accent = branding?.accentColour || "#2563EB";

  return (
    <div
      style={{
        "--brand-primary": primary,
        "--brand-secondary": secondary,
        "--brand-accent": accent,
        "--bb-navy": "#0F2D4A",
        "--bb-blue": "#2563EB",
        "--bb-cyan": "#00A9D2",
        "--bb-ink": "#142B3D",
        "--bb-muted": "#526779",
        "--bb-border": "#C8D5E2",
        display: "flex",
        height: "100vh",
        background: "#F1F6FB",
        color: secondary,
        overflow: "hidden",
      }}
    >
      {sidebar}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          background: "#F1F6FB",
        }}
      >
        {header}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 30,
            background: "#F1F6FB",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
