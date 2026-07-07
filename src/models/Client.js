export function createClient({
  firstName,
  lastName,
  phone,
  email,
  notes,
}) {
  return {
    id: crypto.randomUUID(),

    // Basic Details
    firstName,
    lastName,

    phone,
    email,

    notes,

    created: new Date().toISOString(),
    modified: new Date().toISOString(),

    status: "Active",

    // Measurements
    measurements: {},

    // Business Records
    jobs: [],
    appointments: [],
    payments: [],
    invoices: [],

    // Client History
    timeline: [],

    // Assets
    photos: [],
    documents: [],

    // Internal
    tags: [],

    preferences: {},

    reminders: [],

    customFields: {},
  };
}