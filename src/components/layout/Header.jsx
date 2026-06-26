export default function Header({
  title = "Studio",
  user = "Donna",
}) {
  const hour = new Date().getHours();

  let greeting = "Good evening";

  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";

  const today = new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
            fontWeight: "700",
          }}
        >
          {title}
        </h1>

        <div
  style={{
    marginTop: 6,
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  }}
>
  {greeting}, {user}. Welcome back to your studio.
</div>

        <div
          style={{
            marginTop: 2,
            fontSize: 13,
            color: "#999",
          }}
        >
          {today}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 18,
          fontSize: 22,
        }}
      >
        <button
          style={iconButton}
        >
          🔍
        </button>

        <button
          style={iconButton}
        >
          🔔
        </button>

        <button
          style={iconButton}
        >
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