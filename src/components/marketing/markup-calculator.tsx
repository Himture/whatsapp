"use client";

import { useState, useMemo } from "react";
import { COMPETITORS, CALCULATOR_SLUGS, markupPerMessage } from "@/lib/competitor-data";

const VOLUME_PRESETS = [10_000, 50_000, 100_000, 500_000];

function formatInr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function MarkupCalculator() {
  const [volume, setVolume] = useState(50_000);
  const [selectedSlug, setSelectedSlug] = useState<string>("generic");
  const competitor = COMPETITORS[selectedSlug];

  const { monthlyMarkup, annualMarkup } = useMemo(() => {
    if (!competitor) return { monthlyMarkup: 0, annualMarkup: 0 };
    const perMsg = markupPerMessage(competitor);
    const monthly = perMsg * volume;
    return { monthlyMarkup: monthly, annualMarkup: monthly * 12 };
  }, [competitor, volume]);

  if (!competitor) return null;

  return (
    <div className="rounded-[var(--radius-large)] border border-black/10 bg-white p-6 md:p-8 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wider text-warm-500">
        Zero-tax calculator
      </p>
      <h3 className="mt-1 text-xl md:text-2xl font-bold text-near-black">
        See how much your current platform taxes you
      </h3>

      <div className="mt-5 grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-near-black">Your current platform</span>
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius-micro)] border border-input-border bg-white px-3 py-2 text-sm"
          >
            {CALCULATOR_SLUGS.map((slug) => (
              <option key={slug} value={slug}>{COMPETITORS[slug]?.name}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-near-black">Marketing messages per month</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={volume}
            onChange={(e) => setVolume(Math.max(0, parseInt(e.target.value) || 0))}
            className="mt-1 w-full rounded-[var(--radius-micro)] border border-input-border bg-white px-3 py-2 text-sm"
          />
          <div className="mt-2 flex gap-2 flex-wrap">
            {VOLUME_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setVolume(n)}
                className="rounded-full border border-input-border px-3 py-1 text-xs text-warm-500 hover:border-notion-blue hover:text-near-black transition-colors"
              >
                {n.toLocaleString("en-IN")}
              </button>
            ))}
          </div>
        </label>
      </div>

      <div className="mt-6 grid sm:grid-cols-3 gap-4 rounded-[var(--radius-subtle)] bg-warm-white p-4 border border-black/5">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-warm-500">{competitor.name} markup</p>
          <p className="mt-0.5 text-2xl font-bold text-danger">{formatInr(monthlyMarkup)}<span className="text-xs text-warm-500 font-normal">/mo</span></p>
          <p className="text-xs text-warm-500 mt-0.5">{formatInr(annualMarkup)} per year</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-warm-500">Our markup</p>
          <p className="mt-0.5 text-2xl font-bold text-green-600">₹0<span className="text-xs text-warm-500 font-normal">/mo</span></p>
          <p className="text-xs text-warm-500 mt-0.5">Architecturally guaranteed</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-warm-500">You save</p>
          <p className="mt-0.5 text-2xl font-bold text-near-black">{formatInr(monthlyMarkup)}<span className="text-xs text-warm-500 font-normal">/mo</span></p>
          <p className="text-xs text-warm-500 mt-0.5">Even on our ₹1,499 plan</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-warm-500">
        Meta charges ₹0.8631 per marketing message (India, 2026). {competitor.name} charges ₹{competitor.marketingRateInr}. We charge Meta&apos;s rate with zero markup — messages go from your browser to Meta directly.
      </p>
    </div>
  );
}
