import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How we collect, store, and process data.",
};

const LAST_UPDATED = "April 2026";

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-12 md:py-16 prose prose-sm">
      <h1 className="text-3xl font-bold text-near-black">Privacy Policy</h1>
      <p className="text-warm-500 text-sm mt-1">Last updated: {LAST_UPDATED}</p>

      <section className="mt-8 space-y-6 text-near-black leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold">What we collect</h2>
          <p className="mt-2 text-warm-500">
            In local mode, all your data stays in your browser&apos;s IndexedDB. We do not collect or transmit anything — not even usage telemetry.
          </p>
          <p className="mt-2 text-warm-500">
            In managed hosting, we collect only what&apos;s needed to operate the service: your email address and name for the account, your WhatsApp Cloud API credentials (encrypted at rest with AES-256-GCM), and whatever contacts, templates, webhook events, and broadcast data you create within the app.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">What we never touch</h2>
          <ul className="mt-2 space-y-1 text-warm-500 list-disc pl-5">
            <li>The content of your WhatsApp messages. They flow browser-to-Meta directly.</li>
            <li>Your Facebook personal profile, ads, Pages, or business accounts.</li>
            <li>Payment methods — if you pay for managed hosting, billing runs through a third-party payment processor; we never see or store full card details.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">How we use it</h2>
          <p className="mt-2 text-warm-500">
            Purely to operate the product. No advertising. No selling data to third parties. No model training. No analytics beyond anonymized aggregate usage (page views, feature activation rates).
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Your rights under DPDP and GDPR</h2>
          <ul className="mt-2 space-y-1 text-warm-500 list-disc pl-5">
            <li>Access — request a copy of your data anytime</li>
            <li>Correction — fix anything inaccurate</li>
            <li>Erasure — delete your account and all associated data within 30 days</li>
            <li>Portability — export everything as JSON</li>
            <li>Objection — opt out of any processing we don&apos;t strictly need to run the service</li>
          </ul>
          <p className="mt-2 text-warm-500">
            Email privacy@himture.dev to exercise any of these. We respond within 72 hours.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Third-party processors</h2>
          <p className="mt-2 text-warm-500">Only what the service requires:</p>
          <ul className="mt-2 space-y-1 text-warm-500 list-disc pl-5">
            <li>Meta (WhatsApp Cloud API) — your browser talks to them directly</li>
            <li>Vercel — application hosting</li>
            <li>Neon or Supabase — Postgres database (managed hosting only)</li>
            <li>A third-party payment processor — managed-hosting billing only</li>
            <li>Better Auth — session management (self-contained, no third-party auth without your action)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Data retention</h2>
          <p className="mt-2 text-warm-500">
            In local mode, nothing leaves your browser, so retention is entirely in your hands. In managed hosting, your data lives as long as your account does and is fully removed within 30 days of account deletion — and you can export or delete anything sooner at any time.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Breach notification</h2>
          <p className="mt-2 text-warm-500">
            In the event of a security incident affecting your data, we notify you within 72 hours as required by DPDP and GDPR.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="mt-2 text-warm-500">
            privacy@himture.dev for data requests. security@himture.dev for vulnerability disclosure.
          </p>
        </div>
      </section>
    </article>
  );
}
