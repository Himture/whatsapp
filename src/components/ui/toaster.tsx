"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      duration={3500}
      visibleToasts={4}
      toastOptions={{
        classNames: {
          toast: "rounded-[var(--radius-standard)] shadow-[var(--shadow-card)]",
        },
      }}
    />
  );
}
