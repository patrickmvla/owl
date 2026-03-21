import type { Metadata } from "next";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to access real-time market intelligence",
};

export default function SignInPage() {
  return <SignInForm />;
}
