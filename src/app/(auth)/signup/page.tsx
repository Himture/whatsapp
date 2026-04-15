import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Sign up for WhatsApp API Manager — zero-markup messaging built for agencies and SMBs.",
};

export default function SignUpPage() {
  return <SignupForm />;
}
