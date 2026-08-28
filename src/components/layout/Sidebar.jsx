export default function Sidebar({ currentPage, setCurrentPage }) {
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
        width: 240,
        flexShrink: 0,
        boxSizing: "border-box",
        background: "#2F3A3F",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "20px 14px",
        overflowY: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <style>{`aside::-webkit-scrollbar { display: none; }`}</style>

      <div>
        <div style={{ marginBottom: 28, textAlign: "center", padding: "0 6px" }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>🦋 Chrysalis</h1>
          <p style={{ color: "#CCCCCC", margin: "8px 0 0", lineHeight: 1.35, fontSize: 12 }}>Professional Dressmaker<br />Business System</p>
        </div>

        {menu.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCurrentPage(item.id)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "11px 13px",
              marginBottom: 4,
              border: "none",
              borderRadius: 9,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: currentPage === item.id ? 700 : 500,
              background: currentPage === item.id ? "#F4C542" : "transparent",
              color: currentPage === item.id ? "#2F3A3F" : "white",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ color: "#AAAAAA", fontSize: 11, padding: "14px 6px 0" }}>
        Chrysalis Studio<br />Version 2.1
      </div>
    </aside>
  );
}
