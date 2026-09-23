export const bizzibuddiPlans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "A simple starting point for independent operators.",
    features: ["People & contacts", "Basic jobs", "Calendar", "Dashboard"],
    entitlements: ["people", "jobs", "calendar", "dashboard"],
  },
  {
    id: "professional",
    name: "Professional",
    price: "$9",
    period: "/ month",
    description: "For established service businesses and solo professionals.",
    features: ["Everything in Free", "Advanced scheduling", "Payments & invoices", "Automation"],
    entitlements: ["people", "jobs", "calendar", "dashboard", "advancedScheduling", "finance", "automation"],
  },
  {
    id: "business",
    name: "Business",
    price: "$39",
    period: "/ month",
    description: "For growing businesses needing deeper control.",
    features: ["Everything in Professional", "Production tracking", "Advanced reporting", "Priority features", "Professional controls"],
    entitlements: ["people", "jobs", "calendar", "dashboard", "advancedScheduling", "finance", "automation", "production", "reports", "priorityFeatures", "professionalControls"],
    featured: true,
  },
];

export function getBizzibuddiPlan(planName = "Free") {
  return bizzibuddiPlans.find((plan) => plan.name === planName) || bizzibuddiPlans[0];
}

export function hasBizzibuddiFeature(planName, feature) {
  return getBizzibuddiPlan(planName).entitlements.includes(feature);
}
