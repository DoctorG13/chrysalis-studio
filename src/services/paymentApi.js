const PAYMENT_API_BASE = "http://127.0.0.1:4178/api";

async function request(path, options = {}) {
  const response = await fetch(`${PAYMENT_API_BASE}${path}`, {
    ...options,
    headers: {
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

  if (!response.ok || payload?.ok === false) {
    throw new Error(
      payload?.error ||
        `Payment API request failed (${response.status}).`
    );
  }

  return payload;
}

export async function getPayments(jobId) {
  const payload = await request(
    `/payments/job/${encodeURIComponent(jobId)}`
  );

  return payload.payments || [];
}

export async function savePayment(payment) {
  const hasId = Boolean(payment.id);
  const path = hasId
    ? `/payments/${encodeURIComponent(payment.id)}`
    : "/payments";

  const payload = await request(path, {
    method: hasId ? "PUT" : "POST",
    body: JSON.stringify({ payment }),
  });

  return payload.payment;
}

export async function deletePayment(paymentId) {
  await request(
    `/payments/${encodeURIComponent(paymentId)}`,
    { method: "DELETE" }
  );
}
