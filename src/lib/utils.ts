import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"] as const;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = sizes[i] ?? "GB";

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${size}`;
}

export function maskToken(token: string): string {
  if (token.length <= 8) return "••••••••";
  return `${token.slice(0, 4)}••••${token.slice(-4)}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function isValidPhoneNumber(phone: string): boolean {
  return /^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ""));
}

export function buildGraphApiUrl(version: string, path: string): string {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `https://graph.facebook.com/${version}/${cleanPath}`;
}
