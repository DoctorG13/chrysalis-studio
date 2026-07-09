export default function Header({
  title = "Chrysalis Studio",
}) {
  return (
    <header
      style={{
        height: 90,
        background: "#FFFFFF",
        borderBottom: "1px solid #E8E8E8",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 32px",
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: 30,
            color: "#2F3A3F",
            fontWeight: 700,
          }}
        >
          {title}
        </h1>
      </div>

      <div
        style={{
          display: "flex",
          gap: 18,
        }}
      >
        <button style={iconButton}>
          🔍
        </button>

        <button style={iconButton}>
          🔔
        </button>

        <button style={iconButton}>
          👤
        </button>
      </div>
    </header>
  );
}

const iconButton = {
  width: 42,
  height: 42,
  borderRadius: 10,
  border: "none",
  background: "#F7F7F7",
  cursor: "pointer",
  fontSize: 20,
};