"use server";

import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";

interface AuthState {
  error: string | null;
}

export async function loginAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const result = await getAuth().api.signInEmail({
      body: { email, password },
    });

    if (!result) {
      return { error: "Invalid email or password" };
    }
  } catch {
    return { error: "Invalid email or password" };
  }

  redirect(ROUTES.DASHBOARD);
}

export async function signupAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = formData.get("name") as string | null;
  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;

  if (!name || !email || !password) {
    return { error: "All fields are required" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  try {
    const result = await getAuth().api.signUpEmail({
      body: { name, email, password },
    });

    if (!result) {
      return { error: "Failed to create account" };
    }
  } catch {
    return { error: "Failed to create account. Email may already be in use." };
  }

  redirect(ROUTES.DASHBOARD);
}
