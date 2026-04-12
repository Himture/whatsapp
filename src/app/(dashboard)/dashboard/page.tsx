import type { Metadata } from "next";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NAV_SECTIONS } from "@/lib/constants";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard",
};

const QUICK_ACTIONS = NAV_SECTIONS.filter(
  (s) => s.href !== "/dashboard" && s.href !== "/settings",
);

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-near-black">
          Dashboard
        </h1>
        <p className="mt-2 text-sm sm:text-base text-warm-500">
          Welcome to WhatsApp API Manager. Configure your API keys in Settings, then start using the API.
        </p>
      </div>

      <div className="mb-6 md:mb-8">
        <Card className="bg-warm-white border-none">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="flex size-10 items-center justify-center rounded-[var(--radius-standard)] bg-badge-bg">
                <span className="text-lg">🚀</span>
              </div>
              <div>
                <CardTitle className="text-lg">Getting Started</CardTitle>
                <CardDescription className="mt-1">
                  1. Go to <Link href="/settings" className="text-notion-blue hover:underline font-medium">Settings</Link> and add your WhatsApp API credentials.
                  <br />
                  2. Test your connection to verify everything works.
                  <br />
                  3. Start sending messages and managing your WhatsApp Business account.
                </CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-bold text-near-black mb-4">API Sections</h2>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className="h-full transition-shadow hover:shadow-deep cursor-pointer">
                <CardContent className="py-5">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">{section.label}</CardTitle>
                    <Badge>API</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
