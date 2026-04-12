"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

interface ConfigGuardProps {
  children: ReactNode;
}

export function ConfigGuard({ children }: ConfigGuardProps) {
  const { activeConfig, loading } = useWhatsAppConfig();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="size-6 animate-spin rounded-full border-2 border-notion-blue border-t-transparent" />
      </div>
    );
  }

  if (!activeConfig) {
    return (
      <Card className="max-w-md mx-auto mt-12 bg-warm-white border-none">
        <CardContent className="py-10 text-center">
          <CardDescription className="mb-4">
            You need to configure your WhatsApp API credentials before using this feature.
          </CardDescription>
          <Link href={ROUTES.SETTINGS}>
            <Button>Go to Settings</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
