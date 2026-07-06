import {
  MESSAGING_PRODUCT,
} from "./constants";
import type {
  WhatsAppClientConfig,
  ApiCallResult,
} from "./types";
import { buildGraphApiUrl } from "./utils";

// Shape of a WhatsApp/Graph API error body. Meta nests the most actionable
// text in `error_data.details` (e.g. "Recipient phone number not in allowed
// list"), which is often more specific than the top-level `message`.
export interface GraphErrorBody {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    error_data?: { details?: string; messaging_product?: string };
    fbtrace_id?: string;
  };
}

// Turn a Graph API error body into a single human-readable line, combining the
// message, the more specific details, and the numeric code for support/lookup.
export function parseGraphError(data: unknown, fallback = "Request failed"): string {
  const err = (data as GraphErrorBody | undefined)?.error;
  if (!err) return fallback;
  const parts: string[] = [];
  if (err.message) parts.push(err.message);
  const details = err.error_data?.details;
  if (details && details !== err.message) parts.push(details);
  const base = parts.join(" — ") || fallback;
  if (typeof err.code !== "number") return base;
  const code = err.error_subcode ? `${err.code}/${err.error_subcode}` : `${err.code}`;
  return `${base} (code ${code})`;
}

// Every method in this file runs in the browser and hits graph.facebook.com
// directly. The user's access token never touches our server.
//
// Callers should check `result.ok` — Meta's API sometimes returns a 200
// status with an error body, so use the flag rather than the status code.
async function graphFetch<T>(
  config: WhatsAppClientConfig,
  path: string,
  options?: RequestInit,
): Promise<ApiCallResult<T>> {
  const url = buildGraphApiUrl(config.version, path);
  const start = performance.now();

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    // Some successful endpoints (media.delete, deregister, unsubscribe) return
    // an empty or non-JSON body. Read the text first and only parse when there's
    // something to parse, so an empty 200 isn't mislabeled a network error.
    const text = await response.text();
    const duration = Math.round(performance.now() - start);
    const data = (text ? JSON.parse(text) : { success: response.ok }) as T;

    return {
      ok: response.ok,
      status: response.status,
      data,
      duration,
    };
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    return {
      ok: false,
      status: 0,
      data: {
        error: {
          message: error instanceof Error ? error.message : "Network error",
          type: "NetworkError",
          code: 0,
          fbtrace_id: "",
        },
      } as T,
      duration,
    };
  }
}

// Resumable Upload (step 2): POST the raw file bytes to the upload session. This
// step uses an `OAuth` auth scheme (not Bearer) plus a file_offset header and
// returns { h: "<handle>" } — different enough from graphFetch to need its own.
async function graphUploadFetch(
  config: WhatsAppClientConfig,
  uploadSessionId: string,
  file: File,
): Promise<ApiCallResult> {
  const url = buildGraphApiUrl(config.version, uploadSessionId);
  const start = performance.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `OAuth ${config.accessToken}`,
        file_offset: "0",
      },
      body: file,
    });

    // May return an empty body on success — read text first so an empty 200
    // isn't turned into a bogus network error by response.json().
    const text = await response.text();
    const duration = Math.round(performance.now() - start);
    const data = text ? JSON.parse(text) : { success: response.ok };

    return { ok: response.ok, status: response.status, data, duration };
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    return {
      ok: false,
      status: 0,
      data: {
        error: {
          message: error instanceof Error ? error.message : "Network error",
          type: "NetworkError",
          code: 0,
          fbtrace_id: "",
        },
      },
      duration,
    };
  }
}


// Multipart upload for the /media endpoint (different from the Resumable Upload
// flow above): standard Bearer auth + multipart form-data with the file.
async function graphFetchFormData<T>(
  config: WhatsAppClientConfig,
  path: string,
  formData: FormData,
): Promise<ApiCallResult<T>> {
  const url = buildGraphApiUrl(config.version, path);
  const start = performance.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: formData,
    });

    // Read text first: a successful call with an empty/non-JSON body should not
    // be surfaced as a network error by a throwing response.json().
    const text = await response.text();
    const duration = Math.round(performance.now() - start);
    const data = (text ? JSON.parse(text) : { success: response.ok }) as T;

    return {
      ok: response.ok,
      status: response.status,
      data,
      duration,
    };
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    return {
      ok: false,
      status: 0,
      data: {
        error: {
          message: error instanceof Error ? error.message : "Network error",
          type: "NetworkError",
          code: 0,
          fbtrace_id: "",
        },
      } as T,
      duration,
    };
  }
}


export const messagesApi = {
  sendText(
    config: WhatsAppClientConfig,
    to: string,
    body: string,
    options?: { previewUrl?: boolean; replyToMessageId?: string },
  ) {
    const payload: Record<string, unknown> = {
      messaging_product: MESSAGING_PRODUCT,
      to,
      type: "text",
      text: { preview_url: options?.previewUrl ?? false, body },
    };
    if (options?.replyToMessageId) {
      payload.context = { message_id: options.replyToMessageId };
    }
    return graphFetch(config, `${config.phoneNumberId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  sendReaction(
    config: WhatsAppClientConfig,
    to: string,
    messageId: string,
    emoji: string,
  ) {
    return graphFetch(config, `${config.phoneNumberId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        messaging_product: MESSAGING_PRODUCT,
        to,
        type: "reaction",
        reaction: { message_id: messageId, emoji },
      }),
    });
  },

  sendMedia(
    config: WhatsAppClientConfig,
    to: string,
    mediaType: "image" | "audio" | "video" | "document" | "sticker",
    media: { id?: string; link?: string; caption?: string; filename?: string },
    replyToMessageId?: string,
  ) {
    const mediaObj: Record<string, string> = {};
    if (media.id) mediaObj.id = media.id;
    if (media.link) mediaObj.link = media.link;
    if (media.caption) mediaObj.caption = media.caption;
    if (media.filename) mediaObj.filename = media.filename;

    const payload: Record<string, unknown> = {
      messaging_product: MESSAGING_PRODUCT,
      to,
      type: mediaType,
      [mediaType]: mediaObj,
    };
    if (replyToMessageId) {
      payload.context = { message_id: replyToMessageId };
    }
    return graphFetch(config, `${config.phoneNumberId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  sendLocation(
    config: WhatsAppClientConfig,
    to: string,
    location: { latitude: number; longitude: number; name?: string; address?: string },
    replyToMessageId?: string,
  ) {
    const payload: Record<string, unknown> = {
      messaging_product: MESSAGING_PRODUCT,
      to,
      type: "location",
      location,
    };
    if (replyToMessageId) {
      payload.context = { message_id: replyToMessageId };
    }
    return graphFetch(config, `${config.phoneNumberId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  sendContact(
    config: WhatsAppClientConfig,
    to: string,
    contacts: Array<Record<string, unknown>>,
    replyToMessageId?: string,
  ) {
    const payload: Record<string, unknown> = {
      messaging_product: MESSAGING_PRODUCT,
      to,
      type: "contacts",
      contacts,
    };
    if (replyToMessageId) {
      payload.context = { message_id: replyToMessageId };
    }
    return graphFetch(config, `${config.phoneNumberId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  sendTemplate(
    config: WhatsAppClientConfig,
    to: string,
    templateName: string,
    languageCode: string,
    components?: Array<Record<string, unknown>>,
  ) {
    const template: Record<string, unknown> = {
      name: templateName,
      language: { code: languageCode },
    };
    if (components?.length) {
      template.components = components;
    }
    return graphFetch(config, `${config.phoneNumberId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        messaging_product: MESSAGING_PRODUCT,
        to,
        type: "template",
        template,
      }),
    });
  },

  sendInteractiveList(
    config: WhatsAppClientConfig,
    to: string,
    interactive: Record<string, unknown>,
    replyToMessageId?: string,
  ) {
    const payload: Record<string, unknown> = {
      messaging_product: MESSAGING_PRODUCT,
      to,
      type: "interactive",
      interactive: { type: "list", ...interactive },
    };
    if (replyToMessageId) {
      payload.context = { message_id: replyToMessageId };
    }
    return graphFetch(config, `${config.phoneNumberId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  sendInteractiveButtons(
    config: WhatsAppClientConfig,
    to: string,
    interactive: Record<string, unknown>,
    replyToMessageId?: string,
  ) {
    const payload: Record<string, unknown> = {
      messaging_product: MESSAGING_PRODUCT,
      to,
      type: "interactive",
      interactive: { type: "button", ...interactive },
    };
    if (replyToMessageId) {
      payload.context = { message_id: replyToMessageId };
    }
    return graphFetch(config, `${config.phoneNumberId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  sendProduct(
    config: WhatsAppClientConfig,
    to: string,
    interactive: Record<string, unknown>,
  ) {
    return graphFetch(config, `${config.phoneNumberId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        messaging_product: MESSAGING_PRODUCT,
        to,
        type: "interactive",
        interactive,
      }),
    });
  },

  sendSingleProduct(
    config: WhatsAppClientConfig,
    to: string,
    catalogId: string,
    productRetailerId: string,
    body?: string,
    footer?: string,
  ) {
    const interactive: Record<string, unknown> = {
      type: "product",
      action: {
        catalog_id: catalogId,
        product_retailer_id: productRetailerId,
      },
    };
    if (body) interactive.body = { text: body };
    if (footer) interactive.footer = { text: footer };

    return graphFetch(config, `${config.phoneNumberId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        messaging_product: MESSAGING_PRODUCT,
        to,
        type: "interactive",
        interactive,
      }),
    });
  },

  sendMultiProduct(
    config: WhatsAppClientConfig,
    to: string,
    catalogId: string,
    sections: Array<{ title: string; product_items: Array<{ product_retailer_id: string }> }>,
    header?: string,
    body?: string,
    footer?: string,
  ) {
    const interactive: Record<string, unknown> = {
      type: "product_list",
      action: {
        catalog_id: catalogId,
        sections,
      },
    };
    if (header) interactive.header = { type: "text", text: header };
    if (body) interactive.body = { text: body };
    if (footer) interactive.footer = { text: footer };

    return graphFetch(config, `${config.phoneNumberId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        messaging_product: MESSAGING_PRODUCT,
        to,
        type: "interactive",
        interactive,
      }),
    });
  },

  sendCatalogMessage(
    config: WhatsAppClientConfig,
    to: string,
    body?: string,
    footer?: string,
    thumbnailProductRetailerId?: string,
  ) {
    const interactive: Record<string, unknown> = {
      type: "catalog_message",
      action: {
        name: "catalog_message",
        ...(thumbnailProductRetailerId
          ? { parameters: { thumbnail_product_retailer_id: thumbnailProductRetailerId } }
          : {}),
      },
    };
    if (body) interactive.body = { text: body };
    if (footer) interactive.footer = { text: footer };

    return graphFetch(config, `${config.phoneNumberId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        messaging_product: MESSAGING_PRODUCT,
        to,
        type: "interactive",
        interactive,
      }),
    });
  },

  markAsRead(config: WhatsAppClientConfig, messageId: string) {
    return graphFetch(config, `${config.phoneNumberId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        messaging_product: MESSAGING_PRODUCT,
        status: "read",
        message_id: messageId,
      }),
    });
  },
};


export const mediaApi = {
  upload(config: WhatsAppClientConfig, file: File, type: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("messaging_product", MESSAGING_PRODUCT);
    formData.append("type", type);
    return graphFetchFormData(config, `${config.phoneNumberId}/media`, formData);
  },

  getUrl(config: WhatsAppClientConfig, mediaId: string) {
    return graphFetch(config, mediaId, { method: "GET" });
  },

  delete(config: WhatsAppClientConfig, mediaId: string) {
    return graphFetch(config, mediaId, { method: "DELETE" });
  },
};


export const phoneNumbersApi = {
  list(config: WhatsAppClientConfig) {
    return graphFetch(config, `${config.wabaId}/phone_numbers`, {
      method: "GET",
    });
  },

  getById(config: WhatsAppClientConfig, phoneNumberId: string) {
    return graphFetch(config, phoneNumberId, { method: "GET" });
  },

  requestVerificationCode(
    config: WhatsAppClientConfig,
    codeMethod: "SMS" | "VOICE",
    language: string,
  ) {
    return graphFetch(config, `${config.phoneNumberId}/request_code`, {
      method: "POST",
      body: JSON.stringify({ code_method: codeMethod, language }),
    });
  },

  verifyCode(config: WhatsAppClientConfig, code: string) {
    return graphFetch(config, `${config.phoneNumberId}/verify_code`, {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },

  getDisplayNameStatus(config: WhatsAppClientConfig, phoneNumberId: string) {
    return graphFetch(config, `${phoneNumberId}?fields=name_status,new_name_status`, {
      method: "GET",
    });
  },
};


export const businessProfileApi = {
  get(config: WhatsAppClientConfig) {
    return graphFetch(
      config,
      `${config.phoneNumberId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`,
      { method: "GET" },
    );
  },

  update(config: WhatsAppClientConfig, profile: Record<string, unknown>) {
    return graphFetch(
      config,
      `${config.phoneNumberId}/whatsapp_business_profile`,
      {
        method: "POST",
        body: JSON.stringify({ messaging_product: MESSAGING_PRODUCT, ...profile }),
      },
    );
  },

  createUploadSession(
    config: WhatsAppClientConfig,
    fileLength: number,
    fileType: string,
    fileName: string,
  ): Promise<ApiCallResult> {
    if (!config.appId) {
      return Promise.resolve({
        ok: false,
        status: 0,
        data: {
          error: {
            message: "Add your Meta App ID in Settings — the Resumable Upload endpoint is /{app-id}/uploads.",
            type: "ConfigError",
            code: 0,
            fbtrace_id: "",
          },
        },
        duration: 0,
      });
    }
    // Resumable Upload (step 1): open a session on the app node. Params go in the
    // query string; Meta returns { id: "upload:<session>" }.
    const params = new URLSearchParams({
      file_length: String(fileLength),
      file_type: fileType,
      file_name: fileName,
    });
    return graphFetch(config, `${config.appId}/uploads?${params.toString()}`, {
      method: "POST",
    });
  },

  uploadFileData(config: WhatsAppClientConfig, uploadSessionId: string, fileData: File): Promise<ApiCallResult> {
    return graphUploadFetch(config, uploadSessionId, fileData);
  },

  // Resumable Upload (step 3): attach the uploaded file handle to the business
  // profile as its picture.
  setProfilePicture(config: WhatsAppClientConfig, handle: string) {
    return graphFetch(config, `${config.phoneNumberId}/whatsapp_business_profile`, {
      method: "POST",
      body: JSON.stringify({
        messaging_product: MESSAGING_PRODUCT,
        profile_picture_handle: handle,
      }),
    });
  },
};


export const registrationApi = {
  register(config: WhatsAppClientConfig, pin: string) {
    return graphFetch(config, `${config.phoneNumberId}/register`, {
      method: "POST",
      body: JSON.stringify({
        messaging_product: MESSAGING_PRODUCT,
        pin,
      }),
    });
  },

  deregister(config: WhatsAppClientConfig) {
    return graphFetch(config, `${config.phoneNumberId}/deregister`, {
      method: "POST",
    });
  },
};


export const twoStepVerificationApi = {
  setPin(config: WhatsAppClientConfig, pin: string) {
    return graphFetch(config, config.phoneNumberId, {
      method: "POST",
      body: JSON.stringify({ pin }),
    });
  },
};


export const wabaApi = {
  getShared(config: WhatsAppClientConfig, businessId: string) {
    return graphFetch(
      config,
      `${businessId}/owned_whatsapp_business_accounts`,
      { method: "GET" },
    );
  },

  subscribe(config: WhatsAppClientConfig) {
    return graphFetch(config, `${config.wabaId}/subscribed_apps`, {
      method: "POST",
    });
  },

  getSubscriptions(config: WhatsAppClientConfig) {
    return graphFetch(config, `${config.wabaId}/subscribed_apps`, {
      method: "GET",
    });
  },

  unsubscribe(config: WhatsAppClientConfig) {
    return graphFetch(config, `${config.wabaId}/subscribed_apps`, {
      method: "DELETE",
    });
  },

  overrideCallbackUrl(
    config: WhatsAppClientConfig,
    callbackUrl: string,
    verifyToken: string,
  ) {
    return graphFetch(config, `${config.wabaId}/subscribed_apps`, {
      method: "POST",
      body: JSON.stringify({
        override_callback_uri: callbackUrl,
        verify_token: verifyToken,
      }),
    });
  },
};


export const paymentsApi = {
  sendOrderDetails(
    config: WhatsAppClientConfig,
    to: string,
    order: Record<string, unknown>,
  ) {
    return graphFetch(config, `${config.phoneNumberId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        messaging_product: MESSAGING_PRODUCT,
        to,
        type: "interactive",
        interactive: { type: "order_details", ...order },
      }),
    });
  },

  sendOrderStatus(
    config: WhatsAppClientConfig,
    to: string,
    status: Record<string, unknown>,
  ) {
    return graphFetch(config, `${config.phoneNumberId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        messaging_product: MESSAGING_PRODUCT,
        to,
        type: "interactive",
        interactive: { type: "order_status", ...status },
      }),
    });
  },
};


export const complianceApi = {
  get(config: WhatsAppClientConfig) {
    return graphFetch(
      config,
      `${config.wabaId}?fields=business_compliance_info`,
      { method: "GET" },
    );
  },

  add(config: WhatsAppClientConfig, complianceInfo: Record<string, unknown>) {
    return graphFetch(config, config.wabaId, {
      method: "POST",
      body: JSON.stringify({ business_compliance_info: complianceInfo }),
    });
  },
};


export const migrationApi = {
  migrate(config: WhatsAppClientConfig, pin: string) {
    return graphFetch(config, `${config.phoneNumberId}/register`, {
      method: "POST",
      body: JSON.stringify({
        messaging_product: MESSAGING_PRODUCT,
        pin,
      }),
    });
  },
};

// ─── Template management ──────────────────────────────────────────────────────

export interface TemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "LOCATION";
  text?: string;
  buttons?: Array<{
    type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "COPY_CODE" | "OTP";
    text: string;
    url?: string;
    phone_number?: string;
  }>;
  example?: {
    header_text?: string[];
    header_handle?: string[];
    body_text?: string[][];
  };
}

export interface TemplateRecord {
  id: string;
  name: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "PAUSED" | "DISABLED" | "IN_APPEAL";
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  language: string;
  components: TemplateComponent[];
  quality_score?: { score: string };
  rejected_reason?: string;
}

export interface TemplateCreateInput {
  name: string;
  language: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  components: TemplateComponent[];
  allow_category_change?: boolean;
}

interface TemplateListPage {
  data: TemplateRecord[];
  paging?: { cursors?: { before?: string; after?: string }; next?: string };
}

export const templatesApi = {
  // Meta paginates message_templates (100/page). Follow the `after` cursor until
  // exhausted and concatenate every page, returning the full list in the same
  // result shape callers expect. Capped at MAX_PAGES to guard against loops.
  async list(config: WhatsAppClientConfig, fields = "id,name,status,category,language,components,quality_score,rejected_reason") {
    const MAX_PAGES = 50;
    const first = await graphFetch<TemplateListPage>(
      config,
      `${config.wabaId}/message_templates?fields=${fields}&limit=100`,
      { method: "GET" },
    );
    if (!first.ok) return first;

    const firstPage = first.data as TemplateListPage;
    const collected: TemplateRecord[] = [...(firstPage.data ?? [])];
    let paging = firstPage.paging;
    let pages = 1;

    while (pages < MAX_PAGES) {
      const after = paging?.cursors?.after;
      if (!paging?.next || !after) break;

      const next = await graphFetch<TemplateListPage>(
        config,
        `${config.wabaId}/message_templates?fields=${fields}&limit=100&after=${encodeURIComponent(after)}`,
        { method: "GET" },
      );
      if (!next.ok) return next;

      const nextPage = next.data as TemplateListPage;
      collected.push(...(nextPage.data ?? []));
      paging = nextPage.paging;
      pages++;
    }

    return { ...first, data: { data: collected } };
  },

  create(config: WhatsAppClientConfig, input: TemplateCreateInput) {
    return graphFetch<{ id: string }>(config, `${config.wabaId}/message_templates`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  update(config: WhatsAppClientConfig, templateId: string, updates: Partial<TemplateCreateInput>) {
    return graphFetch(config, templateId, {
      method: "POST",
      body: JSON.stringify(updates),
    });
  },

  // Meta requires deleting by name + language pair.
  deleteByName(config: WhatsAppClientConfig, name: string, language: string) {
    return graphFetch(
      config,
      `${config.wabaId}/message_templates?name=${encodeURIComponent(name)}&language=${encodeURIComponent(language)}`,
      { method: "DELETE" },
    );
  },

  get(config: WhatsAppClientConfig, templateId: string) {
    return graphFetch<TemplateRecord>(
      config,
      `${templateId}?fields=id,name,status,category,language,components,quality_score,rejected_reason`,
      { method: "GET" },
    );
  },
};

