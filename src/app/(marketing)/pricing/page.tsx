import type { Metadata } from "next";
import Link from "next/link";
import { Code2, Server, Cloud } from "lucide-react";
import { GITHUB_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free and open source — self-host the WhatsApp Cloud API console forever. Optional managed hosting for the deploy-mode inbound features.",
};

const FAQS = [
  {
    q: "What does Meta charge?",
    a: "Meta bills your own WhatsApp Business Account directly, per message — for India in 2026 that's about ₹0.8631 per marketing message and ₹0.115 for utility/authentication, with customer-initiated service messages free. You pay Meta directly; this tool never touches that money and adds no markup of its own.",
  },
  {
    q: "Is it really free?",
    a: "Yes — MIT licensed, full source on GitHub. Clone it and run it locally or self-host it, free forever. Your access token stays encrypted on your machine.",
  },
  {
    q: "Do I need a server?",
    a: "Not for the core console: the endpoint explorer, broadcasts, templates, contacts and QR codes all run in your browser. The inbox, auto-replies and webhook analytics DO need a deployed, always-on webhook (a browser can't receive webhooks), so those are deploy-mode features.",
  },
  {
    q: "How is this different from Wati, AiSensy or Interakt?",
    a: "Those are managed providers that host everything and handle Meta onboarding for you. This is a local-first, bring-your-own-credentials tool for people who already have Cloud API access and want to own their data and tokens. Different model — choose whichever fits how you work.",
  },
  {
    q: "Is there managed hosting?",
    a: "Optionally, yes — if you want the deploy-mode inbound features (always-on inbox, auto-replies, analytics) without running your own infrastructure. The self-host path stays free and complete for everything outbound.",
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
      <div className="max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-near-black">Pricing</h1>
        <p className="mt-4 text-lg text-warm-500">
          The tool is free and open source. Self-host it forever at no cost. Managed hosting is optional — only if you want the deploy-mode inbound features without running your own server.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-[var(--radius-comfortable)] border border-black/10 bg-white p-6 flex flex-col">
          <div className="flex items-center gap-2">
            <Server className="size-5 text-notion-blue" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-near-black">Self-host</h2>
          </div>
          <p className="mt-1 text-3xl font-bold text-near-black">Free<span className="text-base font-normal text-warm-500"> · forever</span></p>
          <ul className="mt-4 space-y-2 text-sm text-warm-500 flex-1">
            <li>Every Cloud API endpoint + the full business toolkit</li>
            <li>Runs in your browser; tokens stay on your machine</li>
            <li>Deploy it yourself to unlock the inbound features</li>
            <li>MIT licensed — no markup, no lock-in</li>
          </ul>
          <Link
            href={GITHUB_URL}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-[var(--radius-micro)] bg-near-black text-white px-4 py-2.5 font-semibold hover:bg-warm-600 transition-colors"
          >
            <Code2 className="size-4" aria-hidden="true" /> Get it on GitHub
          </Link>
        </div>

        <div className="rounded-[var(--radius-comfortable)] border border-black/10 bg-warm-white p-6 flex flex-col">
          <div className="flex items-center gap-2">
            <Cloud className="size-5 text-notion-blue" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-near-black">Managed hosting</h2>
          </div>
          <p className="mt-1 text-3xl font-bold text-near-black">Optional</p>
          <ul className="mt-4 space-y-2 text-sm text-warm-500 flex-1">
            <li>We run the always-on webhook, database and inbox for you</li>
            <li>Inbound: live inbox, auto-replies and webhook analytics</li>
            <li>Still your own Meta credentials — still zero per-message markup</li>
            <li>For teams that want the inbound features without the ops</li>
          </ul>
          <a
            href="mailto:admin@afterworld.in?subject=WhatsApp%20API%20Manager%20managed%20hosting"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-[var(--radius-micro)] border border-input-border bg-white px-4 py-2.5 font-semibold text-near-black hover:border-notion-blue transition-colors"
          >
            Get in touch
          </a>
        </div>
      </div>

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
          <h2 className="text-2xl font-bold tracking-tight text-near-black">Read the code before you trust it.</h2>
          <p className="mt-2 text-warm-500">
            It&apos;s all on GitHub.{" "}
            <Link href={GITHUB_URL} className="text-notion-blue hover:underline">View the source →</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
