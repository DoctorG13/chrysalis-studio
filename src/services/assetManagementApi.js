const ASSET_API_BASE = "";

async function request(path, options = {}) {
  const response = await fetch(`${ASSET_API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `Asset API request failed (${response.status}).`);
  }

  return payload;
}

export async function getAssets({ clientId, jobId } = {}) {
  const params = new URLSearchParams();
  if (clientId) params.set("clientId", clientId);
  if (jobId) params.set("jobId", jobId);

  const query = params.toString();
  const result = await request(`/api/assets${query ? `?${query}` : ""}`);
  return result.assets || [];
}

export async function createAssetRecord(asset) {
  const payload = {
    ...asset,
    url: asset.url || asset.dataUrl || "",
    caption: asset.caption || asset.name || asset.title || asset.fileName || "Untitled asset",
    kind: asset.kind || (asset.category === "Photo" ? "photo" : "file"),
  };

  const result = await request("/api/assets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return result.asset;
}

export async function updateAssetRecord(asset) {
  const payload = {
    ...asset,
    url: asset.url || asset.dataUrl || "",
    caption: asset.caption || asset.name || asset.title || asset.fileName || "Untitled asset",
    kind: asset.kind || (asset.category === "Photo" ? "photo" : "file"),
  };

  const result = await request(`/api/assets/${encodeURIComponent(asset.id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return result.asset;
}

export async function deleteAssetRecord(assetId) {
  await request(`/api/assets/${encodeURIComponent(assetId)}`, {
    method: "DELETE",
  });
}
