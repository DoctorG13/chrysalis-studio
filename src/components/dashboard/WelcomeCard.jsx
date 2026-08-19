export default function WelcomeCard() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const formattedDate = now.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header style={welcomeStyle}>
      <div>
        <div style={greetingStyle}>
          <span aria-hidden="true" style={sunStyle}>☀</span>
          <h1>{greeting}, Donna</h1>
        </div>
        <div style={dateStyle}>{formattedDate}</div>
      </div>
    </header>
  );
}

const welcomeStyle = {
  display: "flex",
  alignItems: "center",
  minHeight: 76,
  padding: "4px 2px 0",
};

const greetingStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const sunStyle = {
  color: "#9A2348",
  fontSize: 30,
  lineHeight: 1,
};

const greetingStyleTitle = {};

const dateStyle = {
  marginTop: 5,
  color: "#697178",
  fontSize: 13,
};
