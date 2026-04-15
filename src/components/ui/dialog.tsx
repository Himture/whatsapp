"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { FocusTrap } from "focus-trap-react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  closeOnBackdrop?: boolean;
}

const SIZE_STYLES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
} as const;

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
}: DialogProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <FocusTrap
      active={open}
      focusTrapOptions={{
        initialFocus: () => panelRef.current ?? false,
        escapeDeactivates: false,
        clickOutsideDeactivates: false,
        returnFocusOnDeactivate: true,
      }}
    >
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="absolute inset-0 bg-black/50"
          onClick={closeOnBackdrop ? onClose : undefined}
          aria-hidden="true"
        />
        <div
          ref={panelRef}
          tabIndex={-1}
          className={cn(
            "relative z-10 w-full rounded-[var(--radius-comfortable)] bg-white shadow-[var(--shadow-deep)] outline-none",
            SIZE_STYLES[size],
          )}
        >
          <div className="flex items-start justify-between gap-4 p-5 border-b border-whisper">
            <div className="flex-1 min-w-0">
              <h2 id={titleId} className="text-base font-semibold text-near-black">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1 text-sm text-warm-500">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="-m-1.5 p-1.5 rounded-[var(--radius-micro)] text-warm-500 hover:bg-warm-100 hover:text-near-black focus-visible:ring-2 focus-visible:ring-focus-blue"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="p-5 max-h-[70vh] overflow-y-auto">{children}</div>
          {footer && (
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-whisper bg-warm-50/40 rounded-b-[var(--radius-comfortable)]">
              {footer}
            </div>
          )}
        </div>
      </div>
    </FocusTrap>
  );
}
