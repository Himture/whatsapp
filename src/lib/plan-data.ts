import { PLAN_LIMITS, type Plan } from "./constants";

export interface PlanFeature {
  label: string;
  getValue: (plan: Plan) => string | boolean;
}

export const PLAN_ORDER: Plan[] = ["free", "starter", "business", "agency"];

function formatLimit(n: number): string {
  if (!Number.isFinite(n)) return "Unlimited";
  return n.toLocaleString("en-IN");
}

export const PLAN_FEATURES: PlanFeature[] = [
  {
    label: "WhatsApp configurations",
    getValue: (plan) => formatLimit(PLAN_LIMITS[plan].configs),
  },
  {
    label: "Team members",
    getValue: (plan) => formatLimit(PLAN_LIMITS[plan].teamMembers),
  },
  {
    label: "Contacts",
    getValue: (plan) => formatLimit(PLAN_LIMITS[plan].contacts),
  },
  {
    label: "Webhook event history",
    getValue: (plan) => {
      const days = PLAN_LIMITS[plan].webhookEventRetentionDays;
      if (!Number.isFinite(days)) return "Unlimited";
      return `${days} days`;
    },
  },
  {
    label: "Message markup",
    getValue: () => "None. Ever.",
  },
  {
    label: "Inbox, contacts, broadcasts, templates, flows, analytics, QR",
    getValue: () => true,
  },
  {
    label: "A/B testing on broadcasts",
    getValue: (plan) => PLAN_LIMITS[plan].features.abTesting,
  },
  {
    label: "Priority support",
    getValue: (plan) => PLAN_LIMITS[plan].features.prioritySupport,
  },
  {
    label: "Client workspaces",
    getValue: (plan) => PLAN_LIMITS[plan].features.clientWorkspaces,
  },
  {
    label: "White-label",
    getValue: (plan) => PLAN_LIMITS[plan].features.whiteLabel,
  },
];

export const PLAN_TAGLINES: Record<Plan, string> = {
  free: "Clone the repo, run anywhere. Forever free.",
  starter: "Managed hosting, all features, zero markup.",
  business: "For teams running serious WhatsApp operations.",
  agency: "Manage unlimited client accounts with white-label.",
};
