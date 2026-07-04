export default function AppointmentTabs({
  activeTab,
  onChange,
}) {
  const tabs = [
    "Overview",
    "Notes",
    "Documents",
    "Timeline",
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        marginBottom: 24,
        borderBottom: "1px solid #ddd",
        paddingBottom: 12,
        flexWrap: "wrap",
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border:
              activeTab === tab
                ? "2px solid #7B3FF2"
                : "1px solid #ddd",

            background:
              activeTab === tab
                ? "#F3EEFF"
                : "#FFFFFF",

            cursor: "pointer",

            fontWeight:
              activeTab === tab
                ? 700
                : 500,
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}