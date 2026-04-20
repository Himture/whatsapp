import type { ApiVersion } from "@/lib/constants";

export interface ConfigRecord {
  id: string;
  name: string;
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
  businessPortfolioId: string | null;
  apiVersion: string;
  isDefault: boolean;
  webhookVerifyToken: string;
  appSecret: string | null;
  appId: string | null;
  displayName: string | null;
  brandColor: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigInput {
  name: string;
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
  businessPortfolioId?: string;
  apiVersion: ApiVersion;
  displayName?: string;
  brandColor?: string;
  appSecret?: string;
  appId?: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

export interface DataStore {
  getConfigs(): Promise<ConfigRecord[]>;
  createConfig(input: ConfigInput): Promise<ActionResult>;
  updateConfig(configId: string, input: Partial<ConfigInput>): Promise<ActionResult>;
  deleteConfig(configId: string): Promise<ActionResult>;
  setDefaultConfig(configId: string): Promise<ActionResult>;
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
}
