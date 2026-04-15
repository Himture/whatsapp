"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { useSessionMode } from "@/lib/session-mode";
import { initializeEncryptionKey } from "@/lib/crypto";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { enterLocalMode, enterAuthenticatedMode } = useSessionMode();

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signUp.email({ name, email, password });
      if (result.error) {
        setError(result.error.message ?? "Failed to create account");
        setPending(false);
      } else {
        enterAuthenticatedMode();
        router.push(ROUTES.DASHBOARD);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setPending(false);
    }
  }

  async function handleLocalMode() {
    enterLocalMode();
    await initializeEncryptionKey();
    router.push(ROUTES.DASHBOARD);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Name"
            name="name"
            type="text"
            placeholder="Your name"
            required
            autoComplete="name"
          />
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Min. 8 characters"
            required
            minLength={8}
            autoComplete="new-password"
          />
          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" loading={pending} className="w-full mt-2">
            Create Account
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-warm-300">
              or
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={handleLocalMode}
        >
          Continue without account
        </Button>
      </CardContent>

      <CardFooter className="justify-center pb-6">
        <p className="text-sm text-warm-500">
          Already have an account?{" "}
          <Link href={ROUTES.LOGIN} className="text-notion-blue hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
