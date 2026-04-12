"use client";

import {
  getConfigs as serverGetConfigs,
  createConfig as serverCreateConfig,
  updateConfig as serverUpdateConfig,
  deleteConfig as serverDeleteConfig,
  setDefaultConfig as serverSetDefaultConfig,
} from "@/app/(dashboard)/settings/actions";
import type { DataStore, ConfigRecord, ConfigInput, ActionResult } from "./types";

export class RemoteStore implements DataStore {
  async getConfigs(): Promise<ConfigRecord[]> {
    const configs = await serverGetConfigs();
    return configs.map((c) => ({
      id: c.id,
      name: c.name,
      accessToken: c.accessToken,
      phoneNumberId: c.phoneNumberId,
      wabaId: c.wabaId,
      businessPortfolioId: c.businessPortfolioId,
      apiVersion: c.apiVersion,
      isDefault: c.isDefault,
      createdAt: c.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: c.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    }));
  }

  async createConfig(input: ConfigInput): Promise<ActionResult> {
    return serverCreateConfig(input);
  }

  async updateConfig(configId: string, input: Partial<ConfigInput>): Promise<ActionResult> {
    return serverUpdateConfig(configId, input);
  }

  async deleteConfig(configId: string): Promise<ActionResult> {
    return serverDeleteConfig(configId);
  }

  async setDefaultConfig(configId: string): Promise<ActionResult> {
    return serverSetDefaultConfig(configId);
  }
}
