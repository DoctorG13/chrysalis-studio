const API_BASE =
  import.meta.env.VITE_CHRYSALIS_JOB_API_URL ||
  "";

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
        `Chrysalis Job API request failed (${response.status}).`
    );
  }

  return payload;
}

export async function getJobs() {
  const payload = await request("/api/jobs");
  return Array.isArray(payload?.jobs) ? payload.jobs : [];
}

export async function getJob(id) {
  const payload = await request(
    `/api/jobs/${encodeURIComponent(id)}`
  );
  return payload.job;
}

export async function createJobRecord(job) {
  const payload = await request("/api/jobs", {
    method: "POST",
    body: JSON.stringify({ job }),
  });

  return payload.job;
}

export async function updateJobRecord(job) {
  const payload = await request(
    `/api/jobs/${encodeURIComponent(job.id)}`,
    {
      method: "PUT",
      body: JSON.stringify({ job }),
    }
  );

  return payload.job;
}

export async function deleteJobRecord(id) {
  await request(
    `/api/jobs/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}
