import { useEffect, useRef, useState } from "react";

import Button from "../common/Button";
import { deleteAsset, getClientAssets, saveAsset } from "../../services/assetApi";

export default function AssetSection({ clientId }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const result = await getClientAssets(clientId);
        if (active) setAssets(result);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load client assets.");
      } finally {
        if (active) setLoading(false);
      }
    }
    if (clientId) load();
    return () => { active = false; };
  }, [clientId]);

  async function handleFiles(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    setError("");
    try {
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is larger than 5 MB.`);
        }
        const url = await readFile(file);
        const asset = await saveAsset({
          id: crypto.randomUUID(),
          clientId,
          jobId: "",
          kind: file.type.startsWith("image/") ? "photo" : "file",
          caption: file.name,
          date: new Date().toLocaleDateString("en-AU"),
          url,
          fileName: file.name,
          mimeType: file.type,
        });
        setAssets((current) => [asset, ...current]);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save asset.");
    }
  }

  async function handleDelete(asset) {
    if (!window.confirm(`Delete "${asset.caption || "this file"}"?`)) return;
    try {
      await deleteAsset(asset.id);
      setAssets((current) => current.filter((item) => item.id !== asset.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete asset.");
    }
  }

  return (
    <div style={{ padding: 4 }}>
      <input ref={inputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleFiles} style={{ display: "none" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, color: "#777" }}>Photos, documents and other client files.</div>
        </div>
        <Button onClick={() => inputRef.current?.click()}>+ Add Files</Button>
      </div>

      {error && <div style={errorStyle}>{error}</div>}
      {loading ? <div style={emptyStyle}>Loading assets…</div> : null}
      {!loading && assets.length === 0 ? <div style={emptyStyle}>No client files yet.</div> : null}

      {!loading && assets.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
          {assets.map((asset) => (
            <div key={asset.id} style={cardStyle}>
              {asset.kind === "photo" && asset.url ? (
                <img src={asset.url} alt={asset.caption} style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, background: "#F8F9FA" }}>📄</div>
              )}
              <div style={{ padding: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.caption}</div>
                <button type="button" onClick={() => handleDelete(asset)} style={deleteButtonStyle}>🗑 Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

const emptyStyle = { padding: 20, borderRadius: 12, background: "#F8F9FA", border: "1px solid #E8EAED", textAlign: "center", color: "#888", fontSize: 13 };
const errorStyle = { marginBottom: 12, padding: 10, borderRadius: 8, background: "#FEE2E2", color: "#B91C1C", fontSize: 13 };
const cardStyle = { border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", background: "#FFFFFF" };
const deleteButtonStyle = { marginTop: 10, border: "1px solid #FCA5A5", color: "#B91C1C", background: "#FFF7F7", borderRadius: 7, padding: "6px 9px", fontWeight: 700, cursor: "pointer" };
