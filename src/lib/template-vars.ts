// Derives the exact set of inputs a WhatsApp template requires from its
// component definition, and builds the `components` array Meta expects when
// sending. Keeping this pure (no React, no network) makes it unit-testable and
// reusable between the broadcast composer and any future single-send UI.

import type { TemplateRecord, TemplateComponent } from "./whatsapp";

// A single input the user must fill for a template, plus the metadata needed to
// render it and to place its value back into the outgoing payload.
export interface TemplateField {
  key: string;                       // stable form key
  label: string;                     // human label
  kind: "text" | "media";            // text input vs media (id/url) input
  mediaFormat?: "image" | "video" | "document"; // when kind === "media"
  example?: string;                  // example value from the template, if any
  // Where this value goes in the payload:
  target:
    | { type: "header_text" }
    | { type: "header_media"; format: "image" | "video" | "document" }
    | { type: "body"; index: number }
    | { type: "button_url"; index: number }
    | { type: "button_coupon"; index: number }
    | { type: "button_otp"; index: number };
}

// Highest {{n}} placeholder in a string (body/header text is positional).
function maxVarIndex(text: string | undefined): number {
  const nums = [...(text ?? "").matchAll(/\{\{\s*(\d+)\s*\}\}/g)].map((m) => parseInt(m[1] ?? "0", 10));
  return nums.length ? Math.max(...nums) : 0;
}

function hasVar(text: string | undefined): boolean {
  return /\{\{\s*\d+\s*\}\}/.test(text ?? "");
}

function urlHasVar(url: string | undefined): boolean {
  return /\{\{\s*\d+\s*\}\}/.test(url ?? "");
}

// Inspect a template and return every field the sender must provide.
export function extractTemplateFields(template: TemplateRecord | undefined): TemplateField[] {
  if (!template) return [];
  const fields: TemplateField[] = [];

  for (const comp of template.components) {
    if (comp.type === "HEADER") {
      if (comp.format === "TEXT" && hasVar(comp.text)) {
        fields.push({
          key: "header_text",
          label: "Header text variable",
          kind: "text",
          example: comp.example?.header_text?.[0],
          target: { type: "header_text" },
        });
      } else if (comp.format === "IMAGE" || comp.format === "VIDEO" || comp.format === "DOCUMENT") {
        const format = comp.format.toLowerCase() as "image" | "video" | "document";
        fields.push({
          key: "header_media",
          label: `Header ${format} (Media ID or URL)`,
          kind: "media",
          mediaFormat: format,
          target: { type: "header_media", format },
        });
      }
    } else if (comp.type === "BODY") {
      const n = maxVarIndex(comp.text);
      const examples = comp.example?.body_text?.[0];
      for (let i = 0; i < n; i++) {
        fields.push({
          key: `body_${i}`,
          label: `Body variable {{${i + 1}}}`,
          kind: "text",
          example: examples?.[i],
          target: { type: "body", index: i },
        });
      }
    } else if (comp.type === "BUTTONS") {
      (comp.buttons ?? []).forEach((btn, index) => {
        if (btn.type === "URL" && urlHasVar(btn.url)) {
          fields.push({
            key: `btn_${index}`,
            label: `"${btn.text}" button — URL variable`,
            kind: "text",
            target: { type: "button_url", index },
          });
        } else if (btn.type === "COPY_CODE") {
          fields.push({
            key: `btn_${index}`,
            label: `"${btn.text}" button — coupon code`,
            kind: "text",
            target: { type: "button_coupon", index },
          });
        } else if (btn.type === "OTP") {
          fields.push({
            key: `btn_${index}`,
            label: "One-time passcode",
            kind: "text",
            target: { type: "button_otp", index },
          });
        }
      });
    }
  }

  return fields;
}

// A value that looks like a public URL is sent as `link`; anything else is
// treated as an uploaded Media ID.
function mediaObject(value: string): { id: string } | { link: string } {
  return /^https?:\/\//i.test(value.trim()) ? { link: value.trim() } : { id: value.trim() };
}

// Build Meta's `components` array from the collected field values. Order follows
// the template's own component order; button parameters carry their index.
export function buildTemplateComponents(
  template: TemplateRecord | undefined,
  values: Record<string, string>,
): Array<Record<string, unknown>> {
  if (!template) return [];
  const components: Array<Record<string, unknown>> = [];

  for (const comp of template.components) {
    if (comp.type === "HEADER") {
      if (comp.format === "TEXT" && hasVar(comp.text)) {
        components.push({ type: "header", parameters: [{ type: "text", text: values["header_text"] ?? "" }] });
      } else if (comp.format === "IMAGE" || comp.format === "VIDEO" || comp.format === "DOCUMENT") {
        const format = comp.format.toLowerCase();
        components.push({
          type: "header",
          parameters: [{ type: format, [format]: mediaObject(values["header_media"] ?? "") }],
        });
      }
    } else if (comp.type === "BODY") {
      const n = maxVarIndex(comp.text);
      if (n > 0) {
        components.push({
          type: "body",
          parameters: Array.from({ length: n }, (_, i) => ({ type: "text", text: values[`body_${i}`] ?? "" })),
        });
      }
    } else if (comp.type === "BUTTONS") {
      (comp.buttons ?? []).forEach((btn, index) => {
        const val = values[`btn_${index}`] ?? "";
        if (btn.type === "URL" && urlHasVar(btn.url)) {
          components.push({ type: "button", sub_type: "url", index: String(index), parameters: [{ type: "text", text: val }] });
        } else if (btn.type === "COPY_CODE") {
          components.push({ type: "button", sub_type: "copy_code", index: String(index), parameters: [{ type: "coupon_code", coupon_code: val }] });
        } else if (btn.type === "OTP") {
          components.push({ type: "button", sub_type: "url", index: String(index), parameters: [{ type: "text", text: val }] });
        }
      });
    }
  }

  return components;
}

// Substitute collected values into a template's text for a live preview.
function fillText(text: string | undefined, pick: (n: number) => string | undefined): string {
  return (text ?? "").replace(/\{\{\s*(\d+)\s*\}\}/g, (_, n) => {
    const v = pick(parseInt(n, 10));
    return v && v.length ? v : `{{${n}}}`;
  });
}

type TemplateButtonType = NonNullable<TemplateComponent["buttons"]>[number]["type"];

export interface TemplatePreview {
  headerText?: string;
  headerMedia?: { format: "image" | "video" | "document"; value: string };
  body?: string;
  footer?: string;
  buttons: Array<{ text: string; type: TemplateButtonType }>;
}

// Produce a resolved preview of what the recipient will see.
export function renderTemplatePreview(
  template: TemplateRecord | undefined,
  values: Record<string, string>,
): TemplatePreview {
  const preview: TemplatePreview = { buttons: [] };
  if (!template) return preview;

  for (const comp of template.components) {
    if (comp.type === "HEADER") {
      if (comp.format === "TEXT") {
        preview.headerText = fillText(comp.text, () => values["header_text"]);
      } else if (comp.format === "IMAGE" || comp.format === "VIDEO" || comp.format === "DOCUMENT") {
        preview.headerMedia = { format: comp.format.toLowerCase() as "image" | "video" | "document", value: values["header_media"] ?? "" };
      }
    } else if (comp.type === "BODY") {
      preview.body = fillText(comp.text, (n) => values[`body_${n - 1}`]);
    } else if (comp.type === "FOOTER") {
      preview.footer = comp.text;
    } else if (comp.type === "BUTTONS") {
      preview.buttons = (comp.buttons ?? []).map((b) => ({ text: b.text, type: b.type }));
    }
  }

  return preview;
}
