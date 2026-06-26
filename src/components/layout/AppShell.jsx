import React from "react";

export default function AppShell({
  sidebar,
  header,
  children,
}) {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#FAF9F6",
        overflow: "hidden",
      }}
    >
      {sidebar}

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {header}

        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "30px",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}