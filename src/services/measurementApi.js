const MEASUREMENT_API_BASE = "/api";

async function request(path, options = {}) {
  const response = await fetch(`${MEASUREMENT_API_BASE}${path}`, {
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
        `Measurement API request failed (${response.status}).`
    );
  }

  return payload;
}

export async function getMeasurement(jobId) {
  const payload = await request(
    `/measurements/${encodeURIComponent(jobId)}`
  );

  return payload.measurement || null;
}

export async function saveMeasurement(measurement) {
  const payload = await request(
    `/measurements/${encodeURIComponent(measurement.jobId)}`,
    {
      method: "PUT",
      body: JSON.stringify({ measurement }),
    }
  );

  return payload.measurement;
}

export async function deleteMeasurement(jobId) {
  await request(
    `/measurements/${encodeURIComponent(jobId)}`,
    { method: "DELETE" }
  );
}
