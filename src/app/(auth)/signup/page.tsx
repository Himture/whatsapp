import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your WhatsApp API Manager account — a local-first console for the WhatsApp Cloud API. Bring your own Meta credentials; your token stays on your machine.",
};

export default function SignUpPage() {
  return <SignupForm />;
}
