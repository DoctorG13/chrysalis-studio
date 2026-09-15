export default function ChrysalisActionButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  ariaLabel,
  title,
  style = {},
  variant = "default",
}) {
  const baseStyle = {
    border: variant === "accent" ? "1px solid #C96A83" : "1px solid #D7DCE0",
    background: "#FFFFFF",
    color: variant === "accent" ? "#8B1E3F" : "#30383D",
    borderRadius: 7,
    minHeight: 34,
    padding: "0 11px",
    fontSize: 12,
    fontWeight: 700,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.55 : 1,
    transition: "background 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease, box-shadow 160ms ease",
    whiteSpace: "nowrap",
    ...style,
  };

  function handleEnter(event) {
    if (disabled) return;
    event.currentTarget.style.background = "#8B1E3F";
    event.currentTarget.style.borderColor = "#8B1E3F";
    event.currentTarget.style.color = "#FFFFFF";
    event.currentTarget.style.transform = "translateY(-1px)";
    event.currentTarget.style.boxShadow = "0 3px 8px rgba(139,30,63,0.16)";
  }

  function handleLeave(event) {
    if (disabled) return;
    event.currentTarget.style.background = "#FFFFFF";
    event.currentTarget.style.borderColor = variant === "accent" ? "#C96A83" : "#D7DCE0";
    event.currentTarget.style.color = variant === "accent" ? "#8B1E3F" : "#30383D";
    event.currentTarget.style.transform = "translateY(0)";
    event.currentTarget.style.boxShadow = "none";
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      style={baseStyle}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
    </button>
  );
}
