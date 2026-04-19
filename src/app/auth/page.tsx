"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setStep("code");
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) return;

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: "email",
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
            PromptFlow
          </h1>
        </div>

        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6">
          <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)] text-center mb-1">
            {step === "email" ? "Sign in or create account" : "Check your email"}
          </h2>
          <p className="text-[13px] text-[var(--color-text-tertiary)] text-center mb-5">
            {step === "email"
              ? "We'll send a verification code to your email"
              : `Enter the code sent to ${email}`}
          </p>

          {error && (
            <div className="mb-4 px-3 py-2 text-[13px] text-[var(--color-danger)] bg-[var(--color-danger-light)] rounded-lg">
              {error}
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleSendCode}>
              <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">
                Email address
              </label>
              <input
                type="email"
                autoFocus
                required
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] transition-colors"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full mt-4 px-4 py-2.5 text-[14px] font-medium bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-default text-white rounded-lg transition-colors"
              >
                {loading ? "Sending..." : "Send code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode}>
              <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">
                Verification code
              </label>
              <input
                type="text"
                autoFocus
                required
                inputMode="numeric"
                maxLength={8}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] text-center tracking-[0.3em] font-mono outline-none focus:border-[var(--color-accent)] transition-colors"
                placeholder="000000"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))
                }
              />
              <button
                type="submit"
                disabled={loading || otp.length < 6}

                className="w-full mt-4 px-4 py-2.5 text-[14px] font-medium bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-default text-white rounded-lg transition-colors"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
              <button
                type="button"
                className="w-full mt-2 px-4 py-2 text-[13px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError("");
                }}
              >
                Use a different email
              </button>
            </form>
          )}
        </div>

        <a
          href="/"
          className="block text-center text-[13px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] mt-4 transition-colors"
        >
          Continue without signing in
        </a>
      </div>
    </div>
  );
}
