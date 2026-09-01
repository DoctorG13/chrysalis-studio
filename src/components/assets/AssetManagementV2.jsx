import { useEffect, useState } from "react";
import AssetCard from "./AssetCard";
import { ThriveDialog, useThriveDialog } from "../common/ThriveDialog";
import { createAssetRecord, deleteAssetRecord, getAssets, updateAssetRecord } from "../../services/assetManagementApi";

export default function AssetManagementV2({ clientId, jobId, title = "Photos & Documents" }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { confirm, dialogProps } = useThriveDialog();

  useEffect(() => {
    let active = true;
    getAssets({ clientId, jobId }).then((items) => { if (active) setAssets(items); }).catch((e) => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [clientId, jobId]);

  async function update(asset) { const saved = await updateAssetRecord(asset); setAssets((items) => items.map((item) => item.id === saved.id ? saved : item)); }
  async function remove(id) {
    const confirmed = await confirm({
      title: "Delete Asset",
      message: "Delete this asset? This cannot be undone.",
      confirmLabel: "Delete Asset",
      danger: true,
    });
    if (!confirmed) return;
    await deleteAssetRecord(id);
    setAssets((items) => items.filter((item) => item.id !== id));
  }
  async function upload(event) {
    try {
      for (const file of Array.from(event.target.files || [])) {
        const dataUrl = await readFile(file);
        const asset = await createAssetRecord({ clientId: clientId || "", jobId: jobId || "", fileName: file.name, name: file.name, title: file.name, mimeType: file.type, size: file.size, dataUrl, category: file.type.startsWith("image/") ? "Photo" : "Document", description: "" });
        setAssets((items) => [asset, ...items]);
      }
    } catch (e) { setError(e.message || "Unable to upload asset."); }
    event.target.value = "";
  }

  return <section>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
      <div><h2 style={{ margin: 0 }}>{title}</h2><p style={{ margin: "5px 0 0", color: "#707a80", fontSize: 13 }}>Upload, name and organise photos and documents.</p></div>
      <label style={{ border: "1px solid #d7dce0", borderRadius: 8, padding: "9px 14px", fontWeight: 700, cursor: "pointer" }}>+ Add Files<input type="file" multiple hidden onChange={upload} /></label>
    </div>
    {error && <p style={{ color: "#a33" }}>{error}</p>}
    {loading ? <p>Loading assets...</p> : !assets.length ? <p style={{ color: "#778087" }}>No assets uploaded yet.</p> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>{assets.map((asset) => <AssetCard key={asset.id} asset={asset} onUpdate={update} onDelete={remove} />)}</div>}
    <ThriveDialog {...dialogProps} />
  </section>;
}
function readFile(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`)); reader.readAsDataURL(file); }); }
