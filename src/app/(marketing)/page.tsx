import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Code2, Shield, Zap, Briefcase, Palette, Users, Inbox } from "lucide-react";
import { MarkupCalculator } from "@/components/marketing/markup-calculator";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { PricingTable } from "@/components/marketing/pricing-table";
import { ROUTES, GITHUB_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "WhatsApp API Manager — zero markup, open source",
  description: "Manage your WhatsApp Cloud API without paying hidden per-message markup. Open source, self-host free, or managed hosting from ₹1,499/month.",
};

const TRUST_POINTS = [
  { icon: Zap, label: "Zero markup — architecturally" },
  { icon: Code2, label: "Open source, MIT licensed" },
  { icon: Shield, label: "Tokens never leave your machine" },
  { icon: Briefcase, label: "Built for agencies and SMBs" },
];

const AGENCY_HIGHLIGHTS = [
  { icon: Briefcase, title: "Multi-account workspaces", body: "Switch between client WABAs in one click. Aggregate inbox, broadcast, and analytics across every workspace you manage." },
  { icon: Palette, title: "White-label per workspace", body: "Per-client display name and brand color. Surface your client's branding inside the dashboard so it feels like their tool, not yours." },
  { icon: Users, title: "One bill instead of many", body: "₹8,999/month flat for unlimited workspaces. Compare to running 10 BSP subscriptions at ₹3,500+ each." },
  { icon: Inbox, title: "Unified inbox", body: "All client conversations show up in one timeline. Reply directly. Filter by workspace when you need to focus." },
];

export default function LandingPage() {
  return (
    <>
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-10 md:pt-24 md:pb-16">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-warm-100 px-3 py-1 text-xs text-warm-600 font-medium">
            <span className="size-1.5 rounded-full bg-green-500" aria-hidden="true" /> India&apos;s first zero-markup WhatsApp API tool
          </p>
          <h1 className="mt-5 text-4xl md:text-6xl font-bold tracking-tight text-near-black leading-[1.05]">
            The WhatsApp API tool that charges you{" "}
            <span className="text-notion-blue">nothing per message.</span>
          </h1>
          <p className="mt-6 text-lg text-warm-500 leading-relaxed">
            Everyone else adds 10–26% markup on every Meta message. We don&apos;t — because messages go from your browser straight to Meta. We never see them.
          </p>
          <p className="mt-3 text-sm text-warm-500">
            <strong className="text-near-black font-semibold">You bring your own Meta credentials.</strong> We&apos;re a Tech Provider, not a BSP — your number, WABA, and templates stay where they are.{" "}
            <Link href="/pricing#faq" className="text-notion-blue hover:underline">Learn more</Link>
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={ROUTES.LOGIN + "?demo=1"}
              className="inline-flex items-center gap-2 rounded-[var(--radius-micro)] bg-near-black text-white px-5 py-3 font-semibold hover:bg-warm-600 transition-colors"
            >
              Try the demo (no signup) <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href={GITHUB_URL}
              className="inline-flex items-center gap-2 rounded-[var(--radius-micro)] border border-input-border bg-white px-5 py-3 font-semibold text-near-black hover:border-notion-blue transition-colors"
            >
              <Code2 className="size-4" aria-hidden="true" /> Free forever — self-host
            </Link>
          </div>
          <p className="mt-3 text-xs text-warm-500">
            Want managed hosting?{" "}
            <Link href="/pricing" className="text-notion-blue hover:underline">Plans from ₹1,499/mo →</Link>
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-warm-500">
            {TRUST_POINTS.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <Icon className="size-3.5" aria-hidden="true" /> {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <MarkupCalculator />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-black/10">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-notion-blue">Everything included</p>
          <h2 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight text-near-black">
            One subscription. No paid add-ons.
          </h2>
          <p className="mt-3 text-warm-500">
            Most platforms charge extra for chatbot builders, meter your automation triggers, or tier essential features. We bundle everything into one price.
          </p>
        </div>
        <div className="mt-8">
          <FeatureGrid />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-black/10">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-notion-blue">For agencies</p>
          <h2 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight text-near-black">
            Run 20 client WhatsApps from one dashboard.
          </h2>
          <p className="mt-3 text-warm-500">
            Stop juggling a separate login for every client. ₹8,999/month flat — unlimited workspaces, white-label, unified inbox. Most agencies today pay ₹35,000+ across separate per-client subscriptions.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {AGENCY_HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-[var(--radius-comfortable)] border border-black/10 bg-white p-5">
              <div className="flex items-start gap-3">
                <span className="size-9 rounded-[var(--radius-micro)] bg-badge-bg flex items-center justify-center shrink-0">
                  <Icon className="size-4 text-notion-blue" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-near-black">{title}</h3>
                  <p className="mt-1 text-sm text-warm-500">{body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/pricing" className="text-sm text-notion-blue hover:underline">
            See agency plan details →
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-black/10">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-notion-blue">Simple pricing</p>
          <h2 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight text-near-black">
            Priced in INR. No hidden costs.
          </h2>
          <p className="mt-3 text-warm-500">
            Every tier includes every feature. Higher tiers raise storage and team limits. No per-message charge ever.
          </p>
        </div>
        <div className="mt-8">
          <PricingTable compact />
        </div>
        <div className="mt-6">
          <Link href="/pricing" className="text-sm text-notion-blue hover:underline">
            See full feature comparison →
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-black/10">
        <div className="rounded-[var(--radius-large)] bg-near-black text-white p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Stop paying a markup tax.
          </h2>
          <p className="mt-3 text-white/70 max-w-xl mx-auto">
            Try the demo right now. Self-host free, or managed hosting from ₹1,499/month. Cancel anytime, one click, no dark patterns.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link
              href={ROUTES.LOGIN + "?demo=1"}
              className="inline-flex items-center gap-2 rounded-[var(--radius-micro)] bg-white text-near-black px-5 py-3 font-semibold hover:bg-warm-100 transition-colors"
            >
              Try the demo <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-[var(--radius-micro)] border border-white/30 px-5 py-3 font-semibold hover:bg-white/10 transition-colors"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
