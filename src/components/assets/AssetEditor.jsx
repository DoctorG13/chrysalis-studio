import { useEffect, useState } from "react";

export default function AssetEditor({ asset, onSave, onCancel }) {
  const [name, setName] = useState(asset?.name || asset?.title || "");
  const [description, setDescription] = useState(asset?.description || "");
  const [category, setCategory] = useState(asset?.category || "Photo");

  useEffect(() => {
    setName(asset?.name || asset?.title || "");
    setDescription(asset?.description || "");
    setCategory(asset?.category || "Photo");
  }, [asset]);

  if (!asset) return null;

  function handleSubmit(event) {
    event.preventDefault();

    onSave({
      ...asset,
      name: name.trim() || asset.fileName || "Untitled Asset",
      title: name.trim() || asset.fileName || "Untitled Asset",
      description: description.trim(),
      category,
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
      <div>
        <label style={labelStyle}>Name</label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Wedding Dress – Front"
          style={inputStyle}
          autoFocus
        />
      </div>

      <div>
        <label style={labelStyle}>Category</label>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          style={inputStyle}
        >
          <option>Photo</option>
          <option>Document</option>
          <option>Reference</option>
          <option>Sketch</option>
          <option>Other</option>
        </select>
      </div>

      <div>
        <label style={labelStyle}>Description / Notes</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={5}
          placeholder="Add notes about this asset..."
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancel} style={secondaryButtonStyle}>
          Cancel
        </button>
        <button type="submit" style={primaryButtonStyle}>
          Save Changes
        </button>
      </div>
    </form>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontSize: 12,
  fontWeight: 700,
  color: "#59636a",
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  border: "1px solid #d7dce0",
  borderRadius: 8,
  fontSize: 14,
  background: "#fff",
};

const primaryButtonStyle = {
  border: 0,
  borderRadius: 8,
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  border: "1px solid #d7dce0",
  borderRadius: 8,
  padding: "10px 16px",
  background: "#fff",
  cursor: "pointer",
};
