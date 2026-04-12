"use client";

import { useState } from "react";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { ConfigGuard } from "@/components/whatsapp/config-guard";
import { ResponseViewer } from "@/components/whatsapp/response-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { wabaApi } from "@/lib/whatsapp";
import { ApiDocLink } from "@/components/whatsapp/api-doc-link";
import type { ApiCallResult } from "@/lib/types";

export default function WabaPage() {
  return (
    <ConfigGuard>
      <WabaContent />
    </ConfigGuard>
  );
}

function WabaContent() {
  const { activeConfig } = useWhatsAppConfig();
  const [result, setResult] = useState<ApiCallResult | null>(null);
  const [loading, setLoading] = useState(false);

  const [businessId, setBusinessId] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [subTab, setSubTab] = useState<"subscribe" | "getAll" | "unsubscribe" | "override">("subscribe");

  async function handleGetShared(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;
    setLoading(true);
    const res = await wabaApi.getShared(activeConfig, businessId);
    setResult(res);
    setLoading(false);
  }

  async function handleSubscribe() {
    if (!activeConfig) return;
    setLoading(true);
    const res = await wabaApi.subscribe(activeConfig);
    setResult(res);
    setLoading(false);
  }

  async function handleGetSubscriptions() {
    if (!activeConfig) return;
    setLoading(true);
    const res = await wabaApi.getSubscriptions(activeConfig);
    setResult(res);
    setLoading(false);
  }

  async function handleUnsubscribe() {
    if (!activeConfig) return;
    setLoading(true);
    const res = await wabaApi.unsubscribe(activeConfig);
    setResult(res);
    setLoading(false);
  }

  async function handleOverrideCallback(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;
    setLoading(true);
    const res = await wabaApi.overrideCallbackUrl(activeConfig, callbackUrl, verifyToken);
    setResult(res);
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-near-black">
          WhatsApp Business Account
        </h1>
        <p className="mt-1 text-sm text-warm-500">
          Manage shared WABAs and app subscriptions for webhook notifications.
        </p>
        <ApiDocLink />
      </div>

      <Tabs defaultValue="shared">
        <TabsList>
          <TabsTrigger value="shared">Get Shared WABAs</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="shared">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleGetShared} className="flex flex-col gap-4">
                <Input
                  label="Business ID"
                  placeholder="Enter your Business Portfolio ID"
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                  required
                  description="The ID of the business that owns the WABAs"
                />
                <Button type="submit" loading={loading}>
                  Get Shared WABAs
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <div className="flex gap-2 mb-4">
            <Button
              variant={subTab === "subscribe" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setSubTab("subscribe")}
            >
              Subscribe
            </Button>
            <Button
              variant={subTab === "getAll" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setSubTab("getAll")}
            >
              Get All
            </Button>
            <Button
              variant={subTab === "unsubscribe" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setSubTab("unsubscribe")}
            >
              Unsubscribe
            </Button>
            <Button
              variant={subTab === "override" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setSubTab("override")}
            >
              Override Callback URL
            </Button>
          </div>

          {subTab === "subscribe" && (
            <Card>
              <CardContent className="pt-6">
                <CardTitle className="text-base mb-3">Subscribe to Webhooks</CardTitle>
                <p className="text-sm text-warm-500 mb-4">
                  Subscribe your app to receive webhook notifications for this WABA.
                </p>
                <Button onClick={handleSubscribe} loading={loading}>
                  Subscribe
                </Button>
              </CardContent>
            </Card>
          )}

          {subTab === "getAll" && (
            <Card>
              <CardContent className="pt-6">
                <CardTitle className="text-base mb-3">Get All Subscriptions</CardTitle>
                <p className="text-sm text-warm-500 mb-4">
                  List all apps subscribed to webhooks for this WABA.
                </p>
                <Button onClick={handleGetSubscriptions} loading={loading}>
                  Get Subscriptions
                </Button>
              </CardContent>
            </Card>
          )}

          {subTab === "unsubscribe" && (
            <Card>
              <CardContent className="pt-6">
                <CardTitle className="text-base mb-3">Unsubscribe from Webhooks</CardTitle>
                <p className="text-sm text-warm-500 mb-4">
                  Remove your app&apos;s webhook subscription for this WABA.
                </p>
                <Button variant="danger" onClick={handleUnsubscribe} loading={loading}>
                  Unsubscribe
                </Button>
              </CardContent>
            </Card>
          )}

          {subTab === "override" && (
            <Card>
              <CardContent className="pt-6">
                <CardTitle className="text-base mb-3">Override Callback URL</CardTitle>
                <form onSubmit={handleOverrideCallback} className="flex flex-col gap-4">
                  <Input
                    label="Callback URL"
                    placeholder="https://your-server.com/webhook"
                    value={callbackUrl}
                    onChange={(e) => setCallbackUrl(e.target.value)}
                    required
                    description="The URL that will receive webhook notifications"
                  />
                  <Input
                    label="Verify Token"
                    placeholder="Your verification token"
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    required
                    description="A token used to verify the callback URL"
                  />
                  <Button type="submit" loading={loading}>
                    Override Callback URL
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <ResponseViewer result={result} />
    </div>
  );
}
