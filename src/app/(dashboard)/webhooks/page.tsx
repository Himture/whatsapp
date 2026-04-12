"use client";

import Link from "next/link";
import { ConfigGuard } from "@/components/whatsapp/config-guard";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ApiDocLink } from "@/components/whatsapp/api-doc-link";
import { Button } from "@/components/ui/button";

export default function WebhooksPage() {
  return (
    <ConfigGuard>
      <WebhooksContent />
    </ConfigGuard>
  );
}

function WebhooksContent() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-near-black">
          Webhooks
        </h1>
        <p className="mt-1 text-sm text-warm-500">
          Configure webhook notifications to receive real-time updates from WhatsApp.
        </p>
        <ApiDocLink />
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardContent className="pt-6">
            <CardTitle className="text-lg mb-3">Webhook Setup Guide</CardTitle>
            <div className="text-sm text-warm-500 space-y-3">
              <p>
                Webhooks allow your application to receive real-time notifications about incoming messages,
                message status updates, and other events from the WhatsApp Cloud API.
              </p>
              <p>To set up webhooks, you need to:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>
                  Create an HTTPS endpoint on your server that can receive POST requests.
                </li>
                <li>
                  Configure the webhook URL in your Meta App Dashboard under the WhatsApp product settings.
                </li>
                <li>
                  Implement the verification challenge: your endpoint must respond to GET requests
                  with the <code className="bg-warm-white px-1 py-0.5 rounded text-xs font-mono">hub.challenge</code> value.
                </li>
                <li>
                  Subscribe your app to receive notifications for your WABA using the Subscriptions
                  feature in the WABA management page.
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <CardTitle className="text-lg mb-3">Supported Webhook Fields</CardTitle>
            <div className="text-sm text-warm-500 space-y-2">
              <p>The WhatsApp Cloud API sends notifications for the following events:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong className="text-near-black">messages</strong> - Incoming messages (text, media, location, contacts, etc.)</li>
                <li><strong className="text-near-black">statuses</strong> - Message delivery status updates (sent, delivered, read, failed)</li>
                <li><strong className="text-near-black">errors</strong> - Error notifications</li>
                <li><strong className="text-near-black">account_update</strong> - Phone number quality and status changes</li>
                <li><strong className="text-near-black">template_category_update</strong> - Template category changes</li>
                <li><strong className="text-near-black">message_template_status_update</strong> - Template approval status changes</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <CardTitle className="text-lg mb-3">Manage Subscriptions</CardTitle>
            <p className="text-sm text-warm-500 mb-4">
              To subscribe, unsubscribe, or override the callback URL for your WABA webhook notifications,
              use the WABA management page.
            </p>
            <Link href="/waba">
              <Button>Go to WABA Subscriptions</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
