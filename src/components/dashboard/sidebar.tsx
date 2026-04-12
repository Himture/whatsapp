"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, type LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  MessageSquare,
  ImageIcon,
  Phone,
  Building2,
  UserPlus,
  ShieldCheck,
  Network,
  Webhook,
  CreditCard,
  FileCheck,
  ArrowRightLeft,
  Clock,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS } from "@/lib/constants";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  MessageSquare,
  Image: ImageIcon,
  Phone,
  Building2,
  UserPlus,
  ShieldCheck,
  Network,
  Webhook,
  CreditCard,
  FileCheck,
  ArrowRightLeft,
  Clock,
  Settings,
};

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <aside className="flex h-full w-60 flex-col border-r border-black/10 bg-warm-white">
      <div className="flex items-center justify-between px-4 py-5 border-b border-black/10">
        <h2 className="text-base font-bold tracking-tight text-near-black">
          WhatsApp API
        </h2>
        {/* Close button visible only on mobile */}
        <button
          type="button"
          onClick={onClose}
          className="md:hidden inline-flex items-center justify-center rounded-[var(--radius-micro)] p-1 text-warm-500 hover:text-near-black transition-colors"
          aria-label="Close sidebar"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="flex flex-col gap-0.5">
          {NAV_SECTIONS.map((section) => {
            const Icon = ICON_MAP[section.icon];
            const isActive = pathname === section.href;

            return (
              <li key={section.href}>
                <Link
                  href={section.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--radius-subtle)] px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white text-near-black shadow-card"
                      : "text-warm-500 hover:text-near-black hover:bg-white/60",
                  )}
                >
                  {Icon && <Icon className="size-4 shrink-0" />}
                  {section.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar - always visible */}
      <div className="hidden md:flex h-full w-60 shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile sidebar - slide-over drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={onClose}
          aria-hidden="true"
        />
        {/* Drawer */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-60 transform transition-transform duration-300 ease-in-out",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
}
