export default function JobTabs({
  activeTab,
  onChange,
}) {
  const tabs = [
    {
      key: "Overview",
      label: "Overview",
      icon: "🏠",
    },
    {
      key: "Measurements",
      label: "Measurements",
      icon: "📏",
    },
    {
      key: "Payments",
      label: "Payments",
      icon: "💳",
    },
    {
      key: "Fittings",
      label: "Fittings",
      icon: "🧵",
    },
    {
      key: "Photos",
      label: "Photos",
      icon: "📷",
    },
    {
      key: "Timeline",
      label: "Timeline",
      icon: "🕒",
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 24,
      }}
    >
      {tabs.map((tab) => {
        const active =
          activeTab === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() =>
              onChange(tab.key)
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 10,
              border: active
                ? "2px solid #7B3FF2"
                : "1px solid #D8D8D8",
              background: active
                ? "#F3EEFF"
                : "#FFFFFF",
              color: active
                ? "#5B21B6"
                : "#444",
              fontWeight: active
                ? 700
                : 500,
              cursor: "pointer",
              transition: "all .2s",
            }}
          >
            <span>{tab.icon}</span>

            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}