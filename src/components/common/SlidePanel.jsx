export default function SlidePanel({
  open,
  children,
}) {
  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.25)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .3s",
          zIndex: 999,
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 480,
          maxWidth: "100%",
          height: "100vh",
          background: "#FFF",
          transform: open
            ? "translateX(0)"
            : "translateX(100%)",
          transition: "transform .35s ease",
          boxShadow: "-10px 0 35px rgba(0,0,0,.15)",
          display: "flex",
          flexDirection: "column",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            padding: 30,
            flex: 1,
            overflowY: "auto",
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}