export default function TextInput({
  label,
  value,
  onChange,
  placeholder = "",
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        marginBottom: 20,
      }}
    >
      <label
        style={{
          fontSize: 14,
          color: "#666",
          fontWeight: 600,
        }}
      >
        {label}
      </label>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "12px 14px",
          border: "1px solid #DDD",
          borderRadius: 10,
          fontSize: 16,
          outline: "none",
        }}
      />
    </div>
  );
}