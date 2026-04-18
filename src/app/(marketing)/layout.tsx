import Link from "next/link";
import type { ReactNode } from "react";
import { ROUTES, GITHUB_URL } from "@/lib/constants";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-2 focus:bg-near-black focus:text-white focus:rounded-[var(--radius-micro)]"
      >
        Skip to content
      </a>
      <header className="border-b border-black/10 sticky top-0 bg-white/90 backdrop-blur z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <Link href="/" className="font-bold tracking-tight text-near-black">
            WhatsApp API Manager
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/pricing" className="text-warm-500 hover:text-near-black">Pricing</Link>
            <Link href={GITHUB_URL} className="text-warm-500 hover:text-near-black hidden sm:inline">GitHub</Link>
            <Link href={ROUTES.LOGIN} className="text-warm-500 hover:text-near-black">Sign in</Link>
            <Link href={ROUTES.SIGNUP} className="rounded-[var(--radius-micro)] bg-near-black text-white px-3 py-1.5 font-medium hover:bg-warm-600">
              Start free
            </Link>
          </nav>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">{children}</main>
      <footer className="border-t border-black/10 bg-warm-white">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <p className="font-semibold text-near-black mb-3">Product</p>
            <ul className="space-y-1.5 text-warm-500">
              <li><Link href="/pricing" className="hover:text-near-black">Pricing</Link></li>
              <li><Link href={ROUTES.LOGIN + "?demo=1"} className="hover:text-near-black">Live demo</Link></li>
              <li><Link href={GITHUB_URL} className="hover:text-near-black">Self-host</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-near-black mb-3">Resources</p>
            <ul className="space-y-1.5 text-warm-500">
              <li><Link href={GITHUB_URL} className="hover:text-near-black">GitHub</Link></li>
              <li><Link href="https://developers.facebook.com/docs/whatsapp/cloud-api" className="hover:text-near-black">WhatsApp API docs</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-near-black mb-3">Legal</p>
            <ul className="space-y-1.5 text-warm-500">
              <li><Link href="/privacy" className="hover:text-near-black">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-near-black">Terms</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-near-black mb-3">Company</p>
            <ul className="space-y-1.5 text-warm-500">
              <li>Made in India</li>
              <li>Open source (MIT)</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
