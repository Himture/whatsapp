"use client";

import { useState } from "react";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { ConfigGuard } from "@/components/whatsapp/config-guard";
import { ResponseViewer } from "@/components/whatsapp/response-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { migrationApi } from "@/lib/whatsapp";
import { ApiDocLink } from "@/components/whatsapp/api-doc-link";
import type { ApiCallResult } from "@/lib/types";

export default function MigrationPage() {
  return (
    <ConfigGuard>
      <MigrationContent />
    </ConfigGuard>
  );
}

function MigrationContent() {
  const { activeConfig } = useWhatsAppConfig();
  const [result, setResult] = useState<ApiCallResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState("");

  async function handleMigrate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;
    setLoading(true);
    const res = await migrationApi.migrate(activeConfig, pin);
    setResult(res);
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-near-black">
          Migration
        </h1>
        <p className="mt-1 text-sm text-warm-500">
          Migrate your phone number from the WhatsApp Business App or On-Premises API to the Cloud API.
        </p>
        <ApiDocLink />
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleMigrate} className="flex flex-col gap-4">
            <Input
              label="PIN"
              placeholder="Enter 6-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              maxLength={6}
              pattern="[0-9]{6}"
              description="The 6-digit two-step verification PIN associated with the phone number"
            />
            <Button type="submit" loading={loading}>
              Migrate Phone Number
            </Button>
          </form>
        </CardContent>
      </Card>

      <ResponseViewer result={result} />
    </div>
  );
}
