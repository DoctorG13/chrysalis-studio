export function createJob({
  name,
  dueDate,
  priority = "Normal",
  status = "Quote",
  description = "",
  reference = "",
}) {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),

    reference,

    name,

    dueDate,

    priority,

    status,

    description,

    garments: [],
    appointments: [],
    fittings: [],
    payments: [],
    photos: [],
    notes: [],

    timeline: [
      {
        id: crypto.randomUUID(),
        type: "created",
        title: "Job Created",
        date: now,
      },
    ],

    created: now,
  };
}

export function addTimelineEntry(
  job,
  title,
  type = "note"
) {
  return {
    ...job,
    timeline: [
      {
        id: crypto.randomUUID(),
        type,
        title,
        date: new Date().toISOString(),
      },
      ...(job.timeline || []),
    ],
  };
}