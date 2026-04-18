import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Code2, KeyRound, ShieldCheck, Server } from "lucide-react";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { ROUTES, GITHUB_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "WhatsApp API Manager — a local-first console for the WhatsApp Cloud API",
  description:
    "Every WhatsApp Cloud API endpoint plus broadcasts, templates and QR codes — running entirely in your browser. Your token never leaves your machine. Open source, MIT, self-host free.",
};

const TRUST_POINTS = [
  { icon: Server, label: "Zero deploy — runs in your browser" },
  { icon: KeyRound, label: "Your token never leaves your machine" },
  { icon: Code2, label: "Open source, MIT licensed" },
  { icon: ShieldCheck, label: "Official Cloud API — no ban risk" },
];

const WHY_LOCAL_FIRST = [
  {
    icon: KeyRound,
    title: "Own your credentials",
    body: "Your access token is encrypted client-side (AES-256-GCM) and kept in your browser. Requests go straight to graph.facebook.com — no server in the middle, nothing for anyone else to leak.",
  },
  {
    icon: Server,
    title: "Nothing to deploy",
    body: "Open it and go — no database, no account, no backend to start. Run it from localhost or self-host the app. Optional cloud sync only if you want it.",
  },
  {
    icon: ShieldCheck,
    title: "Official API, no ban risk",
    body: "Built entirely on Meta's official Cloud API — not a reverse-engineered web client like the unofficial libraries that get numbers banned.",
  },
  {
    icon: Code2,
    title: "Read it, fork it, keep it",
    body: "MIT licensed, full source on GitHub. No rent-seeker between you and Meta, and no per-message markup — ever.",
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-warm-100 px-3 py-1 text-xs text-warm-600 font-medium">
            <span className="size-1.5 rounded-full bg-green-500" aria-hidden="true" /> Local-first · open source · bring your own Meta credentials
          </p>
          <h1 className="mt-5 text-4xl md:text-6xl font-bold tracking-tight text-near-black leading-[1.05]">
            A local-first console for the{" "}
            <span className="text-notion-blue">WhatsApp Cloud API.</span>
          </h1>
          <p className="mt-6 text-lg text-warm-500 leading-relaxed">
            Every official Cloud API endpoint — plus broadcasts, templates, contacts and QR codes — in one clean console that runs entirely in your browser. You bring your own Meta credentials; your token never touches a server.
          </p>
          <p className="mt-3 text-sm text-warm-500">
            <strong className="text-near-black font-semibold">Like Postman for WhatsApp, with a real business toolkit on top.</strong>{" "}
            For developers and operators who already have Cloud API access and want to own their data.
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
              <Code2 className="size-4" aria-hidden="true" /> View source on GitHub
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-warm-500">
            {TRUST_POINTS.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <Icon className="size-3.5" aria-hidden="true" /> {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-black/10">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-notion-blue">What&apos;s inside</p>
          <h2 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight text-near-black">
            The whole Cloud API, plus the tools around it.
          </h2>
          <p className="mt-3 text-warm-500">
            A typed explorer for every endpoint, and the day-to-day toolkit on top. Outbound features run locally; the inbound ones (inbox, auto-replies, webhook analytics) light up once you deploy a webhook.
          </p>
        </div>
        <div className="mt-8">
          <FeatureGrid />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-black/10">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-notion-blue">Why local-first</p>
          <h2 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight text-near-black">
            Your tokens. Your data. No middleman.
          </h2>
          <p className="mt-3 text-warm-500">
            Most WhatsApp platforms proxy your messages through their servers and bill a markup. This one doesn&apos;t — there&apos;s no server in the path to begin with.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {WHY_LOCAL_FIRST.map(({ icon: Icon, title, body }) => (
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
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-black/10">
        <div className="rounded-[var(--radius-comfortable)] border border-amber-200 bg-amber-50 p-6 md:p-8">
          <h2 className="text-xl font-bold tracking-tight text-amber-900">One honest caveat: inbound needs a deployment</h2>
          <p className="mt-2 text-sm text-amber-800 max-w-3xl leading-relaxed">
            Receiving messages means receiving webhooks, and webhooks need a public, always-on URL — which a browser tab can&apos;t be. So the <strong>inbox, auto-replies and webhook analytics</strong> are &ldquo;deploy-mode&rdquo; features: deploy the app (with a database) and point your webhook at it. The API explorer, broadcasts, templates and QR codes work fully on their own, no server required.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-black/10">
        <div className="rounded-[var(--radius-large)] bg-near-black text-white p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Free and open source.</h2>
          <p className="mt-3 text-white/70 max-w-xl mx-auto">
            Clone it, run it, self-host it — free forever, MIT licensed. Try the demo first; no signup, no card.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link
              href={ROUTES.LOGIN + "?demo=1"}
              className="inline-flex items-center gap-2 rounded-[var(--radius-micro)] bg-white text-near-black px-5 py-3 font-semibold hover:bg-warm-100 transition-colors"
            >
              Try the demo <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href={GITHUB_URL}
              className="inline-flex items-center gap-2 rounded-[var(--radius-micro)] border border-white/30 px-5 py-3 font-semibold hover:bg-white/10 transition-colors"
            >
              <Code2 className="size-4" aria-hidden="true" /> Star on GitHub
            </Link>
          </div>
          <p className="mt-4 text-xs text-white/50">
            Want the inbound features without running infra?{" "}
            <Link href="/pricing" className="underline hover:no-underline">Managed hosting is optional →</Link>
          </p>
        </div>
      </section>
    </>
  );
}
