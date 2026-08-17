const BASE_URL = "http://127.0.0.1:4180/api/timeline";

async function request(path = "", options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `Timeline request failed (${response.status})`);
  }
  return payload;
}

export async function getTimeline({ clientId = "", jobId = "" } = {}) {
  const params = new URLSearchParams();
  if (clientId) params.set("clientId", clientId);
  if (jobId) params.set("jobId", jobId);
  const suffix = params.toString() ? `?${params}` : "";
  const payload = await request(suffix);
  return payload.events || [];
}

export async function getTimelineEvent(id) {
  const payload = await request(`/${encodeURIComponent(id)}`);
  return payload.event || null;
}

export async function createTimelineEvent(event) {
  const payload = await request("", { method: "POST", body: JSON.stringify({ event }) });
  return payload.event;
}

export async function updateTimelineEvent(event) {
  const payload = await request(`/${encodeURIComponent(event.id)}`, { method: "PUT", body: JSON.stringify({ event }) });
  return payload.event;
}

export async function deleteTimelineEvent(id) {
  const payload = await request(`/${encodeURIComponent(id)}`, { method: "DELETE" });
  return payload.deleted === true;
}
