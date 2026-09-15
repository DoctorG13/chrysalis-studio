import { useEffect, useRef, useState } from "react";

const OVERLAY_STYLE = {
  position: "fixed",
  inset: 0,
  zIndex: 10000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  background: "rgba(20, 22, 24, 0.52)",
  backdropFilter: "blur(2px)",
};

const DIALOG_STYLE = {
  width: "min(520px, calc(100vw - 48px))",
  maxHeight: "calc(100vh - 48px)",
  overflow: "auto",
  border: "1px solid #D9DDE0",
  borderRadius: 16,
  background: "#FFFFFF",
  boxShadow: "0 24px 70px rgba(20, 22, 24, 0.22)",
  fontFamily: "Georgia, 'Times New Roman', serif",
};

const HEADER_STYLE = {
  padding: "22px 24px 10px",
};

const EYEBROW_STYLE = {
  marginBottom: 6,
  color: "#8B1E3F",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 1.1,
  textTransform: "uppercase",
};

const TITLE_STYLE = {
  margin: 0,
  color: "#1F2A2E",
  fontSize: 24,
  lineHeight: 1.15,
};

const BODY_STYLE = {
  padding: "0 24px 18px",
  color: "#4F5A5F",
  fontSize: 15,
  lineHeight: 1.55,
};

const MESSAGE_STYLE = {
  margin: 0,
  whiteSpace: "pre-line",
};

const INPUT_STYLE = {
  width: "100%",
  boxSizing: "border-box",
  marginTop: 16,
  padding: "12px 13px",
  border: "1px solid #C9D0D4",
  borderRadius: 9,
  outline: "none",
  background: "#FFFFFF",
  color: "#1F2A2E",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: 15,
};

const FOOTER_STYLE = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  padding: "14px 24px 22px",
  borderTop: "1px solid #ECEEEF",
  background: "#FAFAFA",
};

const BUTTON_STYLE = {
  minWidth: 96,
  height: 42,
  padding: "0 16px",
  border: "1px solid #D4DADF",
  borderRadius: 9,
  background: "#FFFFFF",
  color: "#1F2A2E",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
};

const PRIMARY_BUTTON_STYLE = {
  ...BUTTON_STYLE,
  borderColor: "#8B1E3F",
  background: "#8B1E3F",
  color: "#FFFFFF",
};

const DANGER_BUTTON_STYLE = {
  ...PRIMARY_BUTTON_STYLE,
  borderColor: "#B42318",
  background: "#B42318",
};

export function useThriveDialog() {
  const resolverRef = useRef(null);
  const [dialog, setDialog] = useState({
    open: false,
    mode: "confirm",
    title: "",
    message: "",
    defaultValue: "",
    inputValue: "",
    confirmLabel: "Continue",
    cancelLabel: "Cancel",
    danger: false,
    inputLabel: "",
  });

  function finish(value) {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setDialog((current) => ({ ...current, open: false }));
    resolver?.(value);
  }

  function confirm({
    title,
    message,
    confirmLabel = "Continue",
    cancelLabel = "Cancel",
    danger = false,
  }) {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        open: true,
        mode: "confirm",
        title,
        message,
        defaultValue: "",
        inputValue: "",
        confirmLabel,
        cancelLabel,
        danger,
        inputLabel: "",
      });
    });
  }

  function prompt({
    title,
    message,
    defaultValue = "",
    confirmLabel = "Save",
    cancelLabel = "Cancel",
    inputLabel = "",
  }) {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        open: true,
        mode: "prompt",
        title,
        message,
        defaultValue,
        inputValue: defaultValue,
        confirmLabel,
        cancelLabel,
        danger: false,
        inputLabel,
      });
    });
  }

  function cancel() {
    finish(dialog.mode === "prompt" ? null : false);
  }

  function submit() {
    finish(
      dialog.mode === "prompt"
        ? dialog.inputValue
        : true
    );
  }

  const dialogProps = {
    ...dialog,
    onCancel: cancel,
    onConfirm: submit,
    onInputChange: (value) =>
      setDialog((current) => ({
        ...current,
        inputValue: value,
      })),
  };

  return {
    confirm,
    prompt,
    dialogProps,
  };
}

export function ThriveDialog({
  open,
  mode = "confirm",
  title,
  message,
  inputValue = "",
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  danger = false,
  inputLabel = "",
  onCancel,
  onConfirm,
  onInputChange,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel?.();
        return;
      }

      if (
        event.key === "Enter" &&
        mode === "prompt" &&
        event.target?.tagName !== "TEXTAREA"
      ) {
        event.preventDefault();
        onConfirm?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, [open, mode, onCancel, onConfirm]);

  useEffect(() => {
    if (!open || mode !== "prompt") return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open, mode]);

  if (!open) return null;

  return (
    <div
      style={OVERLAY_STYLE}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel?.();
        }
      }}
    >
      <div
        style={DIALOG_STYLE}
        role="dialog"
        aria-modal="true"
        aria-labelledby="thrive-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div style={HEADER_STYLE}>
          <div style={EYEBROW_STYLE}>
            THRIVE
          </div>
          <h2
            id="thrive-dialog-title"
            style={TITLE_STYLE}
          >
            {title}
          </h2>
        </div>

        <div style={BODY_STYLE}>
          <p style={MESSAGE_STYLE}>{message}</p>

          {mode === "prompt" && (
            <>
              {inputLabel && (
                <label
                  htmlFor="thrive-dialog-input"
                  style={{
                    display: "block",
                    marginTop: 16,
                    color: "#2F3A3F",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {inputLabel}
                </label>
              )}

              <input
                ref={inputRef}
                id="thrive-dialog-input"
                type="text"
                value={inputValue}
                onChange={(event) =>
                  onInputChange?.(event.target.value)
                }
                style={INPUT_STYLE}
                aria-label={inputLabel || title}
              />
            </>
          )}
        </div>

        <div style={FOOTER_STYLE}>
          <button
            type="button"
            onClick={onCancel}
            style={BUTTON_STYLE}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            style={
              danger
                ? DANGER_BUTTON_STYLE
                : PRIMARY_BUTTON_STYLE
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
