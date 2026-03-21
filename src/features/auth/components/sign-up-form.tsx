"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/features/auth/config/auth-client";

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await authClient.signUp.email({
      email,
      password,
      name,
    });

    if (error) {
      setError(error.message ?? "Sign up failed");
      setLoading(false);
      return;
    }

    router.push("/");
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-muted-foreground">
          Sign up to start tracking markets
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-sm border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="name" className="label-micro">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="flex h-9 w-full border border-input bg-transparent px-3 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="label-micro">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="flex h-9 w-full border border-input bg-transparent px-3 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="label-micro">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="flex h-9 w-full border border-input bg-transparent px-3 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex h-9 w-full items-center justify-center bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-foreground underline underline-offset-4 hover:text-accent">
          Sign in
        </Link>
      </p>
    </div>
  );
}
