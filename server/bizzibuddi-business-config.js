export const BIZZI_BUDDI_INDUSTRY_TEMPLATES = {
  general: {
    name: "General business",
    description: "A flexible starting point for most service businesses.",
    terminology: { person: "People", job: "Jobs", appointment: "Appointments" },
    fields: [],
  },
  other: {
    name: "Other / custom",
    description: "A flexible starting point for businesses that do not fit the listed industry templates.",
    terminology: { person: "People", job: "Jobs", appointment: "Appointments" },
    fields: [],
  },
  dressmaker: {
    name: "Dressmaker / Tailor",
    description: "Measurements, fittings and garment-specific client information.",
    terminology: { person: "Clients", job: "Garments", appointment: "Fittings" },
    fields: [
      { name: "Bust", key: "bust", type: "measurement", unit: "cm" },
      { name: "Waist", key: "waist", type: "measurement", unit: "cm" },
      { name: "Hip", key: "hip", type: "measurement", unit: "cm" },
      { name: "Height", key: "height", type: "measurement", unit: "cm" },
      { name: "Shoe size", key: "shoe_size", type: "text" },
    ],
  },
  hairdresser: {
    name: "Hairdresser / Salon",
    description: "Client preferences, colour history and service information.",
    terminology: { person: "Clients", job: "Services", appointment: "Appointments" },
    fields: [
      { name: "Hair type", key: "hair_type", type: "dropdown", options: ["Straight", "Wavy", "Curly", "Coily"] },
      { name: "Colour history", key: "colour_history", type: "long_text" },
      { name: "Preferred stylist", key: "preferred_stylist", type: "text" },
      { name: "Last colour date", key: "last_colour_date", type: "date" },
    ],
  },
  tattooist: {
    name: "Tattoo Studio",
    description: "Artist, placement, style and client reference information.",
    terminology: { person: "Clients", job: "Tattoos", appointment: "Sessions" },
    fields: [
      { name: "Preferred artist", key: "preferred_artist", type: "text" },
      { name: "Style", key: "style", type: "text" },
      { name: "Placement", key: "placement", type: "text" },
      { name: "Design reference", key: "design_reference", type: "url" },
      { name: "Consent notes", key: "consent_notes", type: "long_text" },
    ],
  },
  school: {
    name: "School / Education",
    description: "Student, guardian and enrolment information.",
    terminology: { person: "Students", job: "Programs", appointment: "Meetings" },
    fields: [
      { name: "Student ID", key: "student_id", type: "text" },
      { name: "Year level", key: "year_level", type: "text" },
      { name: "Parent / guardian", key: "guardian", type: "text" },
      { name: "Emergency contact", key: "emergency_contact", type: "text" },
      { name: "Enrolment date", key: "enrolment_date", type: "date" },
    ],
  },
  trades: {
    name: "Trades / Contractor",
    description: "Property, access and job-specific service information.",
    terminology: { person: "Customers", job: "Jobs", appointment: "Site visits" },
    fields: [
      { name: "Property type", key: "property_type", type: "dropdown", options: ["Residential", "Commercial", "Industrial", "Other"] },
      { name: "Site access", key: "site_access", type: "long_text" },
      { name: "Equipment / asset", key: "equipment", type: "text" },
      { name: "Warranty status", key: "warranty_status", type: "text" },
    ],
  },
  consultant: {
    name: "Consultant / Professional",
    description: "Client engagements, projects and professional appointments.",
    terminology: { person: "Clients", job: "Projects", appointment: "Meetings" },
    fields: [
      { name: "Industry", key: "industry", type: "text" },
      { name: "Engagement type", key: "engagement_type", type: "text" },
      { name: "Primary contact", key: "primary_contact", type: "text" },
    ],
  },
};

export const BIZZI_BUDDI_FIELD_TYPES = [
  "text",
  "long_text",
  "number",
  "currency",
  "date",
  "yes_no",
  "dropdown",
  "multi_select",
  "phone",
  "email",
  "url",
  "measurement",
  "percentage",
];
