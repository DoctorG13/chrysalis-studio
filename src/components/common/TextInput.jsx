export default function TextInput({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  disabled = false,
}) {
  const isDate = type === "date";
  const isNumber = type === "number";
  const isEmail = type === "email";
  const isTel = type === "tel";

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

      <div
        style={{
          position: "relative",
        }}
      >
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px 14px",
            paddingRight: isDate ? 44 : 14,
            border: "1px solid #DDD",
            borderRadius: 10,
            fontSize: 16,
            outline: "none",
            backgroundColor: disabled ? "#F5F5F5" : "#FFF",
            color: "#2F3A3F",
            cursor: disabled ? "not-allowed" : "text",
          }}
        />

        {isDate && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              fontSize: 18,
            }}
          >
            📅
          </span>
        )}
      </div>
    </div>
  );
}
