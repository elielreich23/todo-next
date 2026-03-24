"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../../contexts/UserContext";
import styles from "./styles.module.scss";
import "../../../styles/global.scss";
import Link from "next/link";
import { API_BASE_URL, API_ENDPOINTS } from "../../../constants";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useUser();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
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
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        // In development, if token is provided, redirect to reset page
        if (data.token && data.uid) {
          setTimeout(() => {
            const safeToken = encodeURIComponent(data.token);
            const safeUid = encodeURIComponent(data.uid);
            router.push(`/auth/forgetPwd_1?token=${safeToken}&uid=${safeUid}`);
          }, 2000);
        } else {
          // Redirect to confirmation page
          setTimeout(() => {
            router.push("/auth/forgetPwd_1");
          }, 2000);
        }
      } else {
        setError(data.message || data.errors?.email?.[0] || "Failed to send reset email. Please try again.");
      }
    } catch (err) {
      console.error("Password reset request error:", err);
      if (err.message.includes("Network") || err.code === "ERR_NETWORK") {
        setError("Network error: Cannot connect to server. Please check if the backend is running.");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.logo}>tasker</div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.title}>
          Forgot Password
          <p className={styles.subtitle}>Reclaim your account easily</p>
        </div>

        {success && (
          <div className={styles.success}>
            Email sent! Redirecting...
          </div>
        )}

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <label htmlFor="email" className={styles.label}>
          Email Address
        </label>
        <input
          type="email"
          id="email"
          className={styles.input}
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading || success}
        />
        <button
          type="submit"
          className={styles.resetButton}
          disabled={isLoading || success}
        >
          {isLoading ? "Sending..." : success ? "Sent!" : "Reset Password"}
        </button>
      </form>
      <div className={styles.authButtons}>
        <Link href="/auth/signin" className={styles.login}>
          Login
        </Link>
        <Link href="/auth/signup" className={styles.signup}>
          Sign Up
        </Link>
      </div>
    </div>
  );
}
