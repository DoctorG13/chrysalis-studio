import { useEffect } from "react";

const PANEL_WIDTH = 900;

export default function SlidePanel({
  open,
  onClose,
  children,
}) {
  useEffect(() => {
    if (!open) return undefined;

    document.body.classList.add(
      "chrysalis-slide-panel-open"
    );

    return () => {
      document.body.classList.remove(
        "chrysalis-slide-panel-open"
      );
    };
  }, [open]);

  return (
    <>
      <style>{`
        body.chrysalis-slide-panel-open [role="status"][aria-live="polite"] {
          position: fixed !important;
          left: calc(100% - min(${PANEL_WIDTH}px, 100vw) / 2) !important;
          top: 50% !important;
          right: auto !important;
          bottom: auto !important;
          margin: 0 !important;
          transform: translate(-50%, -50%) !important;
          width: min(430px, calc(min(${PANEL_WIDTH}px, 100vw) - 48px)) !important;
          max-width: calc(min(${PANEL_WIDTH}px, 100vw) - 48px) !important;
        }
      `}</style>

      <div
        onClick={open ? onClose : undefined}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(47,58,63,0.35)",
          backdropFilter: "blur(2px)",
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
          width: PANEL_WIDTH,
          maxWidth: "100%",
          height: "100vh",
          background: "#FFF",
          transform: open ? "translateX(0)" : "translateX(100%)",
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
            minWidth: 0,
            overflowY: "auto",
          }}
        >
          {open ? children : null}
        </div>
      </div>
    </>
  );
}
