"use client";

import { useState } from "react";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { ConfigGuard } from "@/components/whatsapp/config-guard";
import { ResponseViewer } from "@/components/whatsapp/response-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { paymentsApi } from "@/lib/whatsapp";
import { ApiDocLink } from "@/components/whatsapp/api-doc-link";
import type { ApiCallResult } from "@/lib/types";

export default function PaymentsPage() {
  return (
    <ConfigGuard>
      <PaymentsContent />
    </ConfigGuard>
  );
}

function PaymentsContent() {
  const { activeConfig } = useWhatsAppConfig();
  const [result, setResult] = useState<ApiCallResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [sgOrderTo, setSgOrderTo] = useState("");
  const [sgOrderDetailsJson, setSgOrderDetailsJson] = useState("");
  const [sgStatusTo, setSgStatusTo] = useState("");
  const [sgOrderStatusJson, setSgOrderStatusJson] = useState("");

  const [inOrderTo, setInOrderTo] = useState("");
  const [inOrderDetailsJson, setInOrderDetailsJson] = useState("");
  const [inStatusTo, setInStatusTo] = useState("");
  const [inOrderStatusJson, setInOrderStatusJson] = useState("");

  function parseJson(raw: string): Record<string, unknown> | null {
    try {
      setJsonError(null);
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      setJsonError("Invalid JSON. Please check your input.");
      return null;
    }
  }

  async function handleSgOrderDetails(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;
    const parsed = parseJson(sgOrderDetailsJson);
    if (!parsed) return;
    setLoading(true);
    const res = await paymentsApi.sendOrderDetails(activeConfig, sgOrderTo, parsed);
    setResult(res);
    setLoading(false);
  }

  async function handleSgOrderStatus(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;
    const parsed = parseJson(sgOrderStatusJson);
    if (!parsed) return;
    setLoading(true);
    const res = await paymentsApi.sendOrderStatus(activeConfig, sgStatusTo, parsed);
    setResult(res);
    setLoading(false);
  }

  async function handleInOrderDetails(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;
    const parsed = parseJson(inOrderDetailsJson);
    if (!parsed) return;
    setLoading(true);
    const res = await paymentsApi.sendOrderDetails(activeConfig, inOrderTo, parsed);
    setResult(res);
    setLoading(false);
  }

  async function handleInOrderStatus(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;
    const parsed = parseJson(inOrderStatusJson);
    if (!parsed) return;
    setLoading(true);
    const res = await paymentsApi.sendOrderStatus(activeConfig, inStatusTo, parsed);
    setResult(res);
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-near-black">
          Payments
        </h1>
        <p className="mt-1 text-sm text-warm-500">
          Send order details and order status messages for WhatsApp Payments (Singapore and India).
        </p>
        <ApiDocLink />
      </div>

      {jsonError && (
        <div className="mb-4 rounded-[var(--radius-micro)] bg-red-50 p-3 text-sm text-danger">
          {jsonError}
        </div>
      )}

      <Tabs defaultValue="singapore">
        <TabsList>
          <TabsTrigger value="singapore">Singapore</TabsTrigger>
          <TabsTrigger value="india">India</TabsTrigger>
        </TabsList>

        <TabsContent value="singapore">
          <div className="flex flex-col gap-6">
            <Card>
              <CardContent className="pt-6">
                <CardTitle className="text-base mb-4">Order Details (Singapore)</CardTitle>
                <form onSubmit={handleSgOrderDetails} className="flex flex-col gap-4">
                  <Input
                    label="Recipient Phone Number"
                    placeholder="e.g., 6591234567"
                    value={sgOrderTo}
                    onChange={(e) => setSgOrderTo(e.target.value)}
                    required
                  />
                  <Textarea
                    label="Order Details JSON"
                    placeholder='{"header": {...}, "body": {...}, "footer": {...}, "action": {...}}'
                    value={sgOrderDetailsJson}
                    onChange={(e) => setSgOrderDetailsJson(e.target.value)}
                    required
                    description="Interactive order_details payload as JSON"
                  />
                  <Button type="submit" loading={loading}>
                    Send Order Details
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <CardTitle className="text-base mb-4">Order Status (Singapore)</CardTitle>
                <form onSubmit={handleSgOrderStatus} className="flex flex-col gap-4">
                  <Input
                    label="Recipient Phone Number"
                    placeholder="e.g., 6591234567"
                    value={sgStatusTo}
                    onChange={(e) => setSgStatusTo(e.target.value)}
                    required
                  />
                  <Textarea
                    label="Order Status JSON"
                    placeholder='{"header": {...}, "body": {...}, "action": {...}}'
                    value={sgOrderStatusJson}
                    onChange={(e) => setSgOrderStatusJson(e.target.value)}
                    required
                    description="Interactive order_status payload as JSON"
                  />
                  <Button type="submit" loading={loading}>
                    Send Order Status
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="india">
          <div className="flex flex-col gap-6">
            <Card>
              <CardContent className="pt-6">
                <CardTitle className="text-base mb-4">Order Details (India)</CardTitle>
                <form onSubmit={handleInOrderDetails} className="flex flex-col gap-4">
                  <Input
                    label="Recipient Phone Number"
                    placeholder="e.g., 919876543210"
                    value={inOrderTo}
                    onChange={(e) => setInOrderTo(e.target.value)}
                    required
                  />
                  <Textarea
                    label="Order Details JSON"
                    placeholder='{"header": {...}, "body": {...}, "footer": {...}, "action": {...}}'
                    value={inOrderDetailsJson}
                    onChange={(e) => setInOrderDetailsJson(e.target.value)}
                    required
                    description="Interactive order_details payload as JSON"
                  />
                  <Button type="submit" loading={loading}>
                    Send Order Details
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <CardTitle className="text-base mb-4">Order Status (India)</CardTitle>
                <form onSubmit={handleInOrderStatus} className="flex flex-col gap-4">
                  <Input
                    label="Recipient Phone Number"
                    placeholder="e.g., 919876543210"
                    value={inStatusTo}
                    onChange={(e) => setInStatusTo(e.target.value)}
                    required
                  />
                  <Textarea
                    label="Order Status JSON"
                    placeholder='{"header": {...}, "body": {...}, "action": {...}}'
                    value={inOrderStatusJson}
                    onChange={(e) => setInOrderStatusJson(e.target.value)}
                    required
                    description="Interactive order_status payload as JSON"
                  />
                  <Button type="submit" loading={loading}>
                    Send Order Status
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <ResponseViewer result={result} />
    </div>
  );
}
