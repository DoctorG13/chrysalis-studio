const ASSET_API_BASE = "http://127.0.0.1:4179";

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
  const result = await request("/api/assets", {
    method: "POST",
    body: JSON.stringify(asset),
  });
  return result.asset;
}

export async function updateAssetRecord(asset) {
  const result = await request(`/api/assets/${asset.id}`, {
    method: "PUT",
    body: JSON.stringify(asset),
  });
  return result.asset;
}

export async function deleteAssetRecord(assetId) {
  await request(`/api/assets/${assetId}`, {
    method: "DELETE",
  });
}
