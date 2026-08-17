import { useEffect, useState } from "react";
import AssetCard from "./AssetCard";
import {
  createAssetRecord,
  deleteAssetRecord,
  getAssets,
  updateAssetRecord,
} from "../../services/assetManagementApi";

export default function AssetManagement({ clientId, jobId, title = "Photos & Documents" }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const result = await getAssets({ clientId, jobId });
        if (active) setAssets(result);
      } catch (loadError) {
        if (active) setError(loadError.message || "Unable to load assets.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [clientId, jobId]);

  async function handleUpdate(asset) {
    const saved = await updateAssetRecord(asset);
    setAssets((current) => current.map((item) => item.id === saved.id ? saved : item));
  }

  async function handleDelete(assetId) {
    if (!window.confirm("Delete this asset? This cannot be undone.")) return;
    await deleteAssetRecord(assetId);
    setAssets((current) => current.filter((item) => item.id !== assetId));
  }

  async function handleUpload(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setError("");

    try {
      const created = [];
      for (const file of files) {
        const dataUrl = await readFile(file);
        const asset = await createAssetRecord({
          clientId: clientId || "",
          jobId: jobId || "",
          fileName: file.name,
          name: file.name,
          title: file.name,
          mimeType: file.type,
          size: file.size,
          dataUrl,
          category: file.type.startsWith("image/") ? "Photo" : "Document",
          description: "",
        });
        created.push(asset);
      }
      setAssets((current) => [...created, ...current]);
    } catch (uploadError) {
      setError(uploadError.message || "Unable to upload asset.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <section>
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <p style={{ margin: "5px 0 0", color: "#707a80", fontSize: 13 }}>
            Upload photos and files, then give them meaningful names and notes.
          </p>
        </div>
        <label style={uploadButtonStyle}>
          + Add Files
          <input type="file" multiple hidden onChange={handleUpload} />
        </label>
      </div>

      {error && <div style={errorStyle}>{error}</div>}
      {loading && <p>Loading assets...</p>}
      {!loading && !assets.length && <p style={{ color: "#778087" }}>No assets uploaded yet.</p>}

      {!loading && assets.length > 0 && (
        <div style={gridStyle}>
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 18,
};

const uploadButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "9px 14px",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 700,
  border: "1px solid #d7dce0",
  background: "#fff",
};

const errorStyle = {
  padding: 12,
  marginBottom: 16,
  borderRadius: 8,
  background: "#fff4f4",
  border: "1px solid #edcaca",
  color: "#a33",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: 16,
};
