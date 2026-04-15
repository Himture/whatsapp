import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of the WhatsApp API Manager service.",
};

const LAST_UPDATED = "April 2026";

export default function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
      <h1 className="text-3xl font-bold text-near-black">Terms of Service</h1>
      <p className="text-warm-500 text-sm mt-1">Last updated: {LAST_UPDATED}</p>

      <section className="mt-8 space-y-6 text-near-black leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold">What this is</h2>
          <p className="mt-2 text-warm-500">
            A software-as-a-service platform that provides a user interface for the WhatsApp Cloud API. Our software sends your messages directly from your browser to Meta&apos;s servers — we do not proxy, store, or resell messaging services.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Your responsibilities</h2>
          <ul className="mt-2 space-y-1 text-warm-500 list-disc pl-5">
            <li>You must have an active WhatsApp Business Account with Meta and comply with their Business Messaging Policy.</li>
            <li>You are responsible for all message content you send and all Meta charges incurred.</li>
            <li>You must obtain consent from contacts before sending marketing messages, as required by DPDP Act (India), GDPR, and Meta policy.</li>
            <li>You must not use the service for spam, phishing, fraud, or any activity that violates Meta&apos;s Commerce Policy or local law.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Our responsibilities</h2>
          <ul className="mt-2 space-y-1 text-warm-500 list-disc pl-5">
            <li>We host the application and maintain its availability on a best-effort basis. Paid plans include specific uptime targets documented in the pricing page.</li>
            <li>We encrypt all access tokens at rest (AES-256-GCM).</li>
            <li>We do not read, inspect, or store the content of your WhatsApp messages.</li>
            <li>We notify you within 72 hours of any security incident affecting your account.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Billing</h2>
          <ul className="mt-2 space-y-1 text-warm-500 list-disc pl-5">
            <li>Our charges are for the software only. We never add a markup to Meta&apos;s conversation charges.</li>
            <li>Meta bills you directly for WhatsApp conversation costs. We have no involvement in that billing.</li>
            <li>Subscriptions renew monthly or annually as selected. Cancel anytime — the subscription ends at the next renewal date. No partial refunds for unused time within a billing period.</li>
            <li>Indian customers are billed in INR via Razorpay. International customers via Stripe in USD.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Cancellation</h2>
          <p className="mt-2 text-warm-500">
            One-click cancellation from Settings. No retention screens, no phone call required, no email chains. After cancellation, you have 30 days to export your data before it is permanently deleted.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Availability and SLA</h2>
          <p className="mt-2 text-warm-500">
            Managed hosting targets 99.9% monthly uptime on Business and Agency plans. Starter and Free plans do not include a formal SLA. Current uptime and incident history are published on our status page.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Liability</h2>
          <p className="mt-2 text-warm-500">
            Our maximum liability under any circumstance is limited to the amount you paid us in the preceding twelve months. We are not liable for losses resulting from Meta restricting your WhatsApp account, your phone number quality rating degradation, message delivery failures originating at Meta, or any act or omission outside our control.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Termination</h2>
          <p className="mt-2 text-warm-500">
            We may suspend or terminate accounts that violate Meta&apos;s policies, send spam, or engage in illegal activity. We will notify you and give you a reasonable opportunity to export your data unless the violation requires immediate action for safety or legal reasons.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Governing law</h2>
          <p className="mt-2 text-warm-500">
            These terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Changes</h2>
          <p className="mt-2 text-warm-500">
            We may update these terms with at least 30 days&apos; notice via email. Continued use after the effective date constitutes acceptance.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="mt-2 text-warm-500">
            Questions: support@himture.dev. Legal: legal@himture.dev.
          </p>
        </div>
      </section>
    </article>
  );
}
