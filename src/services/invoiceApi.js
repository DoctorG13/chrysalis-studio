const BASE_URL = "http://127.0.0.1:4181/api/invoices";

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
    throw new Error(payload.error || `Invoice request failed (${response.status})`);
  }
  return payload;
}

export async function getInvoices({ clientId = "", jobId = "" } = {}) {
  const params = new URLSearchParams();
  if (clientId) params.set("clientId", clientId);
  if (jobId) params.set("jobId", jobId);
  const suffix = params.toString() ? `?${params}` : "";
  const payload = await request(suffix);
  return payload.invoices || [];
}

export async function getInvoice(id) {
  const payload = await request(`/${encodeURIComponent(id)}`);
  return payload.invoice || null;
}

export async function createInvoice(invoice) {
  const payload = await request("", { method: "POST", body: JSON.stringify({ invoice }) });
  return payload.invoice;
}

export async function updateInvoice(invoice) {
  const payload = await request(`/${encodeURIComponent(invoice.id)}`, { method: "PUT", body: JSON.stringify({ invoice }) });
  return payload.invoice;
}

export async function deleteInvoice(id) {
  const payload = await request(`/${encodeURIComponent(id)}`, { method: "DELETE" });
  return payload.deleted === true;
}
