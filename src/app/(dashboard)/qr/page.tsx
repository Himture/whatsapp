"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import Image from "next/image";
import { Download, Copy, QrCode, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";

export default function QRPage() {
  const { configs, activeConfig } = useWhatsAppConfig();

  // Try to pre-fill from the active config's phone number.
  const defaultPhone = activeConfig?.phoneNumberId ?? "";

  const [phone, setPhone] = useState(defaultPhone);
  const [message, setMessage] = useState("");
  // Cache the last successfully generated QR alongside the URL it was generated from.
  // Render below derives qrDataUrl from this cache, so we never need setState-on-empty.
  const [qrCache, setQrCache] = useState<{ url: string; data: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const clean = phone.replace(/^\+/, "").replace(/\D/g, "");
  const waUrl = clean
    ? message.trim()
      ? `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
      : `https://wa.me/${clean}`
    : "";
  const qrDataUrl = qrCache && qrCache.url === waUrl ? qrCache.data : null;

  useEffect(() => {
    if (!waUrl) return;
    let cancelled = false;
    QRCode.toDataURL(waUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
      color: { dark: "#1a1a1a", light: "#ffffff" },
    })
      .then((data) => { if (!cancelled) setQrCache({ url: waUrl, data }); })
      .catch(() => { /* leave cache stale; render falls back to empty state */ });
    return () => { cancelled = true; };
  }, [waUrl]);

  async function handleCopy() {
    if (!waUrl) return;
    await navigator.clipboard.writeText(waUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `whatsapp-qr-${phone.replace(/\D/g, "")}.png`;
    a.click();
  }

  const phoneOptions = configs
    .map((c) => ({ label: `${c.name} (${c.phoneNumberId})`, value: c.phoneNumberId }));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-near-black">QR Code Generator</h1>
        <p className="mt-1 text-sm text-warm-500">Generate click-to-chat QR codes and direct links for your WhatsApp number</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="flex flex-col gap-4">
          {phoneOptions.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-near-black mb-1">Quick select</label>
              <select
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-[var(--radius-micro)] border border-input-border bg-white px-3 py-2 text-sm text-near-black focus:border-notion-blue focus:outline-none focus:ring-2 focus:ring-focus-blue/20"
              >
                <option value="">— enter manually —</option>
                {phoneOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}

          <Input
            label="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+15551234567 or 15551234567"
            description="Include country code without the +"
          />

          <div>
            <label className="block text-sm font-medium text-near-black mb-1">Pre-filled message (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi, I'd like to know more about your products…"
              rows={3}
              className="w-full rounded-[var(--radius-micro)] border border-input-border bg-white px-3 py-2 text-sm text-near-black placeholder:text-warm-500 focus:border-notion-blue focus:outline-none focus:ring-2 focus:ring-focus-blue/20"
            />
            <p className="mt-1 text-xs text-warm-500">Opens with this text pre-filled in the WhatsApp compose box.</p>
          </div>

          {waUrl && (
            <Card className="bg-warm-white border-none">
              <CardContent className="py-3">
                <p className="text-xs font-medium text-warm-500 mb-1">Link</p>
                <p className="text-xs font-mono text-near-black break-all">{waUrl}</p>
                <Button variant="secondary" size="sm" className="mt-2" onClick={handleCopy}>
                  <Copy className="size-3.5" />
                  {copied ? "Copied!" : "Copy link"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* QR preview */}
        <div className="flex flex-col items-center justify-center">
          {qrDataUrl ? (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-[var(--radius-subtle)] border border-black/10 p-4 bg-white shadow-card">
                <Image src={qrDataUrl} alt="WhatsApp QR code" width={256} height={256} unoptimized />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleDownload}>
                  <Download className="size-4" /> Download PNG
                </Button>
              </div>
              <p className="text-xs text-warm-500 text-center">
                Scan with any phone to open WhatsApp with your number pre-selected.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 w-64 rounded-[var(--radius-subtle)] border-2 border-dashed border-black/10 bg-warm-white text-warm-500">
              <QrCode className="size-12 mb-3" aria-hidden="true" />
              <p className="text-xs text-center px-4">Enter a phone number to generate a QR code</p>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8 rounded-[var(--radius-subtle)] border border-black/10 bg-warm-white p-4">
        <div className="flex items-center gap-2 mb-2">
          <Phone className="size-4 text-notion-blue" />
          <p className="text-sm font-medium text-near-black">Use cases</p>
        </div>
        <ul className="text-sm text-warm-500 space-y-1">
          <li>• Print on business cards, flyers, packaging, or receipts</li>
          <li>• Embed the link on your website as a &quot;Chat on WhatsApp&quot; button</li>
          <li>• Use pre-filled messages to track campaign sources</li>
          <li>• Add to email signatures for easy customer contact</li>
        </ul>
      </div>
    </div>
  );
}
