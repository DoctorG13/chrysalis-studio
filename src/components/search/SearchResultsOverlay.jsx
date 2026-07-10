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
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        marginBottom: 20,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #F3F4F6",
          fontWeight: 700,
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
              borderBottom: "1px solid #F5F5F5",
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
                color: "#666",
                fontSize: 14,
                marginTop: 4,
              }}
            >
              {result.subtitle}
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 12,
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