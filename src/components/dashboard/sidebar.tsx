"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FocusTrap } from "focus-trap-react";
import { X, type LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BarChart3,
  Briefcase,
  Inbox,
  Users,
  Megaphone,
  LayoutTemplate,
  GitBranch,
  CalendarClock,
  QrCode,
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
import { NAV_SECTIONS, NAV_GROUPS } from "@/lib/constants";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  BarChart3,
  Briefcase,
  Inbox,
  Users,
  Megaphone,
  LayoutTemplate,
  GitBranch,
  CalendarClock,
  QrCode,
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

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const sidebarContent = (
    <aside className="flex h-full w-60 flex-col border-r border-black/10 bg-warm-white">
      <div className="flex items-center justify-between px-4 py-5 border-b border-black/10">
        <h2 className="text-base font-bold tracking-tight text-near-black">
          WhatsApp API
        </h2>
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
        {NAV_GROUPS.map((group) => {
          const groupItems = NAV_SECTIONS.filter((s) => s.group === group.key);
          if (groupItems.length === 0) return null;

          return (
            <div key={group.key} className="mb-4">
              {group.label && (
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-warm-500">
                  {group.label}
                </p>
              )}
              <ul className="flex flex-col gap-0.5">
                {groupItems.map((section) => {
                  const Icon = ICON_MAP[section.icon];
                  const isActive = pathname === section.href || pathname.startsWith(section.href + "/");

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
            </div>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <>
      <div className="hidden md:flex h-full w-60 shrink-0">
        {sidebarContent}
      </div>

      {open ? (
        <FocusTrap focusTrapOptions={{ escapeDeactivates: false, clickOutsideDeactivates: false, returnFocusOnDeactivate: true }}>
          <div
            className="fixed inset-0 z-40 md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div
              className="absolute inset-0 bg-black/40"
              onClick={onClose}
              aria-hidden="true"
            />
            <div className="absolute inset-y-0 left-0 w-60">
              {sidebarContent}
            </div>
          </div>
        </FocusTrap>
      ) : null}
    </>
  );
}
