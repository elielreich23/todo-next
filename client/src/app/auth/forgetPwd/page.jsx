"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "../../../contexts/UserContext";
import { api } from "../../../lib/api";
import { API_ENDPOINTS } from "../../../constants";
import AuthShell from "../../../components/auth/AuthShell";
import styles from "../auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useUser();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      const data = await api(API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST, {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!data?.success) {
        throw new Error(
          data?.message || data?.errors?.email?.[0] || "Failed to send reset email. Please try again."
        );
      }

      setSuccess(true);

      if (data.token && data.uid) {
        // Only used when the backend explicitly enables PASSWORD_RESET_DEBUG_TOKENS.
        setTimeout(() => {
          const safeToken = encodeURIComponent(data.token);
          const safeUid = encodeURIComponent(data.uid);
          router.push(`/auth/forgetPwd_1?token=${safeToken}&uid=${safeUid}`);
        }, 1800);
      } else {
        setTimeout(() => {
          router.push("/auth/forgetPwd_1");
        }, 1800);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred. Please try again.";
      if (message.includes("Too many requests") || message.includes("rate limit")) {
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else if (message.includes("connect") || message.includes("Network")) {
        setError("Cannot reach the server. Make sure the backend is running.");
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      headline="Reset your password"
      paragraph="Remember your password?"
      paragraphLink
      paragraphLinkHref="/auth/signin"
      paragraphLinkLabel="Sign in"
      formTitle="Forgot password"
      formSubtitle="Enter the email linked to your account. We will send you a reset link."
    >
      {error && <div className={styles.error} role="alert">{error}</div>}
      {success && (
        <div className={styles.success} role="status">
          If an account exists for that email, we sent reset instructions. Check your inbox.
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.inputGroup}>
          <label htmlFor="reset-email" className={styles.inputLabel}>
            Email address
          </label>
          <input
            id="reset-email"
            type="email"
            className={styles.input}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={isLoading || success}
          />
        </div>

        <button type="submit" className={styles.primaryButton} disabled={isLoading || success}>
          {isLoading ? "Sending..." : success ? "Email sent" : "Send reset link"}
        </button>
      </form>

      <p className={styles.formFooter}>
        New to Taskero?
        <Link href="/auth/signup" className={styles.formFooterLink}>
          {" "}
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
