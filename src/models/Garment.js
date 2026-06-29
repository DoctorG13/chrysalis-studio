export function createGarment({
  name = "",
  type = "",
  status = "Quote",
  dueDate = "",
  notes = "",
} = {}) {
  return {
    id: crypto.randomUUID(),

    name,

    type,

    status,

    dueDate,

    notes,

    measurements: [],

    fittings: [],

    payments: [],

    photos: [],
  };
}