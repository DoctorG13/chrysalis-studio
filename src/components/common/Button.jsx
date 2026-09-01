export default function Button({
  children,
  onClick,
  type = "button",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        background:
          "var(--brand-primary, #8B1E3F)",
        color: "#FFFFFF",
        border: "none",
        borderRadius: 10,
        padding: "12px 22px",
        fontSize: 16,
        fontWeight: 600,
        cursor: "pointer",
        transition:
          "opacity 0.2s, transform 0.2s",
      }}
    >
      {children}
    </button>
  );
}