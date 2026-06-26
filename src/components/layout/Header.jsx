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
        background: "#FFFFFF",
        borderBottom: "1px solid #E5E5E5",
        padding: "20px 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            color: "#2F3A3F",
            fontSize: 30,
          }}
        >
          🦋 {title}
        </h1>

        <p
          style={{
            margin: "8px 0 0 0",
            color: "#777",
          }}
        >
          {greeting}, {user}
        </p>
      </div>

      <div
        style={{
          textAlign: "right",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            color: "#2F3A3F",
          }}
        >
          {today}
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 20,
          }}
        >
          🔍 &nbsp; 🔔 &nbsp; 👤
        </div>
      </div>
    </header>
  );
}