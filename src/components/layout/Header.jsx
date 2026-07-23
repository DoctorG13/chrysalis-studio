import { useState } from "react";

export default function Header({
  title = "Chrysalis Studio",
  searchQuery = "",
  onSearch,
}) {

  // no import needed

  function handleChange(event) {
  onSearch?.(event.target.value);
}

  return (
    <header
      style={{
        height: 90,
        background: "#FFFFFF",
        borderBottom: "1px solid #E8E8E8",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 32px",
        gap: 24,
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: 30,
          color: "#2F3A3F",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </h1>

      <div
        style={{
          flex: 1,
          maxWidth: 520,
          position: "relative",
        }}
      >
        <input
          type="text"
          value={searchQuery}
          onChange={handleChange}
          placeholder="Search clients, jobs, phone, email..."
          style={{
            width: "100%",
            height: 44,
            borderRadius: 12,
            border: "1px solid #D9D9D9",
            padding: "0 16px",
            fontSize: 15,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 18,
        }}
      >
        <button style={iconButton}>🔔</button>

        <button style={iconButton}>👤</button>
      </div>
    </header>
  );
}

const iconButton = {
  width: 42,
  height: 42,
  borderRadius: 10,
  border: "none",
  background: "#F7F7F7",
  cursor: "pointer",
  fontSize: 20,
};