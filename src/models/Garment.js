export function createGarment({
  clientId,
  name,
  type,
}) {
  return {
    id: crypto.randomUUID(),

    clientId,

    name,

    type,

    status: "New",

    created: new Date(),

    fittings: [],

    measurements: [],

    payments: [],

    notes: [],
  };
}