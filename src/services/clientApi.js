const API_BASE =
  import.meta.env.VITE_CHRYSALIS_API_URL ||
  "http://127.0.0.1:4174";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      payload?.error ||
        `Chrysalis API request failed (${response.status}).`
    );
  }

  return payload;
}

export async function getClients() {
  const payload = await request("/api/clients");
  return Array.isArray(payload?.clients)
    ? payload.clients
    : [];
}

export async function getClient(id) {
  const payload = await request(
    `/api/clients/${encodeURIComponent(id)}`
  );
  return payload.client;
}

export async function createClientRecord(client) {
  const payload = await request("/api/clients", {
    method: "POST",
    body: JSON.stringify({ client }),
  });

  return payload.client;
}

export async function updateClientRecord(client) {
  const payload = await request(
    `/api/clients/${encodeURIComponent(client.id)}`,
    {
      method: "PUT",
      body: JSON.stringify({ client }),
    }
  );

  return payload.client;
}

export async function deleteClientRecord(id) {
  await request(
    `/api/clients/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}
