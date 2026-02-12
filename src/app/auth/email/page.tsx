"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import Button from "@/app/components/Button";

export default function EmailLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Failed to sign in");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold">Sign in with Email</h1>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="text-sm text-gray-500 text-center">
        Don&apos;t have an account?{" "}
        <a href="/auth/signup" className="text-blue-500 hover:underline">
          Sign up
        </a>
      </p>

      <p className="text-sm text-gray-500 text-center">
        <a href="/auth" className="text-blue-500 hover:underline">
          ← Back to all sign in options
        </a>
      </p>
    </div>
  );
}
