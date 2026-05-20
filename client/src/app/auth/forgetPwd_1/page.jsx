"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "../../../contexts/UserContext";
import { api } from "../../../lib/api";
import { API_ENDPOINTS } from "../../../constants";
import AuthShell from "../../../components/auth/AuthShell";
import styles from "../auth.module.css";

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useUser();

  const token = searchParams.get("token");
  const uid = searchParams.get("uid");
  const hasToken = Boolean(token && uid);
  const passwordsMatch = password.length > 0 && password === passwordConfirm;

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await api(API_ENDPOINTS.AUTH.PASSWORD_RESET, {
        method: "POST",
        body: JSON.stringify({
          token,
          uid,
          password,
          password_confirm: passwordConfirm,
        }),
      });

      if (!data?.success) {
        throw new Error(
          data?.message || data?.errors?.password?.[0] || "Failed to reset password. Please try again."
        );
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/signin");
      }, 2200);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred. Please try again.";
      if (message.includes("Too many requests") || message.includes("rate limit")) {
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else if (message.includes("Invalid") || message.includes("expired")) {
        setError("This reset link is invalid or expired. Request a new link from the forgot password page.");
      } else if (message.includes("connect") || message.includes("Network")) {
        setError("Cannot reach the server. Make sure the backend is running.");
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasToken) {
    return (
      <AuthShell
        headline="Check your email"
        paragraph="Did not receive it?"
        paragraphLink
        paragraphLinkHref="/auth/forgetPwd"
        paragraphLinkLabel="Try again"
        formTitle="Almost there"
        formSubtitle="We sent password reset instructions to your email if an account exists."
        showTerms={false}
      >
        <div className={styles.iconSuccess} aria-hidden>
          ✓
        </div>
        <p className={styles.hint}>
          Open the link in the email to choose a new password. Links expire after 24 hours.
        </p>
        <Link href="/auth/signin" className={styles.primaryButton} style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
          Back to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      headline="New password"
      paragraph="Back to"
      paragraphLink
      paragraphLinkHref="/auth/signin"
      paragraphLinkLabel="Sign in"
      formTitle="Create new password"
      formSubtitle="Choose a strong password you have not used on Taskero before."
      showTerms={false}
    >
      {error && <div className={styles.error} role="alert">{error}</div>}
      {success && (
        <div className={styles.success} role="status">
          Password updated successfully. Redirecting you to sign in...
        </div>
      )}

      <form className={styles.form} onSubmit={handleResetPassword} noValidate>
        <div className={styles.inputGroup}>
          <label htmlFor="new-password" className={styles.inputLabel}>
            New password
          </label>
          <input
            id="new-password"
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            minLength={8}
            autoComplete="new-password"
            disabled={isLoading || success}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="confirm-password" className={styles.inputLabel}>
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            className={styles.input}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="Re-enter your password"
            required
            minLength={8}
            autoComplete="new-password"
            disabled={isLoading || success}
          />
        </div>

        <div
          className={`${styles.matchRow} ${passwordsMatch ? styles.matchRowValid : ""}`}
          aria-live="polite"
        >
          <span className={`${styles.matchDot} ${passwordsMatch ? styles.matchDotValid : ""}`} />
          {passwordsMatch ? "Passwords match" : "Passwords must match"}
        </div>

        <button
          type="submit"
          className={styles.primaryButton}
          disabled={isLoading || success || !passwordsMatch || password.length < 8}
        >
          {isLoading ? "Saving..." : success ? "Saved" : "Update password"}
        </button>
      </form>

      <p className={styles.formFooter}>
        Link expired?
        <Link href="/auth/forgetPwd" className={styles.formFooterLink}>
          {" "}
          Request a new one
        </Link>
      </p>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.container} style={{ alignItems: "center", justifyContent: "center", color: "#fff" }}>
          Loading...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
