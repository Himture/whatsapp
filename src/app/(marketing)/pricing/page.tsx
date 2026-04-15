import type { Metadata } from "next";
import Link from "next/link";
import { Code2 } from "lucide-react";
import { PricingTable } from "@/components/marketing/pricing-table";
import { MarkupCalculator } from "@/components/marketing/markup-calculator";
import { GITHUB_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free self-host, or managed hosting from ₹1,499/month. Zero per-message markup at every tier.",
};

const FAQS = [
  {
    q: "What does Meta charge separately?",
    a: "Meta charges conversation-based fees directly to your WhatsApp Business Account: ₹0.8631 per marketing message, ₹0.115 for utility and authentication, free for customer-initiated service conversations (India rates, 2026). You pay Meta directly — we never touch that money.",
  },
  {
    q: "Why is there no per-message markup?",
    a: "Our app runs messages from your browser directly to graph.facebook.com. We literally never see your messages, so we cannot charge a per-message fee. It is architecturally impossible, not a pricing decision.",
  },
  {
    q: "Can I really cancel anytime?",
    a: "Yes. One click, instant, no retention screens, no continued billing. This is a hard rule for us. You cancel, the subscription ends at the next billing cycle, and you never hear from our billing again.",
  },
  {
    q: "Is the code really open source?",
    a: "MIT licensed, full source on GitHub. Self-host for free forever. The paid tiers are purely for managed hosting and support.",
  },
  {
    q: "How is this different from Wati or AiSensy?",
    a: "They are Solution Partners (BSPs) — they proxy your messages through their servers and add a markup. We are a Tech Provider — you bring your own WhatsApp Cloud API credentials, we provide the UI. Different model, different economics.",
  },
  {
    q: "What if I need to migrate from Wati or AiSensy?",
    a: "Export your contacts from them as CSV and import into our Contacts page. We match columns automatically. Templates have to be re-created in Meta Business Manager, but approval takes under 24 hours.",
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-20">
      <div className="max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-near-black">Pricing</h1>
        <p className="mt-4 text-lg text-warm-500">
          Every plan includes every feature. Higher tiers raise storage, team, and workspace limits. No plan adds markup to your Meta bill.
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3 rounded-[var(--radius-comfortable)] bg-warm-white border border-black/10 p-4 flex-wrap">
        <p className="text-sm text-near-black">
          <span className="font-semibold">₹0 forever if you self-host.</span>{" "}
          <span className="text-warm-500">Same code as the managed tiers — only support and infrastructure differ.</span>
        </p>
        <Link
          href={GITHUB_URL}
          className="inline-flex items-center gap-2 rounded-[var(--radius-micro)] border border-input-border bg-white px-3 py-1.5 text-sm font-semibold text-near-black hover:border-notion-blue transition-colors"
        >
          <Code2 className="size-4" aria-hidden="true" /> Self-host on GitHub
        </Link>
      </div>

      <div className="mt-6">
        <PricingTable />
      </div>

      <section className="mt-20 pt-12 border-t border-black/10">
        <h2 className="text-2xl font-bold tracking-tight text-near-black">Calculate what you&apos;re overpaying</h2>
        <p className="mt-2 text-warm-500 max-w-2xl">
          Enter your current monthly message volume and your current platform to see the markup tax you&apos;re paying right now.
        </p>
        <div className="mt-6">
          <MarkupCalculator />
        </div>
      </section>

      <section id="faq" className="mt-20 pt-12 border-t border-black/10 max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tight text-near-black">FAQ</h2>
        <dl className="mt-6 divide-y divide-black/10 border-y border-black/10">
          {FAQS.map(({ q, a }) => (
            <div key={q} className="py-5">
              <dt className="font-semibold text-near-black">{q}</dt>
              <dd className="mt-2 text-warm-500 leading-relaxed">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-16">
        <div className="rounded-[var(--radius-large)] bg-warm-white border border-black/10 p-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-near-black">Still have questions?</h2>
          <p className="mt-2 text-warm-500">
            Read the code before you sign up.{" "}
            <Link href={GITHUB_URL} className="text-notion-blue hover:underline">View the source on GitHub →</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
