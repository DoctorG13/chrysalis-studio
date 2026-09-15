import React from "react";

export default function AppShell({
  sidebar,
  header,
  children,
  branding,
}) {
  const primary =
    branding?.primaryColour ||
    "#8B1E3F";

  const secondary =
    branding?.secondaryColour ||
    "#2F3A3F";

  const accent =
    branding?.accentColour ||
    "#C96A83";

  return (
    <div
      style={{
        "--brand-primary": primary,
        "--brand-secondary": secondary,
        "--brand-accent": accent,

        display: "flex",
        height: "100vh",
        background: "#FAF9F6",
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
        }}
      >
        {header}

        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 30,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}