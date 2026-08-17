import { useEffect, useRef, useState } from "react";

import Button from "../common/Button";
import { deleteAsset, getJobAssets, saveAsset } from "../../services/assetApi";

export default function JobPhotos({ job, onAddPhoto, onOpenPhoto, onEditPhoto, onDeletePhoto }) {
  const [assets, setAssets] = useState([]);
  const loadedRef = useRef(false);
  const lastPropSignature = useRef("");
  const syncingRef = useRef(false);

  const propPhotos = Array.isArray(job?.photos) ? job.photos : [];
  const propSignature = JSON.stringify(propPhotos);

  useEffect(() => {
    let active = true;
    loadedRef.current = false;
    lastPropSignature.current = propSignature;
    async function load() {
      try {
        const stored = await getJobAssets(job.id);
        if (!active) return;
        setAssets(stored);
      } catch (error) {
        console.error("Unable to load job assets from SQLite.", error);
        if (active) setAssets(propPhotos);
      } finally {
        if (active) {
          loadedRef.current = true;
          lastPropSignature.current = JSON.stringify(propPhotos);
        }
      }
    }
    if (job?.id) load();
    return () => { active = false; };
  }, [job?.id]);

  useEffect(() => {
    if (!loadedRef.current || syncingRef.current || propSignature === lastPropSignature.current) return;

    let active = true;
    async function sync() {
      syncingRef.current = true;
      const previousIds = new Set(assets.map((asset) => asset.id));
      const nextIds = new Set(propPhotos.map((photo) => photo.id));
      try {
        for (const asset of assets) {
          if (!nextIds.has(asset.id)) await deleteAsset(asset.id);
        }
        const saved = [];
        for (const photo of propPhotos) {
          saved.push(await saveAsset({
            ...photo,
            id: photo.id || crypto.randomUUID(),
            clientId: job.clientId,
            jobId: job.id,
            kind: photo.kind || "photo",
          }));
        }
        if (active) setAssets(saved);
        lastPropSignature.current = propSignature;
      } catch (error) {
        console.error("Unable to save job assets to SQLite.", error);
      } finally {
        syncingRef.current = false;
      }
      void previousIds;
    }
    sync();
    return () => { active = false; };
  }, [propSignature, job?.id, job?.clientId]);

  const photos = assets.length > 0 || loadedRef.current ? assets : propPhotos;

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 18, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#8B1E3F", marginBottom: 5 }}>Photos & Assets</div>
          <div style={{ fontSize: 14, color: "#777" }}>Garment photos and visual references for this job.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ padding: "5px 10px", borderRadius: 999, background: photos.length > 0 ? "#EDE9FE" : "#F3F4F6", color: photos.length > 0 ? "#6D28D9" : "#666", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>{photos.length} {photos.length === 1 ? "asset" : "assets"}</div>
          {onAddPhoto && <Button onClick={onAddPhoto}>+ Add Photos</Button>}
        </div>
      </div>

      {photos.length === 0 ? <EmptyState onAddPhoto={onAddPhoto} /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 18 }}>
          {photos.map((photo, index) => (
            <PhotoCard key={photo.id || `photo-${index}`} photo={photo} onOpen={() => onOpenPhoto?.(photo)} onEdit={() => onEditPhoto?.(photo)} onDelete={() => onDeletePhoto?.(photo)} />
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoCard({ photo, onOpen, onEdit, onDelete }) {
  const caption = photo?.caption || "Untitled photo";
  const date = photo?.date || "";
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
      <div onClick={onOpen} style={{ width: "100%", height: 220, background: "#F3F4F6", overflow: "hidden", cursor: onOpen ? "pointer" : "default" }}>
        {photo?.url ? <img src={photo.url} alt={caption} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 32 }}>📷</div>}
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#2F3A3F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{caption}</div>
        {date && <div style={{ marginTop: 6, fontSize: 12, color: "#777" }}>📅 {formatDate(date)}</div>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {onOpen && <button type="button" onClick={onOpen} style={secondaryButtonStyle}>View</button>}
          {onEdit && <button type="button" onClick={onEdit} style={secondaryButtonStyle}>✎ Edit</button>}
          {onDelete && <button type="button" onClick={onDelete} style={deleteButtonStyle}>🗑 Delete</button>}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onAddPhoto }) {
  return (
    <div style={{ padding: 30, borderRadius: 14, background: "#F8F9FA", border: "1px solid #E8EAED", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, margin: "0 auto 14px", borderRadius: 16, background: "#F1F3F5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>📷</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#555", marginBottom: 6 }}>No photos yet</div>
      <div style={{ maxWidth: 420, margin: "0 auto 18px", fontSize: 13, lineHeight: 1.5, color: "#888" }}>Add photos of the garment, fittings, alterations or other useful visual references for this job.</div>
      {onAddPhoto && <Button onClick={onAddPhoto}>+ Add First Photo</Button>}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/");
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (!Number.isNaN(date.getTime())) return date.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

const secondaryButtonStyle = { border: "1px solid #D9DDE1", background: "#FFFFFF", color: "#2F3A3F", borderRadius: 8, padding: "7px 11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };
const deleteButtonStyle = { ...secondaryButtonStyle, border: "1px solid #FCA5A5", color: "#B91C1C", background: "#FFF7F7" };
