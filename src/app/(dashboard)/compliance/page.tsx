"use client";

import { useState } from "react";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { ConfigGuard } from "@/components/whatsapp/config-guard";
import { ResponseViewer } from "@/components/whatsapp/response-viewer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { complianceApi } from "@/lib/whatsapp";
import { ApiDocLink } from "@/components/whatsapp/api-doc-link";
import type { ApiCallResult } from "@/lib/types";

export default function CompliancePage() {
  return (
    <ConfigGuard>
      <ComplianceContent />
    </ConfigGuard>
  );
}

function ComplianceContent() {
  const { activeConfig } = useWhatsAppConfig();
  const [result, setResult] = useState<ApiCallResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [complianceJson, setComplianceJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  async function handleGetInfo() {
    if (!activeConfig) return;
    setLoading(true);
    const res = await complianceApi.get(activeConfig);
    setResult(res);
    setLoading(false);
  }

  async function handleAddInfo(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(complianceJson) as Record<string, unknown>;
      setJsonError(null);
    } catch {
      setJsonError("Invalid JSON. Please check your input.");
      return;
    }

    setLoading(true);
    const res = await complianceApi.add(activeConfig, parsed);
    setResult(res);
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-near-black">
          Compliance
        </h1>
        <p className="mt-1 text-sm text-warm-500">
          View and manage business compliance information for your WhatsApp Business Account.
        </p>
        <ApiDocLink />
      </div>

      {jsonError && (
        <div className="mb-4 rounded-[var(--radius-micro)] bg-red-50 p-3 text-sm text-danger">
          {jsonError}
        </div>
      )}

      <Tabs defaultValue="get">
        <TabsList>
          <TabsTrigger value="get">Get Info</TabsTrigger>
          <TabsTrigger value="add">Add Info</TabsTrigger>
        </TabsList>

        <TabsContent value="get">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-warm-500 mb-4">
                Retrieve the current business compliance information for your WABA.
              </p>
              <Button onClick={handleGetInfo} loading={loading}>
                Get Compliance Info
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleAddInfo} className="flex flex-col gap-4">
                <Textarea
                  label="Compliance Info JSON"
                  placeholder='{"entity_type": "...", "entity_name": "...", ...}'
                  value={complianceJson}
                  onChange={(e) => setComplianceJson(e.target.value)}
                  required
                  description="Business compliance information as a JSON object"
                />
                <Button type="submit" loading={loading}>
                  Add Compliance Info
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ResponseViewer result={result} />
    </div>
  );
}
