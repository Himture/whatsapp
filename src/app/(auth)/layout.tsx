import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-white px-4 py-8 sm:py-12">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-near-black">
            {APP_NAME}
          </h1>
          <p className="mt-2 text-sm text-warm-500">
            Manage your WhatsApp Business API
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
