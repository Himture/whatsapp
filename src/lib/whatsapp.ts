import {
  MESSAGING_PRODUCT,
} from "./constants";
import type {
  WhatsAppClientConfig,
  ApiCallResult,
} from "./types";
import { buildGraphApiUrl } from "./utils";

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

    const data = await response.json();
    const duration = Math.round(performance.now() - start);

    return {
      ok: response.ok,
      status: response.status,
      data: data as T,
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

    const data = await response.json();
    const duration = Math.round(performance.now() - start);

    return {
      ok: response.ok,
      status: response.status,
      data: data as T,
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
    return graphFetch(config, `${phoneNumberId}?fields=display_name_status`, {
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
  ) {
    return graphFetch(config, "app/uploads", {
      method: "POST",
      body: JSON.stringify({
        file_length: fileLength,
        file_type: fileType,
        file_name: fileName,
      }),
    });
  },

  uploadFileData(config: WhatsAppClientConfig, uploadSessionId: string, fileData: File) {
    const formData = new FormData();
    formData.append("file", fileData);
    return graphFetchFormData(config, uploadSessionId, formData);
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

  getTemplates(config: WhatsAppClientConfig) {
    return graphFetch(config, `${config.wabaId}/message_templates`, {
      method: "GET",
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
