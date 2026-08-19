export default function WelcomeCard() {
  const now = new Date();
  const hour = now.getHours();

  const greeting =
    hour < 12
      ? "Good Morning"
      : hour < 18
      ? "Good Afternoon"
      : "Good Evening";

  const formattedDate = now.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header style={welcomeStyle}>
      <div style={greetingStyle}>
        <span aria-hidden="true">☀️</span>
        <strong>{greeting}, Donna</strong>
      </div>
      <span style={dateStyle}>{formattedDate}</span>
    </header>
  );
}

const welcomeStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  minHeight: 58,
  padding: "0 4px",
};

const greetingStyle = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  color: "#2F3A3F",
  fontSize: 21,
  letterSpacing: "-0.2px",
};

const dateStyle = {
  color: "#6B7280",
  fontSize: 13,
  whiteSpace: "nowrap",
};
