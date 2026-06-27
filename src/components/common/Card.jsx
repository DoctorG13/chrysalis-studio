export default function Card({ children, title }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
        border: "1px solid #ECECEC",
      }}
    >
      {title && (
        <h2
          style={{
            marginTop: 0,
            marginBottom: 20,
            color: "#2F3A3F",
            fontSize: 22,
          }}
        >
          {title}
        </h2>
      )}

      {children}
    </div>
  );
}