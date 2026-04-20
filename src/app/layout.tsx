import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { SessionModeProvider } from "@/lib/session-mode";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Touch the request headers so routes render per-request — that's what lets
  // Next.js read the middleware nonce (src/middleware.ts) and stamp it onto its
  // framework <script> tags, satisfying the nonce-based CSP. Trade-off: pages are
  // server-rendered on demand rather than statically prerendered.
  await headers();
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full font-sans antialiased">
        <SessionModeProvider>{children}</SessionModeProvider>
        <Toaster />
      </body>
    </html>
  );
}
