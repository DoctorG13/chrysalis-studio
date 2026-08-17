import { useState } from "react";
import AssetEditor from "./AssetEditor";
import SlidePanel from "../common/SlidePanel";

export default function AssetCard({ asset, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);

  const displayName = asset.name || asset.title || asset.fileName || "Untitled Asset";
  const category = asset.category || "Photo";
  const description = asset.description || "";
  const source = asset.url || asset.dataUrl || asset.src || "";

  async function handleSave(nextAsset) {
    await onUpdate(nextAsset);
    setEditing(false);
  }

  return (
    <>
      <article style={cardStyle}>
        {source ? (
          <img src={source} alt={displayName} style={imageStyle} />
        ) : (
          <div style={placeholderStyle}>📎</div>
        )}

        <div style={{ padding: 14 }}>
          <div style={categoryStyle}>{category}</div>
          <h3 style={titleStyle}>{displayName}</h3>
          {description && <p style={descriptionStyle}>{description}</p>}

          <div style={actionsStyle}>
            <button type="button" onClick={() => setEditing(true)} style={buttonStyle}>
              ✏️ Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(asset.id)}
              style={{ ...buttonStyle, color: "#a33" }}
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      </article>

      <SlidePanel open={editing} onClose={() => setEditing(false)}>
        <div style={{ padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>Edit Asset</h2>
          <AssetEditor
            asset={asset}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        </div>
      </SlidePanel>
    </>
  );
}

const cardStyle = {
  overflow: "hidden",
  border: "1px solid #e2e6e9",
  borderRadius: 10,
  background: "#fff",
};

const imageStyle = {
  display: "block",
  width: "100%",
  height: 180,
  objectFit: "cover",
  background: "#f5f6f7",
};

const placeholderStyle = {
  height: 180,
  display: "grid",
  placeItems: "center",
  background: "#f5f6f7",
  fontSize: 42,
};

const categoryStyle = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  color: "#7a858c",
};

const titleStyle = {
  margin: "5px 0 6px",
  fontSize: 16,
  color: "#2f3a3f",
};

const descriptionStyle = {
  margin: 0,
  fontSize: 13,
  lineHeight: 1.5,
  color: "#68737a",
};

const actionsStyle = {
  display: "flex",
  gap: 8,
  marginTop: 14,
};

const buttonStyle = {
  border: "1px solid #d7dce0",
  borderRadius: 7,
  background: "#fff",
  padding: "7px 10px",
  fontSize: 12,
  cursor: "pointer",
};
