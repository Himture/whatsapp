import Link from "next/link";
import { AlertCircle, ArrowRight, Check, X } from "lucide-react";
import { MarkupCalculator } from "@/components/marketing/markup-calculator";
import { ROUTES, META_RATES_INR } from "@/lib/constants";
import { markupPerMessage, markupPercentage, type CompetitorData } from "@/lib/competitor-data";

function formatInr(n: number): string {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 4 })}`;
}

export function CompetitorSection({ competitor }: { competitor: CompetitorData }) {
  const markup = markupPerMessage(competitor);
  const pct = markupPercentage(competitor);

  const comparisonRows: Array<{ label: string; them: string; us: string; themOk?: boolean }> = [
    { label: "Per-message markup on marketing", them: `${formatInr(markup)} (${pct}% over Meta)`, us: "₹0 (zero markup)", themOk: false },
    { label: "Entry price", them: competitor.entryPriceLabel, us: "₹1,499/month", themOk: false },
    { label: "Agent / seat policy", them: competitor.agentCap, us: "Scales with plan", themOk: false },
    { label: "Open source", them: "Closed source", us: "MIT licensed on GitHub", themOk: false },
    { label: "Data ownership", them: "Their servers", us: "Local-first, your data", themOk: false },
    { label: "Cancellation", them: "Often dark patterns, documented issues", us: "One click, instant", themOk: false },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
      <nav className="text-sm text-warm-500 mb-6">
        <Link href="/" className="hover:text-near-black">Home</Link>
        <span className="mx-2">/</span>
        <span>Vs {competitor.name}</span>
      </nav>

      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-near-black">
        {competitor.name} alternative
      </h1>
      <p className="mt-4 text-lg text-warm-500 max-w-2xl">{competitor.tagline}</p>

      <div className="mt-10 rounded-[var(--radius-large)] border border-red-200 bg-red-50/50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 text-danger shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-near-black">
              {competitor.name} charges {formatInr(competitor.marketingRateInr)} per marketing message.
            </p>
            <p className="mt-1 text-sm text-warm-500">
              Meta&apos;s actual rate is {formatInr(META_RATES_INR.marketing)}. That is {pct}% markup — a hidden tax on every message you send. On 100,000 messages per month, that is {formatInr(markup * 100_000)} extra every month, or {formatInr(markup * 100_000 * 12)} per year.
            </p>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-bold tracking-tight text-near-black">Side-by-side comparison</h2>
        <div className="mt-4 rounded-[var(--radius-subtle)] border border-black/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-warm-white border-b border-black/10">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-warm-500">Aspect</th>
                <th className="px-4 py-3 text-left font-medium text-warm-500">{competitor.name}</th>
                <th className="px-4 py-3 text-left font-medium text-warm-500">Us</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 bg-white">
              {comparisonRows.map((row) => (
                <tr key={row.label}>
                  <td className="px-4 py-3 font-medium text-near-black">{row.label}</td>
                  <td className="px-4 py-3 text-warm-500">
                    <span className="inline-flex items-center gap-1.5">
                      <X className="size-3.5 text-danger shrink-0" />
                      {row.them}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-warm-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="size-3.5 text-green-600 shrink-0" />
                      {row.us}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold tracking-tight text-near-black">What users say about {competitor.name}</h2>
        <ul className="mt-4 space-y-2">
          {competitor.painPoints.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm text-warm-500">
              <X className="size-4 text-danger shrink-0 mt-0.5" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        {competitor.reviewSources.length > 0 ? (
          <p className="mt-4 text-xs text-warm-300">
            Sources:{" "}
            {competitor.reviewSources.map((source, i) => (
              <span key={source.url}>
                {i > 0 ? ", " : null}
                <Link href={source.url} className="text-notion-blue hover:underline">{source.label}</Link>
              </span>
            ))}
          </p>
        ) : null}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold tracking-tight text-near-black">Your markup, calculated</h2>
        <div className="mt-4">
          <MarkupCalculator />
        </div>
      </section>

      <section className="mt-12">
        <div className="rounded-[var(--radius-large)] bg-near-black text-white p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Switching takes under an hour.
          </h2>
          <p className="mt-2 text-white/70 max-w-xl mx-auto text-sm">
            Export contacts from {competitor.name} as CSV, import here. Templates are managed on Meta Business Manager directly — no lock-in either way.
          </p>
          <Link
            href={ROUTES.SIGNUP}
            className="mt-5 inline-flex items-center gap-2 rounded-[var(--radius-micro)] bg-white text-near-black px-5 py-3 font-semibold hover:bg-warm-100 transition-colors"
          >
            Start free <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
