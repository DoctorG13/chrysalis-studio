export default function Sidebar({
  currentPage,
  setCurrentPage,
}) {
  const menu = [
    { id: "studio", label: "🦋 Studio" },
    { id: "people", label: "👥 People" },
    { id: "garments", label: "👗 Garments" },
    { id: "calendar", label: "📅 Calendar" },
    { id: "finance", label: "💰 Finance" },
    { id: "reports", label: "📊 Reports" },
    { id: "settings", label: "⚙ Settings" },
  ];

  return (
    <aside
      style={{
        width: 260,
        background: "#2F3A3F",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 24,
      }}
    >
      <div>
        <div
          style={{
            marginBottom: 40,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 28,
            }}
          >
            🦋 Chrysalis
          </h1>

          <p
            style={{
              color: "#CCCCCC",
              marginTop: 10,
              lineHeight: 1.5,
            }}
          >
            Dressmaker Business
            <br />
            Operating System
          </p>
        </div>

        {menu.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "14px 16px",
              marginBottom: 8,
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 16,

              background:
                currentPage === item.id
                  ? "#F4C542"
                  : "transparent",

              color:
                currentPage === item.id
                  ? "#2F3A3F"
                  : "white",

              transition: "0.2s",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        style={{
          color: "#AAAAAA",
          fontSize: 13,
        }}
      >
        Chrysalis Studio
        <br />
        Version 2.1
      </div>
    </aside>
  );
}