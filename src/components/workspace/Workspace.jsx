export default function Workspace({
  header,
  sidebar,
  children,
  footer,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 20,
      }}
    >
      {header && (
        <div>
          {header}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: 24,
          flex: 1,
          minHeight: 0,
        }}
      >
        <aside
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 20,
            overflow: "auto",
          }}
        >
          {sidebar}
        </aside>

        <main
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 20,
            overflow: "auto",
          }}
        >
          {children}
        </main>
      </div>

      {footer && (
        <div>
          {footer}
        </div>
      )}
    </div>
  );
}