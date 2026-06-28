export function createClient({
  firstName,
  lastName,
  phone,
  email,
  notes,
}) {
  return {
    id: crypto.randomUUID(),
    firstName,
    lastName,
    phone,
    email,
    notes,
    created: new Date(),
    garments: [],
    appointments: [],
    measurements: [],
    payments: [],
  };
}