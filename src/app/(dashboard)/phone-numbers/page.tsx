"use client";

import { useState } from "react";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { ConfigGuard } from "@/components/whatsapp/config-guard";
import { ResponseViewer } from "@/components/whatsapp/response-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { phoneNumbersApi } from "@/lib/whatsapp";
import { ApiDocLink } from "@/components/whatsapp/api-doc-link";
import type { ApiCallResult } from "@/lib/types";

const CODE_METHOD_OPTIONS = [
  { label: "SMS", value: "SMS" },
  { label: "Voice", value: "VOICE" },
];

export default function PhoneNumbersPage() {
  return (
    <ConfigGuard>
      <PhoneNumbersContent />
    </ConfigGuard>
  );
}

function PhoneNumbersContent() {
  const { activeConfig } = useWhatsAppConfig();
  const [result, setResult] = useState<ApiCallResult | null>(null);
  const [loading, setLoading] = useState(false);

  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [displayNamePhoneNumberId, setDisplayNamePhoneNumberId] = useState("");
  const [displayNameResult, setDisplayNameResult] = useState<ApiCallResult | null>(null);
  const [codeMethod, setCodeMethod] = useState<"SMS" | "VOICE">("SMS");
  const [language, setLanguage] = useState("en");
  const [verificationCode, setVerificationCode] = useState("");

  async function handleListNumbers() {
    if (!activeConfig) return;
    setLoading(true);
    const res = await phoneNumbersApi.list(activeConfig);
    setResult(res);
    setLoading(false);
  }

  async function handleGetById(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;
    setLoading(true);
    const res = await phoneNumbersApi.getById(activeConfig, phoneNumberId);
    setResult(res);
    setLoading(false);
  }

  async function handleRequestVerification(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;
    setLoading(true);
    const res = await phoneNumbersApi.requestVerificationCode(activeConfig, codeMethod, language);
    setResult(res);
    setLoading(false);
  }

  async function handleVerifyCode(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;
    setLoading(true);
    const res = await phoneNumbersApi.verifyCode(activeConfig, verificationCode);
    setResult(res);
    setLoading(false);
  }

  async function handleGetDisplayNameStatus(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;
    setLoading(true);
    const res = await phoneNumbersApi.getDisplayNameStatus(activeConfig, displayNamePhoneNumberId);
    setDisplayNameResult(res);
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-near-black">
          Phone Numbers
        </h1>
        <p className="mt-1 text-sm text-warm-500">
          List, retrieve, and verify phone numbers associated with your WhatsApp Business Account.
        </p>
        <ApiDocLink />
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List Numbers</TabsTrigger>
          <TabsTrigger value="get">Get by ID</TabsTrigger>
          <TabsTrigger value="request">Request Verification</TabsTrigger>
          <TabsTrigger value="verify">Verify Code</TabsTrigger>
          <TabsTrigger value="display-name">Display Name Status</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-warm-500 mb-4">
                Retrieve all phone numbers registered to your WhatsApp Business Account.
              </p>
              <Button onClick={handleListNumbers} loading={loading}>
                List Phone Numbers
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="get">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleGetById} className="flex flex-col gap-4">
                <Input
                  label="Phone Number ID"
                  placeholder="Enter phone number ID"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  required
                />
                <Button type="submit" loading={loading}>
                  Get Phone Number
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="request">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleRequestVerification} className="flex flex-col gap-4">
                <Dropdown
                  label="Code Method"
                  options={CODE_METHOD_OPTIONS}
                  value={codeMethod}
                  onChange={(val: string) => setCodeMethod(val as "SMS" | "VOICE")}
                  required
                />
                <Input
                  label="Language"
                  placeholder="e.g., en, es, pt_BR"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  required
                  description="Language code for the verification message"
                />
                <Button type="submit" loading={loading}>
                  Request Verification Code
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verify">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
                <Input
                  label="Verification Code"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  description="Enter the 6-digit verification code you received"
                />
                <Button type="submit" loading={loading}>
                  Verify Code
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="display-name">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleGetDisplayNameStatus} className="flex flex-col gap-4">
                <Input
                  label="Phone Number ID"
                  placeholder="Enter phone number ID"
                  value={displayNamePhoneNumberId}
                  onChange={(e) => setDisplayNamePhoneNumberId(e.target.value)}
                  required
                  description="Retrieve the display name verification status for a phone number"
                />
                <Button type="submit" loading={loading}>
                  Get Display Name Status
                </Button>
              </form>
              <ResponseViewer result={displayNameResult} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ResponseViewer result={result} />
    </div>
  );
}
