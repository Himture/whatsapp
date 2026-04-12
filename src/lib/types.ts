import type { ApiVersion } from "./constants";



export interface WhatsAppConfig {
  id: string;
  userId: string;
  name: string;
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
  businessPortfolioId: string | null;
  apiVersion: ApiVersion;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhatsAppClientConfig {
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
  businessPortfolioId?: string;
  version: ApiVersion;
}



export interface WhatsAppMessageResponse {
  messaging_product: "whatsapp";
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export interface WhatsAppMediaResponse {
  id: string;
  url?: string;
  mime_type?: string;
  sha256?: string;
  file_size?: number;
  messaging_product: "whatsapp";
}

export interface WhatsAppPhoneNumber {
  verified_name: string;
  display_phone_number: string;
  id: string;
  quality_rating: "GREEN" | "YELLOW" | "RED";
}

export interface WhatsAppBusinessProfile {
  about: string;
  address: string;
  description: string;
  email: string;
  messaging_product: "whatsapp";
  profile_picture_url: string;
  vertical: string;
  websites: string[];
}

export interface WhatsAppErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}



export interface ApiCallResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | WhatsAppErrorResponse;
  duration: number;
}



export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "file"
  | "toggle"
  | "phone"
  | "json";

export interface FormFieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  description?: string;
  options?: Array<{ label: string; value: string }>;
}

export interface EndpointDefinition {
  id: string;
  name: string;
  method: "GET" | "POST" | "DELETE" | "PUT" | "PATCH";
  path: string;
  description?: string;
  fields: FormFieldDefinition[];
  bodyBuilder: (values: Record<string, unknown>, config: WhatsAppClientConfig) => unknown;
}



export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface AuthSession {
  user: AuthUser;
  session: {
    id: string;
    expiresAt: Date;
  };
}
