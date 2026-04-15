import { META_RATES_INR } from "./constants";

export interface CompetitorData {
  slug: string;
  name: string;
  tagline: string;
  entryPriceInr: number;
  entryPriceLabel: string;
  marketingRateInr: number;
  agentCap: string;
  painPoints: string[];
  reviewSources: Array<{ label: string; url: string }>;
}

// "generic" is an unbranded baseline used only by the calculator's default state —
// we don't want the home page to lead with a named competitor. It's deliberately
// excluded from COMPETITOR_SLUGS (and so from the /vs/* static routes).
export const GENERIC_COMPETITOR: CompetitorData = {
  slug: "generic",
  name: "Typical WhatsApp platform",
  tagline: "Industry-average markup of ~15% on every marketing message.",
  entryPriceInr: 2000,
  entryPriceLabel: "~₹2,000/mo",
  marketingRateInr: 1.0,
  agentCap: "Varies by plan",
  painPoints: [],
  reviewSources: [],
};

export const COMPETITORS: Record<string, CompetitorData> = {
  generic: GENERIC_COMPETITOR,
  wati: {
    slug: "wati",
    name: "Wati",
    tagline: "EUR billing, 3-agent cap, documented post-cancellation charges.",
    entryPriceInr: 6200,
    entryPriceLabel: "€59/mo (annual)",
    marketingRateInr: 1.04,
    agentCap: "3 on Growth — cannot be expanded",
    painPoints: [
      "Prices in EUR with no INR option",
      "Growth plan capped at 3 agents with zero expansion path",
      "Automation triggers metered and sold as top-ups (€40 per 1,000)",
      "Multiple documented cases of billing continuing after cancellation",
      "Dark cancellation UX — hidden cancellation form",
      "Trustpilot 3.6/5 versus G2 4.6/5 — large review discrepancy",
    ],
    reviewSources: [
      { label: "Trustpilot reviews", url: "https://www.trustpilot.com/review/wati.io" },
      { label: "Capterra reviews", url: "https://www.capterra.com/p/204314/WATI/reviews/" },
    ],
  },
  aisensy: {
    slug: "aisensy",
    name: "AiSensy",
    tagline: "26% markup on every marketing message. Chatbot builder is a paid add-on.",
    entryPriceInr: 1500,
    entryPriceLabel: "₹1,500/mo",
    marketingRateInr: 1.09,
    agentCap: "5 free, ₹750/extra per month",
    painPoints: [
      "26% markup on marketing messages — highest among Indian BSPs",
      "Chatbot flow builder costs an extra ₹2,500/month",
      "Must pre-purchase messaging credits (cash flow friction)",
      "No built-in CRM — relies on third-party integrations",
      "Reports of software failures after payment with slow support",
    ],
    reviewSources: [
      { label: "G2 reviews", url: "https://www.g2.com/products/aisensy/reviews" },
    ],
  },
  interakt: {
    slug: "interakt",
    name: "Interakt",
    tagline: "Lowest markup of Indian BSPs (12%), but the CRM is a separate ₹2,499/mo subscription.",
    entryPriceInr: 2499,
    entryPriceLabel: "₹2,499/mo",
    marketingRateInr: 0.882,
    agentCap: "Unlimited agents, but Sales CRM is a separate subscription",
    painPoints: [
      "Dual subscription required (inbox + Sales CRM at ₹2,499 each)",
      "Only WhatsApp and Instagram — no SMS, email, or voice channels",
      "Slow customer support, especially via email",
      "Occasional freezing and blank-screen bugs",
      "AI Agent features are new and untested at scale",
    ],
    reviewSources: [
      { label: "G2 reviews", url: "https://www.g2.com/products/interakt/reviews" },
    ],
  },
};

// Branded slugs only — powers /vs/[competitor] static routes.
export const COMPETITOR_SLUGS = Object.keys(COMPETITORS).filter((slug) => slug !== "generic");

// All options shown in the calculator dropdown, with the generic baseline first.
export const CALCULATOR_SLUGS = ["generic", ...COMPETITOR_SLUGS];

export function markupPerMessage(competitor: CompetitorData): number {
  return Math.max(0, competitor.marketingRateInr - META_RATES_INR.marketing);
}

export function markupPercentage(competitor: CompetitorData): number {
  return Math.round((markupPerMessage(competitor) / META_RATES_INR.marketing) * 100);
}

export function getCompetitor(slug: string): CompetitorData | null {
  return COMPETITORS[slug] ?? null;
}
