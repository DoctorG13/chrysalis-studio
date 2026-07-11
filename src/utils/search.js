export function searchStudio(query, clients = [], jobs = []) {
  const term = query.trim().toLowerCase();

  if (!term) {
    return [];
  }

  const results = [];

  clients.forEach((client) => {
    const fullName = [
      client.firstName,
      client.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    const searchable = [
      fullName,
      client.phone,
      client.email,
      client.notes,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (searchable.includes(term)) {
      results.push({
        type: "client",
        id: client.id,
        title: fullName,
        subtitle: client.phone || client.email || "",
        data: client,
      });
    }
  });

  jobs.forEach((job) => {
    const searchable = [
      job.name,
      job.reference,
      job.status,
      job.garment,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (searchable.includes(term)) {
      results.push({
        type: "job",
        id: job.id,
        title: job.name ?? "",
        subtitle: `${job.status ?? ""} • ${job.reference ?? ""}`,
        data: job,
      });
    }
  });

  return results.sort((a, b) =>
    (a.title ?? "").localeCompare(b.title ?? "")
  );
}