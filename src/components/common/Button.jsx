export default function Button({
  children,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "#F4C542",
        color: "#2F3A3F",
        border: "none",
        borderRadius: 10,
        padding: "12px 22px",
        fontSize: 16,
        fontWeight: "600",
        cursor: "pointer",
        transition: "0.2s",
      }}
    >
      {children}
    </button>
  );
}