export default function SlidePanel({
  open,
  onClose,
  children,
}) {
  return (
    <>
      <div
        onClick={open ? onClose : undefined}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(47,58,63,0.35)",
          backdropFilter: "blur(3px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .3s ease",
          zIndex: 999,
          cursor: "pointer",
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "min(1700px, 94vw)",
          maxWidth: "calc(100vw - 12px)",
          minWidth: 720,
          height: "100vh",
          background: "#FFF",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform .35s ease",
          boxShadow: "-12px 0 40px rgba(0,0,0,.18)",
          display: "flex",
          flexDirection: "column",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            padding: 34,
            flex: 1,
            minWidth: 0,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {open ? children : null}
        </div>
      </div>
    </>
  );
}
