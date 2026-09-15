const ASSET_API_BASE = "http://127.0.0.1:4179/api";

async function request(path, options = {}) {
  const response = await fetch(`${ASSET_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let payload = null;
  try { payload = await response.json(); } catch { payload = null; }

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || `Asset API request failed (${response.status}).`);
  }

  return payload;
}

export async function getJobAssets(jobId) {
  const payload = await request(`/assets/job/${encodeURIComponent(jobId)}`);
  return payload.assets || [];
}

export async function getClientAssets(clientId) {
  const payload = await request(`/assets/client/${encodeURIComponent(clientId)}`);
  return payload.assets || [];
}

export async function saveAsset(asset) {
  const payload = await request(`/assets/${encodeURIComponent(asset.id)}`, {
    method: "PUT",
    body: JSON.stringify({ asset }),
  });
  return payload.asset;
}

export async function deleteAsset(assetId) {
  await request(`/assets/${encodeURIComponent(assetId)}`, { method: "DELETE" });
}
