import { Info } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

// Honest notice for inbound-dependent features (inbox, analytics, auto-replies).
// Inbound WhatsApp data arrives only via a public, always-on webhook — a browser
// cannot receive it — so in local (no-backend) mode these views can only show
// data already on this device, never live traffic.
export function DeploymentRequiredNotice({ feature }: { feature: string }) {
  return (
    <div className="mb-4 flex gap-2 rounded-[var(--radius-micro)] bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
      <Info className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <p className="font-medium">{feature} needs a deployed webhook</p>
        <p className="mt-0.5 text-amber-800">
          Incoming WhatsApp events are delivered only to a public, always-on URL, so they can&apos;t
          reach a browser tab. Deploy the app (with a database) and point your webhook at{" "}
          <code className="bg-amber-100 px-1 rounded text-xs">/api/webhooks/&#123;configId&#125;</code>{" "}
          to see live data here — in local mode this view shows only what&apos;s already stored on this device.{" "}
          <Link href={ROUTES.SETTINGS} className="underline hover:no-underline">Webhook setup →</Link>
        </p>
      </div>
    </div>
  );
}
