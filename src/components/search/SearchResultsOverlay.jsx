export default function SearchResultsOverlay({
  query = "",
  results = [],
  onSelectClient,
}) {
  if (!query.trim()) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 95,
        left: "50%",
        transform: "translateX(-50%)",

        width: 520,
        maxHeight: 420,

        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        boxShadow: "0 12px 32px rgba(0,0,0,0.18)",

        overflowY: "auto",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #F3F4F6",
          fontWeight: 700,
          background: "#FAFAFA",
        }}
      >
        🔍 Search Results ({results.length})
      </div>

      {results.length === 0 ? (
        <div
          style={{
            padding: 16,
            color: "#777",
          }}
        >
          No matches found.
        </div>
      ) : (
        results.map((result) => (
          <div
            key={`${result.type}-${result.id}`}
            onClick={() => {
              if (result.type === "client") {
                onSelectClient?.(result.data);
              }
            }}
            style={{
              padding: 16,
              cursor: "pointer",
              borderBottom: "1px solid #F3F4F6",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F8FAFC";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#FFFFFF";
            }}
          >
            <div
              style={{
                fontWeight: 600,
              }}
            >
              {result.title}
            </div>

            <div
              style={{
                marginTop: 4,
                fontSize: 14,
                color: "#666",
              }}
            >
              {result.subtitle}
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                color: "#999",
                textTransform: "uppercase",
              }}
            >
              {result.type}
            </div>
          </div>
        ))
      )}
    </div>
  );
}