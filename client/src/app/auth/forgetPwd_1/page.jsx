"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "../../../contexts/UserContext";
import styles from "./styles.module.css";
import "../../../styles/global.scss";
import Link from "next/link";
import { API_BASE_URL, API_ENDPOINTS } from "../../../constants";
import PasswordStrengthMeter from "../../../components/PasswordStrengthMeter/PasswordStrengthMeter";

function ForgotPasswordContent() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, isValid: false });
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useUser();

  const token = searchParams.get("token");
  const uid = searchParams.get("uid");
  const hasToken = token && uid;

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      router.push("/dashboard");
      return;
    }
    // If no token/uid, show confirmation message
    if (!hasToken) {
      setSuccess(true);
    }
  }, [hasToken, isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (password !== passwordConfirm) {
      setError("Passwords don't match");
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    // Check password strength meets minimum requirement
    if (passwordStrength.score < 2) {
      setError("Password is too weak. Please choose a stronger password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.PASSWORD_RESET}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          uid: uid,
          password: password,
          password_confirm: passwordConfirm,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        // Redirect to signin page after successful reset
        setTimeout(() => {
          router.push("/auth/signin");
        }, 2000);
      } else {
        setError(data.message || data.errors?.password?.[0] || "Failed to reset password. Please try again.");
      }
    } catch (err) {
      console.error("Password reset error:", err);
      if (err.message.includes("Network") || err.code === "ERR_NETWORK") {
        setError("Network error: Cannot connect to server. Please check if the backend is running.");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show confirmation message if no token
  if (!hasToken) {
    return (
      <div className={styles.container}>
        <div className={styles.confirmationContent}>
          <h1 className={styles.title}>Check Your Email</h1>
          <p className={styles.subtitle}>
            An email was sent to you with instructions to reset your password.
          </p>
          <p className={styles.subtitleSmall}>
            Please check your inbox and click on the reset link provided.
          </p>
        </div>
        <Link href="/auth/signin" className={styles.backLink}>
          Back to Login
        </Link>
      </div>
    );
  }

  // Show reset password form if token is present
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.formTitle}>Reset Password</h1>
        <p className={styles.formSubtitle}>
          Enter your new password below
        </p>

        {success && (
          <div className={styles.success}>
            Password reset successfully! Redirecting to login...
          </div>
        )}

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <form className={styles.form} onSubmit={handleResetPassword}>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              New Password
            </label>
            <input
              type="password"
              id="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              disabled={isLoading || success}
            />
            <PasswordStrengthMeter
              password={password}
              onStrengthChange={setPasswordStrength}
              showFeedback={true}
              minScore={2}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="passwordConfirm" className={styles.label}>
              Confirm Password
            </label>
            <input
              type="password"
              id="passwordConfirm"
              className={styles.input}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Confirm new password"
              required
              disabled={isLoading || success}
            />
          </div>

          <button
            type="submit"
            className={styles.resetButton}
            disabled={isLoading || success}
          >
            {isLoading ? "Resetting..." : success ? "Reset!" : "Reset Password"}
          </button>
        </form>

        <div className={styles.footer}>
          <Link href="/auth/signin" className={styles.footerLink}>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPassword() {
  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <div className={styles.loading}>Loading...</div>
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
