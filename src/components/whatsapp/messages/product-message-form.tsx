"use client";

import { useState } from "react";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { messagesApi } from "@/lib/whatsapp";
import { ResponseViewer } from "@/components/whatsapp/response-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { ApiCallResult } from "@/lib/types";

const FIELD_LABELS = {
  RECIPIENT: "Recipient Phone Number",
  CATALOG_ID: "Catalog ID",
  PRODUCT_RETAILER_ID: "Product Retailer ID",
  BODY: "Body Text",
  FOOTER: "Footer Text",
  HEADER: "Header Text",
  THUMBNAIL_PRODUCT_RETAILER_ID: "Thumbnail Product Retailer ID",
  SECTION_TITLE: "Section Title",
  PRODUCT_RETAILER_IDS: "Product Retailer IDs",
} as const;

const PLACEHOLDERS = {
  RECIPIENT: "e.g. 14155238886",
  CATALOG_ID: "Enter catalog ID",
  PRODUCT_RETAILER_ID: "Enter product retailer ID",
  BODY: "Optional body text",
  FOOTER: "Optional footer text",
  HEADER: "Optional header text",
  THUMBNAIL_PRODUCT_RETAILER_ID: "Optional thumbnail product retailer ID",
  SECTION_TITLE: "e.g. Popular Items",
  PRODUCT_RETAILER_IDS: "Comma-separated IDs, e.g. id1, id2, id3",
} as const;

const MAX_PRODUCT_SECTIONS = 10;



interface ProductSection {
  title: string;
  productRetailerIds: string;
}

function createEmptyProductSection(): ProductSection {
  return { title: "", productRetailerIds: "" };
}



function SingleProductForm() {
  const { activeConfig } = useWhatsAppConfig();
  const [recipient, setRecipient] = useState("");
  const [catalogId, setCatalogId] = useState("");
  const [productRetailerId, setProductRetailerId] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiCallResult | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;

    setLoading(true);
    try {
      const response = await messagesApi.sendSingleProduct(
        activeConfig,
        recipient,
        catalogId,
        productRetailerId,
        bodyText || undefined,
        footerText || undefined,
      );
      setResult(response);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <Input
        label={FIELD_LABELS.RECIPIENT}
        placeholder={PLACEHOLDERS.RECIPIENT}
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        required
      />

      <Input
        label={FIELD_LABELS.CATALOG_ID}
        placeholder={PLACEHOLDERS.CATALOG_ID}
        value={catalogId}
        onChange={(e) => setCatalogId(e.target.value)}
        required
      />

      <Input
        label={FIELD_LABELS.PRODUCT_RETAILER_ID}
        placeholder={PLACEHOLDERS.PRODUCT_RETAILER_ID}
        value={productRetailerId}
        onChange={(e) => setProductRetailerId(e.target.value)}
        required
      />

      <Input
        label={FIELD_LABELS.BODY}
        placeholder={PLACEHOLDERS.BODY}
        value={bodyText}
        onChange={(e) => setBodyText(e.target.value)}
      />

      <Input
        label={FIELD_LABELS.FOOTER}
        placeholder={PLACEHOLDERS.FOOTER}
        value={footerText}
        onChange={(e) => setFooterText(e.target.value)}
      />

      <Button type="submit" loading={loading}>
        Send Single Product
      </Button>

      <ResponseViewer result={result} />
    </form>
  );
}



function MultiProductForm() {
  const { activeConfig } = useWhatsAppConfig();
  const [recipient, setRecipient] = useState("");
  const [catalogId, setCatalogId] = useState("");
  const [headerText, setHeaderText] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [sections, setSections] = useState<ProductSection[]>([createEmptyProductSection()]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiCallResult | null>(null);

  function updateSection(idx: number, field: keyof ProductSection, value: string) {
    setSections((prev) =>
      prev.map((section, i) =>
        i === idx ? { ...section, [field]: value } : section,
      ),
    );
  }

  function addSection() {
    if (sections.length < MAX_PRODUCT_SECTIONS) {
      setSections((prev) => [...prev, createEmptyProductSection()]);
    }
  }

  function removeSection(idx: number) {
    if (sections.length > 1) {
      setSections((prev) => prev.filter((_, i) => i !== idx));
    }
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;

    const parsedSections = sections.map((section) => ({
      title: section.title,
      product_items: section.productRetailerIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .map((id) => ({ product_retailer_id: id })),
    }));

    setLoading(true);
    try {
      const response = await messagesApi.sendMultiProduct(
        activeConfig,
        recipient,
        catalogId,
        parsedSections,
        headerText || undefined,
        bodyText || undefined,
        footerText || undefined,
      );
      setResult(response);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <Input
        label={FIELD_LABELS.RECIPIENT}
        placeholder={PLACEHOLDERS.RECIPIENT}
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        required
      />

      <Input
        label={FIELD_LABELS.CATALOG_ID}
        placeholder={PLACEHOLDERS.CATALOG_ID}
        value={catalogId}
        onChange={(e) => setCatalogId(e.target.value)}
        required
      />

      <Input
        label={FIELD_LABELS.HEADER}
        placeholder={PLACEHOLDERS.HEADER}
        value={headerText}
        onChange={(e) => setHeaderText(e.target.value)}
      />

      <Input
        label={FIELD_LABELS.BODY}
        placeholder={PLACEHOLDERS.BODY}
        value={bodyText}
        onChange={(e) => setBodyText(e.target.value)}
      />

      <Input
        label={FIELD_LABELS.FOOTER}
        placeholder={PLACEHOLDERS.FOOTER}
        value={footerText}
        onChange={(e) => setFooterText(e.target.value)}
      />

      {/* Sections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-near-black">Sections</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addSection}
            disabled={sections.length >= MAX_PRODUCT_SECTIONS}
          >
            Add Section
          </Button>
        </div>

        {sections.map((section, si) => (
          <div
            key={si}
            className="rounded-[var(--radius-standard)] border border-[#ddd] p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-near-black">
                Section {si + 1}
              </span>
              {sections.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSection(si)}
                >
                  Remove
                </Button>
              )}
            </div>

            <Input
              label={FIELD_LABELS.SECTION_TITLE}
              placeholder={PLACEHOLDERS.SECTION_TITLE}
              value={section.title}
              onChange={(e) => updateSection(si, "title", e.target.value)}
              required
            />

            <Input
              label={FIELD_LABELS.PRODUCT_RETAILER_IDS}
              placeholder={PLACEHOLDERS.PRODUCT_RETAILER_IDS}
              value={section.productRetailerIds}
              onChange={(e) => updateSection(si, "productRetailerIds", e.target.value)}
              required
              description="Enter product retailer IDs separated by commas"
            />
          </div>
        ))}
      </div>

      <Button type="submit" loading={loading}>
        Send Multi-Product
      </Button>

      <ResponseViewer result={result} />
    </form>
  );
}



function CatalogForm() {
  const { activeConfig } = useWhatsAppConfig();
  const [recipient, setRecipient] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [thumbnailProductRetailerId, setThumbnailProductRetailerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiCallResult | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;

    setLoading(true);
    try {
      const response = await messagesApi.sendCatalogMessage(
        activeConfig,
        recipient,
        bodyText || undefined,
        footerText || undefined,
        thumbnailProductRetailerId || undefined,
      );
      setResult(response);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <Input
        label={FIELD_LABELS.RECIPIENT}
        placeholder={PLACEHOLDERS.RECIPIENT}
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        required
      />

      <Input
        label={FIELD_LABELS.BODY}
        placeholder={PLACEHOLDERS.BODY}
        value={bodyText}
        onChange={(e) => setBodyText(e.target.value)}
      />

      <Input
        label={FIELD_LABELS.FOOTER}
        placeholder={PLACEHOLDERS.FOOTER}
        value={footerText}
        onChange={(e) => setFooterText(e.target.value)}
      />

      <Input
        label={FIELD_LABELS.THUMBNAIL_PRODUCT_RETAILER_ID}
        placeholder={PLACEHOLDERS.THUMBNAIL_PRODUCT_RETAILER_ID}
        value={thumbnailProductRetailerId}
        onChange={(e) => setThumbnailProductRetailerId(e.target.value)}
      />

      <Button type="submit" loading={loading}>
        Send Catalog Message
      </Button>

      <ResponseViewer result={result} />
    </form>
  );
}



export function ProductMessageForm() {
  return (
    <Tabs defaultValue="single">
      <TabsList>
        <TabsTrigger value="single">Single Product</TabsTrigger>
        <TabsTrigger value="multi">Multi-Product</TabsTrigger>
        <TabsTrigger value="catalog">Catalog</TabsTrigger>
      </TabsList>
      <TabsContent value="single">
        <SingleProductForm />
      </TabsContent>
      <TabsContent value="multi">
        <MultiProductForm />
      </TabsContent>
      <TabsContent value="catalog">
        <CatalogForm />
      </TabsContent>
    </Tabs>
  );
}
