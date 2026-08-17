const API_BASE = "http://127.0.0.1:4174/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.ok === false) {
    throw new Error(
      payload.error ||
        `Appointment API request failed with status ${response.status}.`
    );
  }

  return payload;
}

export async function getAppointments() {
  const payload = await request("/appointments");
  return payload.appointments || [];
}

export async function createAppointmentRecord(appointment) {
  const payload = await request("/appointments", {
    method: "POST",
    body: JSON.stringify({ appointment }),
  });

  return payload.appointment;
}

export async function updateAppointmentRecord(appointment) {
  const payload = await request(
    `/appointments/${encodeURIComponent(appointment.id)}`,
    {
      method: "PUT",
      body: JSON.stringify({ appointment }),
    }
  );

  return payload.appointment;
}

export async function deleteAppointmentRecord(id) {
  await request(`/appointments/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
